'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import AppShell from '@/lib/components/layout/AppShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const [isMounted, setIsMounted] = useState(false)

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
    <AppShell email={user?.email} tier={user?.subscription_tier || 'free'} onLogout={handleLogout}>
      {children}
    </AppShell>
  )
}
