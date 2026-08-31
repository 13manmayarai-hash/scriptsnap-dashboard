import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MIN_SCRIPTS_FOR_VOICEPRINT = 3
const MAX_SCRIPTS_SAMPLED = 20

export interface VoiceProfile {
  analysisSummary: string
  scriptCountAnalyzed: number
  lastAnalyzedAt: string
}

// Builds (or rebuilds) a creator's VoicePrint from their own accumulated
// ScriptSnap scripts — the real, already-owned signal of how they write,
// with no new YouTube OAuth scope required. Sampling the most recent
// MAX_SCRIPTS_SAMPLED keeps the prompt small and keeps the profile
// reflecting how the creator writes *now*, not their earliest scripts.
export async function analyzeVoiceProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: VoiceProfile | null; error: string | null }> {
  const { data: scripts, error: fetchError } = await supabase
    .from('scripts')
    .select('script, tone, category')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_SCRIPTS_SAMPLED)

  if (fetchError) {
    return { profile: null, error: 'Failed to load scripts for analysis' }
  }

  const rows = scripts || []
  if (rows.length < MIN_SCRIPTS_FOR_VOICEPRINT) {
    return {
      profile: null,
      error: `Need at least ${MIN_SCRIPTS_FOR_VOICEPRINT} scripts to build a VoicePrint — you have ${rows.length}.`,
    }
  }

  const sample = rows
    .map((r, i) => `--- Script ${i + 1} (tone: ${r.tone || 'unspecified'}, category: ${r.category || 'unspecified'}) ---\n${r.script}`)
    .join('\n\n')
    .slice(0, 12000) // keep the prompt bounded regardless of script length

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 500,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: `Here are ${rows.length} scripts a YouTube Shorts creator has written. Identify their voice as a detailed, reusable writing profile — not a generic tone label. Cover: sentence length/rhythm, word choice and vocabulary level, recurring phrases or verbal tics, how they open and close scripts, pacing, and energy level. Respond with ONLY the profile text (3-5 sentences), no preamble, no JSON.

${sample}`,
      },
    ],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const analysisSummary = textBlock?.text.trim()
  if (!analysisSummary) {
    return { profile: null, error: 'Could not generate a voice profile — try again in a moment.' }
  }

  const lastAnalyzedAt = new Date().toISOString()
  const { error: upsertError } = await supabase
    .from('voice_profiles')
    .upsert({
      user_id: userId,
      analysis_summary: analysisSummary,
      script_count_analyzed: rows.length,
      last_analyzed_at: lastAnalyzedAt,
    })

  if (upsertError) {
    return { profile: null, error: 'Generated a profile but failed to save it — try again.' }
  }

  return {
    profile: { analysisSummary, scriptCountAnalyzed: rows.length, lastAnalyzedAt },
    error: null,
  }
}
