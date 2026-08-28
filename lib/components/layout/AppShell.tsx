'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAppStore } from '@/lib/store/app'
import Sidebar from './Sidebar'
import MobileDrawer from './MobileDrawer'
import Topbar from './Topbar'

const PAGE_META: Record<string, { title: string; breadcrumb?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/dashboard/new': { title: 'New Script' },
  '/dashboard/library': { title: 'Scripts' },
  '/dashboard/ideas': { title: 'Ideas' },
  '/dashboard/calendar': { title: 'Calendar' },
  '/dashboard/templates': { title: 'Templates' },
  '/dashboard/settings': { title: 'Settings' },
  '/dashboard/help': { title: 'Help' },
  '/dashboard/billing': { title: 'Usage & Billing', breadcrumb: 'Settings' },
  '/dashboard/tone-presets': { title: 'Tone & Voice', breadcrumb: 'Settings' },
  '/dashboard/categories': { title: 'Categories', breadcrumb: 'Settings' },
}

function pageMeta(pathname: string): { title: string; breadcrumb?: string } {
  if (pathname.startsWith('/dashboard/scripts/')) {
    return { title: 'Script', breadcrumb: 'Scripts' }
  }
  return PAGE_META[pathname] || { title: 'Dashboard' }
}

export default function AppShell({
  children,
  email,
  tier,
  onLogout,
}: {
  children: React.ReactNode
  email?: string
  tier?: string
  onLogout: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { topbarAction, topbarSaveState } = useAppStore()

  const meta = pageMeta(pathname)
  const action = topbarAction || (pathname === '/dashboard/new' ? undefined : { label: 'New script', href: '/dashboard/new' })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setDrawerOpen(false)
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    router.push(`/dashboard/library${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="flex h-screen bg-warm-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-sage focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <aside className="hidden w-[232px] flex-shrink-0 border-r border-warm-border bg-warm-surface-alt md:block">
        <Sidebar
          pathname={pathname}
          tier={tier || 'free'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearch}
          onLogout={onLogout}
        />
      </aside>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
        tier={tier || 'free'}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={meta.title}
          breadcrumb={meta.breadcrumb}
          saveState={topbarSaveState || undefined}
          action={action}
          email={email}
          tier={tier}
          onMenuClick={() => setDrawerOpen((v) => !v)}
          sidebarOpen={drawerOpen}
          onLogout={onLogout}
        />
        <main id="main-content" className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
