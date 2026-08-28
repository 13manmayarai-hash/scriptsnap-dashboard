'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Copy, Search, ShieldAlert, ArrowUpDown, Loader2 } from 'lucide-react'
import LoadingState from '@/lib/components/ui/LoadingState'

interface Script {
  id: string
  topic: string
  category: string
  tone: string
  created_at: string
  word_count: number
  guideline_passed: boolean
}

type SortKey = 'newest' | 'oldest' | 'longest'

const CATEGORY_COLORS = [
  'bg-sage/15 text-sage',
  'bg-accent-slate/15 text-accent-slate',
  'bg-accent-plum/15 text-accent-plum',
  'bg-accent-ochre/15 text-accent-ochre',
  'bg-accent-clay/15 text-accent-clay',
  'bg-accent-teal/15 text-accent-teal',
  'bg-accent-umber/15 text-accent-umber',
]

// Deterministic, not random — the same category always lands on the same
// color across renders/sessions, so it reads as a real visual language
// rather than flickering between colors.
function categoryColor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'longest', label: 'Longest first' },
]

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryContent />
    </Suspense>
  )
}

function LibraryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [scripts, setScripts] = useState<(Script & { title: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(query)
  const [sort, setSort] = useState<SortKey>('newest')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      let request = supabase
        .from('scripts')
        .select('id, topic, category, tone, title, created_at, word_count, guideline_passed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (query.trim()) {
        // Wrapped in double quotes (with any embedded quotes escaped) per
        // PostgREST's filter grammar — otherwise a search term containing a
        // comma or parenthesis breaks out of this clause and silently
        // changes what the filter matches.
        const safe = query.trim().replace(/"/g, '\\"')
        request = request.or(`topic.ilike."%${safe}%",title.ilike."%${safe}%"`)
      }

      const { data } = await request
      setScripts(data || [])
      setLoading(false)
    }
    load()
  }, [query])

  const sortedScripts = useMemo(() => {
    const copy = [...scripts]
    if (sort === 'oldest') copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    else if (sort === 'longest') copy.sort((a, b) => b.word_count - a.word_count)
    else copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return copy
  }, [scripts, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput.trim()) params.set('q', searchInput.trim())
    router.push(`/dashboard/library${params.toString() ? `?${params}` : ''}`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this script? This can't be undone.")) return
    const supabase = createClient()
    await supabase.from('scripts').delete().eq('id', id)
    setScripts((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDuplicate = async (id: string) => {
    setBusyId(id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: original } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', id)
        .single()
      if (!original) return

      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = original
      const { data: inserted } = await supabase
        .from('scripts')
        .insert({ ...rest, title: `${original.title} (copy)` })
        .select('id, topic, category, tone, title, created_at, word_count, guideline_passed')
        .single()

      if (inserted) setScripts((prev) => [inserted, ...prev])
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="relative max-w-md flex-1">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search your scripts by topic or title…"
            className="input pl-9"
            aria-label="Search scripts"
          />
        </form>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} aria-hidden="true" className="text-ink-muted" />
          <label htmlFor="sort-scripts" className="sr-only">Sort scripts</label>
          <select
            id="sort-scripts"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input min-h-[40px] py-1.5 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading scripts…" />
      ) : sortedScripts.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="mb-4 text-5xl text-ink-muted/70">📭</div>
          <h2 className="mb-2 text-2xl font-bold heading-serif">
            {query ? 'No scripts match your search' : 'No Scripts Yet'}
          </h2>
          <p className="mb-6 text-ink-muted">
            {query ? 'Try a different search term.' : 'Generate your first script to see it appear here.'}
          </p>
          <Link href="/dashboard/new" className="btn-primary inline-flex">
            Start a new script
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedScripts.map((script) => (
            <div key={script.id} className="card flex items-center gap-3 py-3">
              <Link href={`/dashboard/scripts/${script.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{script.title}</p>
                  {!script.guideline_passed && (
                    <ShieldAlert size={14} aria-hidden="true" className="flex-shrink-0 text-accent-ochre" />
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
                  <span className="truncate">{script.topic}</span>
                  <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${categoryColor(script.category)}`}>
                    {script.category}
                  </span>
                  <span className="flex-shrink-0">{script.tone}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {new Date(script.created_at).toLocaleDateString()} • {script.word_count} words
                </p>
              </Link>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => handleDuplicate(script.id)}
                  disabled={busyId === script.id}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors hover:bg-warm-surface-alt disabled:opacity-50"
                  aria-label={`Duplicate ${script.title}`}
                >
                  {busyId === script.id ? (
                    <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(script.id)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-error transition-colors hover:bg-error/10"
                  aria-label={`Delete ${script.title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
