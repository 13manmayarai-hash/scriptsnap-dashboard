'use client'

import { useRef } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import Sidebar from './Sidebar'

export default function MobileDrawer({
  open,
  onClose,
  pathname,
  tier,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  pathname: string
  tier: string
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  onLogout: () => void
}) {
  const drawerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(drawerRef, open, onClose)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          style={{ overscrollBehavior: 'contain' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`${
          open ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform bg-warm-surface-alt shadow-xl transition-transform duration-200 motion-reduce:transition-none md:hidden`}
      >
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-warm-surface"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <Sidebar
          pathname={pathname}
          tier={tier}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSearchSubmit={onSearchSubmit}
          onNavigate={onClose}
          onLogout={onLogout}
        />
      </div>
    </>
  )
}
