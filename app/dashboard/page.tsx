'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import { TIER_SCRIPT_LIMITS, TIER_NAMES, TIER_BENEFITS } from '@/lib/tiers'
import { Sparkles, Check, X, ArrowRight, Lightbulb, CalendarDays } from 'lucide-react'
import LoadingState from '@/lib/components/ui/LoadingState'

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
  const { user } = useAppStore()
  const searchParams = useSearchParams()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(
    searchParams.get('payment') === 'success'
  )
  const [recentScripts, setRecentScripts] = useState<RecentScript[]>([])
  const [ideas, setIdeas] = useState<IdeaPreview[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
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
    }
    load()
  }, [])

  const tier = user?.subscription_tier || 'free'
  const displayName = user?.email ? user.email.split('@')[0] : 'there'

  return (
    <div className="mx-auto max-w-3xl">
      {showPaymentSuccess && (
        <div className="card mb-6 border border-sage/40 bg-sage/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 rounded-full bg-sage/20 p-1.5 text-sage">
                <Check size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-ink">
                  Thank you! You're now on the {TIER_NAMES[tier]} plan
                </h3>
                <p className="mb-3 text-sm text-ink-muted">Here's what you get with {TIER_NAMES[tier]}:</p>
                <ul className="space-y-1.5">
                  {TIER_BENEFITS[tier].map((benefit, i) => (
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
        <span className="font-semibold capitalize">{tier}</span> plan:{' '}
        {user?.scripts_generated_month || 0} / {TIER_SCRIPT_LIMITS[tier]} scripts used this month
      </p>
    </div>
  )
}
