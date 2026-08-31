import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getRetentionAnalysis } from '@/lib/youtube/retention'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const DEFAULT_TARGET_WPM = 140

export interface StructuredBlock {
  timestamp: string
  audio: string
  visual: string
  sfx: string
  retentionTrigger: string | null
  brollPrompt: string | null
}

export interface StructuredScript {
  title: string
  targetWPM: number
  blocks: StructuredBlock[]
}

// Breaks an existing script's text into a production-ready dual-column
// shooting script (audio/visual/sfx per block), as an additive enrichment
// stored in scripts.structured_blocks rather than replacing the plain-text
// script column that library/PDF-export/ratings all depend on. Uses the
// creator's own measured VoicePrint pace (falls back to a generic default)
// for timestamps, and — when the script is linked to a video with known
// retention drop-offs — asks Claude to place a "Pattern Interrupt" block at
// each one, reusing the same never-throw retention lookup already used on
// the analyze page. Each block also carries an optional ready-to-paste
// generative B-roll prompt, produced in the same call rather than a second
// billable Claude request.
export async function generateStructuredScript(
  supabase: SupabaseClient,
  userId: string,
  scriptId: string
): Promise<{ structured: StructuredScript | null; error: string | null }> {
  const { data: script } = await supabase
    .from('scripts')
    .select('id, title, script, published_video_id')
    .eq('id', scriptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!script) {
    return { structured: null, error: 'Script not found' }
  }

  const { data: voiceProfile } = await supabase
    .from('voice_profiles')
    .select('avg_wpm')
    .eq('user_id', userId)
    .maybeSingle<{ avg_wpm: number | null }>()

  const targetWPM = voiceProfile?.avg_wpm || DEFAULT_TARGET_WPM

  let dipsPrompt = ''
  if (script.published_video_id) {
    const retention = await getRetentionAnalysis(supabase, userId, script.published_video_id)
    if (retention && retention.dips.length > 0) {
      dipsPrompt = `\nKNOWN AUDIENCE RETENTION DROP-OFF POINTS for this video (insert a "Pattern Interrupt" block — a sudden visual/audio/pacing change designed to re-hook a drifting viewer — at or just before each of these timestamps):\n${retention.dips
        .map((d) => `- ~${d.startSeconds}s into the video (${d.dropPercent}% drop in watch ratio)`)
        .join('\n')}\n`
    }
  }

  const prompt = `You are a professional YouTube Shorts director breaking a finished script into a production-ready dual-column shooting script.

TARGET PACE: ${targetWPM} words per minute (this creator's own measured speaking pace — use it to place realistic timestamps).
${dipsPrompt}
SCRIPT:
${script.script}

Break the script above into sequential shooting blocks. Respond with ONLY a single valid JSON object (no markdown, no code fences, no commentary) with this exact shape:
{"title": "short production title for this shoot", "targetWPM": ${targetWPM}, "blocks": [{"timestamp": "0:00", "audio": "the spoken line(s) for this block, verbatim from the script", "visual": "what's on screen — shot type, action, on-screen text", "sfx": "sound effect or music cue, or empty string if none", "retentionTrigger": "a short label like 'Pattern Interrupt' if this block exists specifically to counter a known retention drop-off, else null", "brollPrompt": "a ready-to-paste image/video generation prompt (for tools like Midjourney, Runway, or Sora) describing this block's visual in concrete, literal, tool-agnostic terms — camera angle, subject, lighting, style — or null if the visual is on-screen text/graphics with no real footage to generate"}]}

Rules:
- Every word of the original script must appear in exactly one block's "audio" field, in order — don't summarize or drop any of it.
- Timestamps are cumulative, computed from ${targetWPM} words/minute pacing, formatted "M:SS".
- Only set "retentionTrigger" on a block when it corresponds to a listed drop-off point above; otherwise use null.
- "brollPrompt" should stand alone (no reference to "this video" or the script) since it's pasted directly into a separate generative tool.`

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const match = textBlock?.text.match(/\{[\s\S]*\}/)
  if (!match) {
    return { structured: null, error: 'Could not generate a structured script — try again in a moment.' }
  }

  let parsed: any
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return { structured: null, error: 'Could not generate a structured script — try again in a moment.' }
  }

  if (!Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    return { structured: null, error: 'Could not generate a structured script — try again in a moment.' }
  }

  const blocks: StructuredBlock[] = parsed.blocks
    .filter((b: any) => b && typeof b.audio === 'string')
    .map((b: any) => ({
      timestamp: typeof b.timestamp === 'string' ? b.timestamp : '0:00',
      audio: b.audio,
      visual: typeof b.visual === 'string' ? b.visual : '',
      sfx: typeof b.sfx === 'string' ? b.sfx : '',
      retentionTrigger: typeof b.retentionTrigger === 'string' && b.retentionTrigger.trim() ? b.retentionTrigger.trim() : null,
      brollPrompt: typeof b.brollPrompt === 'string' && b.brollPrompt.trim() ? b.brollPrompt.trim() : null,
    }))

  if (blocks.length === 0) {
    return { structured: null, error: 'Could not generate a structured script — try again in a moment.' }
  }

  const structured: StructuredScript = {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : script.title,
    targetWPM: typeof parsed.targetWPM === 'number' && parsed.targetWPM > 0 ? parsed.targetWPM : targetWPM,
    blocks,
  }

  const { error: updateError } = await supabase
    .from('scripts')
    .update({ structured_blocks: structured })
    .eq('id', scriptId)
    .eq('user_id', userId)

  if (updateError) {
    return { structured: null, error: 'Generated a structured script but failed to save it — try again.' }
  }

  return { structured, error: null }
}
