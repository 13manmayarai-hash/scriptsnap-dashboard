import Image from 'next/image'
import { ArrowRight, Play, PenTool, Sparkles, ShieldCheck, FileText, Languages, Clock3 } from 'lucide-react'
import { Button, Stat } from './Shared'

// TODO: swap /public/hero-illustration.png for the real transparent-PNG
// creator character once provided — this line-art placeholder is the
// pre-existing hero image, not the new reference character.
function HeroArtwork() {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[#DDD9CE] bg-[#FAF8F3] p-7 shadow-[0_18px_45px_rgba(42,40,34,0.07)]">
      <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-[#E7EBDD] blur-2xl" aria-hidden="true" />
      <div className="relative grid min-h-[310px] grid-cols-[1.05fr_.95fr] gap-5">
        <div className="relative flex items-center justify-center overflow-hidden rounded-[10px]">
          <Image
            src="/hero-illustration.png"
            alt="Line-art illustration of a person in a beanie writing in a notebook at a desk, with a mug of coffee and a small plant"
            width={385}
            height={240}
            priority
            className="h-full w-full max-w-[330px] object-contain"
          />
        </div>
        <div className="flex flex-col justify-center pr-2">
          <p className="font-serif text-[26px] leading-[1.15] text-[#292824]">
            &ldquo;A good script
            <br />
            doesn&rsquo;t just tell.
            <br />
            It makes people
            <br />
            <span className="relative inline-block italic text-[#66775E]">
              feel something.&rdquo;
              <span className="absolute -bottom-2 left-0 h-[2px] w-[92%] rotate-[-2deg] bg-[#66775E]" />
            </span>
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-[#8B8880]">&mdash; Rajiv, @technosaze</p>
        </div>
      </div>
      <div className="grid grid-cols-4 divide-x divide-[#E1DED4] rounded-[10px] border border-[#E1DED4] bg-white/60">
        <Stat icon={<FileText size={17} aria-hidden="true" />} label="Trained on" value="20 scripts" />
        <Stat icon={<Languages size={17} aria-hidden="true" />} label="Languages" value="5" />
        <Stat icon={<Clock3 size={17} aria-hidden="true" />} label="Per script" value="~40 sec" />
        <Stat icon={<ShieldCheck size={17} aria-hidden="true" />} label="Free scripts" value="5/mo" />
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1380px] px-6 pb-8 pt-16 lg:px-10 lg:pt-20">
      {/* Floating decorative icons live in the gutter between the two hero
          columns — genuinely empty space at any width, so they can't
          collide with the headline or get clipped behind the artwork card. */}
      <div className="relative grid items-center gap-14 lg:grid-cols-[.95fr_1.05fr]">
        <div
          className="animate-float absolute left-[47%] top-[10%] z-10 hidden -translate-x-1/2 rounded-[14px] border border-[#E0DDD3] bg-white p-3 text-[#7A8B72] lg:block"
          style={{ animationDelay: '0s' }}
          aria-hidden="true"
        >
          <PenTool size={20} />
        </div>
        <div
          className="animate-float absolute left-[47%] top-[45%] z-10 hidden -translate-x-1/2 rounded-[14px] border border-[#E0DDD3] bg-white p-3 text-[#B8863A] lg:block"
          style={{ animationDelay: '1.1s' }}
          aria-hidden="true"
        >
          <Sparkles size={20} />
        </div>
        <div
          className="animate-float absolute left-[47%] top-[80%] z-10 hidden -translate-x-1/2 rounded-[14px] border border-[#E0DDD3] bg-white p-3 text-[#5C7A52] lg:block"
          style={{ animationDelay: '2.1s' }}
          aria-hidden="true"
        >
          <ShieldCheck size={20} />
        </div>
        <div className="animate-fade-up">
          <div className="mb-6 inline-block">
            <span className="font-serif text-[17px] italic text-[#30302B]">for one creator, trained on his voice</span>
            <div className="ml-1 mt-[-1px] h-[2px] w-[220px] rotate-[-2deg] bg-[#30302B]" aria-hidden="true" />
          </div>
          <h1 className="max-w-[680px] text-[50px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[60px] lg:text-[64px] text-balance">
            Turn a topic into a script that sounds like <span className="text-[#708067]">you.</span>
          </h1>
          <p className="mt-7 max-w-[580px] text-[18px] leading-7 text-[#706E68]">
            ScriptSnap writes your next YouTube Shorts script &mdash; title, ten
            title variations, description, hashtags and pinned comment,
            all in one generation &mdash; trained on your own back-catalog, not
            a shared AI voice.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button href="/auth/signup" icon={<ArrowRight size={17} aria-hidden="true" />} className="min-w-[205px]">Start writing free</Button>
            <Button href="#how-it-works" variant="secondary" icon={<Play size={15} fill="currentColor" aria-hidden="true" />} className="min-w-[220px]">See how it works</Button>
          </div>
          <p className="mt-8 text-[13px] text-[#5D5B55]">
            Built and used daily by <span className="font-medium text-[#3A3934]">@technosaze</span> on his own channel, before anyone else&rsquo;s.
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <HeroArtwork />
        </div>
      </div>
    </section>
  )
}
