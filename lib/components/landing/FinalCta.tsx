import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Button from '@/lib/components/ui/Button'
import Reveal from '@/lib/components/ui/Reveal'

export default function FinalCta() {
  return (
    <section className="py-5 sm:py-7">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal>
          <div className="flex flex-col items-center gap-6 overflow-visible rounded-[24px] border border-warm-border bg-warm-tint p-8 text-center sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pb-5 sm:pt-0 sm:pl-8 sm:pr-11 sm:text-left">
            <div className="relative aspect-[773/665] w-[220px] flex-shrink-0 sm:mb-[-30px] sm:w-[180px] sm:self-end">
              <Image
                src="/final-cta-illustration.png"
                alt="Illustration of a creator typing on a laptop at a desk with a notebook and coffee"
                fill
                className="object-contain"
                sizes="220px"
              />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                Your next video starts with an idea.
              </h2>
              <p className="mt-1.5 text-[15px] text-ink-muted">
                Turn it into a script people want to watch.
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-center gap-2 sm:items-end">
              <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />} className="!rounded-full">
                Start creating
              </Button>
              <p className="text-[12.5px] text-ink-faint">Start free. No credit card required.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
