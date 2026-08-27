import Link from 'next/link'
import type { ReactNode } from 'react'

interface ButtonProps {
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
  className?: string
  children: ReactNode
  type?: 'button' | 'submit'
}

// Wraps the .btn-primary/.btn-secondary classes already defined in
// globals.css (44px touch target, focus-visible ring, disabled state)
// so every CTA on the site — landing page included — shares one
// implementation instead of re-declaring the same styles per section.
export default function Button({
  href,
  onClick,
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
}: ButtonProps) {
  const classes = `${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${className}`

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
        {icon}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
      {icon}
    </button>
  )
}
