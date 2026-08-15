'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import { Sparkles, BarChart3, LogOut, Menu, X } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  if (!isMounted) return null

  return (
    <div className="flex h-screen bg-brand-black text-brand-white">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static w-64 h-screen bg-brand-black border-r border-brand-gold/20 p-6 transition-transform z-40`}
      >
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-gold">ScriptSnap</h1>
            <p className="text-sm text-brand-white/60">Dashboard</p>
          </div>

          <nav className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-gold/10 transition"
            >
              <Sparkles size={20} />
              <span>Generate Script</span>
            </Link>
            <Link
              href="/dashboard/library"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-brand-gold/10 transition"
            >
              <BarChart3 size={20} />
              <span>Library</span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-brand-gold/20 space-y-3">
            <div className="text-sm">
              <p className="text-brand-white/60">Tier</p>
              <p className="font-semibold text-brand-gold capitalize">
                {user?.subscription_tier || 'free'}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
