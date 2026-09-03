'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import { MessageCircle, Send, Loader2, Sparkles, Copy, Check, Trash2, Lightbulb } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// Minimal, dependency-free rendering for the light markdown replies tend to
// use (bold, inline code, bullet/numbered lists) — full markdown parsing
// would be overkill for short chat turns.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={`${keyPrefix}-${i}`} className="rounded bg-ink/10 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

function renderMarkdownLite(content: string) {
  const blocks = content.trim().split(/\n\s*\n/)
  return blocks.map((block, bi) => {
    const lines = block.split('\n').filter((l) => l.trim())
    const isBulletList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l.trim()))
    const isNumberedList = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l.trim()))

    if (isBulletList) {
      return (
        <ul key={bi} className={`list-disc space-y-1 pl-5 ${bi > 0 ? 'mt-2' : ''}`}>
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^[-*]\s+/, ''), `${bi}-${li}`)}</li>
          ))}
        </ul>
      )
    }
    if (isNumberedList) {
      return (
        <ol key={bi} className={`list-decimal space-y-1 pl-5 ${bi > 0 ? 'mt-2' : ''}`}>
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\d+\.\s+/, ''), `${bi}-${li}`)}</li>
          ))}
        </ol>
      )
    }
    return (
      <p key={bi} className={bi > 0 ? 'mt-2' : ''}>
        {renderInline(block, `${bi}`)}
      </p>
    )
  })
}

export default function ChatPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading chat…" />}>
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageInner() {
  const searchParams = useSearchParams()
  const scriptId = searchParams.get('scriptId') || undefined

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [scriptTitle, setScriptTitle] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [savedIndex, setSavedIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const [chatRes, scriptResult] = await Promise.all([
          fetch('/api/chat', { credentials: 'same-origin' }),
          scriptId
            ? supabase.from('scripts').select('title').eq('id', scriptId).maybeSingle()
            : Promise.resolve({ data: null }),
        ])
        const data = await chatRes.json()
        setMessages(data.messages || [])
        if (scriptResult?.data?.title) setScriptTitle(scriptResult.data.title)
      } catch {
        setError('Could not load chat history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [scriptId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

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
        body: JSON.stringify({ message: text, ...(scriptId ? { scriptId } : {}) }),
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

  const handleClear = async () => {
    if (!window.confirm('Clear this entire conversation? This cannot be undone.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/chat', { method: 'DELETE', credentials: 'same-origin' })
      if (res.ok) setMessages([])
    } catch {
      // Best-effort — leave existing messages visible on failure.
    } finally {
      setClearing(false)
    }
  }

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000)
    } catch {
      // Clipboard access can fail silently in some embedded browser contexts.
    }
  }

  const handleSaveAsIdea = async (text: string, index: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: insertError } = await supabase.from('ideas').insert({ user_id: user.id, text })
    if (!insertError) {
      setSavedIndex(index)
      setTimeout(() => setSavedIndex((prev) => (prev === index ? null : prev)), 2000)
    }
  }

  if (loading) {
    return <LoadingState message="Loading chat…" />
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} aria-hidden="true" className="text-sage" />
          <div>
            <h1 className="text-xl font-bold heading-serif">Ask AI</h1>
            <p className="text-xs text-ink-muted">Brainstorm ideas, refine hooks, get YouTube Shorts strategy help</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-ink-faint hover:bg-warm-surface-alt hover:text-error"
          >
            <Trash2 size={13} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      {scriptTitle && (
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">
          <MessageCircle size={12} aria-hidden="true" />
          Discussing: {scriptTitle}
        </div>
      )}

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
            <div className="max-w-[80%]">
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-sage text-white' : 'bg-warm-surface-alt text-ink'
                }`}
              >
                {m.role === 'assistant' ? renderMarkdownLite(m.content) : m.content}
              </div>
              <div
                className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-ink-faint ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <span>{new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                {m.role === 'assistant' && (
                  <>
                    <button onClick={() => handleCopy(m.content, i)} className="hover:text-ink" aria-label="Copy reply">
                      {copiedIndex === i ? <Check size={11} aria-hidden="true" /> : <Copy size={11} aria-hidden="true" />}
                    </button>
                    <button onClick={() => handleSaveAsIdea(m.content, i)} className="hover:text-ink" aria-label="Save as idea">
                      {savedIndex === i ? <Check size={11} aria-hidden="true" /> : <Lightbulb size={11} aria-hidden="true" />}
                    </button>
                  </>
                )}
              </div>
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
          ref={textareaRef}
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
