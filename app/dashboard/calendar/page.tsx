'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, Loader2 } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'

interface CalendarEntry {
  id: string
  title: string
  scheduled_date: string
  status: 'draft' | 'published'
  script_id: string | null
}

interface ScriptOption {
  id: string
  title: string
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [scripts, setScripts] = useState<ScriptOption[]>([])
  const [loading, setLoading] = useState(true)
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(toDateKey(new Date()))
  const [scriptId, setScriptId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [{ data: entryData }, { data: scriptData }] = await Promise.all([
      supabase
        .from('calendar_entries')
        .select('id, title, scheduled_date, status, script_id')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true }),
      supabase
        .from('scripts')
        .select('id, title')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    setEntries(entryData || [])
    setScripts(scriptData || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('calendar_entries').insert({
        user_id: user.id,
        title: title.trim(),
        scheduled_date: date,
        script_id: scriptId || null,
      })
      if (insertError) throw insertError

      setTitle('')
      setScriptId('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (entry: CalendarEntry) => {
    const next = entry.status === 'draft' ? 'published' : 'draft'
    const supabase = createClient()
    await supabase.from('calendar_entries').update({ status: next }).eq('id', entry.id)
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e)))
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this entry?')) return
    const supabase = createClient()
    await supabase.from('calendar_entries').delete().eq('id', id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>()
    for (const entry of entries) {
      const list = map.get(entry.scheduled_date) || []
      list.push(entry)
      map.set(entry.scheduled_date, list)
    }
    return map
  }, [entries])

  const upcoming = useMemo(() => {
    const todayKey = toDateKey(new Date())
    return entries.filter((e) => e.scheduled_date >= todayKey).slice(0, 8)
  }, [entries])

  const monthLabel = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const firstOfMonth = monthCursor
  const daysInMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate()
  const startWeekday = firstOfMonth.getDay()
  const todayKey = toDateKey(new Date())

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  if (loading) {
    return <LoadingState message="Loading calendar…" />
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon size={24} aria-hidden="true" className="text-sage" />
          <h1 className="text-2xl font-bold heading-serif">Calendar</h1>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
          {showForm ? <X size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
          {showForm ? 'Cancel' : 'Plan content'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card mb-6 space-y-3">
          <div>
            <label htmlFor="entry-title" className="mb-1.5 block text-sm font-medium">Title</label>
            <input
              id="entry-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's going out?"
              className="input"
              disabled={saving}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="entry-date" className="mb-1.5 block text-sm font-medium">Date</label>
              <input
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label htmlFor="entry-script" className="mb-1.5 block text-sm font-medium">Attach a script (optional)</label>
              <select
                id="entry-script"
                value={scriptId}
                onChange={(e) => setScriptId(e.target.value)}
                className="input"
                disabled={saving}
              >
                <option value="">None</option>
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 px-6">
            {saving && <Loader2 size={16} aria-hidden="true" className="animate-spin" />}
            {saving ? 'Adding…' : 'Add to calendar'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <p className="text-sm font-semibold text-ink">{monthLabel}</p>
            <button
              onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              aria-label="Next month"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-faint">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />
              const key = toDateKey(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day))
              const dayEntries = entriesByDate.get(key) || []
              const isToday = key === todayKey
              return (
                <div
                  key={i}
                  className={`min-h-[64px] rounded-lg border p-1 text-left ${
                    isToday ? 'border-sage bg-sage/5' : 'border-warm-border'
                  }`}
                >
                  <p className={`text-xs ${isToday ? 'font-bold text-sage' : 'text-ink-muted'}`}>{day}</p>
                  {dayEntries.slice(0, 2).map((entry) => (
                    <p
                      key={entry.id}
                      className={`mt-0.5 truncate rounded px-1 py-0.5 text-[10px] ${
                        entry.status === 'published' ? 'bg-sage/20 text-sage' : 'bg-ink/5 text-ink-muted'
                      }`}
                      title={entry.title}
                    >
                      {entry.title}
                    </p>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Upcoming content</h2>
          {upcoming.length === 0 ? (
            <div className="card py-8 text-center">
              <p className="text-sm text-ink-muted">Nothing planned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((entry) => (
                <div key={entry.id} className="card py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {entry.script_id ? (
                        <Link href={`/dashboard/scripts/${entry.script_id}`} className="truncate text-sm font-medium text-ink hover:underline">
                          {entry.title}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium text-ink">{entry.title}</p>
                      )}
                      <p className="text-xs text-ink-muted">
                        {new Date(entry.scheduled_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="flex min-h-[36px] min-w-[36px] flex-shrink-0 items-center justify-center rounded text-error hover:bg-error/10"
                      aria-label={`Remove ${entry.title}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    onClick={() => toggleStatus(entry)}
                    className={`mt-2 rounded px-2 py-1 text-xs font-medium ${
                      entry.status === 'published' ? 'bg-sage/20 text-sage' : 'bg-ink/5 text-ink-muted'
                    }`}
                  >
                    {entry.status === 'published' ? 'Published' : 'Draft'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
