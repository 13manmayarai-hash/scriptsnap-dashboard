'use client'

import { Loader2 } from 'lucide-react'

export default function LoadingState({
  message = 'Loading…',
  compact = false,
}: {
  message?: string
  compact?: boolean
}) {
  return (
    <div className={`flex items-center justify-center gap-2 text-ink-muted ${compact ? '' : 'py-12'}`}>
      <Loader2 size={compact ? 14 : 16} aria-hidden="true" className="animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
