'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, Plus, Trash2, Check, ArrowRight, Pencil } from 'lucide-react'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'

interface Idea {
  id: string
  text: string
  status: 'new' | 'used'
  created_at: string
}

export default function IdeasPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('ideas')
      .select('id, text, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('ideas')
        .insert({ user_id: user.id, text: text.trim() })
      if (insertError) throw insertError

      setText('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add idea')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUsed = async (idea: Idea) => {
    const nextStatus = idea.status === 'used' ? 'new' : 'used'
    const supabase = createClient()
    await supabase.from('ideas').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', idea.id)
    setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, status: nextStatus } : i)))
  }

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id)
    setEditingText(idea.text)
  }

  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return
    const supabase = createClient()
    await supabase.from('ideas').update({ text: editingText.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, text: editingText.trim() } : i)))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this idea?')) return
    const supabase = createClient()
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas((prev) => prev.filter((i) => i.id !== id))
  }

  const handleConvert = (idea: Idea) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(idea.text)}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-ink-muted">Loading ideas…</p>
      </div>
    )
  }

  const newIdeas = ideas.filter((i) => i.status === 'new')
  const usedIdeas = ideas.filter((i) => i.status === 'used')

  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <Lightbulb size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Ideas</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">Quick thoughts, parked until you're ready to turn them into a script.</p>

      <form onSubmit={handleAdd} className="card mb-6">
        <label htmlFor="idea-text" className="sr-only">New idea</label>
        <div className="flex gap-2">
          <input
            id="idea-text"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Why do cats knock things off tables?"
            className="input flex-1"
            disabled={saving}
          />
          <button type="submit" disabled={saving || !text.trim()} className="btn-primary flex items-center gap-1.5 px-4">
            <Plus size={16} aria-hidden="true" />
            Add
          </button>
        </div>
        {error && <ErrorMessage className="mt-3">{error}</ErrorMessage>}
      </form>

      {ideas.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-sm text-ink-muted">No ideas yet — jot one down above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {newIdeas.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">To explore</h2>
              <div className="space-y-2">
                {newIdeas.map((idea) => (
                  <div key={idea.id} className="card flex items-center gap-2 py-3">
                    {editingId === idea.id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(idea.id)}
                        onBlur={() => saveEdit(idea.id)}
                        autoFocus
                        className="input flex-1 py-1.5"
                      />
                    ) : (
                      <p className="flex-1 text-sm text-ink">{idea.text}</p>
                    )}
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => handleConvert(idea)}
                        className="flex min-h-[44px] items-center gap-1 rounded px-2 text-xs text-sage hover:bg-sage/10"
                      >
                        Convert <ArrowRight size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => startEdit(idea)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
                        aria-label={`Edit ${idea.text}`}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleToggleUsed(idea)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded hover:bg-warm-surface-alt"
                        aria-label={`Mark "${idea.text}" as used`}
                      >
                        <Check size={15} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-error hover:bg-error/10"
                        aria-label={`Delete ${idea.text}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {usedIdeas.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Used</h2>
              <div className="space-y-2">
                {usedIdeas.map((idea) => (
                  <div key={idea.id} className="card flex items-center gap-2 py-3 opacity-60">
                    <p className="flex-1 text-sm text-ink line-through">{idea.text}</p>
                    <button
                      onClick={() => handleToggleUsed(idea)}
                      className="flex-shrink-0 rounded px-2 py-1 text-xs text-ink-muted hover:underline"
                    >
                      Mark as new
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded text-error hover:bg-error/10"
                      aria-label={`Delete ${idea.text}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
