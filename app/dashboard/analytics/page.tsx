'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, FileText, Type, Mic2, Tags, CalendarDays } from 'lucide-react'

interface Stats {
  totalScripts: number
  avgWordCount: number
  topTone: string | null
  topCategory: string | null
  contentPlanned: number
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)
  let best = values[0]
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data }, { count: plannedCount }] = await Promise.all([
        supabase.from('scripts').select('word_count, tone, category').eq('user_id', user.id),
        supabase
          .from('calendar_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('scheduled_date', new Date().toISOString().slice(0, 10)),
      ])

      const scripts = data || []
      const wordCounts = scripts.map((s) => s.word_count).filter((w): w is number => typeof w === 'number')

      setStats({
        totalScripts: scripts.length,
        avgWordCount: wordCounts.length
          ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
          : 0,
        topTone: mostCommon(scripts.map((s) => s.tone).filter(Boolean)),
        topCategory: mostCommon(scripts.map((s) => s.category).filter(Boolean)),
        contentPlanned: plannedCount || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink-muted">Loading analytics…</p>
      </div>
    )
  }

  const cards = [
    { icon: FileText, label: 'Scripts created', value: String(stats?.totalScripts ?? 0) },
    { icon: Type, label: 'Average script length', value: stats?.avgWordCount ? `${stats.avgWordCount} words` : '—' },
    { icon: Mic2, label: 'Most-used tone', value: stats?.topTone || '—' },
    { icon: Tags, label: 'Most-used category', value: stats?.topCategory || '—' },
    { icon: CalendarDays, label: 'Content planned', value: String(stats?.contentPlanned ?? 0) },
  ]

  return (
    <div className="max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <BarChart3 size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Analytics</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">A quick read on what you've made so far.</p>

      {!stats || stats.totalScripts === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-ink-muted">No scripts yet — generate your first one to see stats here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-soft-accent text-sage">
                <Icon size={16} aria-hidden="true" />
              </div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
              <p className="mt-1 text-2xl font-bold heading-serif capitalize">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
