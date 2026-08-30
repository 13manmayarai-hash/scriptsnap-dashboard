'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import RazorpayButton from '@/lib/components/RazorpayButton'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: 0,
      tier: 'free',
      scripts: 5,
      description: 'Perfect for getting started',
      features: [
        '5 scripts/month',
        'Basic personalization',
        'All tones (Meditative, Balanced, Energetic)',
        'Community support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Basic',
      price: 199,
      tier: 'basic',
      scripts: 50,
      description: 'Great for active creators',
      features: [
        '50 scripts/month',
        'Full AI personalization',
        'Context & keywords support',
        'Export to PDF',
        'Script history',
        'Email support',
      ],
      cta: 'Upgrade to Basic',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 499,
      tier: 'pro',
      scripts: 200,
      description: 'For serious content creators',
      features: [
        '200 scripts/month',
        'All Basic features',
        'YouTube channel analytics',
        'Trending keywords',
        'Priority support',
      ],
      cta: 'Upgrade to Pro',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-warm-bg py-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-20">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold heading-serif mb-2 md:mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-ink-muted">
            Choose the perfect plan for your YouTube Shorts journey
          </p>
        </div>

        {/* Pricing Cards — stack on phones so the description and feature list stay visible; 3 columns from sm: up */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4 md:gap-8 mb-10 sm:mb-14 md:mb-20">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative border rounded-lg transition-colors p-5 sm:p-4 md:p-6 ${
                tier.highlighted
                  ? 'bg-sage/10 border-sage ring-2 ring-sage md:scale-105'
                  : 'bg-warm-surface border-warm-border hover:border-sage/40'
              }`}
            >
              {tier.highlighted && (
                <div
                  className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-lg"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(59,130,246,0.32) 0%, rgba(59,130,246,0) 55%)',
                    }}
                  />
                </div>
              )}

              {tier.highlighted && (
                <div className="absolute -top-3 sm:-top-3 md:-top-4 left-1/2 z-10 -translate-x-1/2 flex justify-center">
                  <span className="bg-sage text-white px-3 py-1 sm:px-3 sm:py-1 md:px-4 md:py-1 rounded-full text-xs sm:text-xs md:text-sm font-bold text-center whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="relative z-10 mb-4 sm:mb-4 md:mb-8">
                <h2 className="text-xl sm:text-lg md:text-3xl font-bold text-ink mb-1 md:mb-2">
                  {tier.name}
                </h2>
                <p className="text-ink-muted text-sm md:text-sm leading-snug">
                  {tier.description}
                </p>
              </div>

              <div className="relative z-10 mb-4 sm:mb-4 md:mb-8">
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className="text-3xl sm:text-xl md:text-5xl font-bold text-ink">
                    {priceFormatter.format(tier.price)}
                  </span>
                  <span className="text-sm md:text-base text-ink-muted">/mo</span>
                </div>
                <p className="text-sage font-semibold text-sm md:text-base mt-1 md:mt-2">
                  {tier.scripts} scripts/mo
                </p>
              </div>

              {/* CTA Button - Different for Free vs Paid */}
              <div className="relative z-10 mb-4 sm:mb-4 md:mb-8">
                {tier.price === 0 ? (
                  <Link
                    href="/auth/signup"
                    className={`flex items-center justify-center min-h-[44px] w-full px-4 sm:px-2 md:px-4 rounded md:rounded-lg font-semibold text-center leading-tight text-sm md:text-base transition-colors ${
                      tier.highlighted
                        ? 'bg-sage text-white hover:bg-sage-hover'
                        : 'bg-ink/5 text-ink hover:bg-ink/10'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <RazorpayButton
                    tier={tier.tier as 'basic' | 'pro'}
                    tierName={tier.name}
                  />
                )}
              </div>

              <div className="relative z-10 space-y-2 sm:space-y-1 md:space-y-4">
                {tier.features.map((feature, j) => (
                  <div key={j} className="flex gap-2 sm:gap-1 md:gap-3">
                    <Check size={16} aria-hidden="true" className="md:hidden text-sage flex-shrink-0 mt-0.5" />
                    <Check size={20} aria-hidden="true" className="hidden md:block text-sage flex-shrink-0" />
                    <span className="text-ink/80 text-sm sm:text-[10px] md:text-sm leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold heading-serif mb-8 text-center">
            Common Questions
          </h2>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-ink mb-2">
                Can I upgrade/downgrade anytime?
              </h3>
              <p className="text-ink-muted">
                Yes! Change your plan anytime. Changes take effect immediately.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-ink mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-ink-muted">
                30-day money-back guarantee. No questions asked.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-ink mb-2">
                What if I don't use all my scripts?
              </h3>
              <p className="text-ink-muted">
                Your script count resets to your plan's monthly allowance on your billing date — unused scripts don't carry over.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-ink mb-2">
                Is there a discount for annual billing?
              </h3>
              <p className="text-ink-muted">
                Coming soon! Sign up now and we'll notify you about it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
