import { HOW_IT_WORKS_STEPS } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 bg-warm-bg py-10 sm:py-14">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal className="mb-7 text-center">
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-[-0.01em] text-ink">
            How it works
          </h2>
        </Reveal>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-start sm:justify-center sm:gap-0">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center gap-3 sm:contents">
              <Reveal delayMs={i * 90} className="relative flex flex-col items-center text-center sm:w-[220px]">
                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-sage text-[17px] font-bold text-white">
                  {step.num}
                </div>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-ink-muted">{step.description}</p>
              </Reveal>
              {i < HOW_IT_WORKS_STEPS.length - 1 && (
                <span
                  className="mt-[22px] hidden h-0 max-w-[80px] flex-1 flex-shrink border-t-2 border-dashed border-warm-border sm:block"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
