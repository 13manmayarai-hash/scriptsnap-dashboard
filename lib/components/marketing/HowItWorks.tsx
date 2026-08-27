import { ArrowRight } from 'lucide-react'
import { Reveal } from './Shared'

const STEPS = [
  { num: 1, title: 'Drop in your idea', description: 'Tell ScriptSnap what you want to talk about.' },
  { num: 2, title: 'Shape the voice', description: 'Choose your tone, audience and format.' },
  { num: 3, title: 'Get a ready-to-edit script', description: 'Refine it with AI tools until it sounds like you.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 border-t border-[#E2DFD6] bg-[#F1EFE8] py-16 sm:py-20">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mb-12 text-center">
          <h2 className="text-[clamp(24px,3.4vw,32px)] font-semibold tracking-[-0.02em]">How it works</h2>
        </Reveal>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center gap-3 sm:contents">
              <Reveal delayMs={i * 90} className="flex flex-col items-center text-center sm:w-[220px]">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A8B72] text-[14px] font-semibold text-white">
                  {step.num}
                </div>
                <h3 className="mt-3 text-[15px] font-semibold">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#77746C]">{step.description}</p>
              </Reveal>
              {i < STEPS.length - 1 && (
                <ArrowRight size={18} className="mx-1 hidden flex-shrink-0 text-[#B8B4A8] sm:block" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
