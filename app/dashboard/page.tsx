'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/app'
import { TIER_SCRIPT_LIMITS, TIER_NAMES, TIER_BENEFITS } from '@/lib/tiers'
import { LANGUAGES } from '@/lib/languages'
import { Sparkles, Copy, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react'

interface GuidelineFlag {
  severity: 'info' | 'warning'
  note: string
}

interface GeneratedScript {
  id: string
  topic: string
  duration: number
  category: string
  tone: string
  language: string
  context: string
  keywords: string[]
  script: string
  title: string
  description: string
  hashtags: string[]
  pinned_comment: string
  alternativeTitles: Array<{ style: string; title: string }>
  keyPoints: string[]
  word_count: number
  created_at: string
  is_series: boolean
  guidelineCheck?: { passed: boolean; flags: GuidelineFlag[] }
}

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

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const { user, setUser } = useAppStore()
  const searchParams = useSearchParams()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(
    searchParams.get('payment') === 'success'
  )
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(30)
  const [categories, setCategories] = useState<Category[]>(
    DEFAULT_CATEGORIES.map((name) => ({ id: name, name }))
  )
  const [category, setCategory] = useState('Cultural & Historical')
  const [tonePresets, setTonePresets] = useState<TonePreset[]>(DEFAULT_TONES)
  const [toneId, setToneId] = useState(DEFAULT_TONES[0].id)
  const [language, setLanguage] = useState('english')
  const [context, setContext] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState<GeneratedScript | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

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
      }
      if (cats && cats.length > 0) {
        setCategories(cats)
        setCategory(cats[0].name)
      }
    }

    loadPersonalization()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Parse keywords from textarea
      const keywordList = keywords
        .split(/[,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)

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
      setScript(data)

      if (user) {
        setUser({ ...user, scripts_generated_month: user.scripts_generated_month + 1 })
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate script')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const tier = user?.subscription_tier || 'free'

  return (
    <div>
      {showPaymentSuccess && (
        <div className="card mb-6 border border-sage/40 bg-sage/5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-sage/20 text-sage">
                <Check size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink mb-1">
                  Thank you! You're now on the {TIER_NAMES[tier]} plan
                </h3>
                <p className="text-ink-muted text-sm mb-3">
                  Here's what you get with {TIER_NAMES[tier]}:
                </p>
                <ul className="space-y-1.5">
                  {TIER_BENEFITS[tier].map((benefit, i) => (
                    <li key={i} className="flex gap-2 text-ink text-sm">
                      <Check size={16} aria-hidden="true" className="text-sage flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="flex-shrink-0 p-1.5 bg-ink/5 hover:bg-ink/10 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="card sticky top-6">
          <h2 className="text-2xl font-bold heading-serif mb-6">
            🎬 Generate Script
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Topic */}
            <div>
              <label htmlFor="script-topic" className="block text-sm font-medium mb-2">Topic *</label>
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
              <p className="text-xs text-ink-muted/70 mt-1">What's your video about?</p>
            </div>

            {/* Context */}
            <div>
              <label htmlFor="script-context" className="block text-sm font-medium mb-2">Extra Context (optional)</label>
              <textarea
                id="script-context"
                name="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe what's happening in the footage, any specific details you want included…"
                className="input h-24 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-ink-muted/70 mt-1">Make the script more personalized</p>
            </div>

            {/* Keywords */}
            <div>
              <label htmlFor="script-keywords" className="block text-sm font-medium mb-2">Keywords or Phrases (optional)</label>
              <textarea
                id="script-keywords"
                name="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. 'sustainable', 'handmade', 'ancient technique' — one per line or comma-separated"
                className="input h-20 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-ink-muted/70 mt-1">Specific details to include</p>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="script-duration" className="block text-sm font-medium mb-2">
                Duration: {duration}s
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
              <p className="text-xs text-ink-muted/70 mt-1">15-90 seconds</p>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="script-category" className="block text-sm font-medium">Category</label>
                <Link href="/dashboard/categories" className="text-xs text-sage hover:underline">Manage</Link>
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
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="script-language" className="block text-sm font-medium mb-2">Output Language</label>
              <select
                id="script-language"
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
                disabled={loading}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="block text-sm font-medium" id="tone-label">Tone</span>
                <Link href="/dashboard/tone-presets" className="text-xs text-sage hover:underline">Manage</Link>
              </div>
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
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors truncate ${
                      toneId === t.id
                        ? 'bg-sage text-white'
                        : 'bg-ink/5 text-ink hover:bg-ink/10'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading || !topic}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} aria-hidden="true" />
              {loading ? 'Generating…' : 'Generate Script'}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3" aria-live="polite">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </form>

          {/* Tier Info */}
          <div className="mt-6 pt-6 border-t border-warm-border">
            <p className="text-xs text-ink-muted">
              <span className="font-semibold capitalize">{user?.subscription_tier || 'free'}</span> plan: {user?.scripts_generated_month || 0} / {TIER_SCRIPT_LIMITS[user?.subscription_tier || 'free']} used this month
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2">
        {script ? (
          <div className="space-y-4">
            {/* Guideline Check */}
            {script.guidelineCheck && (
              <div
                className={`card flex items-start gap-3 ${
                  script.guidelineCheck.passed
                    ? 'border-sage/40 bg-sage/5'
                    : 'border-amber-400/50 bg-amber-50'
                }`}
              >
                {script.guidelineCheck.passed ? (
                  <ShieldCheck size={20} aria-hidden="true" className="text-sage flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert size={20} aria-hidden="true" className="text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {script.guidelineCheck.passed
                      ? 'No policy risks flagged'
                      : 'Worth a second look before posting'}
                  </p>
                  {script.guidelineCheck.flags.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {script.guidelineCheck.flags.map((flag, i) => (
                        <li key={i} className="text-sm text-ink-muted">
                          {flag.note}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Main Title */}
            <div className="card">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold heading-serif mb-3">
                    {script.title}
                  </h1>
                  <p className="text-ink-muted text-sm">
                    {script.duration}s • {script.category} • {script.tone}
                    {script.language && script.language !== 'english' && (
                      <> • {LANGUAGES.find((l) => l.key === script.language)?.label || script.language}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(script.title, 'main-title')}
                  className="flex-shrink-0 p-2 bg-ink/5 hover:bg-ink/10 rounded transition-colors"
                  aria-label="Copy title"
                >
                  <Copy size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Script */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">SCRIPT ({script.word_count} words)</h3>
              <div className="bg-warm-surface-alt border border-warm-border rounded-lg p-4 mb-4">
                <p className="text-ink whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {script.script}
                </p>
              </div>
              <button
                onClick={() => handleCopy(script.script, 'script')}
                className={`btn-secondary text-sm w-full ${
                  copied === 'script' ? 'bg-green-500/20' : ''
                }`}
              >
                {copied === 'script' ? '✓ Copied!' : 'Copy Script'}
              </button>
            </div>

            {/* Key Points */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">KEY POINTS</h3>
              <ul className="space-y-2">
                {script.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-ink text-sm">
                    <span className="text-sage font-bold flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description & SEO */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">
                DESCRIPTION
              </h3>
              <p className="text-ink text-sm mb-4 leading-relaxed whitespace-pre-wrap">
                {script.description}
              </p>
              <button
                onClick={() => handleCopy(script.description, 'description')}
                className={`btn-secondary text-sm w-full ${
                  copied === 'description' ? 'bg-green-500/20' : ''
                }`}
              >
                {copied === 'description' ? '✓ Copied!' : 'Copy Description'}
              </button>
            </div>

            {/* Hashtags */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">HASHTAGS</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {script.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-block bg-sage/20 text-sage px-3 py-1 rounded text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleCopy(script.hashtags.join(' '), 'hashtags')}
                  className={`btn-secondary text-sm w-full ${
                    copied === 'hashtags' ? 'bg-green-500/20' : ''
                  }`}
                >
                  {copied === 'hashtags' ? '✓ Copied!' : 'Copy Hashtags'}
                </button>
              </div>
            </div>

            {/* Pinned Comment */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">
                PINNED COMMENT
              </h3>
              <p className="text-ink text-sm mb-4 italic">
                "{script.pinned_comment}"
              </p>
              <button
                onClick={() => handleCopy(script.pinned_comment, 'pinned')}
                className={`btn-secondary text-sm w-full ${
                  copied === 'pinned' ? 'bg-green-500/20' : ''
                }`}
              >
                {copied === 'pinned' ? '✓ Copied!' : 'Copy Pinned Comment'}
              </button>
            </div>

            {/* Alternative Titles */}
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-muted mb-3">
                10 TITLE VARIATIONS
              </h3>
              <div className="space-y-2">
                {script.alternativeTitles.map((alt, i) => (
                  <div
                    key={i}
                    className="p-3 bg-warm-surface-alt border border-warm-border rounded-lg flex justify-between items-start gap-3"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-ink-muted font-semibold mb-1">
                        {alt.style}
                      </p>
                      <p className="text-ink text-sm">{alt.title}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(alt.title, `alt-${i}`)}
                      className="flex-shrink-0 p-2 bg-ink/5 hover:bg-ink/10 rounded transition-colors"
                      aria-label={`Copy title: ${alt.title}`}
                    >
                      <Copy size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="card">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-ink-muted text-xs">WORD COUNT</p>
                  <p className="text-ink text-lg font-bold">
                    {script.word_count}
                  </p>
                </div>
                <div>
                  <p className="text-ink-muted text-xs">DURATION</p>
                  <p className="text-ink text-lg font-bold">{script.duration}s</p>
                </div>
                <div>
                  <p className="text-ink-muted text-xs">SERIES</p>
                  <p className="text-ink text-lg font-bold">
                    {script.is_series ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-20">
            <Sparkles size={48} className="mx-auto text-sage/50 mb-4" />
            <h3 className="text-xl font-semibold text-ink mb-2">
              No Script Generated Yet
            </h3>
            <p className="text-ink-muted">
              Fill out the form and click "Generate Script" to get started! ✨
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
