import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Reveal, Button } from './Shared'

export default function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="grid items-center gap-8 rounded-[24px] border border-[#E0DDD3] bg-[#FBFAF6] px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-[.85fr_1.15fr] md:text-left">
          <div className="mx-auto w-full max-w-[280px] md:mx-0">
            <Image
              src="/final-cta-illustration.png"
              alt="Sketch illustration of a person typing on a laptop with a notebook and coffee mug beside them"
              width={590}
              height={495}
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-[clamp(28px,4.5vw,44px)] font-semibold tracking-[-0.02em] text-balance">
              Your next video starts with an idea.
            </h2>
            <p className="mx-auto mt-4 max-w-[460px] text-[16px] text-[#706E68] md:mx-0">
              Describe your next Short and see your first script — full content kit, guideline check
              included — in under a minute. Free, no card required.
            </p>
            <div className="mt-8 flex justify-center md:justify-start">
              <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />}>
                Generate your first script free
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
