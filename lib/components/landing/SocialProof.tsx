'use client'

import { useEffect, useState } from 'react'
import { Star, Users } from 'lucide-react'
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
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
        <Reveal className="mb-10 text-center">
          <h2 className="mx-auto max-w-[560px] font-serif text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight tracking-[-0.01em] text-ink">
            Loved by creators who don&rsquo;t want their scripts to sound like AI.
          </h2>
        </Reveal>

        <Reveal>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-warm-border bg-warm-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-soft-accent text-[16px] font-semibold text-sage-hover" aria-hidden="true">
                R
              </div>
              <div>
                <div className="flex gap-0.5 text-[#C99A4A]" aria-label={`${TESTIMONIAL.rating} out of 5 stars`}>
                  {Array.from({ length: TESTIMONIAL.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-1.5 max-w-[420px] text-[15px] leading-6 text-ink">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
                <p className="mt-1 text-[12px] text-ink-muted">&mdash; {TESTIMONIAL.attribution}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-warm-border bg-warm-surface-alt px-5 py-3">
              <Users size={18} className="text-sage" aria-hidden="true" />
              <div>
                <p className="font-serif text-[22px] font-bold leading-none text-ink">
                  {count !== null && count > 0 ? `${count}+` : '—'}
                </p>
                <p className="text-[11px] text-ink-muted">Creators</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
