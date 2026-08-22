'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tags, Plus, Trash2, Loader2 } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'

interface Category {
  id: string
  name: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('categories')
        .insert({ user_id: user.id, name: name.trim() })

      if (insertError) throw insertError

      setName('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return
    const supabase = createClient()
    await supabase.from('categories').delete().eq('id', id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) {
    return <LoadingState message="Loading categories…" />
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Tags size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Categories</h1>
      </div>
      <p className="text-ink-muted text-sm mb-6">
        Categories show up in the generate form and help hashtags match your kind of video.
      </p>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-3">ADD A CATEGORY</h2>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Travel & Adventure"
            className="input"
            disabled={saving}
            required
            aria-label="New category name"
          />
          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-2 px-6 flex-shrink-0">
            {saving ? <Loader2 size={18} aria-hidden="true" className="animate-spin" /> : <Plus size={18} aria-hidden="true" />}
            {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
        {error && (
          <ErrorMessage className="mt-3">{error}</ErrorMessage>
        )}
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="card flex items-center justify-between py-3">
            <p className="font-medium text-ink">{cat.name}</p>
            <button
              onClick={() => handleDelete(cat.id)}
              className="flex-shrink-0 p-2 bg-ink/5 hover:bg-ink/10 rounded transition-colors text-error"
              aria-label={`Delete ${cat.name}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-ink-muted text-sm">No categories yet — add one above.</p>
        )}
      </div>
    </div>
  )
}
