'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import { ArrowLeft, Mic2, TrendingDown, Loader2, Sparkles, AlertTriangle } from 'lucide-react'

interface Script {
  id: string
  title: string
  script: string
  published_video_id: string | null
}

interface VoiceProfile {
  analysis_summary: string
  script_count_analyzed: number
  last_analyzed_at: string
}

interface RetentionDip {
  startSeconds: number
  endSeconds: number
  dropPercent: number
}

interface RetentionState {
  tierAllowed: boolean
  connected?: boolean
  needsReconnect?: boolean
  dips?: RetentionDip[]
  videoDurationSeconds?: number | null
  error?: string
}

interface ScriptBlock {
  text: string
  dip?: RetentionDip
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`
}

// Approximates where in the script text a retention dip "happened" by
// assuming roughly even pacing across the video's duration — there's no
// forced word-to-timestamp alignment here (that needs real audio
// transcription/alignment, out of scope), so this is a labeled estimate,
// not a claim of precision.
function buildScriptBlocks(scriptText: string, dips: RetentionDip[], videoDurationSeconds: number | null | undefined): ScriptBlock[] {
  const words = scriptText.split(/\s+/).filter(Boolean)
  const totalWords = words.length

  if (!videoDurationSeconds || dips.length === 0 || totalWords === 0) {
    return [{ text: scriptText }]
  }

  const cuts = dips
    .map((dip) => ({
      wordIndex: Math.min(totalWords, Math.max(1, Math.round((dip.startSeconds / videoDurationSeconds) * totalWords))),
      dip,
    }))
    .sort((a, b) => a.wordIndex - b.wordIndex)

  const blocks: ScriptBlock[] = []
  let cursor = 0
  for (const { wordIndex, dip } of cuts) {
    if (wordIndex > cursor) {
      blocks.push({ text: words.slice(cursor, wordIndex).join(' '), dip })
      cursor = wordIndex
    }
  }
  if (cursor < totalWords) {
    blocks.push({ text: words.slice(cursor).join(' ') })
  }
  return blocks.length > 0 ? blocks : [{ text: scriptText }]
}

export default function ScriptAnalyzePage() {
  const params = useParams()
  const scriptId = params.id as string

  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState('free')

  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceError, setVoiceError] = useState('')

  const [retention, setRetention] = useState<RetentionState | null>(null)
  const [retentionLoading, setRetentionLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data: scriptData }, { data: profile }] = await Promise.all([
        supabase.from('scripts').select('id, title, script, published_video_id').eq('id', scriptId).single(),
        supabase.from('users').select('subscription_tier').eq('id', user.id).single(),
      ])

      setScript(scriptData)
      setTier(profile?.subscription_tier || 'free')
      setLoading(false)

      const voiceRes = await fetch('/api/voice-profile/analyze', { credentials: 'same-origin' })
      const voiceData = await voiceRes.json()
      setVoiceProfile(voiceData.profile)

      if (scriptData?.published_video_id && (profile?.subscription_tier || 'free') === 'pro') {
        setRetentionLoading(true)
        try {
          const params = new URLSearchParams({ videoId: scriptData.published_video_id })
          const res = await fetch(`/api/youtube/retention?${params}`, { credentials: 'same-origin' })
          setRetention(await res.json())
        } catch {
          setRetention({ tierAllowed: true, connected: true, error: 'Could not load retention data — try again in a moment.' })
        } finally {
          setRetentionLoading(false)
        }
      }
    }
    load()
  }, [scriptId])

  const handleGenerateVoiceProfile = async () => {
    setVoiceLoading(true)
    setVoiceError('')
    try {
      const res = await fetch('/api/voice-profile/analyze', { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        setVoiceError(data.error || 'Failed to generate VoicePrint')
        return
      }
      setVoiceProfile({
        analysis_summary: data.profile.analysisSummary,
        script_count_analyzed: data.profile.scriptCountAnalyzed,
        last_analyzed_at: data.profile.lastAnalyzedAt,
      })
    } catch {
      setVoiceError('Failed to generate VoicePrint — try again in a moment.')
    } finally {
      setVoiceLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading analysis…" />
  }

  if (!script) {
    return (
      <div className="card py-16 text-center">
        <h1 className="mb-2 text-xl font-bold heading-serif">Script not found</h1>
        <Link href="/dashboard/library" className="text-sage hover:underline">Back to Library</Link>
      </div>
    )
  }

  const dips = retention?.dips || []
  const blocks = buildScriptBlocks(script.script, dips, retention?.videoDurationSeconds)

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/dashboard/scripts/${script.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to script
      </Link>

      <h1 className="mb-1 text-2xl font-bold heading-serif">Analyze: {script.title}</h1>
      <p className="mb-6 text-sm text-ink-muted">Your voice, and — where a video is linked — where viewers dropped off.</p>

      {/* VoicePrint card */}
      <div className="card mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Mic2 size={18} aria-hidden="true" className="text-sage" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">VoicePrint</h2>
        </div>
        {voiceProfile ? (
          <>
            <p className="text-sm text-ink">{voiceProfile.analysis_summary}</p>
            <p className="mt-2 text-xs text-ink-faint">
              Based on your last {voiceProfile.script_count_analyzed} scripts · updated {new Date(voiceProfile.last_analyzed_at).toLocaleDateString()}
            </p>
            <button
              onClick={handleGenerateVoiceProfile}
              disabled={voiceLoading}
              className="btn-secondary mt-3 flex items-center gap-1.5 px-3 py-2 text-xs"
            >
              {voiceLoading ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Sparkles size={14} aria-hidden="true" />}
              Refresh VoicePrint
            </button>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              Build a VoicePrint from your own past scripts — a detailed writing profile beyond a single tone label.
            </p>
            {voiceError && <ErrorMessage className="mb-3">{voiceError}</ErrorMessage>}
            <button
              onClick={handleGenerateVoiceProfile}
              disabled={voiceLoading}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {voiceLoading ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Sparkles size={14} aria-hidden="true" />}
              {voiceLoading ? 'Analyzing…' : 'Generate my VoicePrint'}
            </button>
          </>
        )}
      </div>

      {/* Retention status banner */}
      {!script.published_video_id && (
        <p className="mb-4 text-sm text-ink-muted">
          Link this script to a published video (from the{' '}
          <Link href={`/dashboard/scripts/${script.id}`} className="text-sage hover:underline">script page</Link>) to see retention drop-off mapped against the text below.
        </p>
      )}
      {script.published_video_id && tier !== 'pro' && (
        <p className="mb-4 text-sm text-ink-muted">
          Retention-dip mapping is a <Link href="/dashboard/billing" className="text-sage hover:underline">Pro</Link> feature.
        </p>
      )}
      {retentionLoading && <div className="mb-4"><LoadingState message="Loading retention data…" compact /></div>}
      {retention?.needsReconnect && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent-ochre/40 bg-accent-ochre/10 p-3">
          <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-accent-ochre" />
          <p className="text-sm text-ink">
            Your YouTube access needs to be reconnected — <Link href="/dashboard/settings" className="underline">reconnect in Settings</Link>.
          </p>
        </div>
      )}
      {retention?.error && <ErrorMessage className="mb-4">{retention.error}</ErrorMessage>}
      {retention?.connected && !retention.needsReconnect && dips.length === 0 && !retention.error && (
        <p className="mb-4 text-sm text-ink-muted">No significant retention drop-offs detected for this video.</p>
      )}
      {dips.length > 0 && (
        <p className="mb-4 text-xs text-ink-faint">
          Drop-off points below are estimated from the video&apos;s overall pacing, not exact word-level timing.
        </p>
      )}

      {/* Dual-column: script segments left, retention annotations right */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">SCRIPT</h2>
        <div className="space-y-4">
          {blocks.map((block, i) => (
            <div key={i} className="flex flex-col gap-3 md:flex-row md:items-stretch">
              <div className="flex-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{block.text}</div>
              {block.dip && (
                <div className="flex-shrink-0 rounded-lg border border-error/30 bg-error/5 p-3 md:w-64">
                  <div className="mb-1 flex items-center gap-1.5 text-error">
                    <TrendingDown size={14} aria-hidden="true" />
                    <span className="text-xs font-semibold">Retention drop</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    ~{formatSeconds(block.dip.startSeconds)}–{formatSeconds(block.dip.endSeconds)} into the video
                  </p>
                  <p className="text-xs text-ink-muted">-{block.dip.dropPercent}% watch ratio</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
