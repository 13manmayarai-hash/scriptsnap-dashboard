import type { Metadata } from 'next'
import { inter } from '@/lib/fonts'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ScriptSnap - AI YouTube Shorts Generator',
  description: 'Generate viral YouTube Shorts scripts powered by AI',
  openGraph: {
    title: 'ScriptSnap',
    description: 'AI-powered YouTube Shorts script generator',
    url: 'https://scriptsnap.app',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brand-black text-brand-white`}>
        {children}
      </body>
    </html>
  )
}
