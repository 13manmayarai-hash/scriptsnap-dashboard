'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { Reveal } from './Shared'

// The founder-usage story is the one thing here that's true today
// regardless of signup count, so it stays as the main content. The
// creator count beside it is real and fetched live — not a fabricated
// number — so it honestly starts small and grows as people actually sign
// up, instead of claiming a user base ScriptSnap doesn't have yet.
export default function SocialProof() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public/creator-count')
      .then((r) => r.json())
      .then((d) => setCount(typeof d.count === 'number' ? d.count : null))
      .catch(() => setCount(null))
  }, [])

  return (
    <section className="relative overflow-hidden border-t border-[#E2DFD6] bg-[#F1EFE8] py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-16 -top-16 h-[280px] w-[280px] opacity-40" aria-hidden="true">
        <Image src="/section-bg-decoration.png" alt="" fill className="object-contain" />
      </div>
      <div className="relative mx-auto max-w-[1380px] px-6 lg:px-10">
        <Reveal className="flex flex-col items-center gap-8 rounded-[20px] border border-[#E0DDD3] bg-white p-8 text-center sm:p-12 md:flex-row md:text-left">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#7A8B72] text-white">
            <span className="font-serif text-2xl italic">R</span>
          </div>
          <div className="flex-1">
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-balance">
              Built and used every day by the creator who made it
            </h3>
            <p className="mt-3 text-[15px] leading-6 text-[#706E68]">
              Rajiv runs <span className="font-medium text-[#3A3934]">@technosaze</span> on YouTube and generates every one of his own Shorts scripts through ScriptSnap &mdash; before it was ever a product other creators could sign up for.
            </p>
          </div>
          {count !== null && count > 0 ? (
            <div className="flex flex-shrink-0 flex-col items-center rounded-[12px] border border-[#E0DDD3] bg-[#FBFAF6] px-7 py-4 text-center">
              <span className="font-serif text-[32px] font-bold text-[#3A3934]">{count.toLocaleString('en-IN')}+</span>
              <span className="text-[12px] text-[#9C9686]">{count === 1 ? 'Creator' : 'Creators'}</span>
            </div>
          ) : (
            <div className="flex flex-shrink-0 items-center gap-2 rounded-[12px] border border-[#E0DDD3] bg-[#FBFAF6] px-5 py-4">
              <ShieldCheck size={18} className="text-[#5C7A52]" aria-hidden="true" />
              <span className="text-[13px] font-medium text-[#3A3934]">Real channel, real daily use</span>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  )
}
