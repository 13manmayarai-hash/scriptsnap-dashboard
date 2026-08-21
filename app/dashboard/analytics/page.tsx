'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, FileText, Type, Mic2, Tags, CalendarDays, AlertTriangle,
  CheckCircle2, XCircle, Lightbulb, Eye, Clock, Users, ThumbsUp,
  MessageCircle, Share2, MousePointerClick, PlayCircle, MoreHorizontal, Plus,
  Loader2, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import YouTubeIcon from '@/lib/components/ui/YouTubeIcon'
import VideoPlayerModal from '@/lib/components/ui/VideoPlayerModal'
import VideoBreakdownPanel, { type DetailsState } from '@/lib/components/ui/VideoBreakdownPanel'
import LoadingState from '@/lib/components/ui/LoadingState'

const SAGE = '#7A8B72'
const ERROR = '#B85C5C'
const BORDER = '#E0DDD3'
const INK_MUTED = '#706E68'

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

interface DailyPoint { date: string; views: number; watchTimeMinutes: number; subscribersNet: number }
interface TopVideo { videoId: string; title: string; views: number; averageViewPercentage: number; thumbnailUrl?: string }
interface CompetitorVideo { videoId: string; title: string; channelTitle: string; viewCount: number; thumbnailUrl?: string }

interface PerformanceData {
  channelTitle: string
  subscriberCount: number
  rangeDays: number
  totals: {
    views: number
    watchTimeHours: number
    subscribersGained: number
    subscribersLost: number
    likes: number
    comments: number
    shares: number
  }
  daily: DailyPoint[]
  topVideos: TopVideo[]
  channelCtr?: { impressions: number; ctr: number }
  aiSummary: { whatsWorking: string[]; whatsNot: string[]; suggestions: string[] }
  competitorVideos: CompetitorVideo[]
}

interface PerformanceState {
  tierAllowed: boolean
  connected?: boolean
  needsReconnect?: boolean
  channelTitle?: string
  error?: string
  data?: PerformanceData
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function chartTooltipStyle() {
  return { backgroundColor: '#FFFFFF', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const [tier, setTier] = useState<string>('free')
  const [perf, setPerf] = useState<PerformanceState | null>(null)
  const [perfLoading, setPerfLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [watchingVideo, setWatchingVideo] = useState<{ videoId: string; title: string } | null>(null)
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null)
  const [detailsById, setDetailsById] = useState<Record<string, DetailsState>>({})

  const loadPerformance = async (forceRefresh = false) => {
    setPerfLoading(true)
    try {
      const params = forceRefresh ? '?refresh=1' : ''
      const res = await fetch(`/api/youtube/performance${params}`, { credentials: 'same-origin' })
      const json = await res.json()
      setPerf({
        tierAllowed: json.tierAllowed,
        connected: json.connected,
        needsReconnect: json.needsReconnect,
        channelTitle: json.channelTitle,
        error: json.error,
        data: json.aiSummary ? json : undefined,
      })
    } catch {
      setPerf({ tierAllowed: true, connected: true, error: 'Could not load performance data — try again in a moment.' })
    } finally {
      setPerfLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data }, { count: plannedCount }, { data: profile }] = await Promise.all([
        supabase.from('scripts').select('word_count, tone, category').eq('user_id', user.id),
        supabase
          .from('calendar_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('scheduled_date', new Date().toISOString().slice(0, 10)),
        supabase.from('users').select('subscription_tier').eq('id', user.id).single(),
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

      const userTier = profile?.subscription_tier || 'free'
      setTier(userTier)
      if (userTier === 'pro') {
        loadPerformance()
      }
    }
    load()
  }, [])

  const toggleExpand = async (videoId: string, source: 'own' | 'trending') => {
    if (expandedVideoId === videoId) {
      setExpandedVideoId(null)
      return
    }
    setExpandedVideoId(videoId)
    if (detailsById[videoId]) return

    setDetailsById((prev) => ({ ...prev, [videoId]: { status: 'loading' } }))
    try {
      const params = new URLSearchParams({ videoId, source })
      const res = await fetch(`/api/youtube/video-details?${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (data.error) {
        setDetailsById((prev) => ({ ...prev, [videoId]: { status: 'error', message: data.error } }))
      } else {
        setDetailsById((prev) => ({ ...prev, [videoId]: { status: 'loaded', data } }))
      }
    } catch {
      setDetailsById((prev) => ({
        ...prev,
        [videoId]: { status: 'error', message: 'Could not load this video\'s breakdown — try again in a moment.' },
      }))
    }
  }

  const handleAddIdea = async (text: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('ideas').insert({ user_id: user.id, text })
    } catch {
      // Non-critical — nothing to show on failure here.
    }
  }

  const handleGenerateScript = (topic: string) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(topic)}`)
  }

  if (loading) {
    return <LoadingState message="Loading analytics…" />
  }

  const cards = [
    { icon: FileText, label: 'Scripts created', value: String(stats?.totalScripts ?? 0), color: 'bg-sage' },
    { icon: Type, label: 'Average script length', value: stats?.avgWordCount ? `${stats.avgWordCount} words` : '—', color: 'bg-blue-500' },
    { icon: Mic2, label: 'Most-used tone', value: stats?.topTone || '—', color: 'bg-purple-500' },
    { icon: Tags, label: 'Most-used category', value: stats?.topCategory || '—', color: 'bg-amber-500' },
    { icon: CalendarDays, label: 'Content planned', value: String(stats?.contentPlanned ?? 0), color: 'bg-rose-500' },
  ]

  const perfData = perf?.data
  const netSubs = perfData ? perfData.totals.subscribersGained - perfData.totals.subscribersLost : 0

  return (
    <div className="max-w-5xl">
      <div className="mb-2 flex items-center gap-3">
        <BarChart3 size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Analytics</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">A quick read on what you've made so far.</p>

      {!stats || stats.totalScripts === 0 ? (
        <div className="card mb-8 py-16 text-center">
          <p className="text-ink-muted">No scripts yet — generate your first one to see stats here.</p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <Icon size={18} aria-hidden="true" className="mb-3 text-white" />
              <p className="text-xs uppercase tracking-wide text-white/80">{label}</p>
              <p className="mt-1 text-2xl font-bold heading-serif capitalize text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* YouTube performance — Pro tier, connected channel only */}
      <div className="mb-2 flex items-center gap-2">
        <YouTubeIcon size={18} />
        <h2 className="text-lg font-bold heading-serif">YouTube performance</h2>
      </div>

      {tier !== 'pro' && (
        <p className="mb-6 text-xs text-ink-muted">
          Connect your YouTube channel (<Link href="/dashboard/billing" className="text-sage hover:underline">Pro</Link>) to see real channel performance, trends, and AI-written takeaways here.
        </p>
      )}

      {tier === 'pro' && perfLoading && !perf && (
        <div className="card">
          <LoadingState message="Loading performance data…" compact />
        </div>
      )}

      {tier === 'pro' && perf && !perf.connected && (
        <div className="card">
          <p className="mb-3 text-sm text-ink-muted">
            Connect your YouTube channel to see real views, watch time, retention, and an AI-written breakdown of what's working.
          </p>
          <a href="/api/youtube/connect" className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
            <YouTubeIcon size={16} />
            Connect YouTube channel
          </a>
        </div>
      )}

      {tier === 'pro' && perf?.needsReconnect && (
        <div className="card">
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-400/50 bg-amber-50 p-3">
            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-ink">Your YouTube access needs to be reconnected.</p>
          </div>
          <Link href="/dashboard/settings" className="btn-secondary inline-flex items-center px-4 py-2 text-sm">
            Reconnect in Settings
          </Link>
        </div>
      )}

      {tier === 'pro' && perf?.connected && !perf.needsReconnect && (
        <div className="space-y-6">
          {perf.error && <ErrorMessage>{perf.error}</ErrorMessage>}

          {perfData && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-faint">
                  {perfData.channelTitle} · {perfData.subscriberCount.toLocaleString()} subscribers · last {perfData.rangeDays} days
                </p>
                <button
                  onClick={() => { setSyncing(true); loadPerformance(true).finally(() => setSyncing(false)) }}
                  disabled={syncing}
                  className="flex items-center gap-1.5 text-xs text-sage hover:underline disabled:opacity-50"
                >
                  {syncing ? <Loader2 size={12} aria-hidden="true" className="animate-spin" /> : <RefreshCw size={12} aria-hidden="true" />}
                  {syncing ? 'Syncing…' : 'Sync now'}
                </button>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile icon={Eye} label="Views" value={perfData.totals.views.toLocaleString()} color="bg-blue-500" />
                <StatTile icon={Clock} label="Watch time" value={`${perfData.totals.watchTimeHours}h`} color="bg-purple-500" />
                <StatTile
                  icon={Users}
                  label="Subscribers"
                  value={`${netSubs >= 0 ? '+' : ''}${netSubs.toLocaleString()}`}
                  color="bg-sage"
                />
                <StatTile
                  icon={MousePointerClick}
                  label="Thumbnail CTR"
                  value={perfData.channelCtr ? `${perfData.channelCtr.ctr.toFixed(1)}%` : 'Not enough data'}
                  color="bg-amber-500"
                />
                <StatTile icon={ThumbsUp} label="Likes" value={perfData.totals.likes.toLocaleString()} color="bg-rose-500" />
                <StatTile icon={MessageCircle} label="Comments" value={perfData.totals.comments.toLocaleString()} color="bg-teal-500" />
                <StatTile icon={Share2} label="Shares" value={perfData.totals.shares.toLocaleString()} color="bg-indigo-500" />
              </div>

              {/* Charts */}
              {perfData.daily.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="card">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Views per day</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={perfData.daily}>
                        <defs>
                          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={SAGE} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={SAGE} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
                        <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
                        <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
                        <Area type="monotone" dataKey="views" stroke={SAGE} strokeWidth={2} fill="url(#viewsFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Watch time per day (minutes)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={perfData.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
                        <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
                        <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
                        <Line type="monotone" dataKey="watchTimeMinutes" stroke={SAGE} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card lg:col-span-2">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">Subscribers gained/lost per day</h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={perfData.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: INK_MUTED }} minTickGap={30} />
                        <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} width={36} />
                        <Tooltip labelFormatter={(label) => shortDate(String(label))} contentStyle={chartTooltipStyle()} />
                        <Bar dataKey="subscribersNet" radius={[3, 3, 3, 3]}>
                          {perfData.daily.map((d, i) => (
                            <Cell key={i} fill={d.subscribersNet >= 0 ? SAGE : ERROR} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard icon={CheckCircle2} iconClass="text-sage" title="What's working" items={perfData.aiSummary.whatsWorking} />
                <SummaryCard icon={XCircle} iconClass="text-error" title="What's not" items={perfData.aiSummary.whatsNot} />
                <SummaryCard icon={Lightbulb} iconClass="text-amber-600" title="Suggestions" items={perfData.aiSummary.suggestions} />
              </div>
              <p className="-mt-3 text-[10px] italic text-ink-faint">AI-written from your real channel numbers above — a starting point for your own judgment, not a guarantee.</p>

              {/* Top videos */}
              {perfData.topVideos.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Your top videos this period</h3>
                  <div className="space-y-2">
                    {perfData.topVideos.map((v) => (
                      <VideoRow
                        key={v.videoId}
                        title={v.title}
                        subtitle={`${v.views.toLocaleString()} views · ${v.averageViewPercentage.toFixed(0)}% retention`}
                        thumbnailUrl={v.thumbnailUrl}
                        videoId={v.videoId}
                        source="own"
                        expanded={expandedVideoId === v.videoId}
                        detailsState={detailsById[v.videoId]}
                        onWatch={() => setWatchingVideo({ videoId: v.videoId, title: v.title })}
                        onToggleExpand={() => toggleExpand(v.videoId, 'own')}
                        onGenerateScript={handleGenerateScript}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Competitor videos */}
              {perfData.competitorVideos.length > 0 && (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Popular in your niche right now</h3>
                  <p className="mb-2 text-xs text-ink-faint">Other creators' videos close to your top video's topic — see what's working for them.</p>
                  <div className="space-y-2">
                    {perfData.competitorVideos.map((v) => (
                      <VideoRow
                        key={v.videoId}
                        title={v.title}
                        subtitle={`${v.channelTitle} · ${v.viewCount.toLocaleString()} views`}
                        thumbnailUrl={v.thumbnailUrl}
                        videoId={v.videoId}
                        source="trending"
                        expanded={expandedVideoId === v.videoId}
                        detailsState={detailsById[v.videoId]}
                        onWatch={() => setWatchingVideo({ videoId: v.videoId, title: v.title })}
                        onToggleExpand={() => toggleExpand(v.videoId, 'trending')}
                        onGenerateScript={handleGenerateScript}
                        onAddIdea={() => handleAddIdea(v.title)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
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

function StatTile({
  icon: Icon,
  label,
  value,
  color = 'bg-sage',
}: {
  icon: LucideIcon
  label: string
  value: string
  color?: string
}) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <Icon size={16} aria-hidden="true" className="mb-2 text-white" />
      <p className="text-[10px] uppercase tracking-wide text-white/80">{label}</p>
      <p className="mt-0.5 text-lg font-bold heading-serif text-white">{value}</p>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  iconClass,
  title,
  items,
}: {
  icon: LucideIcon
  iconClass: string
  title: string
  items: string[]
}) {
  return (
    <div className="card">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon size={15} aria-hidden="true" className={iconClass} />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-ink">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">Not enough data yet.</p>
      )}
    </div>
  )
}

function VideoRow({
  title,
  subtitle,
  thumbnailUrl,
  videoId,
  source,
  expanded,
  detailsState,
  onWatch,
  onToggleExpand,
  onGenerateScript,
  onAddIdea,
}: {
  title: string
  subtitle: string
  thumbnailUrl?: string
  videoId: string
  source: 'own' | 'trending'
  expanded: boolean
  detailsState?: DetailsState
  onWatch: () => void
  onToggleExpand: () => void
  onGenerateScript: (title: string) => void
  onAddIdea?: () => void
}) {
  return (
    <div className="card py-3">
      <div className="flex items-center gap-3">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="h-10 w-[71px] flex-shrink-0 rounded object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          <p className="truncate text-xs text-ink-muted">{subtitle}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={onWatch}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-ink-muted hover:bg-warm-surface-alt"
            aria-label={`Watch "${title}"`}
          >
            <PlayCircle size={16} aria-hidden="true" />
          </button>
          <button
            onClick={onToggleExpand}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-ink-muted hover:bg-warm-surface-alt"
            aria-expanded={expanded}
            aria-label={expanded ? `Hide breakdown for "${title}"` : `Show breakdown for "${title}"`}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
          {onAddIdea && (
            <button
              onClick={onAddIdea}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
              aria-label={`Add "${title}" to ideas`}
            >
              <Plus size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {expanded && detailsState && (
        <VideoBreakdownPanel state={detailsState} source={source} onGenerateScript={onGenerateScript} />
      )}
    </div>
  )
}
