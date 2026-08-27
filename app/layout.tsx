import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import '../styles/globals.css'

// Fraunces carries the editorial/warm personality on headlines; Inter
// stays quiet for UI and body copy. Loaded as CSS variables so both are
// available through Tailwind's font-serif/font-sans everywhere in the
// app, not just the landing page.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: 'ScriptSnap — Turn Ideas Into Scripts People Want to Watch',
  description: 'ScriptSnap helps creators turn rough ideas into engaging video scripts while keeping their voice, tone and personality.',
  openGraph: {
    title: 'ScriptSnap — Turn Ideas Into Scripts People Want to Watch',
    description: 'ScriptSnap helps creators turn rough ideas into engaging video scripts while keeping their voice, tone and personality.',
    siteName: 'ScriptSnap',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScriptSnap — Turn Ideas Into Scripts People Want to Watch',
    description: 'ScriptSnap helps creators turn rough ideas into engaging video scripts while keeping their voice, tone and personality.',
  },
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
    <html lang="en" style={{ colorScheme: 'light' }} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-warm-bg text-ink">
        {children}
      </body>
    </html>
  )
}
