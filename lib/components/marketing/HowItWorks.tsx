import { PenTool, Sparkles, ShieldCheck, FileText, RefreshCw } from 'lucide-react'
import { Reveal } from './Shared'

const FLOW_STEPS = [
  {
    icon: PenTool,
    title: 'Describe the video',
    description: 'Topic, duration, category, tone, output language — plus optional context or keywords to steer it. No blank page, no staring at a cursor.',
  },
  {
    icon: Sparkles,
    title: 'Claude writes it, in your voice',
    description: 'Claude Sonnet 5 generates the script against your own tone presets — trained on the kind of videos you actually make, not a generic template everyone else gets too.',
  },
  {
    icon: ShieldCheck,
    title: "Checked against YouTube's guidelines",
    description: 'Before you see the result, ScriptSnap scans it for monetization and policy risk — flagged lines you might want a second look at, not just a script and a shrug.',
  },
  {
    icon: FileText,
    title: 'Get your full content kit',
    description: 'Script, title, 10 title variations, description, hashtags, pinned comment, and key points — the metadata that normally takes just as long to write as the script itself.',
  },
  {
    icon: RefreshCw,
    title: 'Copy it in — and it learns for next time',
    description: 'Paste it straight into YouTube, no rewriting. Every script you keep or edit feeds your tone presets, so the next one sounds even more like you.',
  },
]

function FlowStep({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number
  icon: typeof PenTool
  title: string
  description: string
}) {
  return (
    <div className="grid grid-cols-[52px_1fr] gap-5 rounded-[14px] border border-[#E0DDD3] bg-white p-6 sm:p-7">
      <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[13px] bg-[#7A8B72] text-white">
        <Icon size={22} aria-hidden="true" strokeWidth={2} />
      </div>
      <div>
        <span className="font-mono text-[11px] text-[#9C9686]">STEP {step}</span>
        <h3 className="mt-1 text-[19px] font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-1.5 text-[14px] leading-6 text-[#706E68]">{description}</p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-t border-[#E2DFD6] bg-[#F1EFE8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[620px] text-center">
          <span className="font-serif text-[15px] italic text-[#7A8B72]">How it works</span>
          <h2 className="mt-3 text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            One prompt, a full content kit.
          </h2>
          <p className="mt-4 text-[16px] text-[#706E68]">
            Five steps, in order — this is the same flow that&rsquo;s live in the product today.
          </p>
        </Reveal>
        <div className="mx-auto flex max-w-[820px] flex-col gap-4">
          {FLOW_STEPS.map((step, i) => (
            <Reveal key={step.title} delayMs={i * 80}>
              <FlowStep step={i + 1} {...step} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
