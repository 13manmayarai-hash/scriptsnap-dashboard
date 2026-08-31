import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getRetentionAnalysis } from '@/lib/youtube/retention'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface SponsorSlotSuggestion {
  afterText: string
  sponsorRead: string
  reasoning: string
}

// Finds the single best point in a script to drop in a sponsor mention
// without breaking flow, and drafts the read itself. Not persisted —
// unlike structured_blocks/repurposed_variants, a sponsor slot is specific
// to one sponsor brief per request, not a fixed property of the script, so
// there's no single "the" sponsor slot to cache.
export async function findSponsorSlot(
  supabase: SupabaseClient,
  userId: string,
  scriptId: string,
  sponsorBrief: string
): Promise<{ suggestion: SponsorSlotSuggestion | null; error: string | null }> {
  const { data: script } = await supabase
    .from('scripts')
    .select('id, script, published_video_id')
    .eq('id', scriptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!script) {
    return { suggestion: null, error: 'Script not found' }
  }

  let dipsPrompt = ''
  if (script.published_video_id) {
    const retention = await getRetentionAnalysis(supabase, userId, script.published_video_id)
    if (retention && retention.dips.length > 0) {
      dipsPrompt = `\nThis video has known audience retention drop-offs around: ${retention.dips
        .map((d) => `~${d.startSeconds}s`)
        .join(', ')} into the video. Avoid placing the sponsor read at or right before one of these points — that's exactly where viewers are already leaving.\n`
    }
  }

  const prompt = `You are a YouTube Shorts producer placing a single sponsor integration into an existing script without hurting audience retention.

SCRIPT:
${script.script}

SPONSOR BRIEF: ${sponsorBrief}
${dipsPrompt}
Find the ONE best point to insert a brief sponsor mention — typically after the hook has landed and before the payoff, never interrupting the opening hook or the final punchline/CTA. Draft a short, natural-sounding sponsor read in the creator's own voice that fits the surrounding tone, not a generic ad-read.

Respond with ONLY a single valid JSON object (no markdown, no code fences, no commentary) with this exact shape:
{"afterText": "the exact sentence or short phrase from the script that the sponsor read should be inserted immediately after, copied verbatim", "sponsorRead": "the drafted sponsor read, 1-3 sentences", "reasoning": "one short sentence on why this point was chosen"}`

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 500,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
  const match = textBlock?.text.match(/\{[\s\S]*\}/)
  if (!match) {
    return { suggestion: null, error: 'Could not find a sponsor slot — try again in a moment.' }
  }

  let parsed: any
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return { suggestion: null, error: 'Could not find a sponsor slot — try again in a moment.' }
  }

  if (typeof parsed.afterText !== 'string' || typeof parsed.sponsorRead !== 'string' || !parsed.sponsorRead.trim()) {
    return { suggestion: null, error: 'Could not find a sponsor slot — try again in a moment.' }
  }

  return {
    suggestion: {
      afterText: parsed.afterText,
      sponsorRead: parsed.sponsorRead.trim(),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    },
    error: null,
  }
}
