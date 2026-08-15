'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import RazorpayButton from '@/lib/components/RazorpayButton'

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
      price: 10,
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
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Pro',
      price: 25,
      tier: 'pro',
      scripts: 200,
      description: 'For serious content creators',
      features: [
        '200 scripts/month',
        'All Basic features',
        'YouTube analytics (coming soon)',
        'Trending keywords',
        'Priority support',
        'API access',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-brand-black py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/60">
            Choose the perfect plan for your YouTube Shorts journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`card relative ${
                tier.highlighted ? 'ring-2 ring-brand-yellow md:scale-105' : ''
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-yellow text-brand-black px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {tier.name}
                </h2>
                <p className="text-white/60 text-sm">{tier.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ₹{tier.price}
                  </span>
                  <span className="text-white/60">/month</span>
                </div>
                <p className="text-brand-yellow font-semibold mt-2">
                  {tier.scripts} scripts/month
                </p>
              </div>

              {/* CTA Button - Different for Free vs Paid */}
              <div className="mb-8">
                {tier.price === 0 ? (
                  <Link
                    href="/auth/signup"
                    className={`block w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                      tier.highlighted
                        ? 'bg-brand-yellow text-brand-black hover:bg-yellow-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <RazorpayButton tier={tier.tier} tierName={tier.name} />
                )}
              </div>

              <div className="space-y-4">
                {tier.features.map((feature, j) => (
                  <div key={j} className="flex gap-3">
                    <Check size={20} className="text-brand-yellow flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Common Questions
          </h2>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I upgrade/downgrade anytime?
              </h3>
              <p className="text-white/60">
                Yes! Change your plan anytime. Changes take effect immediately.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-white/60">
                30-day money-back guarantee. No questions asked.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">
                What if I don't use all my scripts?
              </h3>
              <p className="text-white/60">
                Unused scripts carry over to next month. You won't lose them.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a discount for annual billing?
              </h3>
              <p className="text-white/60">
                Coming soon! Sign up now and we'll notify you about it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
