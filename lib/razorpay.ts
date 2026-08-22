// Razorpay's Node SDK rejects API errors with a plain object
// ({ statusCode, error: { code, description, ... } }), not an Error
// instance — see node_modules/razorpay/dist/api.js's normalizeError.
// `error instanceof Error` is always false for these, so extracting
// `.message` alone silently discards the real reason (missing/invalid
// keys, account not activated, bad amount, etc.) in favor of a generic
// fallback string.
export function getRazorpayErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const description = (error as { error?: { description?: string } }).error?.description
    if (description) return description
  }
  if (error instanceof Error) return error.message
  return fallback
}
