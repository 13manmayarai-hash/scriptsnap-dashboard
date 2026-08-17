'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight,
  Play,
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Home as HomeIcon,
  FileText,
  Lightbulb,
  Mic2,
  Settings as SettingsIcon,
  Star,
  Sparkles,
  Scissors,
  ListPlus,
  Link2,
  Image as ImageIcon,
  PenLine,
  ShieldCheck,
  Clock3,
  Languages,
  Wand2,
} from 'lucide-react'

// Logged-in visitors don't belong on the marketing page — send them
// straight to the app. Anonymous visitors see the landing page below
// (previously "/" redirected everyone to /auth/login with no marketing
// page at all).
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard')
      }
    }

    checkAuth()
  }, [router])

  return <LandingPage />
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#7A8B72] text-white">
        <span className="font-serif text-lg italic">S</span>
      </div>
      <span className="text-[20px] font-semibold tracking-[-0.03em] text-[#20201E]">
        ScriptSnap
      </span>
    </div>
  )
}

function Button({
  children,
  variant = 'primary',
  icon,
  className = '',
  href,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
  className?: string
  href: string
}) {
  const base =
    'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[7px] px-6 text-[15px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A8B72] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F0]'
  const variants = {
    primary: 'bg-[#7A8B72] text-white hover:bg-[#697B62] active:scale-[0.98]',
    secondary:
      'border border-[#AEB5A6] bg-transparent text-[#20201E] hover:bg-[#F0EEE7] active:scale-[0.98]',
  }
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
      {icon}
    </Link>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="text-[#77756F]">{icon}</div>
      <div>
        <div className="text-[11px] text-[#85827A]">{label}</div>
        <div className="mt-0.5 text-[15px] font-semibold text-[#24231F]">{value}</div>
      </div>
    </div>
  )
}

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

const sidebarItems: Array<[typeof HomeIcon, string]> = [
  [HomeIcon, 'Dashboard'],
  [Wand2, 'Generate'],
  [FileText, 'Scripts'],
  [Mic2, 'Tone & Voice'],
  [SettingsIcon, 'Settings'],
]

function Sidebar() {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#E1DED4] bg-[#FBFAF6] p-4">
      <Logo />
      <nav className="mt-9 space-y-1">
        {sidebarItems.map(([Icon, label], index) => (
          <span
            key={label}
            className={`flex min-h-[42px] w-full items-center gap-3 rounded-[7px] px-3 text-left text-[14px] ${
              index === 0 ? 'bg-[#F0EEE5] text-[#596950]' : 'text-[#595750]'
            }`}
          >
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
            {label}
          </span>
        ))}
      </nav>
      <div className="mt-28 rounded-[9px] border border-[#E0DDD3] bg-white p-4">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[#7A8B72]" aria-hidden="true" />
          <span className="text-[13px] font-semibold">Upgrade to Basic</span>
        </div>
        <p className="mt-1 text-[11px] text-[#85827A]">50 scripts/mo, all 5 languages</p>
        <ArrowRight size={15} className="mt-4 text-[#66645D]" aria-hidden="true" />
      </div>
    </aside>
  )
}

function EditorToolbar() {
  return (
    <div className="flex items-center gap-4 border-b border-[#E6E2D9] px-4 py-3 text-[#57554F]" aria-hidden="true">
      <span className="font-serif text-sm">H1</span>
      <span className="font-serif text-sm">H2</span>
      <span className="font-bold">B</span>
      <span className="font-serif italic">I</span>
      <span className="h-5 w-px bg-[#E2DED4]" />
      <Link2 size={16} />
      <ImageIcon size={16} />
    </div>
  )
}

function ScriptEditor() {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#E0DDD3] bg-white">
      <EditorToolbar />
      <div className="px-7 py-6">
        <div className="space-y-5 text-[14px] leading-[1.75] text-[#34332F]">
          <div>
            <span className="font-medium text-[#77756F]">[HOOK]</span>
            <p className="mt-2">
              Okay, so USB-C was supposed to fix this. One cable, every
              device, done. That&rsquo;s what they told us.
            </p>
          </div>
          <p>
            But your phone charges in two hours and your friend&rsquo;s phone
            charges in twenty minutes. Same cable. So what&rsquo;s going on?
          </p>
          <div>
            <span className="font-medium text-[#77756F]">[POINT 1]</span>
            <p className="mt-2">
              It&rsquo;s not the cable &mdash; it&rsquo;s the charging protocol behind it.
              Here&rsquo;s the one spec number to actually check before you buy.
            </p>
          </div>
        </div>
        <div className="mt-10 text-[11px] text-[#97938A]">168 words &middot; 34 sec read</div>
      </div>
    </div>
  )
}

function ToneMatch() {
  return (
    <div className="border-b border-[#E5E1D8] p-5">
      <div className="text-[13px] font-semibold">Tone match</div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex h-[70px] w-[70px] items-center justify-center rounded-full border-[6px] border-[#DDE3D7]">
          <div className="absolute inset-[-6px] rounded-full border-[6px] border-[#7A8B72] border-b-transparent border-l-transparent rotate-[-25deg]" aria-hidden="true" />
          <span className="text-[19px] font-semibold">79%</span>
        </div>
        <p className="text-[12px] leading-5 text-[#706E68]">
          Getting closer to your voice.
          <br />
          Keeps improving as you edit or
          <br />
          regenerate more scripts.
        </p>
      </div>
    </div>
  )
}

function GuidelinePanel() {
  return (
    <div className="overflow-hidden rounded-[9px] border border-[#E0DDD3] bg-white">
      <div className="flex border-b border-[#E5E1D8]" aria-hidden="true">
        {['Overview', 'Kit', 'Languages'].map((item, index) => (
          <span
            key={item}
            className={`relative px-5 py-4 text-[12px] ${
              index === 0 ? 'font-semibold text-[#262520]' : 'text-[#85827A]'
            }`}
          >
            {item}
            {index === 0 && <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7A8B72]" />}
          </span>
        ))}
      </div>
      <ToneMatch />
      <div className="border-b border-[#E5E1D8] p-5">
        <div className="text-[13px] font-semibold">Community Guidelines check</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#EFF1E8] px-3 py-1.5 text-[11px] text-[#596650]">&#10003; No copyright flags</span>
          <span className="rounded-full bg-[#EFF1E8] px-3 py-1.5 text-[11px] text-[#596650]">&#10003; Advertiser-friendly</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold">Tone preset</span>
          <PenLine size={14} className="text-[#88857D]" aria-hidden="true" />
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#68665F]">
          &ldquo;Punchy Explainer&rdquo;
          <br />
          Trained on 20 of your own Shorts
        </p>
      </div>
    </div>
  )
}

const tools = [
  { icon: Sparkles, title: 'AI Rewrite', subtitle: 'Improve this line' },
  { icon: Scissors, title: 'Shorten', subtitle: 'Trim to fit your duration' },
  { icon: ListPlus, title: 'Expand', subtitle: 'Add more detail' },
  { icon: Lightbulb, title: 'Regenerate titles', subtitle: 'Get 10 more variations' },
]

function ToolsPanel() {
  return (
    <div className="rounded-[9px] border border-[#E0DDD3] bg-white p-4" aria-hidden="true">
      <div className="mb-4 text-[13px] font-semibold">Script tools</div>
      <div className="space-y-2">
        {tools.map(({ icon: Icon, title, subtitle }) => (
          <div
            key={title}
            className="flex min-h-[58px] w-full items-center gap-3 rounded-[7px] border border-[#E6E2D9] px-3 text-left"
          >
            <Icon size={17} className="text-[#6F8067]" />
            <div className="flex-1">
              <div className="text-[12px] font-medium text-[#30302B]">{title}</div>
              <div className="mt-0.5 text-[10px] text-[#918D84]">{subtitle}</div>
            </div>
            <ArrowRight size={14} className="text-[#AAA69D]" />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-[7px] bg-[#F0F1E8] p-3.5">
        <div className="flex items-center gap-2 text-[12px] font-medium">
          <Lightbulb size={15} className="text-[#718065]" />
          Tip
        </div>
        <p className="mt-2 text-[10px] leading-4 text-[#6C7064]">
          Scripts you keep without editing train your tone preset the most.
        </p>
      </div>
    </div>
  )
}

function ProductPreview() {
  return (
    <div
      id="how-it-works"
      className="mt-20 scroll-mt-6 overflow-hidden rounded-[14px] border border-[#DCD9CF] bg-[#FBFAF6] shadow-[0_20px_60px_rgba(40,39,33,0.07)] animate-fade-up"
      style={{ animationDelay: '150ms' }}
    >
      {/* This is a fixed-proportions screenshot of the real dashboard, not
          a responsive layout — on narrow screens it scrolls horizontally
          within its own frame instead of squeezing illegible or being
          silently clipped by the page's overflow-x safety net. */}
      <div className="overflow-x-auto">
        <div className="flex min-h-[650px] min-w-[960px]" aria-hidden="true">
          <Sidebar />
          <main className="min-w-0 flex-1 bg-[#F8F7F2]">
            <header className="flex h-[62px] items-center justify-between border-b border-[#E1DED4] px-6">
              <div className="flex items-center gap-5">
                <ArrowLeft size={17} className="text-[#77756F]" />
                <span className="text-[14px] text-[#77756F]">Back</span>
                <span className="h-5 w-px bg-[#DEDAD0]" />
                <span className="text-[14px] font-semibold">Why Phone Chargers Still Don&rsquo;t Fit</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden items-center gap-1.5 text-[11px] text-[#7B8175] sm:flex">
                  <ShieldCheck size={13} />
                  Guideline check passed
                </span>
                <span className="flex items-center gap-2 rounded-[6px] bg-[#7A8B72] px-3 py-2 text-[11px] text-white">
                  <Share2 size={13} />
                  Share
                </span>
                <MoreHorizontal size={17} className="text-[#77756F]" />
              </div>
            </header>
            <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_.72fr_.48fr]">
              <ScriptEditor />
              <GuidelinePanel />
              <ToolsPanel />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function Feature({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="px-6 py-10 md:px-10">
      <div className="font-serif text-[13px] italic text-[#7A8B72]">{number}</div>
      <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 max-w-[330px] text-[13px] leading-5 text-[#77746C]">{description}</p>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#20201E]" style={{ colorScheme: 'light' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-[#7A8B72] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <header className="border-b border-[#E3E0D7] bg-[#F9F8F4]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-[76px] max-w-[1380px] items-center justify-between px-6 lg:px-10">
          <Logo />
          <nav className="hidden items-center gap-10 md:flex">
            <a href="#features" className="text-[14px] text-[#484742] transition hover:text-[#20201E]">Features</a>
            <a href="#how-it-works" className="text-[14px] text-[#484742] transition hover:text-[#20201E]">How it works</a>
            <Link href="/pricing" className="text-[14px] text-[#484742] transition hover:text-[#20201E]">Pricing</Link>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="hidden text-[14px] font-medium sm:block">Log in</Link>
            <Button href="/auth/signup" className="min-h-[44px] px-5">Get started free</Button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto max-w-[1380px] px-6 pb-8 pt-16 lg:px-10 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[.95fr_1.05fr]">
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

          <ProductPreview />
        </section>

        <section id="features" className="border-t border-[#E2DFD6] bg-[#F1EFE8]">
          <div className="mx-auto grid max-w-[1380px] grid-cols-1 divide-y divide-[#DDD9CF] px-6 py-0 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
            <Feature number="01" title="Write faster" description="Turn a topic into a full script and content kit in under a minute, not an afternoon." />
            <Feature number="02" title="Sound like yourself" description="Trained on your own back-catalog, so every script sounds like you, not a generic AI voice." />
            <Feature number="03" title="Post with confidence" description="Every script is checked against YouTube's Community Guidelines before you post — copyright, monetization risk, all of it." />
          </div>
        </section>
      </main>

      <footer className="bg-[#20201E] px-6 py-12 text-[#F4F1E9] lg:px-10">
        <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="text-[18px] font-semibold">ScriptSnap</div>
            <p className="mt-2 text-[12px] text-[#AAA79F]">Built solo by a YouTube Shorts creator.</p>
          </div>
          <div className="flex gap-7 text-[12px] text-[#AAA79F]">
            <a href="#" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A8B72] rounded">Privacy</a>
            <a href="#" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A8B72] rounded">Terms</a>
            <a href="#" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A8B72] rounded">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
