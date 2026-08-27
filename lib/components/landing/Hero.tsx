import { ArrowRight, Play } from 'lucide-react'
import Button from '@/lib/components/ui/Button'
import HeroIllustration from './HeroIllustration'

const BENEFIT_PILLS = ['AI-assisted writing', 'Creator voice', 'Hooks that grab attention']

export default function Hero() {
  return (
    <section id="hero" className="pb-8 pt-14 sm:pt-16 lg:pt-20">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-[18px] sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12">
        <div className="animate-fade-up order-1">
          <h1 className="font-serif text-[clamp(2.75rem,7vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-balance">
            Turn ideas into
            <br />
            scripts people
            <br />
            <span className="relative inline-block italic text-sage">
              want to watch.
              <span className="absolute -bottom-1.5 left-0 h-[3px] w-[94%] rotate-[-1deg] bg-[#C99A4A]" aria-hidden="true" />
            </span>
          </h1>

          <p className="mt-6 max-w-[500px] text-[17px] leading-7 text-ink-muted">
            <span className="font-semibold text-ink">ScriptSnap</span> helps creators turn rough ideas into engaging YouTube scripts — from the first hook to the final line.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />} className="min-w-[210px]">
              Create your first script
            </Button>
            <Button href="#how-it-works" variant="secondary" icon={<Play size={14} fill="currentColor" aria-hidden="true" />} className="min-w-[180px]">
              See how it works
            </Button>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-muted">
            {BENEFIT_PILLS.map((pill) => (
              <li key={pill} className="flex items-center gap-1.5">
                <span className="text-sage" aria-hidden="true">✓</span>
                {pill}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-fade-up order-2" style={{ animationDelay: '80ms' }}>
          <HeroIllustration />
        </div>
      </div>
    </section>
  )
}
