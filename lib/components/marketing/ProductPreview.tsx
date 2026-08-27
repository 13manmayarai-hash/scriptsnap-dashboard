import {
  Share2, HelpCircle, Link2, Image as ImageIcon,
} from 'lucide-react'

function WindowChrome() {
  return (
    <div className="relative flex items-center justify-center border-b border-[#E1DED4] bg-[#FBFAF6] px-4 py-3">
      <div className="absolute left-4 flex items-center gap-1.5" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F0645B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F0B94B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#5FB86A]" />
      </div>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3A3934]">
        <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#7A8B72] text-[10px] font-bold text-white">S</span>
        ScriptSnap
      </div>
      <HelpCircle size={16} className="absolute right-4 text-[#97938A]" aria-hidden="true" />
    </div>
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
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#EFF1E8] px-2.5 py-1 text-[11px] font-semibold text-[#5C7A52]">Score 82</span>
          <span className="text-[11px] text-[#9C9686]">Saved ✓</span>
          <Share2 size={15} className="text-[#77756F]" aria-hidden="true" />
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
      aria-hidden="true"
    >
      <WindowChrome />
      <div className="grid gap-4 bg-[#F8F7F2] p-5 sm:grid-cols-[1.4fr_.9fr]">
        <ScriptEditor />
        <InsightsPanel />
      </div>
    </div>
  )
}
