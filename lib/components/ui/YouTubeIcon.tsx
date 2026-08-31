// The real YouTube brand mark (red rounded rectangle + white play
// triangle) — the lucide `Youtube` icon is a plain outline glyph that
// inherits currentColor, not the actual brand colors.
export default function YouTubeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="1" y="3.5" width="22" height="17" rx="5.5" fill="#FF0000" />
      <path d="M10 8.3 L16.5 12 L10 15.7 Z" fill="#FFFFFF" />
    </svg>
  )
}
