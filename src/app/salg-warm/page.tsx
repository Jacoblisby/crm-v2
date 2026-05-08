/**
 * Design A — Casavo Warm
 * Cream baggrund, sage-grøn accent, serif display. Italiensk boutique-feel.
 * Bruger generic MockFunnel med warm-theme.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';
import { MockFunnel, type MockTheme } from '@/lib/components/MockFunnel';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const WARM: MockTheme = {
  bg: '#fdfaf6',
  bgSecondary: '#ffffff',
  border: '#ece4d6',
  text: '#1f2937',
  textMuted: '#6b7280',
  accent: '#5a7a6e',
  accentText: '#ffffff',
  heading: '#1f2937',
  fontHeading: 'Georgia, "Times New Roman", serif',
  fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  radius: '12px',
  offerLabel: 'Vores foreløbige tilbud',
};

export default function SalgWarmPage() {
  return (
    <div style={{ background: WARM.bg }}>
      <PrototypeBanner />
      <Header />
      <Hero />
      <MockFunnel theme={WARM} />
      <ValueProps />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b" style={{ borderColor: WARM.border }}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/design-preview"
          className="text-xs uppercase tracking-[0.2em] font-medium"
          style={{ color: WARM.accent }}
        >
          ← Tilbage til oversigt
        </Link>
        <div
          className="text-xl"
          style={{ fontFamily: WARM.fontHeading, color: WARM.heading }}
        >
          365 <span style={{ color: WARM.accent }}>·</span> Ejendomme
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="text-center space-y-5 mt-6 sm:mt-12 px-4">
      <p
        className="text-xs uppercase tracking-[0.25em] font-medium"
        style={{ color: WARM.accent }}
      >
        Vi opkøber kontant, uden mægler
      </p>
      <h1
        className="text-4xl sm:text-6xl font-normal leading-[1.05] tracking-tight"
        style={{
          fontFamily: WARM.fontHeading,
          color: WARM.heading,
        }}
      >
        Hvad er din bolig <em style={{ color: WARM.accent }}>egentlig</em> værd?
      </h1>
      <p
        className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
        style={{ color: '#4b5563' }}
      >
        Få et foreløbigt tilbud på 5 minutter — bygget på rigtige tinglyste handler i din
        ejerforening. Du sparer typisk{' '}
        <span style={{ color: WARM.heading, fontWeight: 600 }}>70.000 kr i salær</span>.
      </p>
    </div>
  );
}

function ValueProps() {
  const items = [
    {
      title: 'Kontant betaling',
      body: 'Vi handler kontant. Ingen bank-forbehold, ingen ventetid.',
    },
    {
      title: 'Du vælger overtagelsen',
      body: 'Fra 14 dage til 6 måneder — som det passer dig og dit liv.',
    },
    {
      title: 'Inspections-garanti',
      body: 'Hvis vores endelige tilbud afviger mere end 5%, kan du trække dig.',
    },
  ];
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-2xl p-6 space-y-2"
            style={{ background: '#f5efe2' }}
          >
            <h3
              className="text-base font-medium"
              style={{ fontFamily: WARM.fontHeading, color: WARM.heading }}
            >
              {it.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
              {it.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="max-w-4xl mx-auto px-4 mt-8 pt-8 pb-12 text-xs flex flex-wrap justify-between gap-4"
      style={{ borderTop: `1px solid ${WARM.border}`, color: WARM.textMuted }}
    >
      <div>© 365 Ejendomme · CVR 42 80 04 22</div>
      <div className="flex gap-4">
        <span>Sikret af tinglysning</span>
        <span>·</span>
        <span>87+ boliger købt siden 2024</span>
      </div>
    </footer>
  );
}
