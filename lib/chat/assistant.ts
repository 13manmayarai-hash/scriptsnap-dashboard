import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_HISTORY_MESSAGES = 20

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// A scoped assistant for script-writing and YouTube Shorts strategy help —
// not a general-purpose chatbot. Grounds itself in the creator's VoicePrint
// when one exists, same way structuredScript/analyze.ts already do, rather
// than guessing at their voice from scratch each conversation.
const SYSTEM_PROMPT = `You are the ScriptSnap AI assistant, embedded in a YouTube Shorts scriptwriting tool. Help creators with: brainstorming video ideas, refining hooks, YouTube Shorts strategy and pacing, feedback on scripts they paste in, and general questions about growing a Shorts channel.

Stay focused on scriptwriting and YouTube strategy — if asked something unrelated, briefly redirect back to what you can help with here. Keep replies conversational and concise (a few sentences to a short paragraph, not an essay) unless the user is asking for a longer draft.`

export async function sendChatMessage(
  supabase: SupabaseClient,
  userId: string,
  message: string
): Promise<{ reply: string | null; error: string | null }> {
  const { data: history, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES)

  if (historyError) {
    return { reply: null, error: 'Failed to load chat history' }
  }

  const orderedHistory = (history || []).slice().reverse() as ChatMessage[]

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('analysis_summary')
    .eq('user_id', userId)
    .maybeSingle<{ analysis_summary: string }>()

  const system = voiceProfile?.analysis_summary
    ? `${SYSTEM_PROMPT}\n\nThis creator's VoicePrint (their established writing voice): ${voiceProfile.analysis_summary}`
    : SYSTEM_PROMPT

  const { error: insertUserError } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role: 'user', content: message })

  if (insertUserError) {
    return { reply: null, error: 'Failed to save your message' }
  }

  const apiMessages: Anthropic.MessageParam[] = [
    ...orderedHistory.map((m) => ({ role: m.role, content: m.content } as Anthropic.MessageParam)),
    { role: 'user', content: message },
  ]

  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 600,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    system,
    messages: apiMessages,
  })

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const reply = textBlock?.text.trim()

  if (!reply) {
    return { reply: null, error: 'Could not get a response — try again in a moment.' }
  }

  const { error: insertAssistantError } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })

  if (insertAssistantError) {
    // The reply is still valid even if we failed to persist it — surface it
    // to the user rather than discarding a real, already-billed response.
    return { reply, error: null }
  }

  return { reply, error: null }
}
