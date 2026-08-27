import Link from 'next/link'
import { Reveal, Button } from './Shared'

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const PRICING_TIERS = [
  { name: 'Free', price: 0, scripts: 5, description: 'Enough to see if it actually sounds like you.', featured: false },
  { name: 'Basic', price: 199, scripts: 50, description: 'For a creator publishing 1–2 Shorts a day.', featured: true },
  { name: 'Pro', price: 499, scripts: 200, description: 'For high-frequency creators testing more variants.', featured: false },
]

export default function PricingTeaser() {
  return (
    <section id="pricing" className="scroll-mt-6 border-t border-[#E2DFD6] bg-[#F1EFE8] py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[620px] text-center">
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            Simple pricing, priced for a solo creator
          </h2>
          <p className="mt-4 text-[16px] text-[#706E68]">
            Start free, upgrade when the time it saves is obviously worth more than the plan.
          </p>
        </Reveal>
        <div className="mx-auto grid max-w-[980px] grid-cols-1 gap-5 sm:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.name} delayMs={i * 90}>
              <div
                className={`relative flex h-full flex-col rounded-[16px] border p-7 transition-shadow ${
                  tier.featured
                    ? 'border-[#7A8B72] bg-[#EFF1E8] shadow-[0_16px_40px_rgba(122,139,114,0.14)]'
                    : 'border-[#E0DDD3] bg-white hover:shadow-[0_8px_24px_rgba(40,39,33,0.05)]'
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-7 z-10 rounded-full bg-[#7A8B72] px-3 py-1 text-[11px] font-bold text-white">
                    Most popular
                  </span>
                )}
                <h4 className="relative z-10 text-[16px] font-semibold">{tier.name}</h4>
                <div className="relative z-10 mt-2 font-serif text-[36px] font-bold">
                  {priceFormatter.format(tier.price)}
                  <span className="ml-1 text-[14px] font-sans font-normal text-[#9C9686]">/mo</span>
                </div>
                <p className="relative z-10 mt-2 text-[13.5px] text-[#706E68]">{tier.description}</p>
                <p className="relative z-10 mt-4 text-[13.5px] font-semibold text-[#5C7A52]">{tier.scripts} scripts / month</p>
                <div className="relative z-10 mt-6">
                  <Button
                    href={tier.price === 0 ? '/auth/signup' : '/pricing'}
                    variant={tier.featured ? 'primary' : 'secondary'}
                    className="w-full"
                  >
                    {tier.price === 0 ? 'Start free' : 'View plan'}
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[13px] text-[#9C9686]">
          <Link href="/pricing" className="text-[#5C7A52] underline hover:no-underline">
            See full pricing &amp; FAQ →
          </Link>
        </p>
      </div>
    </section>
  )
}
