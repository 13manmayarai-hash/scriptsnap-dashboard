import { Reveal } from './Shared'

function MoatStep({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[12px] border border-[#E0DDD3] bg-white p-5">
      <span className="w-14 flex-shrink-0 font-serif text-[28px] font-bold text-[#7A8B72]">{num}</span>
      <div>
        <h4 className="text-[15px] font-semibold">{title}</h4>
        <p className="text-[13px] text-[#9C9686]">{description}</p>
      </div>
    </div>
  )
}

export default function Moat() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
          <Reveal>
            <span className="font-serif text-[15px] italic text-[#7A8B72]">Why it&rsquo;s different</span>
            <h2 className="mt-3 text-[clamp(26px,3.6vw,38px)] font-semibold tracking-[-0.02em] text-balance">
              Personalization is the moat.
            </h2>
            <p className="mt-5 text-[16px] leading-7 text-[#706E68]">
              Rajiv runs <span className="font-medium text-[#3A3934]">@technosaze</span> on YouTube.
              He trained the first version of this script generator on roughly twenty of his own
              Shorts &mdash; and it worked well enough to write in his voice, for his kind of video,
              that the plan became a small SaaS other solo creators could pay for.
            </p>
            <p className="mt-4 text-[16px] leading-7 text-[#706E68]">
              Generic AI writing tools produce competent, generic scripts. ScriptSnap is built
              around <span className="font-medium text-[#3A3934]">your</span> cadence &mdash; your
              tones, your categories, the kind of video you actually make &mdash; not a one-size-fits-all
              prompt everyone else is typing too.
            </p>
          </Reveal>
          <Reveal delayMs={120} className="flex flex-col gap-3">
            <MoatStep num="20" title="Shorts from one creator" description="The starting point" />
            <p className="text-center text-[13px] text-[#9C9686]">↓ shapes</p>
            <MoatStep num="1" title="Tone preset, refined" description="Style and pacing, not a generic template" />
            <p className="text-center text-[13px] text-[#9C9686]">↓ powers</p>
            <MoatStep num="∞" title="Scripts that sound like you" description="Every generation, in your tone, ready to post" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
