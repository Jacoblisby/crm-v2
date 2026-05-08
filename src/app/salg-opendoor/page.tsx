/**
 * Design C — Opendoor
 * Opendoor's faktiske flow: 8 trin, data-driven, room-by-room condition.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';
import { MockFunnelOpendoor } from '@/lib/components/MockFunnelOpendoor';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const OD_BLUE = '#143cd9';
const OD_INK = '#0b1330';
const OD_CORAL = '#ff5d3a';

export default function SalgOpendoorPage() {
  return (
    <div className="min-h-screen bg-white" style={{ color: OD_INK }}>
      <PrototypeBanner />
      <Header />
      <Hero />
      <MockFunnelOpendoor />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/design-preview"
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: OD_BLUE }}
        >
          ← Oversigt
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: OD_INK }}>
            365<span style={{ color: OD_CORAL }}>.</span>
          </span>
          <a
            href="tel:+4561789071"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold rounded-full"
            style={{ background: OD_INK, color: 'white' }}
          >
            Ring til os
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(20,60,217,0.07), transparent 60%)',
        }}
      />
      <div className="relative max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#fff1ed', color: OD_CORAL }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: OD_CORAL }} />
          Sig hej til en nemmere måde at sælge
        </div>

        <h1
          className="text-4xl sm:text-6xl font-extrabold leading-[0.98] tracking-tight"
          style={{ color: OD_INK, letterSpacing: '-0.025em' }}
        >
          Sælg din bolig.
          <br />
          <span style={{ color: OD_BLUE }}>Spring linjen over.</span>
        </h1>

        <p className="text-base sm:text-lg leading-relaxed max-w-md mx-auto" style={{ color: OD_INK, opacity: 0.7 }}>
          Få et stærkt kontant tilbud på 5 minutter. Vi køber direkte — uden mægler,
          uden ventetid.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <span>© 365 Ejendomme · CVR 42 80 04 22</span>
        <span>Sikret af tinglysning · Bygget med kærlighed i Næstved</span>
      </div>
    </footer>
  );
}
