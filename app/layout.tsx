import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'ScriptSnap - AI YouTube Shorts Script Generator',
  description: 'Generate AI-powered YouTube Shorts scripts instantly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-brand-black text-brand-white">
        {children}
      </body>
    </html>
  )
}
