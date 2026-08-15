import { create } from 'zustand'
import type { SubscriptionTier } from '@/lib/tiers'

export interface User {
  id: string
  email: string
  subscription_tier: SubscriptionTier
  scripts_generated_month: number
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  scripts: any[]
  setScripts: (scripts: any[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  scripts: [],
  setScripts: (scripts) => set({ scripts }),
}))
