'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LANGUAGES } from '@/lib/languages'
import { Trash2, Copy, Download, Search, ShieldAlert, ShieldCheck } from 'lucide-react'
import ScriptRating from '@/lib/components/ScriptRating'

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
  created_at: string
  word_count: number
  guideline_passed: boolean
  guideline_flags: Array<{ severity: string; note: string }>
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryContent />
    </Suspense>
  )
}

function LibraryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [copied, setCopied] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      let request = supabase
        .from('scripts')
        .select('id, topic, category, tone, language, duration, script, title, description, created_at, word_count, guideline_passed, guideline_flags')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (query.trim()) {
        request = request.or(`topic.ilike.%${query.trim()}%,title.ilike.%${query.trim()}%`)
      }

      const { data } = await request
      setScripts(data || [])
      setSelectedScript(null)
      setLoading(false)
    }
    load()
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput.trim()) params.set('q', searchInput.trim())
    router.push(`/dashboard/library${params.toString() ? `?${params}` : ''}`)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this script? This can\'t be undone.')) return
    const supabase = createClient()
    await supabase.from('scripts').delete().eq('id', id)
    setScripts((prev) => prev.filter((s) => s.id !== id))
    setSelectedScript(null)
  }

  const handleDownload = async (script: Script) => {
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

  const languageLabel = (key: string) => LANGUAGES.find((l) => l.key === key)?.label || key

  return (
    <div>
      <form onSubmit={handleSearch} className="relative mb-6 max-w-md">
        <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search your scripts by topic or title…"
          className="input pl-9"
          aria-label="Search scripts"
        />
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-ink-muted">Loading library…</p>
        </div>
      ) : scripts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-ink-muted/70 mb-4 text-5xl">📭</div>
          <h2 className="text-2xl font-bold heading-serif mb-2">
            {query ? 'No scripts match your search' : 'No Scripts Yet'}
          </h2>
          <p className="text-ink-muted mb-6">
            {query ? 'Try a different search term.' : 'Generate your first script to see it appear here.'}
          </p>
          <a href="/dashboard" className="btn-primary inline-block">
            Generate Scripts
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scripts List */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-xl font-bold mb-4 heading-serif">
                📚 Library ({scripts.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => setSelectedScript(script)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedScript?.id === script.id
                        ? 'bg-sage/20 border border-sage'
                        : 'bg-warm-surface-alt hover:bg-ink/5 border border-warm-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink truncate text-sm">
                        {script.title}
                      </p>
                      {!script.guideline_passed && (
                        <ShieldAlert size={14} aria-hidden="true" className="text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-ink-muted truncate">
                      {script.topic} • {script.tone}
                    </p>
                    <p className="text-xs text-ink-muted/70 mt-1">
                      {new Date(script.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Script Detail */}
          <div className="lg:col-span-2">
            {selectedScript ? (
              <div className="space-y-4">
                {/* Header */}
                <div className="card">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h1 className="text-3xl font-bold heading-serif mb-2">
                        {selectedScript.title}
                      </h1>
                      <div className="flex gap-2 flex-wrap">
                        <span className="inline-block bg-sage/20 text-sage px-3 py-1 rounded text-xs font-medium">
                          {selectedScript.category}
                        </span>
                        <span className="inline-block bg-ink/5 text-ink-muted px-3 py-1 rounded text-xs font-medium">
                          {selectedScript.tone}
                        </span>
                        <span className="inline-block bg-ink/5 text-ink-muted px-3 py-1 rounded text-xs font-medium">
                          {selectedScript.duration}s
                        </span>
                        <span className="inline-block bg-ink/5 text-ink-muted px-3 py-1 rounded text-xs font-medium">
                          {selectedScript.word_count} words
                        </span>
                        {selectedScript.language && selectedScript.language !== 'english' && (
                          <span className="inline-block bg-ink/5 text-ink-muted px-3 py-1 rounded text-xs font-medium">
                            {languageLabel(selectedScript.language)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ScriptRating scriptId={selectedScript.id} />
                  </div>
                </div>

                {/* Guideline check */}
                <div
                  className={`card flex items-start gap-3 ${
                    selectedScript.guideline_passed ? 'border-sage/40 bg-sage/5' : 'border-amber-400/50 bg-amber-50'
                  }`}
                >
                  {selectedScript.guideline_passed ? (
                    <ShieldCheck size={18} aria-hidden="true" className="text-sage flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert size={18} aria-hidden="true" className="text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {selectedScript.guideline_passed ? 'No policy risks flagged' : 'Worth a second look before posting'}
                    </p>
                    {selectedScript.guideline_flags?.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {selectedScript.guideline_flags.map((flag, i) => (
                          <li key={i} className="text-sm text-ink-muted">{flag.note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-ink-muted mb-2">DESCRIPTION</h3>
                  <p className="text-ink text-sm leading-relaxed">
                    {selectedScript.description}
                  </p>
                </div>

                {/* Script Content */}
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-ink-muted">SCRIPT</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(selectedScript.script)}
                        className="flex items-center gap-2 px-3 py-2 bg-ink/5 hover:bg-ink/10 rounded text-ink text-sm transition-colors"
                      >
                        <Copy size={16} aria-hidden="true" />
                        <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload(selectedScript)}
                        className="flex items-center gap-2 px-3 py-2 bg-ink/5 hover:bg-ink/10 rounded text-ink text-sm transition-colors"
                      >
                        <Download size={16} aria-hidden="true" />
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="bg-warm-surface-alt border border-warm-border rounded-lg p-4">
                    <p className="text-ink whitespace-pre-wrap text-sm leading-relaxed font-mono">
                      {selectedScript.script}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="card">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-ink-muted text-xs">TOPIC</p>
                      <p className="text-ink font-semibold">{selectedScript.topic}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-xs">CREATED</p>
                      <p className="text-ink font-semibold">
                        {new Date(selectedScript.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(selectedScript.id)}
                  className="w-full flex items-center justify-center gap-2 btn-secondary py-3 text-error hover:text-error-hover"
                >
                  <Trash2 size={18} aria-hidden="true" />
                  Delete Script
                </button>
              </div>
            ) : (
              <div className="card text-center py-20">
                <p className="text-ink-muted/70">← Select a script to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
