'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo, Button } from './Shared'

const NAV_LINKS = [
  { href: '#hero', label: 'Product' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#how-it-works', label: 'Resources' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-10">
      <header className="mx-auto max-w-[1200px] rounded-[16px] border border-[#E3E0D7] bg-[#F9F8F4]/90 shadow-[0_4px_20px_rgba(40,39,33,0.05)] backdrop-blur-sm">
        <div className="flex h-[64px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="ScriptSnap home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14px] text-[#484742] transition hover:text-[#20201E]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/auth/login" className="text-[14px] font-medium">Log in</Link>
            <Button href="/auth/signup" className="min-h-[42px] px-5">Start creating →</Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#484742] md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div className="flex flex-col gap-1 border-t border-[#E3E0D7] px-4 py-3 md:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-[8px] px-2 py-2.5 text-[15px] text-[#484742] hover:bg-[#F0EEE5]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[#E3E0D7] pt-3">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="min-h-[44px] rounded-[8px] px-2 py-2.5 text-[15px] font-medium text-[#20201E] hover:bg-[#F0EEE5]"
              >
                Log in
              </Link>
              <Button href="/auth/signup" className="min-h-[44px] w-full">Start creating →</Button>
            </div>
          </div>
        )}
      </header>
    </div>
  )
}
