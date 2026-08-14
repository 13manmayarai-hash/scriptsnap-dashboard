'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store/app'
import { Trash2, Copy, Download } from 'lucide-react'

interface Script {
  id: string
  topic: string
  category: string
  tone: string
  duration: number
  script: string
  title: string
  description: string
  created_at: string
  word_count: number
}

export default function LibraryPage() {
  const { user } = useAppStore()
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // TODO: Fetch from /api/library or Supabase
    // For now, show demo scripts from localStorage
    const savedScripts = localStorage.getItem('scriptsnap_scripts')
    if (savedScripts) {
      setScripts(JSON.parse(savedScripts))
    }
    setLoading(false)
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = (id: string) => {
    const updated = scripts.filter(s => s.id !== id)
    setScripts(updated)
    localStorage.setItem('scriptsnap_scripts', JSON.stringify(updated))
    setSelectedScript(null)
  }

  const handleDownload = (script: Script) => {
    const content = `
TITLE: ${script.title}
TOPIC: ${script.topic}
CATEGORY: ${script.category}
TONE: ${script.tone}
DURATION: ${script.duration}s
WORD COUNT: ${script.word_count}
DATE: ${new Date(script.created_at).toLocaleDateString()}

SCRIPT:
${script.script}

DESCRIPTION:
${script.description}
    `.trim()

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', `${script.title.replace(/\s+/g, '_')}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-white/60">Loading library...</p>
      </div>
    )
  }

  if (scripts.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="text-white/40 mb-4 text-5xl">📭</div>
        <h2 className="text-2xl font-bold text-white mb-2">No Scripts Yet</h2>
        <p className="text-white/60 mb-6">
          Generate your first script to see it appear here.
        </p>
        <a
          href="/dashboard"
          className="btn-primary inline-block"
        >
          Generate Scripts
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scripts List */}
      <div className="lg:col-span-1">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 text-gradient">
            📚 Library ({scripts.length})
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => setSelectedScript(script)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedScript?.id === script.id
                    ? 'bg-brand-yellow/20 border border-brand-yellow'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <p className="font-semibold text-white truncate text-sm">
                  {script.title}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {script.topic} • {script.tone}
                </p>
                <p className="text-xs text-white/40 mt-1">
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {selectedScript.title}
                  </h1>
                  <div className="flex gap-2 flex-wrap">
                    <span className="inline-block bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded text-xs font-medium">
                      {selectedScript.category}
                    </span>
                    <span className="inline-block bg-white/10 text-white/70 px-3 py-1 rounded text-xs font-medium">
                      {selectedScript.tone}
                    </span>
                    <span className="inline-block bg-white/10 text-white/70 px-3 py-1 rounded text-xs font-medium">
                      {selectedScript.duration}s
                    </span>
                    <span className="inline-block bg-white/10 text-white/70 px-3 py-1 rounded text-xs font-medium">
                      {selectedScript.word_count} words
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white/60 mb-2">DESCRIPTION</h3>
              <p className="text-white text-sm leading-relaxed">
                {selectedScript.description}
              </p>
            </div>

            {/* Script Content */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white/60">SCRIPT</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(selectedScript.script)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors"
                  >
                    <Copy size={16} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedScript)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {selectedScript.script}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="card">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/60 text-xs">TOPIC</p>
                  <p className="text-white font-semibold">{selectedScript.topic}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">CREATED</p>
                  <p className="text-white font-semibold">
                    {new Date(selectedScript.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(selectedScript.id)}
              className="w-full flex items-center justify-center gap-2 btn-secondary py-3 text-red-400 hover:text-red-300"
            >
              <Trash2 size={18} />
              Delete Script
            </button>
          </div>
        ) : (
          <div className="card text-center py-20">
            <p className="text-white/40">← Select a script to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
