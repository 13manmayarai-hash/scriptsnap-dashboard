'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TIER_NAMES, TIER_SCRIPT_LIMITS, TIER_BENEFITS, type SubscriptionTier } from '@/lib/tiers'
import { CreditCard, Check } from 'lucide-react'
import LoadingState from '@/lib/components/ui/LoadingState'

interface BillingInfo {
  subscription_tier: SubscriptionTier
  scripts_generated_month: number
  next_billing_date: string | null
  razorpay_payment_id: string | null
}

export default function BillingPage() {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('subscription_tier, scripts_generated_month, next_billing_date, razorpay_payment_id')
        .eq('id', user.id)
        .single()
      if (data) setInfo(data as BillingInfo)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <LoadingState message="Loading billing info…" />
  }

  const tier = info?.subscription_tier || 'free'
  const used = info?.scripts_generated_month || 0
  const limit = TIER_SCRIPT_LIMITS[tier]
  const usagePct = Math.min(100, Math.round((used / limit) * 100))

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <CreditCard size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Usage &amp; Billing</h1>
      </div>
      <p className="text-ink-muted text-sm mb-6">
        Your current plan, this month's usage, and where to change it.
      </p>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-ink-muted uppercase tracking-wide">Current plan</p>
            <p className="text-2xl font-bold text-ink">{TIER_NAMES[tier]}</p>
          </div>
          <Link href="/pricing" className="btn-secondary text-sm">
            {tier === 'pro' ? 'Manage plan' : 'Upgrade'}
          </Link>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-ink-muted">Scripts used this month</span>
            <span className="text-ink font-medium">{used} / {limit}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-ink/10 overflow-hidden">
            <div className="h-full bg-sage rounded-full" style={{ width: `${usagePct}%` }} />
          </div>
        </div>

        {info?.next_billing_date && (
          <p className="text-sm text-ink-muted mt-4">
            Next billing date: <span className="text-ink font-medium">{new Date(info.next_billing_date).toLocaleDateString()}</span>
          </p>
        )}
        {info?.razorpay_payment_id && (
          <p className="text-xs text-ink-muted/70 mt-2 font-mono">
            Last payment ref: {info.razorpay_payment_id}
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">WHAT'S INCLUDED IN {TIER_NAMES[tier].toUpperCase()}</h2>
        <ul className="space-y-2">
          {TIER_BENEFITS[tier].map((benefit, i) => (
            <li key={i} className="flex gap-2 text-ink text-sm">
              <Check size={16} aria-hidden="true" className="text-sage flex-shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
