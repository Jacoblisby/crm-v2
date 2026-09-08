import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/**
 * Sælgersiderne skal ligge på deres eget domæne.
 *
 * Modtageren af et brev skal ikke skulle taste «crm.365ejendom.dk» — det er
 * vores interne værktøj, og det siger intet til en sælger. saelg.365ejendom.dk
 * er kortere, forklarer sig selv, og fylder mindre i en QR-kode.
 *
 * Omskrivningerne rammer KUN når Host-headeren er det nye domæne, så
 * crm.365ejendom.dk er uberørt. De sender roden til forsiden, så adressen
 * bliver «saelg.365ejendom.dk» og ikke «.../frontpage».
 */
const SAELG_DOMAENE = 'saelg.365ejendom.dk';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: SAELG_DOMAENE }],
        destination: '/frontpage',
      },
      // Flowet får en adresse en sælger kan læse. /salg-v4 virker fortsat,
      // så eksisterende links ikke knækker.
      {
        source: '/tjek-din-pris',
        has: [{ type: 'host', value: SAELG_DOMAENE }],
        destination: '/salg-v4',
      },
    ];
  },
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
