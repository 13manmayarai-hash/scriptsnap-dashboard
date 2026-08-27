export default function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'sage' | 'error'
  className?: string
}) {
  const toneClasses = {
    neutral: 'bg-warm-surface-alt text-ink-muted border border-warm-border',
    sage: 'bg-soft-accent text-sage-hover',
    error: 'bg-error/10 text-error',
  }[tone]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses} ${className}`}>
      {children}
    </span>
  )
}
