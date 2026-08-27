'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Fades an element up into place the first time it scrolls into view
// (rather than on every scroll in/out) — a single IntersectionObserver
// per element, disconnected once triggered. Respects prefers-reduced-motion
// via the .reveal CSS rule in globals.css.
export function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'in-view' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function Logo() {
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

export function Button({
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
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return (
    <Link
      href={href}
      className={`${base} inline-flex min-h-[46px] items-center justify-center gap-2 text-[15px] ${className}`}
    >
      {children}
      {icon}
    </Link>
  )
}

export function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

export function Feature({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="px-6 py-10 md:px-10">
      <div className="font-serif text-[13px] italic text-[#7A8B72]">{number}</div>
      <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 max-w-[330px] text-[13px] leading-5 text-[#77746C]">{description}</p>
    </div>
  )
}
