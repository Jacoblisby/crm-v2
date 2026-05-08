/**
 * Design E — Vores design + Opendoor's flow-struktur.
 *
 * Isolerer flow-spørgsmålet fra styling-spørgsmålet:
 * Bruger samme slate-900 design som /salg, men adopterer Opendoor's
 * 8-trins flow med room-by-room condition og transparent service-fee.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';
import { MockFunnelOpendoorOurs } from '@/lib/components/MockFunnelOpendoorOurs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SalgFlowOpendoorPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <Header />
      <Hero />
      <MockFunnelOpendoorOurs />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/design-preview"
          className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium"
        >
          ← Oversigt
        </Link>
        <span className="font-bold text-base text-slate-900">
          365 <span className="text-slate-400">Ejendomme</span>
        </span>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="text-center space-y-4 mt-6 sm:mt-10 px-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
        365 Ejendomme · Vi opkøber kontant
      </p>
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
        Hvad er din bolig værd?
      </h1>
      <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
        Få et foreløbigt tilbud på 5 minutter. Du sparer typisk{' '}
        <strong className="text-slate-900">70.000 kr i salær</strong>.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="max-w-3xl mx-auto px-4 mt-8 pt-8 pb-12 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-200">
      <span>365 Ejendomme · CVR 42 80 04 22</span>
      <span>Sikret af tinglysning · 87+ boliger købt siden 2024</span>
    </footer>
  );
}
