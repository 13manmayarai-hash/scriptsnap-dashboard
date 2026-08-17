'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LANGUAGES } from '@/lib/languages'
import ScriptRating from '@/lib/components/ScriptRating'
import { ArrowLeft, Copy, Download, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react'

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
  word_count: number
  is_series: boolean
  guideline_passed: boolean
  guideline_flags: Array<{ severity: string; note: string }>
  created_at: string
}

export default function ScriptWorkspacePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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
          'id, topic, category, tone, language, duration, script, title, description, hashtags, pinned_comment, alternative_titles, key_points, word_count, is_series, guideline_passed, guideline_flags, created_at'
        )
        .eq('id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!data) {
        setNotFound(true)
      } else {
        setScript(data as Script)
      }
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
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

    const writeParagraph = (
      text: string,
      fontSize: number,
      lineHeight: number,
      style: 'normal' | 'bold' | 'italic' = 'normal'
    ) => {
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
      `${script.duration}s  •  ${script.category}  •  ${script.tone}  •  ${script.word_count} words  •  ${new Date(script.created_at).toLocaleDateString()}`,
      10,
      14
    )
    y += 14
    writeParagraph('SCRIPT', 11, 16, 'bold')
    writeParagraph(script.script, 11, 15)
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
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-ink-muted">Loading script…</p>
      </div>
    )
  }

  if (notFound || !script) {
    return (
      <div className="card py-16 text-center">
        <h1 className="mb-2 text-xl font-bold heading-serif">Script not found</h1>
        <p className="mb-6 text-sm text-ink-muted">
          It may have been deleted, or the link is wrong.
        </p>
        <Link href="/dashboard/library" className="btn-primary inline-flex">
          Back to Scripts
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link href="/dashboard/library" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
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

      <div
        className={`card flex items-start gap-3 ${
          script.guideline_passed ? 'border-sage/40 bg-sage/5' : 'border-amber-400/50 bg-amber-50'
        }`}
      >
        {script.guideline_passed ? (
          <ShieldCheck size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-sage" />
        ) : (
          <ShieldAlert size={20} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-amber-600" />
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

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">SCRIPT ({script.word_count} words)</h2>
        <div className="mb-4 rounded-lg border border-warm-border bg-warm-surface-alt p-4">
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-ink">{script.script}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => handleCopy(script.script, 'script')}
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
            <span key={i} className="inline-block rounded bg-sage/20 px-3 py-1 text-sm font-medium text-sage">
              {tag}
            </span>
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
    </div>
  )
}
