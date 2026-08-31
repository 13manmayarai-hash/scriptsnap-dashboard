export const dynamic = 'force-dynamic'

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleAPIError'
  }
}

// A deliberate, uncaught throw — Sentry's Next.js instrumentation
// (instrumentation.ts + sentry.server.config.ts) captures this
// automatically without any explicit Sentry.captureException call, which
// is exactly what this route exists to prove.
export function GET() {
  throw new SentryExampleAPIError('This error is raised on the backend called by the example page.')
}
