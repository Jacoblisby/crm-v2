/**
 * /design-preview — index over alle 5 design-varianter af salgssiden.
 * Lokal-only sammenligning. Production /salg er uændret.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const VARIANTS = [
  {
    href: '/salg',
    name: 'Current (Slate Premium)',
    desc: 'Slate-900 monokrom, Apple/Compass-vibe. Det vi har i dag.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-warm',
    name: 'A — Casavo Warm',
    desc: 'Cream + sage-grøn + serif display. Italiensk boutique, varm og imødekommende.',
    palette: ['#fdfaf6', '#5a7a6e', '#1f2937'],
  },
  {
    href: '/salg-editorial',
    name: 'B — Editorial Confidence',
    desc: 'Off-white + deep navy + amber accent. Magazine-style hero, Stripe/Linear-vibe.',
    palette: ['#fafaf9', '#1e2a3a', '#d97706'],
  },
  {
    href: '/salg-opendoor',
    name: 'C — Opendoor',
    desc: 'Bright tech-blå + friendly bold sans + photo-led. Direkte iBuyer-DNA.',
    palette: ['#1e40af', '#ffffff', '#f54f3a'],
  },
  {
    href: '/salg-zillow',
    name: 'D — Zillow',
    desc: 'Zillow-blå + data-rich + house-photo-heavy. Established marketplace-feel.',
    palette: ['#006aff', '#ffffff', '#0e1d35'],
  },
];

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
            Lokal design-sammenligning
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Salgsside — 5 retninger
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Sammenlign current implementering med 4 alternativer. Production /salg og CRM er
            uændret. Klik dig igennem for at vurdere stil.
          </p>
        </div>

        <ul className="space-y-3">
          {VARIANTS.map((v) => (
            <li key={v.href}>
              <Link
                href={v.href}
                className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-semibold text-slate-900">{v.name}</h2>
                      <span className="text-xs text-slate-500">{v.href}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {v.palette.map((c, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full border border-slate-200"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs text-slate-500 pt-4 border-t border-slate-200">
          Prototyperne viser hero + Step 1 (adresse-form) i hver stil. Funnel-logikken er
          uændret. Når du har valgt retning kan vi rulle den ud i den rigtige /salg.
        </p>
      </div>
    </div>
  );
}
