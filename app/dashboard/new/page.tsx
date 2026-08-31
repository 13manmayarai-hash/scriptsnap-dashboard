'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import { TIER_SCRIPT_LIMITS } from '@/lib/tiers'
import { LANGUAGES } from '@/lib/languages'
import { Sparkles, ChevronDown, Loader2, Wand2, X } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'

interface TonePreset {
  id: string
  name: string
  style_description: string
}

interface Category {
  id: string
  name: string
}

const DEFAULT_CATEGORIES = [
  'Cultural & Historical',
  'Art & Design',
  'Science & Nature',
  'Fashion & Style',
  'Food & Craft',
  'Tech & Engineering',
]

const DEFAULT_TONES: TonePreset[] = [
  { id: 'meditative', name: 'Meditative', style_description: 'Calming language, reflective questions, a sense of mindfulness.' },
  { id: 'balanced', name: 'Balanced', style_description: 'Informative and engaging without being extreme.' },
  { id: 'energetic', name: 'Energetic', style_description: 'Exclamation marks, building excitement, a sense of urgency.' },
]

export default function NewScriptPage() {
  return (
    <Suspense fallback={null}>
      <NewScriptForm />
    </Suspense>
  )
}

function NewScriptForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setUser } = useAppStore()
  const [topic, setTopic] = useState(searchParams.get('topic') || '')
  const [duration, setDuration] = useState(30)
  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_CATEGORIES.map((name) => ({ id: name, name }))
  )
  const [category, setCategory] = useState('Cultural & Historical')
  const [tonePresets, setTonePresets] = useState<TonePreset[]>(DEFAULT_TONES)
  const [toneId, setToneId] = useState(DEFAULT_TONES[0].id)
  const [language, setLanguage] = useState('english')
  const [context, setContext] = useState(searchParams.get('context') || '')
  const [keywords, setKeywords] = useState('')
  const [showMore, setShowMore] = useState(!!searchParams.get('context'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [hasCustomTonePresets, setHasCustomTonePresets] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [onboardingText, setOnboardingText] = useState('')
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [onboardingError, setOnboardingError] = useState('')
  const [onboardingSuccessName, setOnboardingSuccessName] = useState('')

  useEffect(() => {
    const loadPersonalization = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const [{ data: presets }, { data: cats }] = await Promise.all([
        supabase
          .from('tone_presets')
          .select('id, name, style_description')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: true }),
      ])

      if (presets && presets.length > 0) {
        setTonePresets(presets)
        setToneId(presets[0].id)
        setHasCustomTonePresets(true)
      }
      if (cats && cats.length > 0) {
        setCategories(cats)
        setCategory(cats[0].name)
      }
    }

    loadPersonalization()
  }, [])

  const isFirstRun = !hasCustomTonePresets && (user?.scripts_generated_month ?? 0) === 0
  const showOnboarding = isFirstRun && !onboardingDismissed && !onboardingSuccessName

  const handleAnalyzeVoice = async () => {
    if (!onboardingText.trim()) return
    setOnboardingLoading(true)
    setOnboardingError('')
    try {
      const res = await fetch('/api/tone-presets/derive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sampleText: onboardingText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not analyze your voice')

      setTonePresets([data.preset])
      setToneId(data.preset.id)
      setHasCustomTonePresets(true)
      setOnboardingSuccessName(data.preset.name)
    } catch (err) {
      setOnboardingError(err instanceof Error ? err.message : 'Could not analyze your voice')
    } finally {
      setOnboardingLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const keywordList = keywords
        .split(/[,\n]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0)

      const selectedTone = tonePresets.find((t) => t.id === toneId) || tonePresets[0]

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          topic,
          duration,
          category,
          tone: selectedTone.name,
          toneStyleDescription: selectedTone.style_description,
          language,
          context,
          keywords: keywordList,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to generate script')
      }

      const data = await response.json()

      if (user) {
        setUser({ ...user, scripts_generated_month: user.scripts_generated_month + 1 })
      }

      router.push(`/dashboard/scripts/${data.id}`)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate script')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold heading-serif">What are you making?</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Describe the topic and ScriptSnap writes a full script, title options, description, hashtags, and a pinned comment.
      </p>

      {showOnboarding && (
        <div className="card mb-6 border-sage/40 bg-sage/5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wand2 size={17} aria-hidden="true" className="text-sage" />
              <h2 className="text-sm font-semibold text-ink">Sound like you from the first script</h2>
            </div>
            <button
              onClick={() => setOnboardingDismissed(true)}
              className="flex min-h-[32px] min-w-[32px] flex-shrink-0 items-center justify-center rounded text-ink-muted hover:bg-ink/5"
              aria-label="Skip this"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="mb-3 text-sm text-ink-muted">
            Paste 2-3 of your past scripts, some captions, or just describe how you talk — we&apos;ll turn it into a tone preset instead of picking a generic default.
          </p>
          <label htmlFor="voice-sample" className="sr-only">Sample of your writing</label>
          <textarea
            id="voice-sample"
            value={onboardingText}
            onChange={(e) => setOnboardingText(e.target.value)}
            placeholder="e.g. paste a past script here…"
            className="input mb-3 h-24 resize-none"
            disabled={onboardingLoading}
          />
          {onboardingError && <ErrorMessage className="mb-3">{onboardingError}</ErrorMessage>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyzeVoice}
              disabled={onboardingLoading || !onboardingText.trim()}
              className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm"
            >
              {onboardingLoading && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
              {onboardingLoading ? 'Analyzing…' : 'Analyze my voice'}
            </button>
            <button
              type="button"
              onClick={() => setOnboardingDismissed(true)}
              className="text-sm text-ink-muted hover:underline"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {onboardingSuccessName && (
        <div className="card mb-6 flex items-center justify-between gap-3 border-sage/40 bg-sage/5">
          <p className="text-sm text-ink">
            ✓ Added <span className="font-semibold">&quot;{onboardingSuccessName}&quot;</span> as your tone — selected below.
          </p>
          <button
            onClick={() => setOnboardingSuccessName('')}
            className="flex min-h-[32px] min-w-[32px] flex-shrink-0 items-center justify-center rounded text-ink-muted hover:bg-ink/5"
            aria-label="Dismiss"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleGenerate} className="card space-y-5">
        <div>
          <label htmlFor="script-topic" className="mb-2 block text-sm font-medium">Topic</label>
          <input
            id="script-topic"
            name="topic"
            type="text"
            autoComplete="off"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Japanese pottery, Coffee roasting…"
            className="input"
            disabled={loading}
            required
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium" id="tone-label">Tone</span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="tone-label">
            {tonePresets.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={toneId === t.id}
                onClick={() => setToneId(t.id)}
                disabled={loading}
                title={t.style_description}
                className={`min-h-[44px] truncate rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  toneId === t.id ? 'bg-sage text-white' : 'bg-warm-surface-alt text-ink hover:bg-ink/5'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="script-duration" className="mb-2 block text-sm font-medium">
            Video length: {duration}s
          </label>
          <input
            id="script-duration"
            name="duration"
            type="range"
            min="15"
            max="90"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full"
            disabled={loading}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            aria-controls="more-options"
            className="flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
            />
            {showMore ? 'Hide options' : 'More options'}
          </button>

          {showMore && (
            <div id="more-options" className="mt-4 space-y-4">
              <div>
                <label htmlFor="script-context" className="mb-2 block text-sm font-medium">Tell ScriptSnap more (optional)</label>
                <textarea
                  id="script-context"
                  name="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe what's happening in the footage, any specific details you want included…"
                  className="input h-24 resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="script-keywords" className="mb-2 block text-sm font-medium">Keywords (optional)</label>
                <textarea
                  id="script-keywords"
                  name="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. 'sustainable', 'handmade', 'ancient technique' — one per line or comma-separated"
                  className="input h-20 resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="script-category" className="block text-sm font-medium">Category</label>
                  <Link href="/dashboard/settings" className="text-xs text-sage hover:underline">Manage</Link>
                </div>
                <select
                  id="script-category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="script-language" className="mb-2 block text-sm font-medium">Output language</label>
                <select
                  id="script-language"
                  name="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input"
                  disabled={loading}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !topic}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <Loader2 size={18} aria-hidden="true" className="animate-spin" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          {loading ? 'Generating…' : 'Generate Script'}
        </button>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <p className="text-center text-xs text-ink-muted">
          <span className="font-semibold capitalize">{user?.subscription_tier || 'free'}</span> plan:{' '}
          {user?.scripts_generated_month || 0} / {TIER_SCRIPT_LIMITS[user?.subscription_tier || 'free']} used this month
        </p>
      </form>
    </div>
  )
}
