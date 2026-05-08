/**
 * Design C — Opendoor
 * Opendoor's signatur: friendly bold, royal blue + warm coral, big address-CTA hero,
 * "Sig hej til en bedre måde at sælge"-vibe.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const OD_BLUE = '#143cd9';
const OD_CORAL = '#ff5d3a';
const OD_INK = '#0b1330';
const OD_BG = '#ffffff';

export default function SalgOpendoorPage() {
  return (
    <div className="min-h-screen" style={{ background: OD_BG, color: OD_INK }}>
      <PrototypeBanner />
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Steps />
        <Footer />
      </main>
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
      {/* gradient blob */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(20,60,217,0.07), transparent 60%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#fff1ed', color: OD_CORAL }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: OD_CORAL }} />
            Sig hej til en nemmere måde at sælge
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.98] tracking-tight"
            style={{ color: OD_INK, letterSpacing: '-0.025em' }}
          >
            Sælg din bolig.
            <br />
            <span style={{ color: OD_BLUE }}>Spring linjen over.</span>
          </h1>

          <p className="text-lg text-slate-700 leading-relaxed max-w-md">
            Få et stærkt kontant tilbud på 5 minutter. Vi køber direkte — uden mægler, uden
            besigtigelser med fremmede mennesker, uden ventetid.
          </p>

          <AddressBar />

          <div className="flex items-center gap-6 text-xs text-slate-500 pt-2">
            <span>★★★★★ 4.8 fra 87+ sælgere</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Du sparer typisk 70.000 kr i salær</span>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div
            className="rounded-3xl p-8 space-y-4"
            style={{ background: OD_BLUE, color: 'white' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
              <span style={{ width: 8, height: 8, borderRadius: 999, background: OD_CORAL }} />
              Eksempel-tilbud
            </div>
            <div>
              <div className="text-sm opacity-80">Bogensevej 53, 4700 Næstved · 67m²</div>
              <div className="text-5xl font-extrabold mt-2 tracking-tight tabular-nums">
                1.245.000 kr
              </div>
              <div className="text-sm opacity-80 mt-1">Kontant. Ingen forbehold.</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-4 border-t border-white/15">
              <div>
                <div className="opacity-70">Mæglersalær sparet</div>
                <div className="font-semibold">70.000 kr</div>
              </div>
              <div>
                <div className="opacity-70">Overtagelse</div>
                <div className="font-semibold">14 dage – 6 mdr</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AddressBar() {
  return (
    <div
      className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl"
      style={{ background: 'white', boxShadow: '0 8px 32px rgba(11,19,48,0.08)', border: '1px solid #e2e8f0' }}
    >
      <input
        type="text"
        placeholder="Indtast din adresse"
        className="flex-1 px-4 py-3 text-base bg-transparent focus:outline-none"
        style={{ color: OD_INK }}
      />
      <button
        type="button"
        className="px-6 py-3 rounded-xl font-semibold text-white"
        style={{ background: OD_BLUE }}
      >
        Få mit tilbud
      </button>
    </div>
  );
}

function SocialProof() {
  const items = [
    { icon: '🏠', n: '87+', label: 'Boliger købt siden 2024' },
    { icon: '⚡', n: '5 min', label: 'Til foreløbigt tilbud' },
    { icon: '✅', n: '14d – 6 mdr', label: 'Du vælger overtagelsen' },
    { icon: '💰', n: '70.000 kr', label: 'Typisk sparet i salær' },
  ];
  return (
    <section className="bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="text-2xl mb-1">{it.icon}</div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums" style={{ color: OD_INK }}>
              {it.n}
            </div>
            <div className="text-xs text-slate-600 mt-1">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Steps() {
  const steps = [
    {
      n: 1,
      title: 'Beskriv din bolig',
      body: 'Adresse + et par detaljer rum-for-rum. Vi henter offentlig data automatisk.',
    },
    {
      n: 2,
      title: 'Få et tilbud — straks',
      body: 'Bygget på rigtige tinglyste handler i din ejerforening. Ikke algoritme-gætværk.',
    },
    {
      n: 3,
      title: 'Gratis besigtigelse',
      body: 'Vi kommer forbi indenfor 24 timer. Bekræfter eller justerer tilbuddet.',
    },
    {
      n: 4,
      title: 'Du vælger dato',
      body: 'Fra 14 dage til 6 måneder. Vi handler kontant uden bank-forbehold.',
    },
  ];
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: OD_CORAL }}>
          Sådan virker det
        </p>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight" style={{ color: OD_INK }}>
          Færdig på 5 minutter
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-300 transition-colors">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg mb-4"
              style={{ background: '#eef2ff', color: OD_BLUE }}
            >
              {s.n}
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: OD_INK }}>
              {s.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
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
