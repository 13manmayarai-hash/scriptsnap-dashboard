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
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Fetch user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userProfile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          subscription_tier: userProfile.subscription_tier || 'free',
          scripts_generated_month: userProfile.scripts_generated_month || 0,
        })
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, setUser])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-black">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-brand-yellow mx-auto mb-4 animate-spin" />
          <p className="text-brand-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-brand-black text-brand-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative w-64 h-full bg-black/50 border-r border-white/10 p-6 transform transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gradient">🎬 ScriptSnap</h1>
          <p className="text-sm text-white/60 mt-1">AI Script Generator</p>
        </div>

        <nav className="space-y-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Sparkles size={20} />
            <span>Generate</span>
          </Link>
          <Link
            href="/dashboard/library"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <BarChart3 size={20} />
            <span>Library</span>
          </Link>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <p className="text-sm text-white/60">Tier</p>
            <p className="font-semibold capitalize">{user?.subscription_tier}</p>
            {user?.subscription_tier === 'free' && (
              <p className="text-xs text-white/40 mt-2">
                {user.scripts_generated_month || 0} / 10 scripts used
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 btn-secondary text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-white/10 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{user?.email}</h2>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
