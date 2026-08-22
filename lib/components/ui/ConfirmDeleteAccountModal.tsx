'use client'

import { useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

export default function ConfirmDeleteAccountModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => Promise<string | null>
}) {
  const [input, setInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)

  const canConfirm = input === 'DELETE' && !deleting

  const handleConfirm = async () => {
    setDeleting(true)
    setError('')
    const errorMessage = await onConfirm()
    if (errorMessage) {
      setError(errorMessage)
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        style={{ overscrollBehavior: 'contain' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative w-full max-w-md rounded-xl border border-warm-border bg-warm-surface p-6 shadow-xl"
      >
        <div className="mb-3 flex items-center gap-2 text-error">
          <AlertTriangle size={20} aria-hidden="true" />
          <h2 id="delete-account-title" className="text-lg font-bold heading-serif">Delete your account</h2>
        </div>

        <p className="mb-2 text-sm text-ink">This permanently deletes, with no way to recover:</p>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>All your generated scripts and ratings</li>
          <li>Your ideas and calendar entries</li>
          <li>Your tone presets and categories</li>
          <li>Your connected YouTube channel</li>
        </ul>

        <label htmlFor="delete-confirm-input" className="mb-1.5 block text-sm font-medium text-ink">
          Type <span className="font-mono font-bold">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={deleting}
          autoComplete="off"
          spellCheck={false}
          className="input mb-5"
        />

        {error && <p className="mb-3 text-sm text-error" role="alert">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} disabled={deleting} className="btn-secondary px-4 py-2.5 text-sm">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="min-h-[44px] rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error-hover disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}
