import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { computeVoiceMetrics, type VoiceSample, type VoiceMetrics } from './metrics'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MIN_SCRIPTS_FOR_VOICEPRINT = 3
const MAX_SAMPLES = 20

export interface VoiceProfile {
  analysisSummary: string
  scriptCountAnalyzed: number
  lastAnalyzedAt: string
  source: 'transcripts' | 'own_scripts'
  metrics: VoiceMetrics
}

// Builds (or rebuilds) a creator's VoicePrint. Prefers real YouTube
// caption transcripts (ingested via /api/youtube/ingest) when enough
// exist — real spoken pacing, not estimated — and falls back to the
// creator's own accumulated ScriptSnap scripts (using each script's
// target duration for an estimated WPM) when transcripts aren't
// available, which needs no YouTube connection at all.
export async function analyzeVoiceProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: VoiceProfile | null; error: string | null }> {
  const { data: transcripts, error: transcriptsError } = await supabase
    .from('video_transcripts')
    .select('transcript, video_duration_seconds')
    .eq('user_id', userId)
    .order('ingested_at', { ascending: false })
    .limit(MAX_SAMPLES)

  if (transcriptsError) {
    return { profile: null, error: 'Failed to load transcripts for analysis' }
  }

  let source: VoiceProfile['source']
  let samples: VoiceSample[]
  let promptCorpus: string

  if ((transcripts || []).length >= MIN_SCRIPTS_FOR_VOICEPRINT) {
    source = 'transcripts'
    samples = transcripts!.map((t) => ({ text: t.transcript, durationSeconds: t.video_duration_seconds }))
    promptCorpus = samples
      .map((s, i) => `--- Video ${i + 1} transcript ---\n${s.text}`)
      .join('\n\n')
      .slice(0, 12000)
  } else {
    const { data: scripts, error: scriptsError } = await supabase
      .from('scripts')
      .select('script, duration, tone, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_SAMPLES)

    if (scriptsError) {
      return { profile: null, error: 'Failed to load scripts for analysis' }
    }

    const rows = scripts || []
    if (rows.length < MIN_SCRIPTS_FOR_VOICEPRINT) {
      return {
        profile: null,
        error: `Need at least ${MIN_SCRIPTS_FOR_VOICEPRINT} scripts or connected-channel videos to build a VoicePrint — you have ${rows.length} scripts and ${(transcripts || []).length} ingested video transcripts.`,
      }
    }

    source = 'own_scripts'
    samples = rows.map((r) => ({ text: r.script, durationSeconds: r.duration }))
    promptCorpus = rows
      .map((r, i) => `--- Script ${i + 1} (tone: ${r.tone || 'unspecified'}, category: ${r.category || 'unspecified'}) ---\n${r.script}`)
      .join('\n\n')
      .slice(0, 12000)
  }

  const metrics = computeVoiceMetrics(samples)

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 500,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: `Here are ${samples.length} ${source === 'transcripts' ? 'real video transcripts' : 'scripts'} from a YouTube Shorts creator, along with measured writing metrics computed directly from the text (not estimated): average pace ${metrics.avgWpm ? `${metrics.avgWpm} words/minute` : 'unknown'}, average sentence length ${metrics.avgSentenceLength} words, vocabulary richness ${metrics.vocabularyRichness} (unique-word ratio), recurring phrases: ${metrics.topCatchphrases.map((c) => `"${c.phrase}"`).join(', ') || 'none detected'}.

Using the measured numbers above as ground truth, write a detailed, reusable writing-voice profile in prose — how they open and close, energy level, word choice character, and how the recurring phrases (if any) function in their delivery. Respond with ONLY the profile text (3-5 sentences), no preamble, no JSON, and don't just restate the numbers — interpret them.

${promptCorpus}`,
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
      script_count_analyzed: samples.length,
      last_analyzed_at: lastAnalyzedAt,
      source,
      avg_wpm: metrics.avgWpm,
      avg_sentence_length: metrics.avgSentenceLength,
      vocabulary_richness: metrics.vocabularyRichness,
      top_catchphrases: metrics.topCatchphrases,
    })

  if (upsertError) {
    return { profile: null, error: 'Generated a profile but failed to save it — try again.' }
  }

  return {
    profile: { analysisSummary, scriptCountAnalyzed: samples.length, lastAnalyzedAt, source, metrics },
    error: null,
  }
}
