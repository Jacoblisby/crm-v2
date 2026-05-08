/**
 * Design A — Casavo Warm
 * Cream baggrund, sage-grøn accent, serif display. Italiensk boutique-feel.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SalgWarmPage() {
  return (
    <div className="min-h-screen" style={{ background: '#fdfaf6' }}>
      <PrototypeBanner />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 sm:py-16">
        <Hero />
        <AddressForm />
        <ValueProps />
        <Footer />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b" style={{ borderColor: '#ece4d6' }}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/design-preview"
          className="text-xs uppercase tracking-[0.2em] font-medium"
          style={{ color: '#5a7a6e' }}
        >
          ← Tilbage til oversigt
        </Link>
        <div
          className="text-xl"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#1f2937' }}
        >
          365 <span style={{ color: '#5a7a6e' }}>·</span> Ejendomme
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="text-center space-y-5 mt-6 sm:mt-12 mb-12">
      <p
        className="text-xs uppercase tracking-[0.25em] font-medium"
        style={{ color: '#5a7a6e' }}
      >
        Vi opkøber kontant, uden mægler
      </p>
      <h1
        className="text-4xl sm:text-6xl font-normal leading-[1.05] tracking-tight"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#1f2937',
        }}
      >
        Hvad er din bolig <em style={{ color: '#5a7a6e' }}>egentlig</em> værd?
      </h1>
      <p
        className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
        style={{ color: '#4b5563' }}
      >
        Få et foreløbigt tilbud på 5 minutter — bygget på rigtige tinglyste handler i din
        ejerforening. Du sparer typisk{' '}
        <span style={{ color: '#1f2937', fontWeight: 600 }}>70.000 kr i salær</span>.
      </p>
    </div>
  );
}

function AddressForm() {
  return (
    <div
      className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_2px_24px_rgba(90,122,110,0.08)]"
      style={{ border: '1px solid #ece4d6' }}
    >
      <div className="space-y-5">
        <div>
          <h2
            className="text-xl sm:text-2xl mb-1"
            style={{ fontFamily: 'Georgia, serif', color: '#1f2937' }}
          >
            Hvor ligger din lejlighed?
          </h2>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            Skriv adressen — vi henter automatisk størrelse, byggeår og ejendomsdata.
          </p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Vejnavn + nr, postnr"
            className="w-full px-5 py-4 text-base rounded-2xl focus:outline-none transition-colors"
            style={{
              background: '#fdfaf6',
              border: '1.5px solid #ece4d6',
              color: '#1f2937',
            }}
          />
        </div>
        <button
          type="button"
          className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-medium tracking-wide transition-opacity hover:opacity-90"
          style={{ background: '#5a7a6e' }}
        >
          Vis mit foreløbige tilbud →
        </button>
        <p className="text-xs" style={{ color: '#6b7280' }}>
          ✓ Gratis &nbsp; ✓ Uforpligtende &nbsp; ✓ Resultat på 5 minutter
        </p>
      </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
      {items.map((it) => (
        <div
          key={it.title}
          className="rounded-2xl p-6 space-y-2"
          style={{ background: '#f5efe2' }}
        >
          <h3
            className="text-base font-medium"
            style={{ fontFamily: 'Georgia, serif', color: '#1f2937' }}
          >
            {it.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
            {it.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="mt-16 pt-8 text-xs flex flex-wrap justify-between gap-4"
      style={{ borderTop: '1px solid #ece4d6', color: '#6b7280' }}
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
