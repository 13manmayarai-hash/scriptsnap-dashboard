import {
  ArrowLeft, ArrowRight, Share2, MoreHorizontal, Home as HomeIcon, FileText, Lightbulb,
  Mic2, Settings as SettingsIcon, Star, Sparkles, Scissors, ListPlus, Link2,
  Image as ImageIcon, PenLine, ShieldCheck, Wand2,
} from 'lucide-react'
import { Logo } from './Shared'

const sidebarItems: Array<[typeof HomeIcon, string]> = [
  [HomeIcon, 'Dashboard'],
  [Wand2, 'Generate'],
  [FileText, 'Scripts'],
  [Mic2, 'Tone & Voice'],
  [SettingsIcon, 'Settings'],
]

function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#E1DED4] bg-[#FBFAF6] p-4">
      <Logo />
      <nav className="mt-9 space-y-1">
        {sidebarItems.map(([Icon, label], index) => (
          <span
            key={label}
            className={`flex min-h-[42px] w-full items-center gap-3 rounded-[7px] px-3 text-left text-[14px] ${
              index === 0 ? 'bg-[#F0EEE5] text-[#596950]' : 'text-[#595750]'
            }`}
          >
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            {label}
          </span>
        ))}
      </nav>
      <div className="mt-28 rounded-[9px] border border-[#E0DDD3] bg-white p-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[#7A8B72]" aria-hidden="true" />
          <span className="text-[13px] font-semibold">Upgrade to Basic</span>
        </div>
        <p className="mt-1 text-[11px] text-[#85827A]">50 scripts/mo, all 5 languages</p>
        <ArrowRight size={15} className="mt-4 text-[#66645D]" aria-hidden="true" />
      </div>
    </aside>
  )
}

function EditorToolbar() {
  return (
    <div className="flex items-center gap-4 border-b border-[#E6E2D9] px-4 py-3 text-[#57554F]" aria-hidden="true">
      <span className="font-serif text-sm">H1</span>
      <span className="font-serif text-sm">H2</span>
      <span className="font-bold">B</span>
      <span className="font-serif italic">I</span>
      <span className="h-5 w-px bg-[#E2DED4]" />
      <Link2 size={16} />
      <ImageIcon size={16} />
    </div>
  )
}

function ScriptEditor() {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#E0DDD3] bg-white">
      <EditorToolbar />
      <div className="px-7 py-6">
        <div className="space-y-5 text-[14px] leading-[1.75] text-[#34332F]">
          <div>
            <span className="font-medium text-[#77756F]">[HOOK]</span>
            <p className="mt-2">
              Okay, so USB-C was supposed to fix this. One cable, every
              device, done. That&rsquo;s what they told us.
            </p>
          </div>
          <p>
            But your phone charges in two hours and your friend&rsquo;s phone
            charges in twenty minutes. Same cable. So what&rsquo;s going on?
          </p>
          <div>
            <span className="font-medium text-[#77756F]">[POINT 1]</span>
            <p className="mt-2">
              It&rsquo;s not the cable &mdash; it&rsquo;s the charging protocol behind it.
              Here&rsquo;s the one spec number to actually check before you buy.
            </p>
          </div>
        </div>
        <div className="mt-10 text-[11px] text-[#97938A]">168 words &middot; 34 sec read</div>
      </div>
    </div>
  )
}

function ToneMatch() {
  return (
    <div className="border-b border-[#E5E1D8] p-5">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">Tone match</div>
        <span className="rounded-full bg-[#EFF1E8] px-2.5 py-1 text-[11px] font-semibold text-[#5C7A52]">Score 82</span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-[6px] border-[#DDE3D7]">
          <div className="absolute inset-[-6px] rounded-full border-[6px] border-[#7A8B72] border-b-transparent border-l-transparent rotate-[-25deg]" aria-hidden="true" />
          <span className="text-[19px] font-semibold">79%</span>
        </div>
        <p className="text-[12px] leading-5 text-[#706E68]">
          Getting closer to your voice.
          <br />
          Keeps improving as you edit or
          <br />
          regenerate more scripts.
        </p>
      </div>
    </div>
  )
}

function GuidelinePanel() {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#E0DDD3] bg-white">
      <div className="flex border-b border-[#E5E1D8]" aria-hidden="true">
        {['Overview', 'Kit', 'Languages'].map((item, index) => (
          <span
            key={item}
            className={`relative px-5 py-4 text-[12px] ${
              index === 0 ? 'font-semibold text-[#262520]' : 'text-[#85827A]'
            }`}
          >
            {item}
            {index === 0 && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7A8B72]" />}
          </span>
        ))}
      </div>
      <ToneMatch />
      <div className="border-b border-[#E5E1D8] p-5">
        <div className="text-[13px] font-semibold">Community Guidelines check</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#EFF1E8] px-3 py-1.5 text-[11px] text-[#596650]">&#10003; No copyright flags</span>
          <span className="rounded-full bg-[#EFF1E8] px-3 py-1.5 text-[11px] text-[#596650]">&#10003; Advertiser-friendly</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Tone preset</span>
          <PenLine size={14} className="text-[#88857D]" aria-hidden="true" />
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#68665F]">
          &ldquo;Punchy Explainer&rdquo;
          <br />
          Trained on 20 of your own Shorts
        </p>
      </div>
    </div>
  )
}

const tools = [
  { icon: Sparkles, title: 'AI Rewrite', subtitle: 'Improve this line' },
  { icon: Scissors, title: 'Shorten', subtitle: 'Trim to fit your duration' },
  { icon: ListPlus, title: 'Expand', subtitle: 'Add more detail' },
  { icon: Lightbulb, title: 'Regenerate titles', subtitle: 'Get 10 more variations' },
]

function ToolsPanel() {
  return (
    <div className="rounded-[9px] border border-[#E0DDD3] bg-white p-4" aria-hidden="true">
      <div className="mb-4 text-[13px] font-semibold">Script tools</div>
      <div className="space-y-2">
        {tools.map(({ icon: Icon, title, subtitle }) => (
          <div
            key={title}
            className="flex min-h-[58px] w-full items-center gap-3 rounded-[7px] border border-[#E6E2D9] px-3 text-left"
          >
            <Icon size={17} className="text-[#6F8067]" />
            <div className="flex-1">
              <div className="text-[12px] font-medium text-[#30302B]">{title}</div>
              <div className="mt-0.5 text-[10px] text-[#918D84]">{subtitle}</div>
            </div>
            <ArrowRight size={14} className="text-[#AAA69D]" />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-[7px] bg-[#F0F1E8] p-3.5">
        <div className="flex items-center gap-2 text-[12px] font-medium">
          <Lightbulb size={15} className="text-[#718065]" />
          Tip
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#6C7064]">
          Scripts you keep without editing train your tone preset the most.
        </p>
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
        <div className="flex min-h-[650px] min-w-[960px]" aria-hidden="true">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-[#F8F7F2]">
            <header className="flex h-[62px] items-center justify-between border-b border-[#E1DED4] px-6">
              <div className="flex items-center gap-5">
                <ArrowLeft size={17} className="text-[#77756F]" />
                <span className="text-[14px] text-[#77756F]">Back</span>
                <span className="h-5 w-px bg-[#DEDAD0]" />
                <span className="text-[14px] font-semibold">Why Phone Chargers Still Don&rsquo;t Fit</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-1.5 text-[11px] text-[#7B8175] sm:flex">
                  <ShieldCheck size={13} />
                  Guideline check passed
                </span>
                <span className="flex items-center gap-2 rounded-[6px] bg-[#7A8B72] px-3 py-2 text-[11px] text-white">
                  <Share2 size={13} />
                  Share
                </span>
                <MoreHorizontal size={17} className="text-[#77756F]" />
              </div>
            </header>
            <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_.72fr_.48fr]">
              <ScriptEditor />
              <GuidelinePanel />
              <ToolsPanel />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
