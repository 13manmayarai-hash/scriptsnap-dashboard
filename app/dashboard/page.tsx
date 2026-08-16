'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/lib/store/app'
import { TIER_SCRIPT_LIMITS, TIER_NAMES, TIER_BENEFITS } from '@/lib/tiers'
import { Sparkles, Copy, Check, X } from 'lucide-react'

interface GeneratedScript {
  id: string
  topic: string
  duration: number
  category: string
  tone: string
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
}

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
  const [category, setCategory] = useState('Cultural & Historical')
  const [tone, setTone] = useState('Meditative')
  const [context, setContext] = useState('')
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState<GeneratedScript | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

  const categories = [
    'Cultural & Historical',
    'Art & Design',
    'Science & Nature',
    'Fashion & Style',
    'Food & Craft',
    'Tech & Engineering',
  ]

  const tones = ['Meditative', 'Balanced', 'Energetic']

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

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          topic,
          duration,
          category,
          tone,
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

      if (typeof window !== 'undefined') {
        const scripts = JSON.parse(localStorage.getItem('scriptsnap_scripts') || '[]')
        scripts.unshift(data)
        localStorage.setItem('scriptsnap_scripts', JSON.stringify(scripts))
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
        <div className="card mb-6 border border-brand-yellow/40 bg-brand-yellow/5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-full bg-brand-yellow/20 text-brand-yellow">
                <Check size={18} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Thank you! You're now on the {TIER_NAMES[tier]} plan
                </h3>
                <p className="text-white/60 text-sm mb-3">
                  Here's what you get with {TIER_NAMES[tier]}:
                </p>
                <ul className="space-y-1.5">
                  {TIER_BENEFITS[tier].map((benefit, i) => (
                    <li key={i} className="flex gap-2 text-white text-sm">
                      <Check size={16} aria-hidden="true" className="text-brand-yellow flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="flex-shrink-0 p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors"
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
          <h2 className="text-2xl font-bold text-gradient mb-6">
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
              <p className="text-xs text-white/40 mt-1">What's your video about?</p>
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
              <p className="text-xs text-white/40 mt-1">Make the script more personalized</p>
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
              <p className="text-xs text-white/40 mt-1">Specific details to include</p>
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
              <p className="text-xs text-white/40 mt-1">15-90 seconds</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="script-category" className="block text-sm font-medium mb-2">Category</label>
              <select
                id="script-category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                disabled={loading}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <span className="block text-sm font-medium mb-2" id="tone-label">Tone</span>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="tone-label">
                {tones.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tone === t}
                    onClick={() => setTone(t)}
                    disabled={loading}
                    className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                      tone === t
                        ? 'bg-brand-yellow text-brand-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {t}
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
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-white/60">
              <span className="font-semibold capitalize">{user?.subscription_tier || 'free'}</span> plan: {user?.scripts_generated_month || 0} / {TIER_SCRIPT_LIMITS[user?.subscription_tier || 'free']} used this month
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2">
        {script ? (
          <div className="space-y-4">
            {/* Main Title */}
            <div className="card">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-3">
                    {script.title}
                  </h1>
                  <p className="text-white/60 text-sm">
                    {script.duration}s • {script.category} • {script.tone}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(script.title, 'main-title')}
                  className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
                  aria-label="Copy title"
                >
                  <Copy size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Script */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3">SCRIPT ({script.word_count} words)</h3>
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-4">
                <p className="text-white whitespace-pre-wrap font-mono text-sm leading-relaxed">
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
              <h3 className="text-sm font-semibold text-white/60 mb-3">KEY POINTS</h3>
              <ul className="space-y-2">
                {script.keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-white text-sm">
                    <span className="text-brand-yellow font-bold flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description & SEO */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-3">
                DESCRIPTION
              </h3>
              <p className="text-white text-sm mb-4 leading-relaxed whitespace-pre-wrap">
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
              <h3 className="text-sm font-semibold text-white/60 mb-3">HASHTAGS</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {script.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-block bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded text-sm font-medium"
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
              <h3 className="text-sm font-semibold text-white/60 mb-3">
                PINNED COMMENT
              </h3>
              <p className="text-white text-sm mb-4 italic">
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
              <h3 className="text-sm font-semibold text-white/60 mb-3">
                10 TITLE VARIATIONS
              </h3>
              <div className="space-y-2">
                {script.alternativeTitles.map((alt, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white/5 border border-white/10 rounded-lg flex justify-between items-start gap-3"
                  >
                    <div className="flex-1">
                      <p className="text-xs text-white/50 font-semibold mb-1">
                        {alt.style}
                      </p>
                      <p className="text-white text-sm">{alt.title}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(alt.title, `alt-${i}`)}
                      className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded transition-colors"
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
                  <p className="text-white/60 text-xs">WORD COUNT</p>
                  <p className="text-white text-lg font-bold">
                    {script.word_count}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">DURATION</p>
                  <p className="text-white text-lg font-bold">{script.duration}s</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">SERIES</p>
                  <p className="text-white text-lg font-bold">
                    {script.is_series ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-20">
            <Sparkles size={48} className="mx-auto text-brand-yellow/50 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Script Generated Yet
            </h3>
            <p className="text-white/60">
              Fill out the form and click "Generate Script" to get started! ✨
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
