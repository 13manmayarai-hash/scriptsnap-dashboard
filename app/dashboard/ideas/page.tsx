'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, Plus, Trash2, Check, ArrowRight, Pencil, TrendingUp, AlertTriangle, PlayCircle } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import YouTubeIcon from '@/lib/components/ui/YouTubeIcon'
import VideoPlayerModal from '@/lib/components/ui/VideoPlayerModal'
import { CATEGORY_OPTIONS, REGION_OPTIONS } from '@/lib/youtube/categories'

const CATEGORY_TABS = [{ id: 'inferred', label: 'For You' }, { id: 'all', label: 'All' }, ...CATEGORY_OPTIONS]

interface Idea {
  id: string
  text: string
  status: 'new' | 'used'
  created_at: string
}

interface ChannelKeyword {
  phrase: string
  exampleTitle: string
  viewCount?: number
  videoId?: string
  thumbnailUrl?: string
}

interface TrendingVideo {
  videoId: string
  title: string
  channelTitle: string
  viewCount: number
  thumbnailUrl?: string
}

interface TrendingState {
  tierAllowed: boolean
  connected?: boolean
  needsReconnect?: boolean
  channelKeywords?: ChannelKeyword[]
  trendingCategoryLabel?: string | null
  trendingVideos?: TrendingVideo[]
  error?: string
}

export default function IdeasPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const [tier, setTier] = useState<string>('free')
  const [trending, setTrending] = useState<TrendingState | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState('inferred')
  const [selectedRegion, setSelectedRegion] = useState('IN')
  const [usingFilter, setUsingFilter] = useState(false)
  const [filterVideos, setFilterVideos] = useState<TrendingVideo[]>([])
  const [filterCategoryLabel, setFilterCategoryLabel] = useState<string | null>(null)
  const [filterLoading, setFilterLoading] = useState(false)
  const [filterError, setFilterError] = useState('')
  const [watchingVideo, setWatchingVideo] = useState<{ videoId: string; title: string } | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('ideas')
      .select('id, text, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)

    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()
    const userTier = profile?.subscription_tier || 'free'
    setTier(userTier)

    if (userTier === 'pro') {
      setTrendingLoading(true)
      try {
        const res = await fetch('/api/youtube/trending', { credentials: 'same-origin' })
        setTrending(await res.json())
      } catch {
        setTrending({ tierAllowed: true, connected: true, error: 'Could not load suggestions — try again in a moment.' })
      } finally {
        setTrendingLoading(false)
      }
    }
  }

  useEffect(() => {
    load()
  }, [])

  const insertIdea = async (ideaText: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error: insertError } = await supabase
      .from('ideas')
      .insert({ user_id: user.id, text: ideaText })
    if (insertError) throw insertError
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setSaving(true)
    try {
      await insertIdea(text.trim())
      setText('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add idea')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSuggestion = async (suggestionText: string) => {
    try {
      await insertIdea(suggestionText)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('ideas')
          .select('id, text, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setIdeas(data || [])
      }
    } catch {
      // Non-critical — the suggestion just stays visible to try again.
    }
  }

  const handleUseSuggestion = (suggestionText: string) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(suggestionText)}`)
  }

  const applyFilter = async (category: string, region: string) => {
    setSelectedCategory(category)
    setSelectedRegion(region)

    // Back to the default combo — just show what was already fetched on
    // page load rather than spending another API call to get it again.
    if (category === 'inferred' && region === 'IN') {
      setUsingFilter(false)
      return
    }

    setUsingFilter(true)
    setFilterLoading(true)
    setFilterError('')
    try {
      const params = new URLSearchParams({ category, region })
      const res = await fetch(`/api/youtube/trending?${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (data.error) {
        setFilterError(data.error)
        setFilterVideos([])
      } else {
        setFilterVideos(data.trendingVideos || [])
        setFilterCategoryLabel(data.trendingCategoryLabel ?? null)
      }
    } catch {
      setFilterError('Could not load trending videos — try again in a moment.')
      setFilterVideos([])
    } finally {
      setFilterLoading(false)
    }
  }

  const handleToggleUsed = async (idea: Idea) => {
    const nextStatus = idea.status === 'used' ? 'new' : 'used'
    const supabase = createClient()
    await supabase.from('ideas').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', idea.id)
    setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, status: nextStatus } : i)))
  }

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id)
    setEditingText(idea.text)
  }

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return
    const supabase = createClient()
    await supabase.from('ideas').update({ text: editingText.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, text: editingText.trim() } : i)))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this idea?')) return
    const supabase = createClient()
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas((prev) => prev.filter((i) => i.id !== id))
  }

  const handleConvert = (idea: Idea) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(idea.text)}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink-muted">Loading ideas…</p>
      </div>
    )
  }

  const newIdeas = ideas.filter((i) => i.status === 'new')
  const usedIdeas = ideas.filter((i) => i.status === 'used')

  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <Lightbulb size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Ideas</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">Quick thoughts, parked until you're ready to turn them into a script.</p>

      <form onSubmit={handleAdd} className="card mb-6">
        <label htmlFor="idea-text" className="sr-only">New idea</label>
        <div className="flex gap-2">
          <input
            id="idea-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Why do cats knock things off tables?"
            className="input flex-1"
            disabled={saving}
          />
          <button type="submit" disabled={saving || !text.trim()} className="btn-primary flex items-center gap-1.5 px-4">
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
        </div>
        {error && <ErrorMessage className="mt-3">{error}</ErrorMessage>}
      </form>

      {tier !== 'pro' && (
        <p className="mb-6 text-xs text-ink-muted">
          Connect your YouTube channel (<Link href="/dashboard/billing" className="text-sage hover:underline">Pro</Link>) to see trending suggestions here.
        </p>
      )}

      {tier === 'pro' && trendingLoading && !trending && (
        <div className="card mb-6">
          <p className="text-sm text-ink-muted">Loading suggestions…</p>
        </div>
      )}

      {tier === 'pro' && trending && !trending.connected && (
        <div className="card mb-6">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} aria-hidden="true" className="text-sage" />
            <h2 className="text-sm font-semibold text-ink-muted">TRENDING SUGGESTIONS</h2>
          </div>
          <p className="mb-3 text-sm text-ink-muted">
            Connect your YouTube channel to see topic suggestions from your own videos and what's trending in your category.
          </p>
          <a href="/api/youtube/connect" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
            <YouTubeIcon size={16} />
            Connect YouTube channel
          </a>
        </div>
      )}

      {tier === 'pro' && trending?.needsReconnect && (
        <div className="card mb-6">
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-50 p-3">
            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-ink">Your YouTube access needs to be reconnected.</p>
          </div>
          <Link href="/dashboard/settings" className="btn-secondary inline-flex items-center px-4 py-2 text-sm">
            Reconnect in Settings
          </Link>
        </div>
      )}

      {tier === 'pro' && trending?.connected && !trending.needsReconnect && (
        <div className="mb-6 space-y-6">
          {trending.error && <ErrorMessage>{trending.error}</ErrorMessage>}

          <div>
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp size={16} aria-hidden="true" className="text-sage" />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">From your channel</h2>
            </div>
            <p className="mb-2 text-xs text-ink-faint">Recurring topics from your own recent videos</p>
            {trending.channelKeywords && trending.channelKeywords.length > 0 ? (
              <div className="space-y-2">
                {trending.channelKeywords.map((kw, i) => (
                  <SuggestionCard
                    key={i}
                    title={kw.phrase}
                    subtitle={kw.exampleTitle}
                    meta={kw.viewCount !== undefined ? `${kw.viewCount.toLocaleString()} views` : undefined}
                    thumbnailUrl={kw.thumbnailUrl}
                    videoId={kw.videoId}
                    onAdd={() => handleAddSuggestion(kw.phrase)}
                    onUse={() => handleUseSuggestion(kw.phrase)}
                    onWatch={() => kw.videoId && setWatchingVideo({ videoId: kw.videoId, title: kw.exampleTitle })}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Not enough videos yet to detect trends.</p>
            )}
          </div>

          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Trending now</h2>

            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => applyFilter(cat.id, selectedRegion)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === cat.id ? 'bg-sage text-white' : 'bg-warm-surface-alt text-ink-muted hover:bg-warm-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label htmlFor="trending-region" className="sr-only">Region</label>
            <select
              id="trending-region"
              value={selectedRegion}
              onChange={(e) => applyFilter(selectedCategory, e.target.value)}
              className="input mb-2 h-9 w-auto py-1 text-xs"
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>

            <p className="mb-2 text-xs text-ink-faint">
              {(() => {
                const label = usingFilter ? filterCategoryLabel : trending.trendingCategoryLabel
                const regionLabel = REGION_OPTIONS.find((r) => r.code === selectedRegion)?.label || selectedRegion
                return label ? `in ${label} · ${regionLabel}` : `on YouTube · ${regionLabel}`
              })()}
            </p>

            {filterError && <ErrorMessage className="mb-2">{filterError}</ErrorMessage>}

            {filterLoading ? (
              <p className="text-sm text-ink-muted">Loading…</p>
            ) : (() => {
                const videos = usingFilter ? filterVideos : trending.trendingVideos || []
                return videos.length > 0 ? (
                  <div className="space-y-2">
                    {videos.map((v) => (
                      <SuggestionCard
                        key={v.videoId}
                        title={v.title}
                        subtitle={v.channelTitle}
                        meta={`${v.viewCount.toLocaleString()} views`}
                        thumbnailUrl={v.thumbnailUrl}
                        videoId={v.videoId}
                        onAdd={() => handleAddSuggestion(v.title)}
                        onUse={() => handleUseSuggestion(v.title)}
                        onWatch={() => setWatchingVideo({ videoId: v.videoId, title: v.title })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-muted">No trending videos found for this category/region.</p>
                )
              })()}
          </div>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-sm text-ink-muted">No ideas yet — jot one down above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {newIdeas.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">To explore</h2>
              <div className="space-y-2">
                {newIdeas.map((idea) => (
                  <div key={idea.id} className="card flex items-center gap-2 py-3">
                    {editingId === idea.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(idea.id)}
                        onBlur={() => saveEdit(idea.id)}
                        autoFocus
                        className="input flex-1 py-1.5"
                      />
                    ) : (
                      <p className="flex-1 text-sm text-ink">{idea.text}</p>
                    )}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleConvert(idea)}
                        className="flex min-h-[44px] items-center gap-1 rounded px-2 text-xs text-sage hover:bg-sage/10"
                      >
                        Convert <ArrowRight size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => startEdit(idea)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
                        aria-label={`Edit ${idea.text}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleToggleUsed(idea)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
                        aria-label={`Mark "${idea.text}" as used`}
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-error hover:bg-error/10"
                        aria-label={`Delete ${idea.text}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usedIdeas.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Used</h2>
              <div className="space-y-2">
                {usedIdeas.map((idea) => (
                  <div key={idea.id} className="card flex items-center gap-2 py-3 opacity-60">
                    <p className="flex-1 text-sm text-ink line-through">{idea.text}</p>
                    <button
                      onClick={() => handleToggleUsed(idea)}
                      className="flex-shrink-0 rounded px-2 py-1 text-xs text-ink-muted hover:underline"
                    >
                      Mark as new
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded text-error hover:bg-error/10"
                      aria-label={`Delete ${idea.text}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {watchingVideo && (
        <VideoPlayerModal
          videoId={watchingVideo.videoId}
          title={watchingVideo.title}
          onClose={() => setWatchingVideo(null)}
        />
      )}
    </div>
  )
}

function SuggestionCard({
  title,
  subtitle,
  meta,
  thumbnailUrl,
  videoId,
  onAdd,
  onUse,
  onWatch,
}: {
  title: string
  subtitle: string
  meta?: string
  thumbnailUrl?: string
  videoId?: string
  onAdd: () => void
  onUse: () => void
  onWatch: () => void
}) {
  return (
    <div className="card flex items-center gap-3 py-3">
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="h-10 w-[71px] flex-shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        <p className="truncate text-xs text-ink-muted">{subtitle}{meta ? ` · ${meta}` : ''}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        {videoId && (
          <button
            onClick={onWatch}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-ink-muted hover:bg-warm-surface-alt"
            aria-label={`Watch "${title}"`}
          >
            <PlayCircle size={16} aria-hidden="true" />
          </button>
        )}
        <button
          onClick={onUse}
          className="flex min-h-[44px] items-center gap-1 rounded px-2 text-xs text-sage hover:bg-sage/10"
        >
          Use this <ArrowRight size={13} aria-hidden="true" />
        </button>
        <button
          onClick={onAdd}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
          aria-label={`Add "${title}" to ideas`}
        >
          <Plus size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
