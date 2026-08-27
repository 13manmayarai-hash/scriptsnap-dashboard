import { Play, User, Flame, Zap } from 'lucide-react'
import { Reveal } from './Shared'

const BENEFITS = [
  { icon: Play, title: 'Write faster', description: 'Turn rough ideas into structured scripts.' },
  { icon: User, title: 'Sound like yourself', description: 'Keep your voice, tone and personality.' },
  { icon: Flame, title: 'Create consistently', description: 'Plan ideas, write scripts and stay on track.' },
  { icon: Zap, title: 'Get more watch time', description: 'Hooks that grab attention.' },
]

export default function Benefits() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mb-10 text-center">
          <h2 className="text-[clamp(24px,3.4vw,32px)] font-semibold tracking-[-0.02em]">Why creators love ScriptSnap</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delayMs={i * 70}>
              <div className="h-full rounded-[14px] border border-[#E0DDD3] bg-[#F1EFE8] p-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#DBD7CB] text-[#484742]">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-5 text-[#77746C]">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
