import Image from 'next/image'
import { ArrowRight, Play, PenTool, Sparkles, ShieldCheck, FileText, Languages, Clock3 } from 'lucide-react'
import { Button, Stat } from './Shared'

function HeroArt() {
  return (
    <div className="relative">
      {/* Soft decorative watercolor behind the character — deliberately
          subtle and positioned off-center so it never competes with the
          headline in the column beside it. */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-[380px] w-[380px] opacity-70 sm:h-[440px] sm:w-[440px]" aria-hidden="true">
        <Image src="/hero-bg-decoration.png" alt="" fill className="object-contain" priority />
      </div>

      <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]">
        <Image
          src="/hero-character.png"
          alt="Illustration of a smiling creator in a backwards cap and hoodie, arms crossed"
          width={622}
          height={1024}
          priority
          className="relative z-10 h-auto w-full object-contain"
        />
      </div>

      <div className="relative z-10 mx-auto mt-4 max-w-[420px] rounded-[14px] border border-[#DDD9CE] bg-[#FAF8F3]/95 p-6 shadow-[0_18px_45px_rgba(42,40,34,0.07)] backdrop-blur-sm">
        <p className="font-serif text-[20px] leading-[1.25] text-[#292824]">
          &ldquo;A good script doesn&rsquo;t just tell. It makes people{' '}
          <span className="relative inline-block italic text-[#66775E]">
            feel something.&rdquo;
            <span className="absolute -bottom-1.5 left-0 h-[2px] w-[92%] rotate-[-2deg] bg-[#66775E]" />
          </span>
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-[#8B8880]">&mdash; Rajiv, @technosaze</p>
        <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-1 divide-y divide-[#E1DED4] rounded-[10px] border border-[#E1DED4] bg-white/60 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <Stat icon={<FileText size={16} aria-hidden="true" />} label="Trained on" value="20 scripts" />
          <Stat icon={<Languages size={16} aria-hidden="true" />} label="Languages" value="5" />
          <Stat icon={<Clock3 size={16} aria-hidden="true" />} label="Per script" value="~40 sec" />
          <Stat icon={<ShieldCheck size={16} aria-hidden="true" />} label="Free scripts" value="5/mo" />
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1380px] px-6 pb-8 pt-16 lg:px-10 lg:pt-20">
      {/* Floating decorative icons live in the gutter between the two hero
          columns — genuinely empty space at any width, so they can't
          collide with the headline or get clipped behind the artwork. */}
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
          <HeroArt />
        </div>
      </div>
    </section>
  )
}
