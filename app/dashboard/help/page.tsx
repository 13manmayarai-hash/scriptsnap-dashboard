'use client'

import { HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'How does ScriptSnap personalize scripts to my voice?',
    a: 'Every script is generated using the tone preset you pick and any context or keywords you add. Add your own tone presets and categories under Settings so the generator matches how you actually write.',
  },
  {
    q: 'Where do my generated scripts go?',
    a: 'Every script you generate is saved to your Scripts library automatically. Open Scripts from the sidebar to search, rate, download as a PDF, or delete any past script.',
  },
  {
    q: 'What does the guideline check do?',
    a: 'Each generation is checked for common policy risks (copyright, misleading claims, etc.) and flagged in the script view so you can review before posting — it never blocks generation.',
  },
  {
    q: 'How do I change or cancel my plan?',
    a: 'Go to Settings → Usage & Billing to see your current plan and usage, and to upgrade or manage billing through Razorpay.',
  },
  {
    q: "What happens when I hit my monthly script limit?",
    a: 'Generation is paused until your plan renews or you upgrade to a higher tier. Your saved scripts and ratings are never affected by your plan.',
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-2 flex items-center gap-3">
        <HelpCircle size={24} aria-hidden="true" className="text-sage" />
        <h1 className="text-2xl font-bold heading-serif">Help</h1>
      </div>
      <p className="mb-6 text-sm text-ink-muted">Answers to the most common questions.</p>

      <div className="space-y-3">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="card">
            <h2 className="mb-1.5 text-sm font-semibold text-ink">{q}</h2>
            <p className="text-sm text-ink-muted">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
