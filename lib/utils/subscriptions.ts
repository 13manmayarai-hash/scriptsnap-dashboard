export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    scripts_per_month: 10,
    tones: ['Balanced'],
    series_toggle: false,
    export: false,
    analytics: false,
  },
  pro: {
    name: 'Pro',
    price: 9,
    scripts_per_month: null,
    tones: ['Meditative', 'Balanced', 'Energetic'],
    series_toggle: true,
    export: true,
    analytics: false,
  },
  pro_plus: {
    name: 'Pro+',
    price: 19,
    scripts_per_month: null,
    tones: ['Meditative', 'Balanced', 'Energetic'],
    series_toggle: true,
    export: true,
    analytics: true,
    priority: true,
  },
  team: {
    name: 'Team',
    price: 29,
    scripts_per_month: null,
    users: 3,
    tones: ['Meditative', 'Balanced', 'Energetic'],
    series_toggle: true,
    export: true,
    analytics: true,
    priority: true,
    custom_branding: true,
  },
} as const

export function canGenerateScript(tier: string, used: number): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]
  if (!tierConfig) return false
  if (!tierConfig.scripts_per_month) return true
  return used < tierConfig.scripts_per_month
}

export function getMonthlyLimit(tier: string): number | null {
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]
  return tierConfig?.scripts_per_month || null
}

export function getAvailableTones(tier: string): string[] {
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]
  return tierConfig?.tones ? [...tierConfig.tones] : ['Balanced']
}

export function getTierFeatures(tier: string) {
  return SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]
}
