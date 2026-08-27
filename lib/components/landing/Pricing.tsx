import { Check } from 'lucide-react'
import Link from 'next/link'
import RazorpayButton from '@/lib/components/RazorpayButton'
import { PRICING_TIERS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const paidCtaClasses = 'flex items-center justify-center min-h-[44px] w-full rounded-lg px-4 text-[14px] font-semibold transition-colors bg-sage text-white hover:bg-sage-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg disabled:opacity-50'

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-6 border-t border-warm-border bg-warm-surface-alt py-10 sm:py-14">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal className="mb-7 text-center">
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.01em] text-ink">
            Simple pricing. Serious results.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delayMs={i * 80}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 transition-colors ${
                  tier.highlighted
                    ? 'border-sage bg-warm-surface ring-2 ring-sage/50 lg:scale-[1.03]'
                    : 'border-warm-border bg-warm-surface hover:border-sage/40'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-3 py-1 text-[11px] font-semibold text-white">
                    {tier.badge}
                  </span>
                )}

                <h3 className="text-[16px] font-semibold text-ink">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-[34px] font-bold text-ink">{priceFormatter.format(tier.price)}</span>
                  <span className="text-[13px] text-ink-muted">/ month</span>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[13.5px] text-ink">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-sage" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {tier.tier === 'free' ? (
                    <Link href="/auth/signup" className="btn-primary w-full text-[14px]">
                      {tier.cta}
                    </Link>
                  ) : (
                    <RazorpayButton
                      tier={tier.tier}
                      tierName={tier.name}
                      ctaLabel={tier.cta}
                      className={paidCtaClasses}
                    />
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
