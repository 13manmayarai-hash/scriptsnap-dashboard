import { ArrowRight } from 'lucide-react'
import { Reveal, Button } from './Shared'

export default function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="rounded-[24px] border border-[#E0DDD3] bg-[#FBFAF6] px-6 py-16 text-center sm:px-10 sm:py-20">
          <h2 className="text-[clamp(28px,4.5vw,44px)] font-semibold tracking-[-0.02em] text-balance">
            Stop staring at a blank page.
          </h2>
          <p className="mx-auto mt-4 max-w-[460px] text-[16px] text-[#706E68]">
            Describe your next Short and see your first script — full content kit, guideline check
            included — in under a minute. Free, no card required.
          </p>
          <div className="mt-8">
            <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />}>
              Generate your first script free
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
