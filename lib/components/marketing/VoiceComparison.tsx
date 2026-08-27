import { ArrowRight, X as XIcon, Check } from 'lucide-react'
import { Reveal, Button } from './Shared'

const VOICE_TRAITS = [
  { label: 'Conversational', pct: 82 },
  { label: 'Curious', pct: 68 },
  { label: 'Fast-paced', pct: 74 },
  { label: 'Minimal filler', pct: 90 },
  { label: 'Strong hooks', pct: 88 },
]

export default function VoiceComparison() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="mx-auto mb-14 max-w-[620px] text-center">
          <span className="font-serif text-[15px] italic text-[#7A8B72]">Your voice, not a template</span>
          <h2 className="mt-3 text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.02em] text-balance">
            Sounds like you wrote it &mdash; because it&rsquo;s trained on how you actually write
          </h2>
        </Reveal>

        <Reveal className="mb-6 text-center text-[11px] font-medium uppercase tracking-wide text-[#9C998F]">
          Example comparison — illustrative, not a real generation
        </Reveal>

        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-[16px] border border-[#E0DDD3] bg-white p-7">
            <h4 className="text-[13px] font-semibold text-[#9C9686]">Generic AI output</h4>
            <p className="mt-4 text-[16px] leading-7 text-[#3A3934]">
              &ldquo;Bamboo is a fast-growing plant that can reach great heights.&rdquo;
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#F5E9E6] px-3 py-1 text-[11px] font-medium text-[#9B5A4A]">
              <XIcon size={12} aria-hidden="true" /> Sounds like AI
            </span>
          </div>

          <div className="flex justify-center py-2 lg:py-0">
            <ArrowRight size={22} className="rotate-90 text-[#9C9686] lg:rotate-0" aria-hidden="true" />
          </div>

          <div className="rounded-[16px] border border-[#7A8B72] bg-[#EFF1E8] p-7">
            <h4 className="text-[13px] font-semibold text-[#5C7A52]">Your ScriptSnap voice</h4>
            <p className="mt-4 text-[16px] leading-7 text-[#292824]">
              &ldquo;This plant can grow several feet in a single day. But here&rsquo;s the scary part&hellip;&rdquo;
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#DEE7D7] px-3 py-1 text-[11px] font-medium text-[#4A6142]">
              <Check size={12} aria-hidden="true" /> Sounds human
            </span>
          </div>
        </div>

        <Reveal delayMs={100} className="mx-auto mt-8 max-w-[560px] rounded-[16px] border border-[#E0DDD3] bg-white p-7">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-semibold">Creator voice</h4>
            <span className="rounded-full bg-[#F0EEE5] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#9C998F]">Example profile</span>
          </div>
          <p className="mt-1 text-[13px] text-[#9C9686]">A tone preset learned from your own scripts</p>
          <div className="mt-5 flex flex-col gap-3">
            {VOICE_TRAITS.map((trait) => (
              <div key={trait.label} className="flex items-center gap-3 text-[12.5px] text-[#5D5B55]">
                <span className="w-[110px] flex-shrink-0">{trait.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAE7DD]">
                  <span className="block h-full rounded-full bg-[#7A8B72]" style={{ width: `${trait.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button href="/auth/signup" className="w-full">Learn my writing style</Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
