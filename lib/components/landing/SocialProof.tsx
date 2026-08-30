'use client'

import { useEffect, useState } from 'react'
import { Star, Play } from 'lucide-react'
import { TESTIMONIAL } from '@/lib/content/landingContent'
import Reveal from '@/lib/components/ui/Reveal'

export default function SocialProof() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/public/creator-count')
      .then((res) => res.json())
      .then((data) => setCount(data.count))
      .catch(() => setCount(null))
  }, [])

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal>
          <div className="flex flex-col items-center gap-4 rounded-[20px] border border-warm-border bg-warm-surface p-4 sm:flex-row sm:gap-5 sm:p-5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft-accent text-[16px] font-semibold text-sage-hover" aria-hidden="true">
              R
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="font-serif text-[16px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[18px]">
                Loved by creators who don&rsquo;t want their scripts to sound like AI.
              </h2>
              <div className="mt-1.5 flex justify-center gap-0.5 text-[#C99A4A] sm:justify-start" aria-label={`${TESTIMONIAL.rating} out of 5 stars`}>
                {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-1.5 text-[13.5px] leading-5 text-ink">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
              <p className="text-[12px] text-ink-muted">&mdash; {TESTIMONIAL.attribution}</p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3 rounded-2xl bg-warm-surface-alt px-5 py-3">
              <div>
                <p className="font-serif text-[20px] font-bold leading-none text-ink">
                  {count !== null && count > 0 ? `${count}+` : '—'}
                </p>
                <p className="text-[11px] text-ink-muted">Creators</p>
              </div>
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage" aria-hidden="true">
                <Play size={12} fill="white" className="text-white" />
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
