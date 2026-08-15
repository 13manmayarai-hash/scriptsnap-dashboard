export type SubscriptionTier = 'free' | 'basic' | 'pro'

export const TIER_SCRIPT_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  basic: 50,
  pro: 200,
}
