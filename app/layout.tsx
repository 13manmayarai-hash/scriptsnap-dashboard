import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ScriptSnap - AI YouTube Shorts Script Generator',
  description: 'Generate AI-powered YouTube Shorts scripts instantly',
  other: {
    'theme-color': '#F7F5F0',
  },
}

// Without this, mobile browsers lay the page out against a fake wide
// (~980px) viewport and optically scale it down to fit the screen, so
// every md:/sm: responsive class always evaluates as if on desktop.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className="bg-warm-bg text-ink">
        {children}
      </body>
    </html>
  )
}
