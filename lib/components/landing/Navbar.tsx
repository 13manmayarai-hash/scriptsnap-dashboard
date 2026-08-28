'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'
import { NAV_LINKS } from '@/lib/content/landingContent'
import Button from '@/lib/components/ui/Button'
import Logo from '@/lib/components/ui/Logo'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="sticky top-0 z-50 px-4 sm:px-6 lg:px-10">
      <header className="mx-auto max-w-[1200px] rounded-2xl border border-warm-border bg-warm-surface/90 shadow-[0_4px_20px_rgba(40,39,33,0.05)] backdrop-blur-sm">
        <div className="flex h-[60px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="ScriptSnap home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 text-[14px] text-ink-muted transition hover:text-ink"
              >
                {link.label}
                {link.label === 'Resources' && <ChevronDown size={14} aria-hidden="true" />}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link href="/auth/login" className="text-[14px] font-medium text-ink transition hover:text-sage">Log in</Link>
            <Button href="/auth/signup" className="min-h-[42px] !rounded-full px-5 text-[14px]">Start creating →</Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div id="mobile-nav" className="flex flex-col gap-1 border-t border-warm-border px-4 py-3 lg:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-lg px-2 py-2.5 text-[15px] text-ink-muted hover:bg-warm-surface-alt hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-warm-border pt-3">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink hover:bg-warm-surface-alt"
              >
                Log in
              </Link>
              <Button href="/auth/signup" className="w-full !rounded-full">Start creating →</Button>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
