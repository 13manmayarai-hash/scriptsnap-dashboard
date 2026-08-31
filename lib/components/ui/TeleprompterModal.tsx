'use client'

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X, Minus, Plus } from 'lucide-react'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { formatSeconds } from '@/lib/youtube/scriptBlocks'

const MIN_WPM = 60
const MAX_WPM = 260
const WPM_STEP = 10

// Full-screen auto-scrolling teleprompter (Feature D) — scroll speed is
// derived from wordCount/wpm rather than a fixed px/sec, so changing the
// pace mid-read re-times the remaining distance instead of just changing
// how fast the same animation plays.
export default function TeleprompterModal({
  text,
  initialWpm,
  onClose,
}: {
  text: string
  initialWpm: number
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, true, onClose)

  const [wpm, setWpm] = useState(() => Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(initialWpm) || 140)))
  const [playing, setPlaying] = useState(false)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const estimatedSeconds = Math.round((wordCount / wpm) * 60)

  useEffect(() => {
    if (!playing) return
    const el = scrollRef.current
    if (!el) return

    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) {
      setPlaying(false)
      return
    }

    const totalDurationMs = (wordCount / wpm) * 60 * 1000
    const remainingScroll = maxScroll - el.scrollTop
    const remainingMs = totalDurationMs * (remainingScroll / maxScroll)
    const startScrollTop = el.scrollTop
    const startTime = performance.now()

    let frameId: number
    const tick = (now: number) => {
      const progress = remainingMs > 0 ? Math.min(1, (now - startTime) / remainingMs) : 1
      el.scrollTop = startScrollTop + remainingScroll * progress
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setPlaying(false)
      }
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
    // Re-timing is intentionally keyed only on play/pace changes, not on
    // every scrollTop update the animation itself produces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, wpm, wordCount])

  const handleRestart = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setPlaying(false)
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Teleprompter" className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-3">
        <div className="flex items-center gap-2 text-white">
          <button
            onClick={() => setWpm((w) => Math.max(MIN_WPM, w - WPM_STEP))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Slower"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <span className="w-20 text-center text-sm tabular-nums">{wpm} WPM</span>
          <button
            onClick={() => setWpm((w) => Math.min(MAX_WPM, w + WPM_STEP))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Faster"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
          <span className="ml-2 text-xs text-white/60">~{formatSeconds(estimatedSeconds)} at this pace</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Restart"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          </button>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close teleprompter"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-16 md:px-16">
        <p className="mx-auto max-w-3xl whitespace-pre-wrap text-center text-3xl leading-relaxed text-white md:text-4xl">
          {text}
        </p>
        <div className="h-[60vh]" aria-hidden="true" />
      </div>
    </div>
  )
}
