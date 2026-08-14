import { create } from 'zustand'

export interface User {
  id: string
  email: string
  subscription_tier: 'free' | 'pro' | 'pro_plus' | 'team'
  scripts_generated_month: number
}

export interface Script {
  id: string
  topic: string
  duration: number
  category: string
  script: string
  title: string
  description: string
  hashtags: string[]
  pinned_comment: string
  alternative_titles: Array<{ style: string; title: string }>
  rating?: number
  word_count: number
  created_at: string
  is_series: boolean
  tone: string
}

interface AppStore {
  user: User | null
  setUser: (user: User | null) => void
  
  scripts: Script[]
  setScripts: (scripts: Script[]) => void
  addScript: (script: Script) => void
  removeScript: (id: string) => void
  
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  error: string | null
  setError: (error: string | null) => void
  
  selectedScript: Script | null
  setSelectedScript: (script: Script | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  scripts: [],
  setScripts: (scripts) => set({ scripts }),
  addScript: (script) => set((state) => ({ scripts: [script, ...state.scripts] })),
  removeScript: (id) => set((state) => ({ scripts: state.scripts.filter(s => s.id !== id) })),
  
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  error: null,
  setError: (error) => set({ error }),
  
  selectedScript: null,
  setSelectedScript: (selectedScript) => set({ selectedScript }),
}))
