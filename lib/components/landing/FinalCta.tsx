import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Button from '@/lib/components/ui/Button'
import Reveal from '@/lib/components/ui/Reveal'

export default function FinalCta() {
  return (
    <section className="py-5 sm:py-7">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal>
          <div className="flex flex-col items-center gap-4 overflow-visible rounded-[24px] border border-warm-border bg-warm-tint p-8 text-center md:flex-row md:items-end md:justify-between md:gap-5 md:pb-5 md:pt-0 md:pl-8 md:pr-11 md:text-left">
            <div className="relative aspect-[773/665] w-[220px] flex-shrink-0 md:mb-[-40px] md:w-[180px] md:self-end">
              <Image
                src="/final-cta-illustration.png"
                alt="Illustration of a creator typing on a laptop at a desk with a notebook and coffee"
                width={773}
                height={665}
                className="absolute bottom-0 left-0 h-auto w-[220px] max-w-none md:w-[205px]"
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
            <div className="flex flex-shrink-0 flex-col items-center gap-2 md:items-end">
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
