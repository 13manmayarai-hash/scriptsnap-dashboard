import {
  ArrowLeft, Share2, MoreHorizontal, Home as HomeIcon, FileText, Lightbulb,
  CalendarDays, LayoutTemplate, BarChart3, Link2, Image as ImageIcon,
} from 'lucide-react'
import { Logo } from './Shared'

const sidebarItems: Array<[typeof HomeIcon, string]> = [
  [HomeIcon, 'Dashboard'],
  [FileText, 'Scripts'],
  [Lightbulb, 'Ideas'],
  [CalendarDays, 'Calendar'],
  [LayoutTemplate, 'Templates'],
  [BarChart3, 'Analytics'],
]

function Sidebar() {
  return (
    <aside className="w-[200px] shrink-0 border-r border-[#E1DED4] bg-[#FBFAF6] p-4">
      <Logo />
      <nav className="mt-9 space-y-1">
        {sidebarItems.map(([Icon, label], index) => (
          <span
            key={label}
            className={`flex min-h-[42px] w-full items-center gap-3 rounded-[7px] px-3 text-left text-[14px] ${
              index === 1 ? 'bg-[#F0EEE5] text-[#596950]' : 'text-[#595750]'
            }`}
          >
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            {label}
          </span>
        ))}
      </nav>
    </aside>
  )
}

function EditorToolbar() {
  return (
    <div className="flex items-center gap-4 border-b border-[#E6E2D9] px-4 py-3 text-[#57554F]" aria-hidden="true">
      <span className="font-bold">B</span>
      <span className="font-serif italic">I</span>
      <span className="font-serif text-sm">H1</span>
      <span className="font-serif text-sm">H2</span>
      <span className="h-5 w-px bg-[#E2DED4]" />
      <Link2 size={16} />
      <ImageIcon size={16} />
    </div>
  )
}

function ScriptEditor() {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#E0DDD3] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E1D8] px-5 py-3">
        <h4 className="text-[15px] font-semibold">Script Editor</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EFF1E8] px-2.5 py-1 text-[11px] font-semibold text-[#5C7A52]">Score 82</span>
          <span className="text-[11px] text-[#9C9686]">Saved ✓</span>
        </div>
      </div>
      <EditorToolbar />
      <div className="px-7 py-6">
        <h5 className="text-[16px] font-semibold text-[#292824]">Why this bamboo grows so fast</h5>
        <div className="mt-4 space-y-4 text-[14px] leading-[1.75] text-[#34332F]">
          <div>
            <span className="font-medium text-[#77756F]">[HOOK]</span>
            <p className="mt-2">
              Most people think bamboo grows overnight. But here&rsquo;s what&rsquo;s actually happening&hellip;
            </p>
          </div>
          <div>
            <span className="font-medium text-[#77756F]">[BODY]</span>
            <p className="mt-2">
              Bamboo isn&rsquo;t just a plant &mdash; it&rsquo;s a growth machine. Some species can shoot up 60 cm in a single day&hellip;
            </p>
          </div>
        </div>
        <div className="mt-8 text-[11px] text-[#97938A]">1,246 words &middot; 3 min read</div>
      </div>
    </div>
  )
}

function InsightsPanel() {
  const meters = [
    { label: 'Hook strength', pct: 88 },
    { label: 'Readability', pct: 82 },
    { label: 'Retention', pct: 76 },
  ]
  return (
    <div className="rounded-[9px] border border-[#E0DDD3] bg-white p-5">
      <h4 className="text-[15px] font-semibold">Insights</h4>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] text-[#85827A]">Script Score</span>
        <span className="font-serif text-[22px] font-bold text-[#3A3934]">82</span>
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {meters.map((m) => (
          <div key={m.label} className="flex items-center gap-3 text-[11.5px] text-[#706E68]">
            <span className="w-[92px] flex-shrink-0">{m.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7DD]">
              <span className="block h-full rounded-full bg-[#7A8B72]" style={{ width: `${m.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3 border-t border-[#E5E1D8] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#85827A]">Tone</span>
          <span className="rounded-full bg-[#F0EEE5] px-2.5 py-1 text-[11px] font-medium text-[#484742]">Conversational</span>
        </div>
        <div>
          <span className="text-[12px] text-[#85827A]">Audience</span>
          <p className="mt-0.5 text-[13px] font-medium text-[#3A3934]">Young Creators (16&ndash;34)</p>
        </div>
      </div>
    </div>
  )
}

export default function ProductPreview() {
  return (
    <div
      className="mt-20 overflow-hidden rounded-[14px] border border-[#DCD9CF] bg-[#FBFAF6] shadow-[0_20px_60px_rgba(40,39,33,0.07)] animate-fade-up"
      style={{ animationDelay: '150ms' }}
    >
      <div className="border-b border-[#E1DED4] bg-[#FBFAF6] px-6 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[#9C998F]">
        Example workspace — illustrative, not your data
      </div>
      {/* This is a fixed-proportions screenshot of the real dashboard, not
          a responsive layout — on narrow screens it scrolls horizontally
          within its own frame instead of squeezing illegible or being
          silently clipped by the page's overflow-x safety net. */}
      <div className="overflow-x-auto">
        <div className="flex min-h-[560px] min-w-[900px]" aria-hidden="true">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-[#F8F7F2]">
            <header className="flex h-[56px] items-center justify-between border-b border-[#E1DED4] px-6">
              <div className="flex items-center gap-4">
                <ArrowLeft size={16} className="text-[#77756F]" />
                <span className="text-[13px] text-[#77756F]">Back</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-[6px] bg-[#7A8B72] px-3 py-1.5 text-[11px] text-white">
                  <Share2 size={12} />
                  Share
                </span>
                <MoreHorizontal size={16} className="text-[#77756F]" />
              </div>
            </header>
            <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_.9fr]">
              <ScriptEditor />
              <InsightsPanel />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
