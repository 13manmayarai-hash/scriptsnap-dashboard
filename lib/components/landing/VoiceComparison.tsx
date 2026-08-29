import { ArrowRight, X, Check } from 'lucide-react'
import Link from 'next/link'
import { VOICE_COMPARISON, CREATOR_VOICE_TRAITS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

export default function VoiceComparison() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[7fr_3fr]">
          <Reveal>
            <div className="grid h-full grid-cols-1 items-center gap-4 rounded-[20px] border border-warm-border bg-warm-surface-alt p-6 sm:grid-cols-[1fr_44px_1fr] sm:p-8">
              <div className="rounded-xl border border-warm-border bg-warm-surface p-4">
                <p className="text-[13px] font-semibold text-ink">{VOICE_COMPARISON.generic.label}</p>
                <p className="mt-2 text-[14.5px] leading-[1.4] text-ink-muted">&ldquo;{VOICE_COMPARISON.generic.text}&rdquo;</p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#F4DEDA] px-2.5 py-1 text-[11px] font-semibold text-[#A24334]">
                  <X size={12} aria-hidden="true" />
                  {VOICE_COMPARISON.generic.badge}
                </span>
              </div>

              <ArrowRight size={22} className="mx-auto flex-shrink-0 rotate-90 text-ink-faint sm:rotate-0" aria-hidden="true" />

              <div className="rounded-xl border border-sage/30 bg-soft-accent p-4">
                <p className="text-[13px] font-semibold text-ink">{VOICE_COMPARISON.scriptsnap.label}</p>
                <p className="mt-2 text-[14.5px] leading-[1.4] text-ink">{VOICE_COMPARISON.scriptsnap.text}</p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#D3E2C1] px-2.5 py-1 text-[11px] font-semibold text-sage-hover">
                  <Check size={12} aria-hidden="true" />
                  {VOICE_COMPARISON.scriptsnap.badge}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={90}>
            <div className="h-full rounded-[20px] border border-warm-border bg-warm-surface-alt p-6 sm:p-8">
              <h3 className="text-[15px] font-semibold text-ink">Creator Voice</h3>
              <div className="mt-3 flex flex-col gap-2">
                {CREATOR_VOICE_TRAITS.map((trait) => (
                  <div key={trait.label} className="flex items-center justify-between text-[13px] text-ink-muted">
                    <span>{trait.label}</span>
                    <span className="relative inline-flex h-2.5 w-14 flex-shrink-0 items-center" aria-hidden="true">
                      <span className="h-px w-full bg-warm-border" />
                      <span className="absolute right-0 h-2.5 w-2.5 rounded-full bg-sage" />
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] leading-4 text-ink-faint">
                A preview of the voice profile ScriptSnap builds from your own writing.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-full bg-soft-accent text-[13px] font-semibold text-sage-hover transition-colors hover:bg-soft-accent-line"
              >
                Learn my writing style
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
