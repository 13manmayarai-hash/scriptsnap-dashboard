import Link from 'next/link'
import { FOOTER_LINKS } from '@/lib/content/landingContent'

export default function Footer() {
  return (
    <footer className="border-t border-warm-border bg-warm-bg py-8">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-4 px-[18px] text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-12">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Link href="/" className="flex items-center gap-2 font-serif text-[16px] font-semibold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-sage text-[11px] font-bold text-white" aria-hidden="true">S</span>
            ScriptSnap
          </Link>
          <p className="text-[12px] text-ink-faint">&copy; {new Date().getFullYear()} ScriptSnap. All rights reserved.</p>
        </div>

        <nav className="flex gap-5 text-[13px] text-ink-muted" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
