export type SubscriptionTier = 'free' | 'basic' | 'pro'

import type { SupabaseClient } from '@supabase/supabase-js'

// Every route that gates on tier should call this instead of reading
// users.subscription_tier directly. Wraps the get_effective_tier RPC,
// which lazily downgrades to 'free' if next_billing_date has passed --
// the same self-healing pattern increment_script_usage already uses for
// the monthly usage counter, since this app creates one-time Razorpay
// orders (not real Razorpay Subscription objects), so there is no
// webhook that ever fires to downgrade a lapsed payment on its own.
// Falls back to 'free' on any RPC error -- fail closed, never grant paid
// access on an error.
export async function getEffectiveTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const { data, error } = await supabase.rpc('get_effective_tier', { p_user_id: userId })
  if (error || !data) return 'free'
  return (data as SubscriptionTier) in TIER_SCRIPT_LIMITS ? (data as SubscriptionTier) : 'free'
}

export const TIER_SCRIPT_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 50,
  pro: 200,
}

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
}

export const TIER_BENEFITS: Record<SubscriptionTier, string[]> = {
  free: ['5 scripts/month', 'Basic personalization', 'Community support'],
  basic: [
    '50 scripts/month',
    'Full AI personalization',
    'Context & keywords support',
    'Export to PDF',
    'Script history',
    'Email support',
  ],
  pro: [
    '200 scripts/month',
    'All Basic features',
    'YouTube channel analytics',
    'Trending keywords',
    'Priority support',
  ],
}
