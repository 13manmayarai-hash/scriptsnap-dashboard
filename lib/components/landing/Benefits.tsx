import { Play, User, Flame, Zap } from 'lucide-react'
import { BENEFITS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

const ICONS = [Play, User, Flame, Zap]

export default function Benefits() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal className="mb-10 text-center">
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.01em] text-ink">
            Why creators love ScriptSnap
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={benefit.title} delayMs={i * 80}>
                <div className="h-full rounded-xl border border-warm-border bg-warm-surface p-6 transition-colors hover:border-sage/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-accent text-sage-hover" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink">{benefit.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-5 text-ink-muted">{benefit.description}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
