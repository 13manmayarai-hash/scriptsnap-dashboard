import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCreatorAnalyticsContext } from '@/lib/youtube/analytics'
import { getTrendingContext, type TrendingContext } from '@/lib/youtube/trending'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MAX_HISTORY_MESSAGES = 20

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface SendChatMessageOptions {
  scriptId?: string
  tone?: { name: string; styleDescription: string }
}

// A scoped assistant for script-writing and YouTube Shorts strategy help —
// not a general-purpose chatbot. Grounds itself in the creator's VoicePrint
// when one exists, same way structuredScript/analyze.ts already do, rather
// than guessing at their voice from scratch each conversation.
const SYSTEM_PROMPT = `You are the ScriptSnap AI assistant, embedded in a YouTube Shorts scriptwriting tool. Help creators with: brainstorming video ideas, refining hooks, YouTube Shorts strategy and pacing, feedback on scripts they paste in, and general questions about growing a Shorts channel.

Stay focused on scriptwriting and YouTube strategy — if asked something unrelated, briefly redirect back to what you can help with here. Keep replies conversational and concise (a few sentences to a short paragraph, not an essay) unless the user is asking for a longer draft.`

// Same short plain-text summary generate-script's prompt already builds
// from this data, condensed further for chat's smaller token budget.
function formatTrendingForChat(trending: TrendingContext): string | null {
  const lines: string[] = []
  if (trending.channelKeywords.length > 0) {
    lines.push(
      `Recurring topics from this creator's own recent videos: ${trending.channelKeywords
        .slice(0, 5)
        .map((k) => `"${k.phrase}"`)
        .join(', ')}`
    )
  }
  if (trending.trendingVideos.length > 0) {
    lines.push(
      `Currently trending ${trending.trendingCategoryLabel ? `in ${trending.trendingCategoryLabel}` : 'on YouTube'} (India): ${trending.trendingVideos
        .slice(0, 5)
        .map((v) => `"${v.title}"`)
        .join(', ')}`
    )
  }
  return lines.length > 0 ? lines.join('\n') : null
}

export async function sendChatMessage(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  options: SendChatMessageOptions = {}
): Promise<{ reply: string | null; error: string | null; messageId: string | null }> {
  const { scriptId, tone } = options

  const { data: history, error: historyError } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY_MESSAGES)

  if (historyError) {
    return { reply: null, error: 'Failed to load chat history', messageId: null }
  }

  const orderedHistory = (history || []).slice().reverse() as ChatMessage[]

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('analysis_summary')
    .eq('user_id', userId)
    .maybeSingle<{ analysis_summary: string }>()

  let system = voiceProfile?.analysis_summary
    ? `${SYSTEM_PROMPT}\n\nThis creator's VoicePrint (their established writing voice): ${voiceProfile.analysis_summary}`
    : SYSTEM_PROMPT

  // An explicitly picked tone preset (from the chat page's tone selector)
  // takes precedence over the general VoicePrint for how suggestions
  // should sound, same style_description text generate-script already
  // uses for the same preset.
  if (tone) {
    system = `${system}\n\nWhen suggesting scripts, hooks, or rewrites in this conversation, write in a "${tone.name}" tone: ${tone.styleDescription}`
  }

  // "Discuss with AI" from a script's page passes its ID so the assistant
  // can reference the actual text, not just the creator's general voice.
  if (scriptId) {
    const { data: script } = await supabase
      .from('scripts')
      .select('title, script')
      .eq('id', scriptId)
      .eq('user_id', userId)
      .maybeSingle<{ title: string; script: string }>()

    if (script) {
      system = `${system}\n\nThe creator is currently discussing this specific script, titled "${script.title}":\n${script.script.slice(0, 4000)}`
    }
  }

  // Same never-blocking treatment generate-script gives these — a YouTube
  // API hiccup should never break a chat reply, and both no-op quickly for
  // anyone who hasn't connected a channel (or isn't Pro, since only Pro
  // can complete the connect flow in the first place).
  try {
    const analyticsContext = await getCreatorAnalyticsContext(supabase, userId)
    if (analyticsContext) {
      system = `${system}\n\nThis creator's own channel performance data (use it to ground suggestions in what's actually worked for them): ${analyticsContext.summary}`
    }
  } catch (err) {
    console.error('Chat analytics context failed:', err)
  }

  try {
    const trendingContext = await getTrendingContext(supabase, userId)
    const trendingText = trendingContext ? formatTrendingForChat(trendingContext) : null
    if (trendingText) {
      system = `${system}\n\n${trendingText}`
    }
  } catch (err) {
    console.error('Chat trending context failed:', err)
  }

  const { error: insertUserError } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role: 'user', content: message })

  if (insertUserError) {
    return { reply: null, error: 'Failed to save your message', messageId: null }
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
    return { reply: null, error: 'Could not get a response — try again in a moment.', messageId: null }
  }

  const { data: inserted, error: insertAssistantError } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role: 'assistant', content: reply })
    .select('id')
    .single()

  if (insertAssistantError) {
    // The reply is still valid even if we failed to persist it — surface it
    // to the user rather than discarding a real, already-billed response.
    return { reply, error: null, messageId: null }
  }

  return { reply, error: null, messageId: inserted?.id ?? null }
}

export async function clearChatHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('chat_messages').delete().eq('user_id', userId)
  if (error) {
    return { error: 'Failed to clear chat history' }
  }
  return { error: null }
}
