'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, LogOut, Settings as SettingsIcon } from 'lucide-react'

interface TopbarAction {
  label: string
  href?: string
  onClick?: () => void
}

export default function Topbar({
  title,
  breadcrumb,
  saveState,
  action,
  email,
  tier,
  onMenuClick,
  sidebarOpen,
  onLogout,
}: {
  title: string
  breadcrumb?: string
  saveState?: string
  action?: TopbarAction
  email?: string
  tier?: string
  onMenuClick: () => void
  sidebarOpen: boolean
  onLogout: () => void
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [profileOpen])

  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-warm-border bg-warm-bg px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          aria-controls="mobile-sidebar"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-warm-surface-alt md:hidden"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-semibold text-ink md:text-lg">{title}</h2>
            {saveState && (
              <span className="flex-shrink-0 text-xs text-ink-muted" aria-live="polite">
                {saveState}
              </span>
            )}
          </div>
          {breadcrumb && <p className="truncate text-xs text-ink-muted">{breadcrumb}</p>}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {action &&
          (action.href ? (
            <Link href={action.href} className="btn-primary px-4 py-2 text-sm">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-primary px-4 py-2 text-sm">
              {action.label}
            </button>
          ))}

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            aria-label="Account menu"
            className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 hover:bg-warm-surface-alt"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage/15 text-sm font-semibold text-sage">
              {(email || 'U').charAt(0).toUpperCase()}
            </span>
            <ChevronDown size={14} aria-hidden="true" className="hidden text-ink-muted sm:block" />
          </button>

          {profileOpen && (
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 z-30 mt-2 w-52 rounded-lg border border-warm-border bg-warm-surface p-1 shadow-lg"
            >
              <div className="mb-1 border-b border-warm-border px-3 py-2">
                <p className="truncate text-sm font-medium text-ink">{email}</p>
                <p className="text-xs capitalize text-ink-muted">{tier} plan</p>
              </div>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => setProfileOpen(false)}
                className="flex min-h-[40px] items-center gap-2 rounded px-3 text-sm text-ink hover:bg-warm-surface-alt"
              >
                <SettingsIcon size={15} aria-hidden="true" /> Settings
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false)
                  onLogout()
                }}
                className="flex min-h-[40px] w-full items-center gap-2 rounded px-3 text-sm text-error hover:bg-error/10"
              >
                <LogOut size={15} aria-hidden="true" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
