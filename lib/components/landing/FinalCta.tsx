import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Button from '@/lib/components/ui/Button'
import Reveal from '@/lib/components/ui/Reveal'

export default function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal>
          <div className="grid items-center gap-8 rounded-2xl border border-warm-border bg-warm-surface-alt p-6 sm:p-10 md:grid-cols-[0.85fr_1.15fr]">
            <div className="relative mx-auto aspect-[773/665] w-full max-w-[340px]">
              <Image
                src="/final-cta-illustration.png"
                alt="Illustration of a creator typing on a laptop at a desk with a notebook and coffee"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 340px, 400px"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-serif text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
                Your next video starts with an idea.
              </h2>
              <p className="mt-3 text-[16px] text-ink-muted">
                Turn it into a script people want to watch.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 md:items-start">
                <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />} className="min-w-[200px]">
                  Start creating
                </Button>
                <p className="text-[12.5px] text-ink-faint">Start free. No credit card required.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
