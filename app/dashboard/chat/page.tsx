'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch('/api/chat', { credentials: 'same-origin' })
        const data = await res.json()
        setMessages(data.messages || [])
      } catch {
        setError('Could not load chat history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setError('')
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content: text, created_at: new Date().toISOString() }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send message')
        return
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, created_at: new Date().toISOString() }])
    } catch {
      setError('Failed to send message — try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return <LoadingState message="Loading chat…" />
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle size={20} aria-hidden="true" className="text-sage" />
        <div>
          <h1 className="text-xl font-bold heading-serif">Ask AI</h1>
          <p className="text-xs text-ink-muted">Brainstorm ideas, refine hooks, get YouTube Shorts strategy help</p>
        </div>
      </div>

      <div ref={scrollRef} className="card mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <Sparkles size={28} aria-hidden="true" className="mb-3 text-sage" />
            <p className="text-sm text-ink-muted">
              Ask about video hooks, pacing, what to make next, or paste a script for feedback.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-sage text-white' : 'bg-warm-surface-alt text-ink'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-warm-surface-alt px-4 py-2.5 text-sm text-ink-muted">
              <Loader2 size={14} aria-hidden="true" className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage className="mb-3">{error}</ErrorMessage>}

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your next script…"
          rows={1}
          className="input flex-1 resize-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="btn-primary flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
