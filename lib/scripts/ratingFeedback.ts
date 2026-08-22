import type { SupabaseClient } from '@supabase/supabase-js'

interface RatedScript {
  topic: string
  tone: string
  category: string
}

export interface RatingFeedback {
  liked: RatedScript[]
  disliked: RatedScript[]
}

interface RatingRow {
  rating: number
  scripts: { topic: string; tone: string; category: string } | { topic: string; tone: string; category: string }[] | null
}

// Pulls a small sample of the creator's own thumbs up/down on past scripts
// so generation can lean toward what's worked and away from what hasn't —
// the ratings UI (ScriptRating.tsx) has captured this signal since it
// shipped, but nothing ever read it back into a prompt until now. A plain
// Postgres query (RLS-scoped to the caller's own session, same as every
// other read in this route), not an external API call, so no caching
// layer needed — just never let a hiccup here block generation.
export async function getRatingFeedback(
  supabase: SupabaseClient,
  userId: string
): Promise<RatingFeedback | null> {
  try {
    const { data } = await supabase
      .from('script_ratings')
      .select('rating, scripts(topic, tone, category)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(12)

    const rows = (data || []) as unknown as RatingRow[]
    if (rows.length === 0) return null

    const toRatedScript = (row: RatingRow): RatedScript | null => {
      const s = Array.isArray(row.scripts) ? row.scripts[0] : row.scripts
      return s ? { topic: s.topic, tone: s.tone, category: s.category } : null
    }

    const liked = rows
      .filter((r) => r.rating === 1)
      .map(toRatedScript)
      .filter((s): s is RatedScript => !!s)
      .slice(0, 3)
    const disliked = rows
      .filter((r) => r.rating === -1)
      .map(toRatedScript)
      .filter((s): s is RatedScript => !!s)
      .slice(0, 2)

    if (liked.length === 0 && disliked.length === 0) return null
    return { liked, disliked }
  } catch (err) {
    console.error('Rating feedback fetch failed:', err)
    return null
  }
}

export function formatRatingFeedback(feedback: RatingFeedback): string {
  const lines: string[] = []
  if (feedback.liked.length > 0) {
    lines.push(
      `Scripts this creator rated helpful (lean toward this style): ${feedback.liked
        .map((s) => `"${s.topic}" (${s.tone}, ${s.category})`)
        .join('; ')}`
    )
  }
  if (feedback.disliked.length > 0) {
    lines.push(
      `Scripts this creator rated NOT helpful (avoid repeating this angle/tone): ${feedback.disliked
        .map((s) => `"${s.topic}" (${s.tone}, ${s.category})`)
        .join('; ')}`
    )
  }
  return lines.join('\n')
}
