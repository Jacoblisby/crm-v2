import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Fraunces } from 'next/font/google';
import { FunnelV3Provider } from './FunnelV3Context';
import { SalgV3Header } from './components/SalgV3Header';
import { GrainOverlay } from './components/GrainOverlay';

/**
 * Salg v3 — editorial-warm aesthetic.
 *
 * Designstrategi:
 *   - Theme: lys, "trykt avis-tillæg paa koekkenbordet"
 *   - Color strategy: committed (cream/teal carrer 40-50% af surface)
 *   - Body: Geist (clean grotesque, ikke Inter)
 *   - Display + tal: Fraunces (variable-font opt-sizing + Soft cut)
 *   - Grain overlay 5% paa hele siden for "trykt papir" feel
 *   - Tinted teal-shadows i stedet for sort
 *
 * Scenen: sjaellandsk boligejer 50-65 aar, sidder ved koekkenbordet kl. 21
 * med iPad. Stress, ikke spil-mode. Tillid > playfulness.
 */
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  // Soft cut + opsz for optical sizing paa large display
  axes: ['SOFT', 'opsz'],
});

export const metadata: Metadata = {
  title: 'Saelg din bolig kontant · 365 Ejendomme',
  description:
    'Foreloebigt tilbud paa din ejerlejlighed paa 5 minutter. Kontant, uden maegler.',
};

export default function SalgV3Layout({ children }: { children: React.ReactNode }) {
  return (
    <FunnelV3Provider>
      <div
        className={`${geist.variable} ${fraunces.variable} salg-v3-root min-h-screen relative`}
        style={{ background: 'oklch(0.965 0.012 80)' }}
      >
        <GrainOverlay />
        <SalgV3Header />
        <main className="relative z-[1]">{children}</main>
        <footer className="relative z-[1] border-t py-10" style={{ borderColor: 'oklch(0.91 0.015 80)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 flex flex-wrap gap-4 justify-between items-center text-[13px]"
               style={{ color: 'oklch(0.46 0.02 80)' }}>
            <div className="py-2 font-body">
              © 365 Ejendomme · Boligselskabet Sommerhave ApS · Naestved · CVR 41763736
            </div>
            <div className="flex gap-6">
              <Link href="https://365ejendom.dk/privatlivspolitik" className="hover:underline">Privatliv</Link>
              <Link href="https://365ejendom.dk" className="hover:underline">365ejendom.dk</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* v3 token-overrides — scoped til .salg-v3-root */}
      <style>{`
        .salg-v3-root {
          --ink:        oklch(0.18 0.015 80);    /* warm near-black */
          --ink-soft:   oklch(0.32 0.015 80);
          --muted:      oklch(0.46 0.02 80);
          --soft:       oklch(0.62 0.022 80);
          --cream:      oklch(0.965 0.012 80);
          --cream-deep: oklch(0.93 0.018 80);
          --paper:      oklch(0.985 0.008 80);
          --border:     oklch(0.91 0.015 80);
          --teal:       oklch(0.35 0.045 200);   /* desaturet teal, varmere */
          --teal-deep:  oklch(0.25 0.05 200);
          --teal-tint:  oklch(0.95 0.025 200);
          /* tinted teal-shadows i stedet for sort */
          --shadow-soft:  0 6px 24px -10px oklch(0.35 0.045 200 / 0.18);
          --shadow-card:  0 12px 40px -16px oklch(0.35 0.045 200 / 0.22);
          --shadow-lift:  0 20px 60px -20px oklch(0.25 0.05 200 / 0.28);
        }
        .salg-v3-root .font-display {
          font-family: var(--font-display), Georgia, serif;
          font-variation-settings: 'opsz' 144, 'SOFT' 100;
        }
        .salg-v3-root .font-display-tight {
          font-family: var(--font-display), Georgia, serif;
          font-variation-settings: 'opsz' 144, 'SOFT' 30;
          letter-spacing: -0.025em;
        }
        .salg-v3-root .font-body {
          font-family: var(--font-body), system-ui, sans-serif;
        }
        .salg-v3-root .font-tabular {
          font-variant-numeric: tabular-nums lining-nums;
        }
        .salg-v3-root .ink         { color: var(--ink); }
        .salg-v3-root .ink-soft    { color: var(--ink-soft); }
        .salg-v3-root .muted       { color: var(--muted); }
        .salg-v3-root .soft        { color: var(--soft); }
        .salg-v3-root .bg-paper    { background: var(--paper); }
        .salg-v3-root .bg-cream    { background: var(--cream); }
        .salg-v3-root .bg-cream-deep { background: var(--cream-deep); }
        .salg-v3-root .bg-teal     { background: var(--teal); }
        .salg-v3-root .bg-teal-tint { background: var(--teal-tint); }
        .salg-v3-root .accent      { color: var(--teal); }
        .salg-v3-root .border-warm { border-color: var(--border); }
        .salg-v3-root .shadow-soft { box-shadow: var(--shadow-soft); }
        .salg-v3-root .shadow-card { box-shadow: var(--shadow-card); }
        .salg-v3-root .shadow-lift { box-shadow: var(--shadow-lift); }
      `}</style>
    </FunnelV3Provider>
  );
}
