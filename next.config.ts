import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Self-hosted: standalone output reducerer Docker-image-størrelse
  output: 'standalone',
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
