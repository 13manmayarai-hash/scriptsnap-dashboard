import { Play, User, Flame, Zap } from 'lucide-react'
import { BENEFITS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

const ICONS = [Play, User, Flame, Zap]

export default function Benefits() {
  return (
    <section className="py-10 sm:py-14">
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
                <div className="h-full rounded-xl bg-warm-tint p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-tint-icon text-ink-muted" aria-hidden="true">
                    <Icon size={17} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-3.5 text-[15px] font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-5 text-ink-muted">{benefit.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
