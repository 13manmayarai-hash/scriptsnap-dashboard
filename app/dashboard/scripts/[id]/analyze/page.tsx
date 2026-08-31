'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ErrorMessage from '@/lib/components/ui/ErrorMessage'
import LoadingState from '@/lib/components/ui/LoadingState'
import { buildScriptBlocks, formatSeconds } from '@/lib/youtube/scriptBlocks'
import type { RetentionDip } from '@/lib/youtube/retention'
import type { StructuredScript } from '@/lib/scripts/structuredScript'
import type { RepurposePlatform, RepurposedVariant } from '@/lib/scripts/repurpose'
import type { SponsorSlotSuggestion } from '@/lib/scripts/sponsorSlot'
import TeleprompterModal from '@/lib/components/ui/TeleprompterModal'
import { ArrowLeft, Mic2, TrendingDown, Loader2, Sparkles, AlertTriangle, Download, Clapperboard, Zap, MonitorPlay, Copy, Check, Image as ImageIcon, Repeat, Banknote } from 'lucide-react'

const DEFAULT_WPM = 140

const PLATFORM_LABELS: Record<RepurposePlatform, string> = {
  youtube_shorts: 'YouTube Shorts',
  tiktok: 'TikTok',
  instagram_reels: 'Instagram Reels',
}
const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS) as RepurposePlatform[]

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

interface RetentionState {
  tierAllowed: boolean
  connected?: boolean
  needsReconnect?: boolean
  dips?: RetentionDip[]
  videoDurationSeconds?: number | null
  error?: string
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

  const [structured, setStructured] = useState<StructuredScript | null>(null)
  const [structuredLoading, setStructuredLoading] = useState(false)
  const [structuredError, setStructuredError] = useState('')

  const [showTeleprompter, setShowTeleprompter] = useState(false)

  const [copiedBrollIndex, setCopiedBrollIndex] = useState<number | null>(null)

  const [variants, setVariants] = useState<RepurposedVariant[] | null>(null)
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [variantsError, setVariantsError] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<RepurposePlatform[]>(ALL_PLATFORMS)
  const [copiedVariantIndex, setCopiedVariantIndex] = useState<number | null>(null)

  const [sponsorBrief, setSponsorBrief] = useState('')
  const [sponsorSuggestion, setSponsorSuggestion] = useState<SponsorSlotSuggestion | null>(null)
  const [sponsorLoading, setSponsorLoading] = useState(false)
  const [sponsorError, setSponsorError] = useState('')
  const [sponsorCopied, setSponsorCopied] = useState(false)

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

      const structuredRes = await fetch(`/api/scripts/${scriptId}/structured`, { credentials: 'same-origin' })
      const structuredData = await structuredRes.json()
      setStructured(structuredData.structured || null)

      const variantsRes = await fetch(`/api/scripts/${scriptId}/repurpose`, { credentials: 'same-origin' })
      const variantsData = await variantsRes.json()
      setVariants(variantsData.variants || null)

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

  const handleGenerateStructured = async () => {
    setStructuredLoading(true)
    setStructuredError('')
    try {
      const res = await fetch(`/api/scripts/${scriptId}/structured`, { method: 'POST', credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok) {
        setStructuredError(data.error || 'Failed to generate structured script')
        return
      }
      setStructured(data.structured)
    } catch {
      setStructuredError('Failed to generate structured script — try again in a moment.')
    } finally {
      setStructuredLoading(false)
    }
  }

  const handleTogglePlatform = (platform: RepurposePlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const handleGenerateVariants = async () => {
    if (selectedPlatforms.length === 0) {
      setVariantsError('Select at least one platform.')
      return
    }
    setVariantsLoading(true)
    setVariantsError('')
    try {
      const res = await fetch(`/api/scripts/${scriptId}/repurpose`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selectedPlatforms }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVariantsError(data.error || 'Failed to generate repurposed variants')
        return
      }
      setVariants(data.variants)
    } catch {
      setVariantsError('Failed to generate repurposed variants — try again in a moment.')
    } finally {
      setVariantsLoading(false)
    }
  }

  const handleCopyVariant = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedVariantIndex(index)
      setTimeout(() => setCopiedVariantIndex((prev) => (prev === index ? null : prev)), 2000)
    } catch {
      // Clipboard access can fail silently in some embedded browser
      // contexts — the script text is still visible on-screen to select manually.
    }
  }

  const handleFindSponsorSlot = async () => {
    if (!sponsorBrief.trim()) {
      setSponsorError('Describe the sponsor first.')
      return
    }
    setSponsorLoading(true)
    setSponsorError('')
    try {
      const res = await fetch(`/api/scripts/${scriptId}/sponsor-slot`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorBrief }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSponsorError(data.error || 'Failed to find a sponsor slot')
        return
      }
      setSponsorSuggestion(data.suggestion)
    } catch {
      setSponsorError('Failed to find a sponsor slot — try again in a moment.')
    } finally {
      setSponsorLoading(false)
    }
  }

  const handleCopySponsorRead = async () => {
    if (!sponsorSuggestion) return
    try {
      await navigator.clipboard.writeText(sponsorSuggestion.sponsorRead)
      setSponsorCopied(true)
      setTimeout(() => setSponsorCopied(false), 2000)
    } catch {
      // Clipboard access can fail silently in some embedded browser
      // contexts — the read text is still visible on-screen to select manually.
    }
  }

  const handleCopyBroll = async (prompt: string, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedBrollIndex(index)
      setTimeout(() => setCopiedBrollIndex((prev) => (prev === index ? null : prev)), 2000)
    } catch {
      // Clipboard access can fail silently in some embedded browser
      // contexts — the prompt text is still visible on-screen to select manually.
    }
  }

  const handleExportPdf = async () => {
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

    writeParagraph(`Analysis: ${script.title}`, 18, 22, 'bold')
    y += 8

    if (voiceProfile) {
      writeParagraph('VOICEPRINT', 11, 16, 'bold')
      writeParagraph(voiceProfile.analysis_summary, 10, 14)
      y += 10
    }

    writeParagraph('SCRIPT', 11, 16, 'bold')
    const exportBlocks = buildScriptBlocks(script.script, retention?.dips || [], retention?.videoDurationSeconds)
    for (const block of exportBlocks) {
      writeParagraph(block.text, 11, 15)
      if (block.dip) {
        y += 2
        writeParagraph(
          `[Retention drop ~${formatSeconds(block.dip.startSeconds)}–${formatSeconds(block.dip.endSeconds)} into the video, -${block.dip.dropPercent}% watch ratio]`,
          9,
          12,
          'bold'
        )
        y += 6
      }
    }

    doc.save(`${script.title.replace(/\s+/g, '_')}_analysis.pdf`)
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

  const teleprompterWpm = structured?.targetWPM || DEFAULT_WPM
  const scriptWordCount = script.script.trim().split(/\s+/).filter(Boolean).length
  const estimatedReadSeconds = Math.round((scriptWordCount / teleprompterWpm) * 60)

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
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">SCRIPT</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTeleprompter(true)} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs">
              <MonitorPlay size={14} aria-hidden="true" />
              Teleprompter
            </button>
            <button onClick={handleExportPdf} className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs">
              <Download size={14} aria-hidden="true" />
              Download analysis PDF
            </button>
          </div>
        </div>
        <p className="mb-3 text-xs text-ink-faint">
          ~{formatSeconds(estimatedReadSeconds)} at {teleprompterWpm} WPM{structured ? ' (your VoicePrint pace)' : ' (estimated)'}
        </p>
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

      {/* Structured shooting script (Feature C) */}
      <div className="card mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clapperboard size={18} aria-hidden="true" className="text-sage" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Structured shooting script</h2>
          </div>
          <button
            onClick={handleGenerateStructured}
            disabled={structuredLoading}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            {structuredLoading ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Clapperboard size={14} aria-hidden="true" />}
            {structuredLoading ? 'Generating…' : structured ? 'Regenerate' : 'Generate structured script'}
          </button>
        </div>
        {structuredError && <ErrorMessage className="mb-3">{structuredError}</ErrorMessage>}
        {!structured && !structuredLoading && (
          <p className="text-sm text-ink-muted">
            Break this script into a dual-column shooting script — audio, visuals, and SFX per block, timed to your own
            measured speaking pace{dips.length > 0 ? ", with Pattern Interrupt blocks placed at this video's known retention drop-offs" : ''}.
          </p>
        )}
        {structured && (
          <>
            <p className="mb-3 text-xs text-ink-faint">Target pace: {structured.targetWPM} WPM</p>
            <div className="space-y-3">
              {structured.blocks.map((block, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-ink/10 p-3 md:flex-row md:items-start">
                  <div className="flex-shrink-0 font-mono text-xs text-ink-faint md:w-14">{block.timestamp}</div>
                  <div className="flex-1">
                    <p className="text-sm text-ink">{block.audio}</p>
                    {block.visual && <p className="mt-1 text-xs text-ink-muted">🎥 {block.visual}</p>}
                    {block.sfx && <p className="mt-0.5 text-xs text-ink-muted">🔊 {block.sfx}</p>}
                    {block.brollPrompt && (
                      <div className="mt-2 flex items-start gap-2 rounded-md bg-ink/5 p-2">
                        <ImageIcon size={12} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-ink-faint" />
                        <p className="flex-1 font-mono text-[11px] leading-relaxed text-ink-muted">{block.brollPrompt}</p>
                        <button
                          onClick={() => handleCopyBroll(block.brollPrompt!, i)}
                          className="flex-shrink-0 rounded p-1 text-ink-faint hover:bg-ink/10 hover:text-ink"
                          aria-label="Copy B-roll prompt"
                        >
                          {copiedBrollIndex === i ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                        </button>
                      </div>
                    )}
                  </div>
                  {block.retentionTrigger && (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-error/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-error">
                      <Zap size={10} aria-hidden="true" />
                      {block.retentionTrigger}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Multi-format repurposer (Feature F) */}
      <div className="card mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Repeat size={18} aria-hidden="true" className="text-sage" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Repurpose for other platforms</h2>
        </div>
        <p className="mb-3 text-sm text-ink-muted">
          Adapt this script&apos;s hook, pacing, and CTA for each platform&apos;s native style — same core content, different opener and close.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((platform) => (
            <label
              key={platform}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                selectedPlatforms.includes(platform) ? 'border-sage bg-sage/10 text-ink' : 'border-ink/15 text-ink-muted'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handleTogglePlatform(platform)}
                className="sr-only"
              />
              {PLATFORM_LABELS[platform]}
            </label>
          ))}
        </div>
        {variantsError && <ErrorMessage className="mb-3">{variantsError}</ErrorMessage>}
        <button
          onClick={handleGenerateVariants}
          disabled={variantsLoading}
          className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
        >
          {variantsLoading ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Repeat size={14} aria-hidden="true" />}
          {variantsLoading ? 'Adapting…' : variants ? 'Regenerate' : 'Generate variants'}
        </button>

        {variants && (
          <div className="mt-4 space-y-3">
            {variants.map((variant, i) => (
              <div key={i} className="rounded-lg border border-ink/10 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {PLATFORM_LABELS[variant.platform]}
                  </span>
                  <button
                    onClick={() => handleCopyVariant(variant.script, i)}
                    className="flex items-center gap-1 rounded p-1 text-ink-faint hover:bg-ink/10 hover:text-ink"
                    aria-label={`Copy ${PLATFORM_LABELS[variant.platform]} script`}
                  >
                    {copiedVariantIndex === i ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  </button>
                </div>
                {variant.note && <p className="mb-2 text-xs text-ink-faint">{variant.note}</p>}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{variant.script}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsor slot finder (Feature G) */}
      <div className="card mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Banknote size={18} aria-hidden="true" className="text-sage" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Sponsor slot finder</h2>
        </div>
        <p className="mb-3 text-sm text-ink-muted">
          Describe a sponsor and get the single best insertion point in this script — chosen to avoid the hook, the
          close, and any known retention drop-off — plus a drafted read in your voice.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={sponsorBrief}
            onChange={(e) => setSponsorBrief(e.target.value)}
            placeholder="e.g. NordVPN — privacy-focused VPN, 30-day money-back guarantee"
            className="input flex-1 text-sm"
          />
          <button
            onClick={handleFindSponsorSlot}
            disabled={sponsorLoading}
            className="btn-secondary flex items-center justify-center gap-1.5 px-3 py-2 text-xs"
          >
            {sponsorLoading ? <Loader2 size={14} aria-hidden="true" className="animate-spin" /> : <Banknote size={14} aria-hidden="true" />}
            {sponsorLoading ? 'Finding…' : 'Find slot'}
          </button>
        </div>
        {sponsorError && <ErrorMessage className="mt-3">{sponsorError}</ErrorMessage>}
        {sponsorSuggestion && (
          <div className="mt-4 rounded-lg border border-ink/10 p-3">
            <p className="text-xs text-ink-faint">
              Insert after: <span className="italic text-ink-muted">&ldquo;{sponsorSuggestion.afterText}&rdquo;</span>
            </p>
            <div className="mt-2 flex items-start justify-between gap-2">
              <p className="flex-1 text-sm leading-relaxed text-ink">{sponsorSuggestion.sponsorRead}</p>
              <button
                onClick={handleCopySponsorRead}
                className="flex-shrink-0 rounded p-1 text-ink-faint hover:bg-ink/10 hover:text-ink"
                aria-label="Copy sponsor read"
              >
                {sponsorCopied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              </button>
            </div>
            {sponsorSuggestion.reasoning && <p className="mt-2 text-xs text-ink-faint">{sponsorSuggestion.reasoning}</p>}
          </div>
        )}
      </div>

      {showTeleprompter && (
        <TeleprompterModal
          text={script.script}
          initialWpm={teleprompterWpm}
          onClose={() => setShowTeleprompter(false)}
        />
      )}
    </div>
  )
}
