/**
 * Design D — Zillow
 * Zillow's info-led flow: search first, see Zestimate + comparables, derefter "get cash offer"-CTA.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';
import { MockFunnelZillow } from '@/lib/components/MockFunnelZillow';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const Z_BLUE = '#006aff';
const Z_DARK = '#0e1d35';
const Z_INK = '#0e0e10';

export default function SalgZillowPage() {
  return (
    <div className="min-h-screen bg-white" style={{ color: Z_INK }}>
      <PrototypeBanner />
      <Header />
      <MockFunnelZillow />
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
