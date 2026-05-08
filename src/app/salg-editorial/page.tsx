/**
 * Design B — Editorial Confidence
 * Off-white + deep navy + sparsom amber. Magazine-style hero, Stripe/Linear vibe.
 * Bruger generic MockFunnel med editorial-theme.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';
import { MockFunnel, type MockTheme } from '@/lib/components/MockFunnel';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAVY = '#1e2a3a';
const AMBER = '#d97706';
const PAPER = '#fafaf9';
const RULE = '#e7e5e4';

const EDITORIAL: MockTheme = {
  bg: PAPER,
  bgSecondary: '#ffffff',
  border: RULE,
  text: NAVY,
  textMuted: 'rgba(30,42,58,0.65)',
  accent: NAVY,
  accentText: '#ffffff',
  heading: NAVY,
  fontHeading: 'Georgia, "Times New Roman", serif',
  fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  radius: '0px',
  offerLabel: '№ 01 · Kontant tilbud',
};

export default function SalgEditorialPage() {
  return (
    <div style={{ background: PAPER, color: NAVY }}>
      <PrototypeBanner />
      <Header />
      <Hero />
      <MockFunnel theme={EDITORIAL} />
      <Quote />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={{ borderBottom: `1px solid ${RULE}` }}>
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between text-xs">
        <Link
          href="/design-preview"
          className="uppercase tracking-[0.2em]"
          style={{ color: NAVY, opacity: 0.6 }}
        >
          ← Oversigt
        </Link>
        <div className="flex items-center gap-4">
          <span style={{ fontWeight: 700, letterSpacing: '0.02em' }}>365 EJENDOMME</span>
          <span style={{ opacity: 0.5 }}>Est. 2024</span>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-baseline gap-3 text-xs uppercase tracking-[0.3em] mb-6" style={{ color: AMBER }}>
        <span>№ 01</span>
        <span style={{ background: AMBER, height: 1, flex: 1, opacity: 0.4 }} />
        <span style={{ color: NAVY, opacity: 0.5 }}>Salg uden mægler</span>
      </div>

      <h1
        className="leading-[0.95] tracking-tight mb-8"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
          fontWeight: 400,
          color: NAVY,
        }}
      >
        Sælg din lejlighed.
        <br />
        <em style={{ color: AMBER, fontStyle: 'italic' }}>Uden mægler.</em>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <p className="text-sm leading-relaxed" style={{ color: NAVY }}>
          Vi køber kontant. Du betaler ingen salær, undgår markedsafslag, og slipper for
          ejerudgifter mens boligen står til salg.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: NAVY, opacity: 0.7 }}>
          Tilbuddet bygger på rigtige tinglyste handler — ikke estimater fra algoritmer
          der ikke kender dit hus.
        </p>
      </div>
    </div>
  );
}

function Quote() {
  return (
    <blockquote
      className="max-w-3xl mx-auto my-16 py-8 px-6 sm:px-12"
      style={{ borderLeft: `3px solid ${AMBER}` }}
    >
      <p
        className="text-xl sm:text-2xl leading-relaxed mb-4"
        style={{ fontFamily: 'Georgia, serif', color: NAVY }}
      >
        &ldquo;Det vi betaler er det vi mener boligen er værd — bygget på tinglyste handler
        og rigtige lejeniveauer fra vores egne 218 lejemål. Ikke gætværk.&rdquo;
      </p>
      <footer className="text-xs uppercase tracking-[0.2em]" style={{ color: NAVY, opacity: 0.6 }}>
        Jacob Lisby · Founder
      </footer>
    </blockquote>
  );
}

function Footer() {
  return (
    <footer
      className="max-w-3xl mx-auto px-4 mt-8 pt-8 pb-12 flex flex-wrap items-center justify-between gap-4 text-xs"
      style={{ borderTop: `1px solid ${RULE}`, color: NAVY, opacity: 0.6 }}
    >
      <span>365 Ejendomme · CVR 42 80 04 22</span>
      <span>Sikret af tinglysning</span>
    </footer>
  );
}
