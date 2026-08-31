import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type RepurposePlatform = 'youtube_shorts' | 'tiktok' | 'instagram_reels'

export interface RepurposedVariant {
  platform: RepurposePlatform
  script: string
  note: string
}

const PLATFORM_LABELS: Record<RepurposePlatform, string> = {
  youtube_shorts: 'YouTube Shorts',
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
}

const PLATFORM_GUIDANCE: Record<RepurposePlatform, string> = {
  youtube_shorts: 'YouTube Shorts: hook must land in the first line, favors a clear informational payoff, CTA can reference subscribing or watching a related video.',
  tiktok: 'TikTok: faster, more conversational/native slang-friendly opener, thrives on a trend-aware or provocative first line, CTA favors comments/duets over subscribing.',
  instagram_reels: 'Instagram Reels: slightly more polished/aesthetic tone than TikTok, opener can lean visual ("watch this"), CTA favors saves/shares.',
}

// This app only ever generates short-form scripts (no long-form source
// exists to split up), so "multi-format repurposing" here means adapting
// one script's hook/pacing/CTA phrasing per short-form platform's native
// conventions, not splitting a long video into clips. Stored additively on
// scripts.repurposed_variants alongside the original plain-text script.
export async function repurposeScript(
  supabase: SupabaseClient,
  userId: string,
  scriptId: string,
  platforms: RepurposePlatform[]
): Promise<{ variants: RepurposedVariant[] | null; error: string | null }> {
  const { data: script } = await supabase
    .from('scripts')
    .select('id, script')
    .eq('id', scriptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!script) {
    return { variants: null, error: 'Script not found' }
  }

  const targets = platforms.length > 0 ? platforms : (Object.keys(PLATFORM_LABELS) as RepurposePlatform[])

  const prompt = `You are a short-form video producer adapting one script for multiple platforms. Each platform has different audience conventions for hooks, pacing, and calls to action, even though the core content and length stay the same.

ORIGINAL SCRIPT:
${script.script}

Adapt it for these platforms, each with its own native style:
${targets.map((p) => `- ${PLATFORM_LABELS[p]}: ${PLATFORM_GUIDANCE[p]}`).join('\n')}

Respond with ONLY a single valid JSON object (no markdown, no code fences, no commentary) with this exact shape:
{"variants": [{"platform": "youtube_shorts", "script": "the adapted script text", "note": "one short sentence on what changed for this platform"}]}

Rules:
- Keep the same core topic, facts, and roughly the same length as the original — only hook phrasing, tone, pacing, and CTA should shift per platform.
- "platform" must be exactly one of: ${targets.map((p) => `"${p}"`).join(', ')}.
- Include exactly one variant per listed platform.`

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
    return { variants: null, error: 'Could not generate repurposed variants — try again in a moment.' }
  }

  let parsed: any
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return { variants: null, error: 'Could not generate repurposed variants — try again in a moment.' }
  }

  if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
    return { variants: null, error: 'Could not generate repurposed variants — try again in a moment.' }
  }

  const validPlatforms = new Set(targets)
  const variants: RepurposedVariant[] = parsed.variants
    .filter((v: any) => v && typeof v.script === 'string' && validPlatforms.has(v.platform))
    .map((v: any) => ({
      platform: v.platform,
      script: v.script,
      note: typeof v.note === 'string' ? v.note : '',
    }))

  if (variants.length === 0) {
    return { variants: null, error: 'Could not generate repurposed variants — try again in a moment.' }
  }

  const { error: updateError } = await supabase
    .from('scripts')
    .update({ repurposed_variants: variants })
    .eq('id', scriptId)
    .eq('user_id', userId)

  if (updateError) {
    return { variants: null, error: 'Generated variants but failed to save them — try again.' }
  }

  return { variants, error: null }
}
