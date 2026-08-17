import type { LucideIcon } from 'lucide-react'

export default function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="card flex flex-col items-center py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-soft-accent text-sage">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h1 className="mb-2 text-xl font-bold heading-serif">{title}</h1>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
    </div>
  )
}
