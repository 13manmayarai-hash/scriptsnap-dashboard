'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic2, Plus, Trash2 } from 'lucide-react'

interface TonePreset {
  id: string
  name: string
  style_description: string
}

export default function TonePresetsPage() {
  const [presets, setPresets] = useState<TonePreset[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('tone_presets')
      .select('id, name, style_description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setPresets(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !description.trim()) return
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('tone_presets')
        .insert({ user_id: user.id, name: name.trim(), style_description: description.trim() })

      if (insertError) throw insertError

      setName('')
      setDescription('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tone preset')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tone preset?')) return
    const supabase = createClient()
    await supabase.from('tone_presets').delete().eq('id', id)
    setPresets((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink-muted">Loading tone presets…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Mic2 size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Tone & Voice Presets</h1>
      </div>
      <p className="text-ink-muted text-sm mb-6">
        Tone presets shape how the generator writes — pick one when generating a script, or add your own.
      </p>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">ADD A PRESET</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Storytime"
              className="input"
              disabled={saving}
              required
            />
          </div>
          <div>
            <label htmlFor="preset-description" className="block text-sm font-medium mb-1">Style description</label>
            <textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Warm, narrative pacing, first-person anecdotes, a twist near the end"
              className="input h-20 resize-none"
              disabled={saving}
              required
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3" aria-live="polite">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6">
            <Plus size={18} aria-hidden="true" />
            {saving ? 'Adding…' : 'Add Preset'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {presets.map((preset) => (
          <div key={preset.id} className="card flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{preset.name}</p>
              <p className="text-sm text-ink-muted mt-1">{preset.style_description}</p>
            </div>
            <button
              onClick={() => handleDelete(preset.id)}
              className="flex-shrink-0 p-2 bg-ink/5 hover:bg-ink/10 rounded transition-colors text-red-600"
              aria-label={`Delete ${preset.name}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {presets.length === 0 && (
          <p className="text-ink-muted text-sm">No tone presets yet — add one above.</p>
        )}
      </div>
    </div>
  )
}
