'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/app'
import { createClient } from '@/lib/supabase/client'
import { canGenerateScript, getAvailableTones, getMonthlyLimit } from '@/lib/utils/subscriptions'
import { Sparkles, AlertCircle, Copy, Check } from 'lucide-react'

const CATEGORIES = [
  'Cultural & Historical',
  'Art & Design',
  'Science & Nature',
  'Fashion & Style',
  'Food & Craft',
  'Tech & Engineering',
]

const ALL_TONES = ['Meditative', 'Balanced', 'Energetic']

export default function DashboardPage() {
  const { user, setIsLoading, isLoading, error, setError, addScript } = useAppStore()
  const [formData, setFormData] = useState({
    topic: '',
    duration: 30,
    category: CATEGORIES[0],
    tone: 'Balanced',
    keywords: '',
    is_series: false,
  })
  const [result, setResult] = useState<any>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const availableTones = user ? getAvailableTones(user.subscription_tier) : ['Balanced']
  const monthlyLimit = user ? getMonthlyLimit(user.subscription_tier) : 10
  const canGenerate = user ? canGenerateScript(user.subscription_tier, user.scripts_generated_month) : false

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setError('Not authenticated')
        return
      }

      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k)

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authUser.id}`,
        },
        body: JSON.stringify({
          topic: formData.topic,
          duration: formData.duration,
          category: formData.category,
          tone: formData.tone,
          keywords,
          is_series: formData.is_series,
          tone_index: ALL_TONES.indexOf(formData.tone) + 1,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate script')
      }

      const data = await response.json()
      setResult(data.script)
      addScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="text-xl font-semibold mb-6">Generate Script</h2>

            {!canGenerate && monthlyLimit && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-500">Monthly limit reached</p>
                  <p className="text-xs text-red-500/80">Upgrade to Pro to generate more scripts</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Topic</label>
                <input
                  type="text"
                  placeholder="e.g., Japanese pottery techniques"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  disabled={isLoading || !canGenerate}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (sec)</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    disabled={isLoading || !canGenerate}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    disabled={isLoading || !canGenerate || availableTones.length === 1}
                    className="input"
                  >
                    {availableTones.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={isLoading || !canGenerate}
                  className="input"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Keywords (optional)</label>
                <input
                  type="text"
                  placeholder="comma, separated, keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  disabled={isLoading || !canGenerate}
                  className="input"
                />
              </div>

              {user?.subscription_tier !== 'free' && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_series}
                    onChange={(e) => setFormData({ ...formData, is_series: e.target.checked })}
                    disabled={isLoading || !canGenerate}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Part of a series?</span>
                </label>
              )}

              <button
                type="submit"
                disabled={isLoading || !canGenerate || !formData.topic}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                  canGenerate && !isLoading
                    ? 'btn-primary'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={18} />
                {isLoading ? 'Generating...' : 'Generate Script'}
              </button>
            </form>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="lg:col-span-2 space-y-6">
            {/* Script */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Script</h3>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{result.script}</p>
              <button
                onClick={() => copyToClipboard(result.script, 0)}
                className="mt-4 btn-secondary w-full flex items-center justify-center gap-2"
              >
                {copiedIndex === 0 ? <Check size={18} /> : <Copy size={18} />}
                {copiedIndex === 0 ? 'Copied!' : 'Copy Script'}
              </button>
            </div>

            {/* SEO Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <p className="text-xs text-white/60 mb-2">Title</p>
                <h4 className="font-semibold mb-3">{result.title}</h4>
                <button
                  onClick={() => copyToClipboard(result.title, 1)}
                  className="btn-secondary text-xs w-full py-2"
                >
                  {copiedIndex === 1 ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="card">
                <p className="text-xs text-white/60 mb-2">Description</p>
                <p className="text-sm mb-3 line-clamp-3">{result.description}</p>
                <button
                  onClick={() => copyToClipboard(result.description, 2)}
                  className="btn-secondary text-xs w-full py-2"
                >
                  {copiedIndex === 2 ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Hashtags & Pinned Comment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <p className="text-xs text-white/60 mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags?.map((tag: string, i: number) => (
                    <span key={i} className="bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card">
                <p className="text-xs text-white/60 mb-2">Pinned Comment</p>
                <p className="text-sm italic">&quot;{result.pinned_comment}&quot;</p>
              </div>
            </div>

            {/* Title Variations */}
            {result.alternativeTitles?.length > 0 && (
              <div className="card">
                <h4 className="font-semibold mb-4">10 Title Variations</h4>
                <div className="space-y-3">
                  {result.alternativeTitles.map((item: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-brand-yellow mb-1">{item.style}</p>
                      <p className="text-sm">{item.title}</p>
                      <button
                        onClick={() => copyToClipboard(item.title, 100 + i)}
                        className="mt-2 text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {copiedIndex === 100 + i ? <Check size={14} /> : <Copy size={14} />}
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
