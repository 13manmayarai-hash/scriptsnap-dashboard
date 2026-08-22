export type SubscriptionTier = 'free' | 'basic' | 'pro'

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
    'API access',
  ],
}
