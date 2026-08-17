'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import {
  Sparkles,
  BarChart3,
  LogOut,
  Menu,
  X,
  Mic2,
  Tags,
  CreditCard,
  Settings as SettingsIcon,
  Search,
} from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Generate Script', icon: Sparkles },
  { href: '/dashboard/library', label: 'Library', icon: BarChart3 },
  { href: '/dashboard/tone-presets', label: 'Tone & Voice', icon: Mic2 },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
]

const ACCOUNT_LINKS = [
  { href: '/dashboard/billing', label: 'Usage & Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('subscription_tier, scripts_generated_month')
        .eq('id', session.user.id)
        .single()

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        subscription_tier: profile?.subscription_tier || 'free',
        scripts_generated_month: profile?.scripts_generated_month || 0,
      })
    }

    checkAuth()
  }, [isMounted, setUser, router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSidebarOpen(false)
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    router.push(`/dashboard/library${params.toString() ? `?${params}` : ''}`)
  }

  if (!isMounted) return null

  return (
    <div className="flex h-screen bg-warm-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-sage focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden text-ink"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {/* Backdrop — dismisses the mobile sidebar on tap-outside */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static w-64 h-screen bg-warm-surface-alt border-r border-warm-border p-6 transition-transform z-40 overflow-y-auto overscroll-contain`}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold heading-serif text-sage">ScriptSnap</h1>
            <p className="text-sm text-ink-muted">Dashboard</p>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scripts…"
              className="input pl-8 text-sm py-2"
              aria-label="Search scripts"
            />
          </form>

          <nav className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    active ? 'bg-sage/15 text-sage font-medium' : 'text-ink hover:bg-sage/10'
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-warm-border">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide px-4 mb-1">Account</p>
            <nav className="space-y-1">
              {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      active ? 'bg-sage/15 text-sage font-medium' : 'text-ink hover:bg-sage/10'
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-warm-border space-y-3">
            <div className="text-sm">
              <p className="text-ink-muted">Tier</p>
              <p className="font-semibold text-sage capitalize">
                {user?.subscription_tier || 'free'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-error text-white hover:bg-error-hover transition"
            >
              <LogOut size={20} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
