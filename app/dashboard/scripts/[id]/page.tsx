'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LANGUAGES } from '@/lib/languages'
import { useAppStore } from '@/lib/store/app'
import ScriptRating from '@/lib/components/ScriptRating'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import VideoBreakdownPanel, { type DetailsState } from '@/lib/components/ui/VideoBreakdownPanel'
import VideoPlayerModal from '@/lib/components/ui/VideoPlayerModal'
import {
  ArrowLeft,
  Copy,
  Download,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  Scissors,
  Maximize2,
  Sparkles,
  Undo2,
  Loader2,
  Link2,
  Unlink,
  TrendingUp,
} from 'lucide-react'

interface Script {
  id: string
  topic: string
  category: string
  tone: string
  language: string
  duration: number
  script: string
  title: string
  description: string
  hashtags: string[]
  pinned_comment: string
  alternative_titles: Array<{ style: string; title: string }>
  key_points: string[]
  guideline_passed: boolean
  guideline_flags: Array<{ severity: string; note: string }>
  used_analytics_context: boolean
  analytics_strategy_note: string | null
  published_video_id: string | null
  created_at: string
}

interface Analysis {
  score: number
  tone: string
  audience: string
  readability: string
  hookStrength: string
  suggestions: string[]
}

type AiAction = 'rewrite' | 'shorten' | 'expand' | 'hook' | 'tone' | 'alternatives' | 'analyze'

const TONE_OPTIONS = ['Conversational', 'Energetic', 'Calm', 'Dramatic', 'Playful', 'Formal']

export default function ScriptWorkspacePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, setTopbarSaveState, setHasUnsavedChanges } = useAppStore()

  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [videoIdInput, setVideoIdInput] = useState('')
  const [linkingVideo, setLinkingVideo] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [videoDetailsState, setVideoDetailsState] = useState<DetailsState | null>(null)
  const [watchingVideo, setWatchingVideo] = useState(false)

  const [scriptText, setScriptText] = useState('')
  const savedTextRef = useRef('')
  const [previousText, setPreviousText] = useState<string | null>(null)

  const [aiLoading, setAiLoading] = useState<AiAction | null>(null)
  const [aiError, setAiError] = useState('')
  const [alternatives, setAlternatives] = useState<string[] | null>(null)
  const [showToneMenu, setShowToneMenu] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('scripts')
        .select(
          'id, topic, category, tone, language, duration, script, title, description, hashtags, pinned_comment, alternative_titles, key_points, guideline_passed, guideline_flags, used_analytics_context, analytics_strategy_note, published_video_id, created_at'
        )
        .eq('id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!data) {
        setNotFound(true)
      } else {
        setScript(data as Script)
        setScriptText(data.script)
        savedTextRef.current = data.script
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  useEffect(() => {
    return () => {
      setTopbarSaveState(null)
      setHasUnsavedChanges(false)
    }
  }, [setTopbarSaveState, setHasUnsavedChanges])

  // Autosave — debounced, so we're not writing on every keystroke.
  useEffect(() => {
    if (!script || scriptText === savedTextRef.current) return

    setTopbarSaveState('Unsaved changes')
    setHasUnsavedChanges(true)
    const timeout = setTimeout(async () => {
      setTopbarSaveState('Saving…')
      const supabase = createClient()
      const { error } = await supabase
        .from('scripts')
        .update({ script: scriptText, word_count: scriptText.trim().split(/\s+/).filter(Boolean).length })
        .eq('id', script.id)

      if (error) {
        setTopbarSaveState("Couldn't save")
      } else {
        savedTextRef.current = scriptText
        setTopbarSaveState('Saved ✓')
        setHasUnsavedChanges(false)
        setTimeout(() => setTopbarSaveState(null), 2000)
      }
    }, 1200)

    return () => clearTimeout(timeout)
  }, [scriptText, script, setTopbarSaveState, setHasUnsavedChanges])

  // Browser-level navigation (refresh, close tab, back button) doesn't go
  // through any of our own links, so it needs its own guard — a pending
  // autosave write can otherwise be silently discarded.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (scriptText !== savedTextRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [scriptText])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fetchVideoDetails = useCallback(async (videoId: string) => {
    setVideoDetailsState({ status: 'loading' })
    try {
      const params = new URLSearchParams({ videoId, source: 'own' })
      const res = await fetch(`/api/youtube/video-details?${params}`, { credentials: 'same-origin' })
      const data = await res.json()
      if (data.error) {
        setVideoDetailsState({ status: 'error', message: data.error })
      } else if (data.needsReconnect) {
        setVideoDetailsState({ status: 'error', message: 'Your YouTube access needs to be reconnected — see Settings.' })
      } else if (data.connected === false) {
        setVideoDetailsState({ status: 'error', message: 'Connect your YouTube channel in Settings to see real performance here.' })
      } else {
        setVideoDetailsState({ status: 'loaded', data })
      }
    } catch {
      setVideoDetailsState({ status: 'error', message: "Could not load this video's performance — try again in a moment." })
    }
  }, [])

  useEffect(() => {
    if (script?.published_video_id && user?.subscription_tier === 'pro') {
      fetchVideoDetails(script.published_video_id)
    }
    // Only re-run when the linked video itself changes, not on every
    // script/user object identity change from unrelated state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script?.published_video_id, user?.subscription_tier])

  // Accepts a bare 11-char video ID or a full watch/shorts/share URL.
  const parseYouTubeVideoId = (input: string): string | null => {
    const trimmed = input.trim()
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed
    try {
      const url = new URL(trimmed)
      if (url.hostname.includes('youtu.be')) return url.pathname.slice(1) || null
      const shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/)
      if (shortsMatch) return shortsMatch[1]
      const v = url.searchParams.get('v')
      if (v && /^[\w-]{11}$/.test(v)) return v
      return null
    } catch {
      return null
    }
  }

  const handleLinkVideo = async () => {
    if (!script) return
    const videoId = parseYouTubeVideoId(videoIdInput)
    if (!videoId) {
      setLinkError("Couldn't find a video ID in that — paste the full YouTube link or just the video ID.")
      return
    }
    setLinkError('')
    const supabase = createClient()
    const { error } = await supabase.from('scripts').update({ published_video_id: videoId }).eq('id', script.id)
    if (error) {
      setLinkError('Failed to link video — try again.')
      return
    }
    setScript({ ...script, published_video_id: videoId })
    setVideoIdInput('')
    setLinkingVideo(false)
    fetchVideoDetails(videoId)
  }

  const handleUnlinkVideo = async () => {
    if (!script) return
    const supabase = createClient()
    await supabase.from('scripts').update({ published_video_id: null }).eq('id', script.id)
    setScript({ ...script, published_video_id: null })
    setVideoDetailsState(null)
  }

  const runAiAction = useCallback(
    async (action: AiAction, tone?: string) => {
      if (!script) return
      setAiError('')
      setAiLoading(action)
      try {
        const response = await fetch(`/api/scripts/${script.id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action, text: scriptText, tone }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => null)
          throw new Error(err?.error || 'AI action failed')
        }
        const data = await response.json()

        if (action === 'alternatives') {
          setAlternatives(data.alternatives || [])
        } else if (action === 'analyze') {
          setAnalysis(data.analysis)
        } else {
          setPreviousText(scriptText)
          setScriptText(data.result)
        }
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI action failed')
      } finally {
        setAiLoading(null)
        setShowToneMenu(false)
      }
    },
    [script, scriptText]
  )

  const handleUndo = () => {
    if (previousText === null) return
    setScriptText(previousText)
    setPreviousText(null)
  }

  const useAlternative = (alt: string) => {
    setPreviousText(scriptText)
    // Replace the opening line/sentence with the chosen hook.
    const rest = scriptText.split(/\n/).slice(1).join('\n')
    setScriptText(rest ? `${alt}\n${rest}` : alt)
    setAlternatives(null)
  }

  const handleDownload = async () => {
    if (!script) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 48
    const maxWidth = pageWidth - margin * 2
    let y = margin

    const ensureSpace = (lineHeight: number) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
    }
    const writeParagraph = (text: string, fontSize: number, lineHeight: number, style: 'normal' | 'bold' = 'normal') => {
      doc.setFont('helvetica', style)
      doc.setFontSize(fontSize)
      const lines = doc.splitTextToSize(text, maxWidth) as string[]
      for (const line of lines) {
        ensureSpace(lineHeight)
        doc.text(line, margin, y)
        y += lineHeight
      }
    }

    writeParagraph(script.title, 18, 22, 'bold')
    y += 4
    writeParagraph(
      `${script.duration}s  •  ${script.category}  •  ${script.tone}  •  ${new Date(script.created_at).toLocaleDateString()}`,
      10,
      14
    )
    y += 14
    writeParagraph('SCRIPT', 11, 16, 'bold')
    writeParagraph(scriptText, 11, 15)
    y += 14
    writeParagraph('DESCRIPTION', 11, 16, 'bold')
    writeParagraph(script.description, 11, 15)

    doc.save(`${script.title.replace(/\s+/g, '_')}.pdf`)
  }

  const handleDelete = async () => {
    if (!script) return
    if (!window.confirm("Delete this script? This can't be undone.")) return
    const supabase = createClient()
    await supabase.from('scripts').delete().eq('id', script.id)
    router.push('/dashboard/library')
  }

  if (loading) {
    return <LoadingState message="Loading script…" />
  }

  if (notFound || !script) {
    return (
      <div className="card py-16 text-center">
        <h1 className="mb-2 text-xl font-bold heading-serif">Script not found</h1>
        <p className="mb-6 text-sm text-ink-muted">It may have been deleted, or the link is wrong.</p>
        <Link href="/dashboard/library" className="btn-primary inline-flex">Back to Scripts</Link>
      </div>
    )
  }

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0
  const charCount = scriptText.length

  const AI_BUTTONS: { action: AiAction; label: string; icon: typeof Wand2 }[] = [
    { action: 'rewrite', label: 'Rewrite', icon: Wand2 },
    { action: 'shorten', label: 'Shorten', icon: Scissors },
    { action: 'expand', label: 'Expand', icon: Maximize2 },
    { action: 'hook', label: 'Improve Hook', icon: Sparkles },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link
        href="/dashboard/library"
        onClick={(e) => {
          if (scriptText !== savedTextRef.current && !window.confirm('You have unsaved changes. Leave without saving?')) {
            e.preventDefault()
          }
        }}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Scripts
      </Link>

      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-3 text-3xl font-bold heading-serif">{script.title}</h1>
            <p className="text-sm text-ink-muted">
              {script.duration}s • {script.category} • {script.tone}
              {script.language && script.language !== 'english' && (
                <> • {LANGUAGES.find((l) => l.key === script.language)?.label || script.language}</>
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <ScriptRating scriptId={script.id} />
            <button
              onClick={() => handleCopy(script.title, 'main-title')}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded transition-colors hover:bg-warm-surface-alt"
              aria-label="Copy title"
            >
              <Copy size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Editor */}
        <div className="card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-muted">SCRIPT</h2>
            <p className="text-xs text-ink-faint">{wordCount} words • {charCount} characters</p>
          </div>

          <label htmlFor="script-editor" className="sr-only">Script content</label>
          <textarea
            id="script-editor"
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            className="input mb-3 h-64 resize-y font-mono text-sm leading-relaxed"
            spellCheck={true}
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {AI_BUTTONS.map(({ action, label, icon: Icon }) => (
              <button
                key={action}
                onClick={() => runAiAction(action)}
                disabled={aiLoading !== null || !scriptText.trim()}
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                {aiLoading === action ? (
                  <Loader2 size={14} aria-hidden="true" className="animate-spin" />
                ) : (
                  <Icon size={14} aria-hidden="true" />
                )}
                {label}
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowToneMenu((v) => !v)}
                disabled={aiLoading !== null || !scriptText.trim()}
                aria-haspopup="menu"
                aria-expanded={showToneMenu}
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                {aiLoading === 'tone' ? (
                  <Loader2 size={14} aria-hidden="true" className="animate-spin" />
                ) : (
                  <Wand2 size={14} aria-hidden="true" />
                )}
                Change Tone
              </button>
              {showToneMenu && (
                <div role="menu" className="absolute left-0 z-10 mt-1 w-40 rounded-lg border border-warm-border bg-warm-surface p-1 shadow-lg">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      role="menuitem"
                      onClick={() => runAiAction('tone', t)}
                      className="block min-h-[36px] w-full rounded px-3 text-left text-sm text-ink hover:bg-warm-surface-alt"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => runAiAction('alternatives')}
              disabled={aiLoading !== null || !scriptText.trim()}
              className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
            >
              {aiLoading === 'alternatives' ? (
                <Loader2 size={14} aria-hidden="true" className="animate-spin" />
              ) : (
                <Sparkles size={14} aria-hidden="true" />
              )}
              Alternatives
            </button>

            {previousText !== null && (
              <button
                onClick={handleUndo}
                className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                <Undo2 size={14} aria-hidden="true" />
                Undo last change
              </button>
            )}
          </div>

          {aiError && <ErrorMessage className="mb-3">{aiError}</ErrorMessage>}

          {alternatives && alternatives.length > 0 && (
            <div className="mb-3 space-y-2 rounded-lg border border-warm-border bg-warm-surface-alt p-3">
              <p className="text-xs font-semibold text-ink-muted">ALTERNATIVE OPENINGS</p>
              {alternatives.map((alt, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded border border-warm-border bg-warm-surface p-2">
                  <p className="flex-1 text-sm text-ink">{alt}</p>
                  <button onClick={() => useAlternative(alt)} className="btn-secondary flex-shrink-0 px-2 py-1 text-xs">
                    Use this
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => handleCopy(scriptText, 'script')}
              className={`btn-secondary flex-1 text-sm ${copied === 'script' ? 'bg-sage/10' : ''}`}
            >
              {copied === 'script' ? '✓ Copied!' : 'Copy Script'}
            </button>
            <button onClick={handleDownload} className="btn-secondary flex flex-1 items-center justify-center gap-2 text-sm">
              <Download size={15} aria-hidden="true" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Insights panel */}
        <div className="card h-fit">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-muted">INSIGHTS</h2>
            <button
              onClick={() => runAiAction('analyze')}
              disabled={aiLoading !== null || !scriptText.trim()}
              className="flex min-h-[32px] items-center gap-1 text-xs text-sage hover:underline disabled:opacity-50"
            >
              {aiLoading === 'analyze' ? <Loader2 size={12} aria-hidden="true" className="animate-spin" /> : null}
              {analysis ? 'Re-check' : 'Check script'}
            </button>
          </div>

          {!analysis ? (
            <p className="text-sm text-ink-muted">Run a check to see a score, tone read, and suggestions for this script.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-ink-muted">SCRIPT SCORE</p>
                <p className="font-serif text-3xl font-bold text-sage">{analysis.score}</p>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Tone</dt>
                  <dd className="text-right font-medium text-ink">{analysis.tone}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Audience</dt>
                  <dd className="text-right font-medium text-ink">{analysis.audience}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Readability</dt>
                  <dd className="text-right font-medium text-ink">{analysis.readability}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Hook strength</dt>
                  <dd className="text-right font-medium text-ink">{analysis.hookStrength}</dd>
                </div>
              </dl>
              {analysis.suggestions?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-ink-muted">SUGGESTIONS</p>
                  <ul className="space-y-1.5">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink">
                        <span className="flex-shrink-0 text-sage">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className={`card flex items-start gap-3 ${
          script.guideline_passed ? 'border-sage/40 bg-sage/5' : 'border-accent-ochre/40 bg-accent-ochre/10'
        }`}
      >
        {script.guideline_passed ? (
          <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-sage" />
        ) : (
          <ShieldAlert size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-accent-ochre" />
        )}
        <div>
          <p className="text-sm font-semibold text-ink">
            {script.guideline_passed ? 'No policy risks flagged' : 'Worth a second look before posting'}
          </p>
          {script.guideline_flags?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {script.guideline_flags.map((flag, i) => (
                <li key={i} className="text-sm text-ink-muted">{flag.note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {script.used_analytics_context && (
        <div className="card flex items-start gap-3 border-sage/40 bg-sage/5">
          <Sparkles size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-sage" />
          <div>
            <p className="text-sm font-semibold text-ink">Tuned using your channel analytics</p>
            {script.analytics_strategy_note && (
              <p className="mt-0.5 text-sm text-ink-muted">{script.analytics_strategy_note}</p>
            )}
          </div>
        </div>
      )}

      {user?.subscription_tier === 'pro' && (
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} aria-hidden="true" className="text-sage" />
            <h2 className="text-sm font-semibold text-ink-muted">PUBLISHED VIDEO PERFORMANCE</h2>
          </div>

          {!script.published_video_id ? (
            linkingVideo ? (
              <div className="space-y-2">
                <label htmlFor="video-link-input" className="sr-only">YouTube video URL or ID</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="video-link-input"
                    type="text"
                    value={videoIdInput}
                    onChange={(e) => setVideoIdInput(e.target.value)}
                    placeholder="Paste the YouTube link or video ID"
                    className="input flex-1"
                  />
                  <div className="flex flex-shrink-0 gap-2">
                    <button onClick={handleLinkVideo} className="btn-primary px-4 text-sm">Link</button>
                    <button
                      onClick={() => { setLinkingVideo(false); setLinkError(''); setVideoIdInput('') }}
                      className="btn-secondary px-4 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {linkError && <ErrorMessage>{linkError}</ErrorMessage>}
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm text-ink-muted">
                  Once this script is live on YouTube, link the video to see its real views, retention, and CTR here.
                </p>
                <button
                  onClick={() => setLinkingVideo(true)}
                  className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <Link2 size={15} aria-hidden="true" />
                  Link published video
                </button>
              </div>
            )
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <button onClick={() => setWatchingVideo(true)} className="text-xs text-sage hover:underline">
                  Watch video
                </button>
                <button
                  onClick={handleUnlinkVideo}
                  className="flex items-center gap-1 text-xs text-ink-muted hover:text-error"
                >
                  <Unlink size={12} aria-hidden="true" />
                  Unlink
                </button>
              </div>
              {videoDetailsState && (
                <VideoBreakdownPanel
                  state={videoDetailsState}
                  source="own"
                  onGenerateScript={(topic) => router.push(`/dashboard/new?topic=${encodeURIComponent(topic)}`)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {script.key_points?.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">KEY POINTS</h2>
          <ul className="space-y-2">
            {script.key_points.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink">
                <span className="flex-shrink-0 font-bold text-sage">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">DESCRIPTION</h2>
        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-ink">{script.description}</p>
        <button
          onClick={() => handleCopy(script.description, 'description')}
          className={`btn-secondary w-full text-sm ${copied === 'description' ? 'bg-sage/10' : ''}`}
        >
          {copied === 'description' ? '✓ Copied!' : 'Copy Description'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">HASHTAGS</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {script.hashtags.map((tag, i) => (
            <span key={i} className="inline-block rounded bg-sage/20 px-3 py-1 text-sm font-medium text-sage">{tag}</span>
          ))}
        </div>
        <button
          onClick={() => handleCopy(script.hashtags.join(' '), 'hashtags')}
          className={`btn-secondary w-full text-sm ${copied === 'hashtags' ? 'bg-sage/10' : ''}`}
        >
          {copied === 'hashtags' ? '✓ Copied!' : 'Copy Hashtags'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">PINNED COMMENT</h2>
        <p className="mb-4 text-sm italic text-ink">&ldquo;{script.pinned_comment}&rdquo;</p>
        <button
          onClick={() => handleCopy(script.pinned_comment, 'pinned')}
          className={`btn-secondary w-full text-sm ${copied === 'pinned' ? 'bg-sage/10' : ''}`}
        >
          {copied === 'pinned' ? '✓ Copied!' : 'Copy Pinned Comment'}
        </button>
      </div>

      {script.alternative_titles?.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">TITLE VARIATIONS</h2>
          <div className="space-y-2">
            {script.alternative_titles.map((alt, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-warm-border bg-warm-surface-alt p-3">
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold text-ink-muted">{alt.style}</p>
                  <p className="text-sm text-ink">{alt.title}</p>
                </div>
                <button
                  onClick={() => handleCopy(alt.title, `alt-${i}`)}
                  className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-warm-surface"
                  aria-label={`Copy title: ${alt.title}`}
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-error hover:text-error-hover"
      >
        <Trash2 size={18} aria-hidden="true" />
        Delete Script
      </button>

      {watchingVideo && script.published_video_id && (
        <VideoPlayerModal
          videoId={script.published_video_id}
          title={script.title}
          onClose={() => setWatchingVideo(false)}
        />
      )}
    </div>
  )
}
