import { Play, User, Flame, Zap } from 'lucide-react'
import { BENEFITS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

const ICONS = [Play, User, Flame, Zap]

export default function Benefits() {
  return (
    <section className="py-5 sm:py-7">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal className="mb-6 text-center">
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.01em] text-ink">
            Why creators love ScriptSnap
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={benefit.title} delayMs={i * 80}>
                <div className="h-full rounded-[20px] border border-warm-border bg-warm-tint px-6 py-[30px] text-center">
                  <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-ink/[0.06] bg-warm-tint-icon text-sage-hover" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.5] text-ink-muted">{benefit.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
