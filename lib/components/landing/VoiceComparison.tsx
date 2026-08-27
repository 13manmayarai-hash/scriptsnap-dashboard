import { ArrowRight, X, Check } from 'lucide-react'
import Link from 'next/link'
import { VOICE_COMPARISON, CREATOR_VOICE_TRAITS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

export default function VoiceComparison() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <div className="flex h-full flex-col justify-center gap-4 rounded-2xl border border-warm-border bg-warm-surface-alt p-6 sm:flex-row sm:items-center sm:gap-4 sm:p-8">
              <div className="flex-1 rounded-xl border border-warm-border bg-warm-surface p-5">
                <p className="text-[13px] font-semibold text-ink">{VOICE_COMPARISON.generic.label}</p>
                <p className="mt-2.5 text-[14.5px] leading-6 text-ink-muted">&ldquo;{VOICE_COMPARISON.generic.text}&rdquo;</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-error/10 px-2.5 py-1 text-[11px] font-semibold text-error">
                  <X size={12} aria-hidden="true" />
                  {VOICE_COMPARISON.generic.badge}
                </span>
              </div>

              <ArrowRight size={22} className="mx-auto flex-shrink-0 rotate-90 text-ink-faint sm:mx-0 sm:rotate-0" aria-hidden="true" />

              <div className="flex-1 rounded-xl border border-sage/30 bg-soft-accent p-5">
                <p className="text-[13px] font-semibold text-ink">{VOICE_COMPARISON.scriptsnap.label}</p>
                <p className="mt-2.5 text-[14.5px] leading-6 text-ink">{VOICE_COMPARISON.scriptsnap.text}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-semibold text-sage-hover">
                  <Check size={12} aria-hidden="true" />
                  {VOICE_COMPARISON.scriptsnap.badge}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={90}>
            <div className="h-full rounded-2xl border border-warm-border bg-warm-surface p-6">
              <h3 className="text-[15px] font-semibold text-ink">Creator Voice</h3>
              <div className="mt-4 flex flex-col gap-3.5">
                {CREATOR_VOICE_TRAITS.map((trait) => (
                  <div key={trait.label} className="flex items-center justify-between text-[13px] text-ink-muted">
                    <span>{trait.label}</span>
                    <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-sage" aria-hidden="true">
                      <span className="ml-4 h-3.5 w-3.5 rounded-full bg-white" />
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11.5px] leading-4 text-ink-faint">
                A preview of the voice profile ScriptSnap builds from your own writing.
              </p>
              <Link href="/dashboard/settings" className="btn-secondary mt-4 w-full text-[13px]">
                Learn my writing style
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
