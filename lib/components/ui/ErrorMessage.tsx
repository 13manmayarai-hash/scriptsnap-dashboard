export default function ErrorMessage({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  if (!children) return null

  return (
    <div
      className={`bg-error/10 border border-error/40 rounded-lg p-3 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm text-error">{children}</p>
    </div>
  )
}
