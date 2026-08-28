'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import { TIER_SCRIPT_LIMITS, TIER_NAMES, TIER_BENEFITS } from '@/lib/tiers'
import {
  Sparkles, Check, X, ArrowRight, Lightbulb, CalendarDays,
  BarChart3, FileText, Type, Mic2, Tags, AlertTriangle,
  CheckCircle2, XCircle, Eye, Clock, Users, ThumbsUp,
  MessageCircle, Share2, MousePointerClick, PlayCircle, MoreHorizontal, Plus,
  Loader2, RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import LoadingState from '@/lib/components/ui/LoadingState'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import YouTubeIcon from '@/lib/components/ui/YouTubeIcon'
import VideoPlayerModal from '@/lib/components/ui/VideoPlayerModal'
import VideoBreakdownPanel, { type DetailsState } from '@/lib/components/ui/VideoBreakdownPanel'

const PerformanceCharts = dynamic(() => import('@/lib/components/analytics/PerformanceCharts'), {
  ssr: false,
  loading: () => <LoadingState compact />,
})

interface RecentScript {
  id: string
  title: string
  topic: string
  category: string
  created_at: string
  word_count: number
}

interface IdeaPreview {
  id: string
  text: string
}

interface UpcomingEntry {
  id: string
  title: string
  scheduled_date: string
}

interface Stats {
  totalScripts: number
  avgWordCount: number
  topTone: string | null
  topCategory: string | null
  contentPlanned: number
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

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardHome />
    </Suspense>
  )
}

function DashboardHome() {
  const router = useRouter()
  const { user } = useAppStore()
  const searchParams = useSearchParams()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(
    searchParams.get('payment') === 'success'
  )
  const [recentScripts, setRecentScripts] = useState<RecentScript[]>([])
  const [ideas, setIdeas] = useState<IdeaPreview[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
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
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        setStatsLoading(false)
        return
      }

      const todayKey = new Date().toISOString().slice(0, 10)

      const [{ data: scripts }, { data: ideaRows }, { data: entries }] = await Promise.all([
        supabase
          .from('scripts')
          .select('id, title, topic, category, created_at, word_count')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('ideas')
          .select('id, text')
          .eq('user_id', authUser.id)
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('calendar_entries')
          .select('id, title, scheduled_date')
          .eq('user_id', authUser.id)
          .gte('scheduled_date', todayKey)
          .order('scheduled_date', { ascending: true })
          .limit(3),
      ])

      setRecentScripts(scripts || [])
      setIdeas(ideaRows || [])
      setUpcoming(entries || [])
      setLoading(false)

      // Aggregated server-side (get_script_stats RPC) rather than pulling
      // every script's word_count/tone/category to the client — a full
      // row fetch here would grow with total scripts ever written, not
      // just what's shown, and re-run on every dashboard load.
      const [{ data: scriptStats }, { count: plannedCount }, { data: profile }] = await Promise.all([
        supabase.rpc('get_script_stats', { p_user_id: authUser.id }).single() as unknown as Promise<{
          data: { total_scripts: number; avg_word_count: number; top_tone: string | null; top_category: string | null } | null
        }>,
        supabase
          .from('calendar_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', authUser.id)
          .gte('scheduled_date', todayKey),
        supabase.from('users').select('subscription_tier').eq('id', authUser.id).single(),
      ])

      setStats({
        totalScripts: scriptStats?.total_scripts || 0,
        avgWordCount: scriptStats?.avg_word_count || 0,
        topTone: scriptStats?.top_tone || null,
        topCategory: scriptStats?.top_category || null,
        contentPlanned: plannedCount || 0,
      })
      setStatsLoading(false)

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
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      await supabase.from('ideas').insert({ user_id: authUser.id, text })
    } catch {
      // Non-critical — nothing to show on failure here.
    }
  }

  const handleGenerateScript = (topic: string) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(topic)}`)
  }

  const displayTier = user?.subscription_tier || 'free'
  const displayName = user?.email ? user.email.split('@')[0] : 'there'

  const cards = [
    { icon: FileText, label: 'Scripts created', value: String(stats?.totalScripts ?? 0), color: 'bg-sage' },
    { icon: Type, label: 'Average script length', value: stats?.avgWordCount ? `${stats.avgWordCount} words` : '—', color: 'bg-accent-slate' },
    { icon: Mic2, label: 'Most-used tone', value: stats?.topTone || '—', color: 'bg-accent-plum' },
    { icon: Tags, label: 'Most-used category', value: stats?.topCategory || '—', color: 'bg-accent-ochre' },
    { icon: CalendarDays, label: 'Content planned', value: String(stats?.contentPlanned ?? 0), color: 'bg-accent-clay' },
  ]

  const perfData = perf?.data
  const netSubs = perfData ? perfData.totals.subscribersGained - perfData.totals.subscribersLost : 0

  return (
    <div className="mx-auto max-w-5xl">
      {showPaymentSuccess && (
        <div className="card mb-6 border border-sage/40 bg-sage/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 rounded-full bg-sage/20 p-1.5 text-sage">
                <Check size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-ink">
                  Thank you! You're now on the {TIER_NAMES[displayTier]} plan
                </h3>
                <p className="mb-3 text-sm text-ink-muted">Here's what you get with {TIER_NAMES[displayTier]}:</p>
                <ul className="space-y-1.5">
                  {TIER_BENEFITS[displayTier].map((benefit, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink">
                      <Check size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-sage" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-ink/10"
              aria-label="Dismiss"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm text-ink-muted">{greeting()}, <span className="capitalize">{displayName}</span></p>
          <h1 className="mt-1 text-3xl font-bold heading-serif">What are you making today?</h1>
        </div>

        <Link
          href="/dashboard/new"
          className="btn-primary mb-8 flex items-center justify-center gap-2 py-4 text-base"
        >
          <Sparkles size={18} aria-hidden="true" />
          Start a new script
          <ArrowRight size={16} aria-hidden="true" />
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Recent scripts</h2>
            {recentScripts.length > 0 && (
              <Link href="/dashboard/library" className="text-xs text-sage hover:underline">View all</Link>
            )}
          </div>

          {loading ? (
            <div className="card py-8"><LoadingState message="Loading recent scripts…" compact /></div>
          ) : recentScripts.length === 0 ? (
            <div className="card py-8 text-center">
              <p className="text-sm text-ink-muted">No scripts yet — generate your first one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScripts.map((script) => (
                <Link
                  key={script.id}
                  href={`/dashboard/scripts/${script.id}`}
                  className="card-hover flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{script.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {script.category} • {new Date(script.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-ink-faint">{script.word_count} words</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink-muted">
                <Lightbulb size={15} aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide">Ideas to explore</h2>
              </div>
              <Link href="/dashboard/ideas" className="text-xs text-sage hover:underline">Open</Link>
            </div>
            {loading ? (
              <LoadingState compact />
            ) : ideas.length === 0 ? (
              <p className="text-sm text-ink-muted">No ideas parked yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {ideas.map((idea) => (
                  <li key={idea.id} className="truncate text-sm text-ink">{idea.text}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink-muted">
                <CalendarDays size={15} aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-wide">Upcoming content</h2>
              </div>
              <Link href="/dashboard/calendar" className="text-xs text-sage hover:underline">Open</Link>
            </div>
            {loading ? (
              <LoadingState compact />
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing planned yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((entry) => (
                  <li key={entry.id} className="flex justify-between gap-2 text-sm text-ink">
                    <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                    <span className="flex-shrink-0 text-xs text-ink-faint">
                      {new Date(entry.scheduled_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          <span className="font-semibold capitalize">{displayTier}</span> plan:{' '}
          {user?.scripts_generated_month || 0} / {TIER_SCRIPT_LIMITS[displayTier]} scripts used this month
        </p>
      </div>

      {/* Analytics — folded into the dashboard rather than a separate tab */}
      <div className="mt-12 border-t border-warm-border pt-8">
        <div className="mb-2 flex items-center gap-3">
          <BarChart3 size={24} aria-hidden="true" className="text-sage" />
          <h2 className="text-2xl font-bold heading-serif">Analytics</h2>
        </div>
        <p className="mb-6 text-sm text-ink-muted">A quick read on what you've made so far.</p>

        {statsLoading ? (
          <div className="card mb-8 py-16"><LoadingState message="Loading analytics…" compact /></div>
        ) : !stats || stats.totalScripts === 0 ? (
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

        {!statsLoading && (
          <>
            {/* YouTube performance — Pro tier, connected channel only */}
            <div className="mb-2 flex items-center gap-2">
              <YouTubeIcon size={18} />
              <h3 className="text-lg font-bold heading-serif">YouTube performance</h3>
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
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-accent-ochre/40 bg-accent-ochre/10 p-3">
                  <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-accent-ochre" />
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
                      <StatTile icon={Eye} label="Views" value={perfData.totals.views.toLocaleString()} color="bg-accent-slate" />
                      <StatTile icon={Clock} label="Watch time" value={`${perfData.totals.watchTimeHours}h`} color="bg-accent-plum" />
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
                        color="bg-accent-ochre"
                      />
                      <StatTile icon={ThumbsUp} label="Likes" value={perfData.totals.likes.toLocaleString()} color="bg-accent-clay" />
                      <StatTile icon={MessageCircle} label="Comments" value={perfData.totals.comments.toLocaleString()} color="bg-accent-teal" />
                      <StatTile icon={Share2} label="Shares" value={perfData.totals.shares.toLocaleString()} color="bg-accent-umber" />
                    </div>

                    {/* Charts */}
                    <PerformanceCharts daily={perfData.daily} />

                    {/* AI summary */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <SummaryCard icon={CheckCircle2} iconClass="text-sage" title="What's working" items={perfData.aiSummary.whatsWorking} />
                      <SummaryCard icon={XCircle} iconClass="text-error" title="What's not" items={perfData.aiSummary.whatsNot} />
                      <SummaryCard icon={Lightbulb} iconClass="text-accent-ochre" title="Suggestions" items={perfData.aiSummary.suggestions} />
                    </div>
                    <p className="-mt-3 text-[10px] italic text-ink-faint">AI-written from your real channel numbers above — a starting point for your own judgment, not a guarantee.</p>

                    {/* Top videos */}
                    {perfData.topVideos.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Your top videos this period</h4>
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
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Popular in your niche right now</h4>
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
          </>
        )}
      </div>

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
