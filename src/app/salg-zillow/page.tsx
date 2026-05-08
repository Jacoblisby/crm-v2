/**
 * Design D — Zillow
 * Zillow's signatur: signal-blue + house-photo-led, prominent search-bar over photo,
 * data-rich property cards, established marketplace-feel.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const Z_BLUE = '#006aff';
const Z_DARK = '#0e1d35';
const Z_INK = '#0e0e10';
const Z_BG_TINT = '#f4f6f9';

export default function SalgZillowPage() {
  return (
    <div className="min-h-screen bg-white" style={{ color: Z_INK }}>
      <PrototypeBanner />
      <Header />
      <Hero />
      <ValueRow />
      <ComparablesPreview />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200 sticky top-0 z-10 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/design-preview"
            className="text-xs font-medium"
            style={{ color: Z_BLUE }}
          >
            ← Oversigt
          </Link>
          <span className="text-xl font-bold" style={{ color: Z_BLUE, letterSpacing: '-0.02em' }}>
            365<span style={{ color: Z_DARK }}>ejendomme</span>
          </span>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium" style={{ color: Z_DARK }}>
            <span>Sælg</span>
            <span style={{ opacity: 0.4 }}>Køb</span>
            <span style={{ opacity: 0.4 }}>Lej</span>
            <span style={{ opacity: 0.4 }}>Vurdér</span>
          </nav>
        </div>
        <a
          href="tel:+4561789071"
          className="text-sm font-semibold"
          style={{ color: Z_BLUE }}
        >
          +45 61 78 90 71
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      {/* Photo "background" — vi bruger en CSS-gradient som placeholder for et husfoto */}
      <div
        className="relative h-[480px] sm:h-[560px] flex items-center justify-center"
        style={{
          background:
            'linear-gradient(180deg, rgba(14,29,53,0.72), rgba(14,29,53,0.55)), linear-gradient(135deg, #2d4f8e 0%, #6b8ec4 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0, transparent 30%), radial-gradient(circle at 80% 20%, rgba(0,106,255,0.25) 0, transparent 35%)',
        }} />

        <div className="relative max-w-3xl text-center px-4 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            Find ud af hvad din bolig er værd
          </p>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Hvad koster din bolig?
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-xl mx-auto">
            Indtast adressen og få et øjeblikkeligt foreløbigt tilbud bygget på tinglyste
            handler i dit område.
          </p>
          <SearchBar />
        </div>
      </div>
    </section>
  );
}

function SearchBar() {
  return (
    <div
      className="flex flex-col sm:flex-row max-w-2xl mx-auto rounded-lg overflow-hidden"
      style={{ background: 'white', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}
    >
      <div className="flex-1 flex items-center px-4 py-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={Z_BLUE} strokeWidth="2.5" className="mr-3">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Indtast adresse, by eller postnummer"
          className="flex-1 text-base bg-transparent focus:outline-none"
          style={{ color: Z_INK }}
        />
      </div>
      <button
        type="button"
        className="px-8 py-4 text-white font-semibold sm:rounded-r-lg"
        style={{ background: Z_BLUE }}
      >
        Søg
      </button>
    </div>
  );
}

function ValueRow() {
  const props = [
    { label: '87+', sub: 'boliger købt siden 2024' },
    { label: '5 min', sub: 'til foreløbigt tilbud' },
    { label: '70.000 kr', sub: 'typisk sparet i mæglersalær' },
    { label: '14d – 6 mdr', sub: 'du vælger overtagelsen' },
  ];
  return (
    <section className="border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {props.map((p) => (
          <div key={p.sub} className="text-center sm:text-left">
            <div
              className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums"
              style={{ color: Z_BLUE }}
            >
              {p.label}
            </div>
            <div className="text-xs sm:text-sm mt-1" style={{ color: Z_DARK, opacity: 0.7 }}>
              {p.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComparablesPreview() {
  const recent = [
    { addr: 'Bogensevej 53', kvm: 78, price: '1.180.000 kr', date: 'Mar 2026', tag: 'Samme EF' },
    { addr: 'Bogensevej 51, 2.tv', kvm: 65, price: '985.000 kr', date: 'Jan 2026', tag: 'Samme EF' },
    { addr: 'Sandsvinget 12', kvm: 72, price: '1.050.000 kr', date: 'Dec 2025', tag: 'Samme postnr' },
  ];
  return (
    <section style={{ background: Z_BG_TINT }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: Z_BLUE }}>
              Seneste handler
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: Z_DARK }}>
              Hvad andre i området fik
            </h2>
          </div>
          <a className="text-sm font-semibold" style={{ color: Z_BLUE }}>
            Se alle handler →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recent.map((r) => (
            <div key={r.addr} className="bg-white rounded-lg overflow-hidden border border-slate-200">
              {/* Foto-placeholder */}
              <div
                className="h-40"
                style={{
                  background:
                    'linear-gradient(135deg, #cfd9e8 0%, #94a8c4 100%)',
                  position: 'relative',
                }}
              >
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: Z_BLUE, color: 'white' }}
                >
                  {r.tag}
                </div>
                <div
                  className="absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.95)', color: Z_DARK }}
                >
                  Tinglyst
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-xl font-extrabold tabular-nums" style={{ color: Z_DARK }}>
                  {r.price}
                </div>
                <div className="text-sm" style={{ color: Z_DARK, opacity: 0.75 }}>
                  {r.addr} · {r.kvm}m²
                </div>
                <div className="text-xs" style={{ color: Z_DARK, opacity: 0.5 }}>
                  Solgt {r.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-10 text-xs" style={{ color: Z_DARK, opacity: 0.7 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="font-bold mb-2" style={{ color: Z_DARK, opacity: 1 }}>365 Ejendomme</div>
            <div>Vi opkøber kontant uden mægler</div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: Z_DARK, opacity: 1 }}>Sælg</div>
            <div>Boligberegner</div>
            <div>Sale-leaseback</div>
            <div>Lejebolig efter</div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: Z_DARK, opacity: 1 }}>Selskab</div>
            <div>Om os</div>
            <div>Kontakt</div>
            <div>Privatlivspolitik</div>
          </div>
          <div>
            <div className="font-semibold mb-2" style={{ color: Z_DARK, opacity: 1 }}>Kontakt</div>
            <div>+45 61 78 90 71</div>
            <div>administration@365ejendom.dk</div>
            <div>Næstved, DK</div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-200 flex flex-wrap justify-between gap-2">
          <span>© 365 Ejendomme · CVR 42 80 04 22</span>
          <span>Sikret af tinglysning</span>
        </div>
      </div>
    </footer>
  );
}
