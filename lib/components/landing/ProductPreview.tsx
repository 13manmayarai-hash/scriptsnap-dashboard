'use client'

import { useEffect, useRef, useState } from 'react'
import {
  HelpCircle, Share2, Link2, Image as ImageIcon,
  Home, FileText, Lightbulb, CalendarDays, LayoutTemplate, BarChart3,
} from 'lucide-react'
import Logo from '@/lib/components/ui/Logo'

const SIDEBAR_ITEMS: Array<[typeof Home, string]> = [
  [Home, 'Dashboard'],
  [FileText, 'Scripts'],
  [Lightbulb, 'Ideas'],
  [CalendarDays, 'Calendar'],
  [LayoutTemplate, 'Templates'],
  [BarChart3, 'Analytics'],
]

const INSIGHT_METERS = [
  { label: 'Hook strength', pct: 88 },
  { label: 'Readability', pct: 82 },
  { label: 'Retention', pct: 76 },
]

function WindowChrome() {
  return (
    <div className="relative flex items-center justify-center border-b border-warm-border bg-warm-surface-alt px-4 py-3">
      <div className="absolute left-4 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F0645B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F0B94B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#5FB86A]" />
      </div>
      <Logo size={20} textClassName="text-[13px] font-semibold text-ink" />
      <HelpCircle size={16} className="absolute right-4 text-ink-faint" aria-hidden="true" />
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="hidden border-r border-warm-border bg-warm-surface-alt p-4 md:block">
      <nav className="space-y-1">
        {SIDEBAR_ITEMS.map(([Icon, label], i) => (
          <span
            key={label}
            className={`flex min-h-[38px] items-center gap-2.5 rounded-[7px] px-3 text-[13px] transition-colors ${
              i === 1 ? 'bg-soft-accent text-sage-hover font-medium' : 'text-ink-muted'
            }`}
          >
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </span>
        ))}
      </nav>
    </aside>
  )
}

export default function ProductPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="overflow-hidden rounded-[22px] border border-warm-border bg-warm-surface-alt shadow-[0_24px_60px_rgba(40,39,33,0.08)]"
    >
      <WindowChrome />
      {/* Sidebar/editor/insights ratio (~17% / 58% / 22%) matches the
          reference mockup, measured directly against it rather than
          eyeballed. Both the outer 3-column split and the inner
          editor/insights split switch on at the same breakpoint (md:) as
          Sidebar's own hidden/visible toggle, so there's no in-between
          width where a column silently collapses to zero. */}
      <div className="grid min-h-[480px] grid-cols-1 bg-[#F8F7F2] md:grid-cols-[0.32fr_1fr_0.42fr]">
        <Sidebar />
        <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:col-span-2 md:grid-cols-[1.55fr_1fr]">
          <div className="overflow-hidden rounded-[9px] border border-warm-border bg-warm-surface">
            <div className="flex items-center justify-between border-b border-warm-border px-5 py-3">
              <h4 className="text-[15px] font-semibold text-ink">Script Editor</h4>
              <div
                className="flex items-center gap-3 transition-opacity duration-700"
                style={{ opacity: animated ? 1 : 0 }}
              >
                <span className="rounded-full bg-soft-accent px-2.5 py-1 text-[11px] font-semibold text-sage-hover">Score 82</span>
                <span className="text-[11px] text-ink-faint">Saved ✓</span>
                <Share2 size={15} className="text-ink-muted" aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-center gap-4 border-b border-warm-border px-4 py-3 text-ink-muted">
              <span className="font-bold text-[13px]">B</span>
              <span className="font-serif italic text-[13px]">I</span>
              <span className="font-serif text-[13px]">H1</span>
              <span className="font-serif text-[13px]">H2</span>
              <span className="h-5 w-px bg-warm-border" />
              <Link2 size={15} />
              <ImageIcon size={15} />
            </div>
            <div
              className="px-6 py-5 transition-all duration-700"
              style={{ opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(8px)' }}
            >
              <h5 className="text-[16px] font-semibold text-ink">Why this bamboo grows so fast</h5>
              <div className="mt-4 space-y-4 text-[14px] leading-[1.7] text-ink">
                <div>
                  <span className="font-medium text-ink-muted">[HOOK]</span>
                  <p className="mt-2">Most people think bamboo grows overnight. But here&rsquo;s what&rsquo;s actually happening&hellip;</p>
                </div>
                <div>
                  <span className="font-medium text-ink-muted">[BODY]</span>
                  <p className="mt-2">Bamboo isn&rsquo;t just a plant &mdash; it&rsquo;s a growth machine. Some species can shoot up 60 cm in a single day&hellip;</p>
                </div>
              </div>
              <div className="mt-6 text-[11px] text-ink-faint">1,246 words &middot; 3 min read</div>
            </div>
          </div>

          <div className="rounded-[9px] border border-warm-border bg-warm-surface p-5">
            <h4 className="text-[15px] font-semibold text-ink">Insights</h4>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] text-ink-faint">Script Score</span>
              <span className="font-serif text-[22px] font-bold text-ink">82</span>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {INSIGHT_METERS.map((m) => (
                <div key={m.label} className="flex items-center gap-3 text-[11.5px] text-ink-muted">
                  <span className="w-[86px] flex-shrink-0">{m.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-warm-border">
                    <span
                      className="block h-full rounded-full bg-sage transition-[width] duration-1000 ease-out"
                      style={{ width: animated ? `${m.pct}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 border-t border-warm-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ink-faint">Tone</span>
                <span className="rounded-full bg-warm-surface-alt px-2.5 py-1 text-[11px] font-medium text-ink border border-warm-border">Conversational</span>
              </div>
              <div>
                <span className="text-[12px] text-ink-faint">Audience</span>
                <p className="mt-0.5 text-[13px] font-medium text-ink">Young Creators (16&ndash;34)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
