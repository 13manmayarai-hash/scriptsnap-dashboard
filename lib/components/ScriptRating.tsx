'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ScriptRating({ scriptId }: { scriptId: string }) {
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
