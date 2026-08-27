import { Play } from 'lucide-react'

export default function Logo({ size = 28, textClassName = 'font-serif text-[19px] font-semibold text-ink' }: { size?: number; textClassName?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="flex flex-shrink-0 items-center justify-center rounded-[7px] bg-sage text-white"
        style={{ height: size, width: size }}
        aria-hidden="true"
      >
        <Play size={size * 0.5} fill="currentColor" />
      </span>
      <span className={textClassName}>ScriptSnap</span>
    </span>
  )
}
