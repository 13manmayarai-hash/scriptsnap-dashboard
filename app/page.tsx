'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/lib/components/marketing/Navbar'
import Hero from '@/lib/components/marketing/Hero'
import ProductPreview from '@/lib/components/marketing/ProductPreview'
import Benefits from '@/lib/components/marketing/Benefits'
import HowItWorks from '@/lib/components/marketing/HowItWorks'
import VoiceComparison from '@/lib/components/marketing/VoiceComparison'
import SocialProof from '@/lib/components/marketing/SocialProof'
import PricingTeaser from '@/lib/components/marketing/PricingTeaser'
import FinalCta from '@/lib/components/marketing/FinalCta'
import Footer from '@/lib/components/marketing/Footer'

// Moat, TrustFeatures, KitShowcase, and Comparison used to render here too
// (founder story, trust/guideline-check section, content-kit grid, and a
// vs-competitors table) — real, accurate content, just not part of the
// Frontend_0.1 reference layout this page now matches exactly. The
// components are untouched in lib/components/marketing/ if that content
// should come back in.

// Logged-in visitors don't belong on the marketing page — send them
// straight to the app. Anonymous visitors see the landing page below
// (previously "/" redirected everyone to /auth/login with no marketing
// page at all).
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
    <div className="min-h-screen bg-[#F7F5F0] text-[#20201E]" style={{ colorScheme: 'light' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-[#7A8B72] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <div className="mx-auto max-w-[1380px] px-6 lg:px-10">
          <ProductPreview />
        </div>
        <Benefits />
        <HowItWorks />
        <VoiceComparison />
        <SocialProof />
        <PricingTeaser />
        <FinalCta />
      </main>

      <Footer />
    </div>
  )
}
