const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}

// Source map upload only runs when SENTRY_AUTH_TOKEN is set (Vercel/CI
// without it just skip the upload step, config still builds fine).
module.exports = withSentryConfig(nextConfig, {
  org: 'man-maya-rai',
  project: 'scriptsnap-dashboard',
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
})
