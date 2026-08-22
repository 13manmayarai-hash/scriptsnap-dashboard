'use client'

import { Sparkles } from 'lucide-react'
import ErrorMessage from './ErrorMessage'
import LoadingState from './LoadingState'

export interface VideoDetails {
  videoId: string
  title: string
  description: string
  hashtags: string[]
  publishedAt: string | null
  durationLabel: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  analytics?: {
    averageViewDuration: number
    averageViewPercentage: number
    ctr?: number
    impressions?: number
  }
  ctrUnavailable?: boolean
  performanceNote?: string
}

export type DetailsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: VideoDetails }

function formatSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  )
}

export default function VideoBreakdownPanel({
  state,
  source,
  onGenerateScript,
}: {
  state: DetailsState
  source: 'own' | 'trending'
  onGenerateScript: (title: string) => void
}) {
  if (state.status === 'loading') {
    return (
      <div className="mt-2 rounded-lg border border-warm-border bg-warm-surface-alt p-3">
        <LoadingState message="Loading breakdown…" compact />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mt-2 rounded-lg border border-warm-border bg-warm-surface-alt p-3">
        <ErrorMessage>{state.message}</ErrorMessage>
      </div>
    )
  }

  const d = state.data

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-warm-border bg-warm-surface-alt p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Stat label="Views" value={d.viewCount.toLocaleString()} />
        <Stat label="Likes" value={d.likeCount.toLocaleString()} />
        <Stat label="Comments" value={d.commentCount.toLocaleString()} />
        {d.durationLabel && <Stat label="Duration" value={d.durationLabel} />}
        {d.publishedAt && <Stat label="Published" value={formatRelativeDate(d.publishedAt)} />}
      </div>

      {source === 'own' && (
        <div className="border-t border-warm-border pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Performance</h3>
          {d.analytics ? (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Avg. watch time" value={formatSeconds(d.analytics.averageViewDuration)} />
              <Stat label="Retention" value={`${d.analytics.averageViewPercentage.toFixed(1)}%`} />
              {d.analytics.ctr !== undefined ? (
                <Stat label="Thumbnail CTR" value={`${d.analytics.ctr.toFixed(1)}%`} />
              ) : (
                <div>
                  <p className="text-sm text-ink-faint">—</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink-faint">CTR (no data yet)</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Analytics not available for this video yet.</p>
          )}
        </div>
      )}

      {source === 'trending' && d.performanceNote && (
        <div className="border-t border-warm-border pt-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles size={13} aria-hidden="true" className="text-sage" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Why it's likely performing</h3>
          </div>
          <p className="text-sm text-ink">{d.performanceNote}</p>
          <p className="mt-1 text-[10px] italic text-ink-faint">AI estimate — not YouTube's own analytics. Real CTR/retention are only visible to the video's own channel.</p>
        </div>
      )}

      <div className="border-t border-warm-border pt-3">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Title</h3>
        <p className="text-sm text-ink">{d.title}</p>
      </div>

      {d.description && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Description</h3>
          <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs text-ink-muted">{d.description}</p>
        </div>
      )}

      {d.hashtags.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Hashtags</h3>
          <div className="flex flex-wrap gap-1">
            {d.hashtags.map((tag) => (
              <span key={tag} className="rounded-full bg-sage/10 px-2 py-0.5 text-xs text-sage">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-warm-border pt-3">
        <button
          onClick={() => onGenerateScript(d.title)}
          className="btn-primary min-h-[44px] px-4 text-sm"
        >
          Generate script from this
        </button>
      </div>
    </div>
  )
}
