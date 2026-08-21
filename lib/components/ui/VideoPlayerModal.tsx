'use client'

import { useRef } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

export default function VideoPlayerModal({
  videoId,
  title,
  onClose,
}: {
  videoId: string
  title: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70"
        style={{ overscrollBehavior: 'contain' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-2xl"
      >
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-white hover:bg-white/10"
          aria-label="Close video"
        >
          <X size={22} aria-hidden="true" />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-xl">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
