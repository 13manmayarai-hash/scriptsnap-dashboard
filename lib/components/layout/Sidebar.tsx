'use client'

import Link from 'next/link'
import { useAppStore } from '@/lib/store/app'
import {
  Home,
  FileText,
  Lightbulb,
  Calendar,
  LayoutTemplate,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  Sparkles,
  LogOut,
  Search,
} from 'lucide-react'

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/library', label: 'Scripts', icon: FileText },
  { href: '/dashboard/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export const ACCOUNT_LINKS = [
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
  { href: '/dashboard/help', label: 'Help', icon: HelpCircle },
  { href: '/dashboard/billing', label: 'Upgrade', icon: Sparkles },
]

export default function Sidebar({
  pathname,
  tier,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onNavigate,
  onLogout,
}: {
  pathname: string
  tier: string
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  onNavigate?: () => void
  onLogout: () => void
}) {
  const { hasUnsavedChanges } = useAppStore()

  // Leaving with a pending script edit (sidebar/account nav, or logout)
  // would otherwise silently discard it — same risk as a raw page unload.
  const guardNavigate = (e: React.MouseEvent) => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave without saving?')) {
      e.preventDefault()
      return
    }
    onNavigate?.()
  }

  const guardLogout = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave without saving?')) return
    onLogout()
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto overscroll-contain p-6">
      <div>
        <h1 className="text-2xl font-bold heading-serif text-sage">ScriptSnap</h1>
        <p className="text-sm text-ink-muted">Creative workspace</p>
      </div>

      <form onSubmit={onSearchSubmit} className="relative">
        <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search scripts…"
          className="input pl-8 text-sm py-2"
          aria-label="Search scripts"
        />
      </form>

      <nav className="space-y-1" aria-label="Primary">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={guardNavigate}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${
                active ? 'bg-sage/10 font-medium text-sage' : 'text-ink hover:bg-warm-surface-alt'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-sage" aria-hidden="true" />
              )}
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-warm-border pt-4">
        <p className="mb-1 px-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">Account</p>
        <nav className="space-y-1" aria-label="Account">
          {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={guardNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition ${
                  active ? 'bg-sage/10 font-medium text-sage' : 'text-ink hover:bg-warm-surface-alt'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-3 border-t border-warm-border pt-4">
        <div className="px-4 text-sm">
          <p className="text-ink-muted">Plan</p>
          <p className="font-semibold capitalize text-sage">{tier}</p>
        </div>

        <button
          onClick={guardLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-lg bg-error px-4 py-2.5 text-sm text-white transition hover:bg-error-hover"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
