'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Wand2,
} from 'lucide-react'

interface ChatMessage {
  id: string | null
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ChatUsage {
  freeUsed: number
  freeLimit: number
  scriptsUsed: number
  scriptLimit: number
}

interface TonePreset {
  id: string
  name: string
  style_description: string
}

const STARTER_PROMPTS = [
  'Give me a video idea',
  'Critique my last hook',
  "What's working on my channel?",
]

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const scriptId = searchParams.get('scriptId') || undefined

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [scriptTitle, setScriptTitle] = useState<string | null>(null)
  const [usage, setUsage] = useState<ChatUsage | null>(null)
  const [clearing, setClearing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [savedIndex, setSavedIndex] = useState<number | null>(null)
  const [tonePresets, setTonePresets] = useState<TonePreset[]>([])
  const [tonePresetId, setTonePresetId] = useState('')
  const [ratings, setRatings] = useState<Record<string, 1 | -1>>({})
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
        const [chatRes, scriptResult, { data: presets }] = await Promise.all([
          fetch('/api/chat', { credentials: 'same-origin' }),
          scriptId
            ? supabase.from('scripts').select('title').eq('id', scriptId).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from('tone_presets')
            .select('id, name, style_description')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
        ])
        const data = await chatRes.json()
        const loadedMessages: ChatMessage[] = data.messages || []
        setMessages(loadedMessages)
        if (data.usage) setUsage(data.usage)
        if (scriptResult?.data?.title) setScriptTitle(scriptResult.data.title)
        if (presets) setTonePresets(presets)

        const assistantIds = loadedMessages
          .filter((m) => m.role === 'assistant' && m.id)
          .map((m) => m.id as string)
        if (assistantIds.length > 0) {
          const { data: ratingRows } = await supabase
            .from('chat_message_ratings')
            .select('chat_message_id, rating')
            .eq('user_id', user.id)
            .in('chat_message_id', assistantIds)
          if (ratingRows) {
            const map: Record<string, 1 | -1> = {}
            for (const r of ratingRows) map[r.chat_message_id] = r.rating
            setRatings(map)
          }
        }
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

  const sendText = async (text: string) => {
    if (!text || sending) return

    setInput('')
    setError('')
    setSending(true)
    setMessages((prev) => [...prev, { id: null, role: 'user', content: text, created_at: new Date().toISOString() }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(scriptId ? { scriptId } : {}),
          ...(tonePresetId ? { tonePresetId } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send message')
        return
      }
      setMessages((prev) => [
        ...prev,
        { id: data.messageId ?? null, role: 'assistant', content: data.reply, created_at: new Date().toISOString() },
      ])
      if (data.usage) setUsage(data.usage)
    } catch {
      setError('Failed to send message — try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  const handleSend = () => sendText(input.trim())

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
      if (res.ok) {
        setMessages([])
        setRatings({})
      }
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

  const handleUseAsScript = (text: string) => {
    router.push(`/dashboard/new?topic=${encodeURIComponent(text)}`)
  }

  const handleRate = async (messageId: string, value: 1 | -1) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const next = ratings[messageId] === value ? null : value
    setRatings((prev) => {
      const copy = { ...prev }
      if (next === null) delete copy[messageId]
      else copy[messageId] = next
      return copy
    })

    if (next === null) {
      await supabase
        .from('chat_message_ratings')
        .delete()
        .eq('chat_message_id', messageId)
        .eq('user_id', user.id)
    } else {
      await supabase.from('chat_message_ratings').upsert(
        { chat_message_id: messageId, user_id: user.id, rating: next },
        { onConflict: 'chat_message_id,user_id' }
      )
    }
  }

  if (loading) {
    return <LoadingState message="Loading chat…" />
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sage/10">
            <Sparkles size={17} aria-hidden="true" className="text-sage" />
          </div>
          <div>
            <h1 className="text-xl font-bold heading-serif">Ask AI</h1>
            <p className="text-xs text-ink-muted">Brainstorm ideas, refine hooks, get YouTube Shorts strategy help</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-xs text-ink-faint transition-colors hover:bg-warm-surface-alt hover:text-error disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {scriptTitle && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">
            <MessageCircle size={12} aria-hidden="true" />
            Discussing: {scriptTitle}
          </div>
        )}
        {tonePresets.length > 0 && (
          <label className="inline-flex items-center gap-1.5 rounded-full border border-warm-border bg-warm-surface py-1 pl-3 pr-2 text-xs text-ink-muted">
            Voice
            <select
              value={tonePresetId}
              onChange={(e) => setTonePresetId(e.target.value)}
              aria-label="Tone for this conversation"
              className="bg-transparent text-ink focus-visible:outline-none"
            >
              <option value="">Default</option>
              {tonePresets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {usage && (
          <p className="text-[11px] text-ink-faint">
            {usage.freeUsed < usage.freeLimit
              ? `${usage.freeLimit - usage.freeUsed} free message${usage.freeLimit - usage.freeUsed === 1 ? '' : 's'} left this month`
              : `${usage.scriptsUsed} / ${usage.scriptLimit} scripts used this month`}
          </p>
        )}
      </div>

      <div ref={scrollRef} className="mb-4 flex-1 space-y-5 overflow-y-auto rounded-xl border border-warm-border bg-warm-surface p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sage/10">
              <Sparkles size={22} aria-hidden="true" className="text-sage" />
            </div>
            <p className="mb-5 max-w-xs text-sm text-ink-muted">
              Ask about video hooks, pacing, what to make next, or paste a script for feedback.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendText(prompt)}
                  className="rounded-full border border-warm-border bg-warm-surface-alt px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-sage/40 hover:text-ink"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id ?? i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage/10">
                <Sparkles size={13} aria-hidden="true" className="text-sage" />
              </div>
            )}
            <div className="max-w-[78%]">
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-sage text-white'
                    : 'rounded-tl-sm border border-warm-border bg-warm-surface-alt text-ink'
                }`}
              >
                {m.role === 'assistant' ? renderMarkdownLite(m.content) : m.content}
              </div>
              <div
                className={`mt-1 flex items-center gap-1 px-0.5 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <span className="mr-0.5 text-[10px] text-ink-faint">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
                {m.role === 'assistant' && (
                  <>
                    <button
                      onClick={() => handleCopy(m.content, i)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-warm-surface-alt hover:text-ink"
                      aria-label="Copy reply"
                    >
                      {copiedIndex === i ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                    </button>
                    <button
                      onClick={() => handleSaveAsIdea(m.content, i)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-warm-surface-alt hover:text-ink"
                      aria-label="Save as idea"
                    >
                      {savedIndex === i ? <Check size={13} aria-hidden="true" /> : <Lightbulb size={13} aria-hidden="true" />}
                    </button>
                    <button
                      onClick={() => handleUseAsScript(m.content)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-warm-surface-alt hover:text-ink"
                      aria-label="Use as script topic"
                    >
                      <Wand2 size={13} aria-hidden="true" />
                    </button>
                    {m.id && (
                      <>
                        <span className="mx-1 h-5 w-px bg-ink/10" aria-hidden="true" />
                        <button
                          onClick={() => handleRate(m.id as string, 1)}
                          aria-pressed={ratings[m.id] === 1}
                          aria-label="This reply was helpful"
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            ratings[m.id] === 1 ? 'bg-sage/10 text-sage' : 'text-ink-faint hover:bg-warm-surface-alt hover:text-ink'
                          }`}
                        >
                          <ThumbsUp size={13} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleRate(m.id as string, -1)}
                          aria-pressed={ratings[m.id] === -1}
                          aria-label="This reply wasn't helpful"
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                            ratings[m.id] === -1 ? 'bg-error/10 text-error' : 'text-ink-faint hover:bg-warm-surface-alt hover:text-ink'
                          }`}
                        >
                          <ThumbsDown size={13} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage/10">
              <Sparkles size={13} aria-hidden="true" className="text-sage" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-warm-border bg-warm-surface-alt px-4 py-2.5 text-sm text-ink-muted">
              <Loader2 size={14} aria-hidden="true" className="animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage className="mb-3">{error}</ErrorMessage>}

      <div className="flex items-end gap-2 rounded-xl border border-warm-border bg-warm-surface p-2 focus-within:border-sage">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your next script…"
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder-ink-faint focus-visible:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-sage text-white transition-colors hover:bg-sage-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-warm-bg disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
