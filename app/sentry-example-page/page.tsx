'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { Bug } from 'lucide-react'

// Standalone verification page for the Sentry wiring — not linked from
// anywhere in the app's nav. Fires one client-side error (captured by
// sentry.client.config.ts) and one server-side error (captured
// automatically by instrumentation.ts, via a route that just throws).
// Safe to leave in production; it does nothing unless visited directly.
export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false)

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <Bug size={32} aria-hidden="true" className="mx-auto mb-3 text-sage" />
      <h1 className="mb-2 text-2xl font-bold heading-serif">Sentry wiring check</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Fires one client-side and one server-side test error. If Sentry is
        wired up correctly, both should appear in your Sentry Issues within
        a few seconds.
      </p>
      <button
        type="button"
        className="btn-primary px-6 py-3"
        onClick={async () => {
          await Sentry.startSpan({ name: 'Sentry Example Frontend Span', op: 'test' }, async () => {
            const res = await fetch('/api/sentry-example-api')
            if (!res.ok) {
              setHasSentError(true)
            }
          })
          throw new Error('Sentry Example Frontend Error')
        }}
      >
        Trigger test errors
      </button>
      {hasSentError && (
        <p className="mt-4 text-sm text-sage">
          Errors sent — check your Sentry Issues dashboard.
        </p>
      )}
    </div>
  )
}
