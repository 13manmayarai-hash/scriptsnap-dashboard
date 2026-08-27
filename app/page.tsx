'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/lib/components/landing/Navbar'
import Hero from '@/lib/components/landing/Hero'
import ProductPreview from '@/lib/components/landing/ProductPreview'
import Benefits from '@/lib/components/landing/Benefits'
import HowItWorks from '@/lib/components/landing/HowItWorks'
import VoiceComparison from '@/lib/components/landing/VoiceComparison'
import SocialProof from '@/lib/components/landing/SocialProof'
import Pricing from '@/lib/components/landing/Pricing'
import FinalCta from '@/lib/components/landing/FinalCta'
import Footer from '@/lib/components/landing/Footer'

// Logged-in visitors don't belong on the marketing page — send them
// straight to the app. Anonymous visitors see the landing page below.
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

  return <LandingPage />
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-bg text-ink" style={{ colorScheme: 'light' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-sage focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <div className="mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12">
          <ProductPreview />
        </div>
        <Benefits />
        <HowItWorks />
        <VoiceComparison />
        <SocialProof />
        <Pricing />
        <FinalCta />
      </main>

      <Footer />
    </div>
  )
}
