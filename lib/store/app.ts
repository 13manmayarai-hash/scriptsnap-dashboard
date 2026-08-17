import { create } from 'zustand'
import type { SubscriptionTier } from '@/lib/tiers'

export interface User {
  id: string
  email: string
  subscription_tier: SubscriptionTier
  scripts_generated_month: number
}

export interface TopbarAction {
  label: string
  href?: string
  onClick?: () => void
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  scripts: any[]
  setScripts: (scripts: any[]) => void
  topbarAction: TopbarAction | null
  setTopbarAction: (action: TopbarAction | null) => void
  topbarSaveState: string | null
  setTopbarSaveState: (state: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  scripts: [],
  setScripts: (scripts) => set({ scripts }),
  topbarAction: null,
  setTopbarAction: (topbarAction) => set({ topbarAction }),
  topbarSaveState: null,
  setTopbarSaveState: (topbarSaveState) => set({ topbarSaveState }),
}))
