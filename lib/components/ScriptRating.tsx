'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ScriptRating({
  scriptId,
  tone,
  keywords,
}: {
  scriptId: string
  tone?: string
  keywords?: string[]
}) {
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }
      const { data } = await supabase
        .from('script_ratings')
        .select('rating')
        .eq('script_id', scriptId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!cancelled) {
        setRating(data?.rating ?? null)
        setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [scriptId])

  const handleRate = async (value: 1 | -1) => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    const next = rating === value ? null : value

    if (next === null) {
      await supabase
        .from('script_ratings')
        .delete()
        .eq('script_id', scriptId)
        .eq('user_id', user.id)
    } else {
      await supabase.from('script_ratings').upsert(
        { script_id: scriptId, user_id: user.id, rating: next },
        { onConflict: 'script_id,user_id' }
      )

      // Feed this rating into the tone/keyword performance stats shown on
      // the dashboard. Mapped onto a 1-5 scale (thumbs up -> 5, thumbs
      // down -> 1) so avg_rating reads like a familiar rating rather than
      // a raw +1/-1 sum. Best-effort only -- there's no corresponding
      // decrement RPC, so un-rating (next === null, handled above) can't
      // retroactively undo its contribution to the running average.
      const scaledRating = next === 1 ? 5 : 1
      if (tone) {
        await supabase.rpc('update_tone_stats', {
          p_user_id: user.id,
          p_tone: tone,
          p_rating: scaledRating,
        })
      }
      if (keywords && keywords.length > 0) {
        await supabase.rpc('update_keyword_stats', {
          p_user_id: user.id,
          p_keywords: keywords,
          p_rating: scaledRating,
        })
      }
    }

    setRating(next)
    setSaving(false)
  }

  if (loading) return null

  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Rate this script">
      <button
        type="button"
        onClick={() => handleRate(1)}
        disabled={saving}
        aria-pressed={rating === 1}
        aria-label="This script was helpful"
        className={`p-2 rounded transition-colors ${
          rating === 1 ? 'bg-sage/20 text-sage' : 'bg-ink/5 text-ink-muted hover:bg-ink/10'
        }`}
      >
        <ThumbsUp size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => handleRate(-1)}
        disabled={saving}
        aria-pressed={rating === -1}
        aria-label="This script wasn't helpful"
        className={`p-2 rounded transition-colors ${
          rating === -1 ? 'bg-error/15 text-error' : 'bg-ink/5 text-ink-muted hover:bg-ink/10'
        }`}
      >
        <ThumbsDown size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
