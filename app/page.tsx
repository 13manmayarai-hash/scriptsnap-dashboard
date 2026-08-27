'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// The old marketing landing page and its components/images were removed
// for a full redesign — see chat history for the new reference. This is a
// placeholder until the new page is built.
//
// Logged-in visitors don't belong here — send them straight to the app.
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] px-6 text-center text-[#20201E]">
      <div>
        <h1 className="text-2xl font-semibold">ScriptSnap</h1>
        <p className="mt-2 text-[#706E68]">A new landing page is on the way.</p>
      </div>
    </div>
  )
}
