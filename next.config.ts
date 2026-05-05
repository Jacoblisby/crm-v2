import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Self-hosted: standalone output reducerer Docker-image-størrelse
  output: 'standalone',
  // Boligberegner submitter fotos som dataURLs i Server Action body —
  // standard 1MB-limit er for lille til 4-8 fotos.
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

// Wrap kun hvis Sentry DSN er sat — ellers kører Next uden ekstra overhead.
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
