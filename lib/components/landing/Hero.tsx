import { ArrowRight, Play } from 'lucide-react'
import Button from '@/lib/components/ui/Button'
import HeroIllustration from './HeroIllustration'

const BENEFIT_PILLS = ['AI-assisted writing', 'Creator voice', 'Hooks that grab attention']

// Always two columns — text left, character right — at every width down to
// a phone screen, per explicit request. Everything below scales with clamp()
// against viewport width rather than switching to a stacked layout, since
// there's no breakpoint where this collapses to one column.
export default function Hero() {
  return (
    <section id="hero" className="pb-3 pt-4 sm:pb-4 sm:pt-6 lg:pt-9">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[1.15fr_0.85fr] items-center gap-3 px-[14px] sm:gap-8 sm:px-6 lg:gap-16 lg:px-12">
        <div className="animate-fade-up">
          <h1 className="font-serif text-[clamp(1.4rem,6.4vw,4.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
            Turn ideas into
            <br />
            scripts people
            <br />
            <span className="relative inline-block italic text-sage">
              want to watch.
              <span className="absolute -bottom-1 left-0 h-[2px] w-[94%] rotate-[-1deg] bg-[#C99A4A] sm:-bottom-1.5 sm:h-[3px]" aria-hidden="true" />
            </span>
          </h1>

          <p className="mt-3 max-w-[500px] text-[clamp(0.7rem,2.4vw,1.0625rem)] leading-[1.5] text-ink-muted sm:mt-6 sm:leading-7">
            <span className="font-semibold text-ink">ScriptSnap</span> helps creators turn rough ideas into engaging YouTube scripts — from the first hook to the final line.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Button
              href="/auth/signup"
              icon={<ArrowRight aria-hidden="true" className="h-[13px] w-[13px] sm:h-[17px] sm:w-[17px]" />}
              className="!min-h-[36px] px-3 text-[12px] sm:!min-h-[44px] sm:px-6 sm:text-[15px] sm:min-w-[210px]"
            >
              Create your first script
            </Button>
            <Button
              href="#how-it-works"
              variant="secondary"
              icon={<Play fill="currentColor" aria-hidden="true" className="h-[11px] w-[11px] sm:h-[14px] sm:w-[14px]" />}
              className="!min-h-[36px] px-3 text-[12px] sm:!min-h-[44px] sm:px-6 sm:text-[15px] sm:min-w-[180px]"
            >
              See how it works
            </Button>
          </div>

          <ul className="mt-3 flex flex-col gap-1 text-[clamp(0.6rem,1.9vw,0.8125rem)] text-ink-muted sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {BENEFIT_PILLS.map((pill) => (
              <li key={pill} className="flex items-center gap-1.5">
                <span className="text-sage" aria-hidden="true">✓</span>
                {pill}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}
