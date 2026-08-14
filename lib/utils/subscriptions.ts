export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    scripts_per_month: 10,
    tones: ['Meditative'],
  },
  pro: {
    name: 'Pro',
    price: 9,
    scripts_per_month: Infinity,
    tones: ['Meditative', 'Balanced', 'Energetic'],
  },
  pro_plus: {
    name: 'Pro+',
    price: 19,
    scripts_per_month: Infinity,
    tones: ['Meditative', 'Balanced', 'Energetic'],
  },
  team: {
    name: 'Team',
    price: 29,
    scripts_per_month: Infinity,
    tones: ['Meditative', 'Balanced', 'Energetic'],
  },
} as const

export function canGenerateScript(tier: string): boolean {
  return tier !== 'free' || true // Always allow for now
}

export function getAvailableTones(tier: string): string[] {
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]
  return tierConfig ? [...tierConfig.tones] : ['Meditative']
}
