'use client'

import { useEffect, useRef, useState } from 'react'

// Scroll-triggered fade/rise, toggled once an element crosses into the
// viewport. Respects prefers-reduced-motion via the .reveal CSS rules in
// globals.css (falls back to a static, already-visible state there).
export default function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: React.ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: inView ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
