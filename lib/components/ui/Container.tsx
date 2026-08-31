// Desktop content width caps around 1240px per the landing page brief —
// wide enough to breathe, never stretching text across ultra-wide screens.
export default function Container({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-[1240px] px-[18px] sm:px-6 lg:px-12 ${className}`}>
      {children}
    </div>
  )
}
