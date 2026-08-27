import { PenTool, Sparkles, ListOrdered, FileText, Hash, Pin, ShieldCheck, Layers } from 'lucide-react'
import { Reveal } from './Shared'

const KIT_ITEMS = [
  { icon: PenTool, title: 'Full script', sample: 'Hook → beats → CTA, paced for Shorts' },
  { icon: Sparkles, title: 'Title', sample: '"6 Hours of Filming for 40 Seconds"' },
  { icon: ListOrdered, title: '10 title variations', sample: 'Ready to A/B test' },
  { icon: FileText, title: 'Description', sample: 'SEO-formatted, ready to paste' },
  { icon: Hash, title: 'Hashtags', sample: '#shortscreator #dayinthelife +6' },
  { icon: Pin, title: 'Pinned comment', sample: 'Drafted to drive replies' },
  { icon: ShieldCheck, title: 'Guideline check', sample: 'Policy risk, flagged before you post' },
  { icon: Layers, title: 'Tone presets', sample: 'Your trained voice, reusable every time' },
]

export default function KitShowcase() {
  return (
    <section id="kit" className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[620px] text-center">
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            Every generation is a full content kit
          </h2>
          <p className="mt-4 text-[16px] text-[#706E68]">
            Not just a script — everything you&rsquo;d otherwise write by hand, one field at a time.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KIT_ITEMS.map(({ icon: Icon, title, sample }, i) => (
            <Reveal key={title} delayMs={(i % 4) * 70}>
              <div className="h-full rounded-[12px] border border-[#E0DDD3] bg-white p-6 transition-colors hover:border-[#7A8B72]/50">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#EFF1E8] text-[#5C7A52]">
                  <Icon size={18} aria-hidden="true" />
                </div>
                <h4 className="text-[14.5px] font-semibold">{title}</h4>
                <p className="mt-1.5 font-mono text-[12px] leading-5 text-[#9C9686]">{sample}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
