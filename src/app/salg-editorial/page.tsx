/**
 * Design B — Editorial Confidence
 * Off-white + deep navy + sparsom amber. Magazine-style hero, Stripe/Linear vibe.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAVY = '#1e2a3a';
const AMBER = '#d97706';
const PAPER = '#fafaf9';
const RULE = '#e7e5e4';

export default function SalgEditorialPage() {
  return (
    <div className="min-h-screen" style={{ background: PAPER, color: NAVY }}>
      <PrototypeBanner />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <Hero />
        <AddressForm />
        <Numbers />
        <Quote />
        <Footer />
      </main>
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
    <div className="space-y-8 mb-14">
      <div className="flex items-baseline gap-3 text-xs uppercase tracking-[0.3em]" style={{ color: AMBER }}>
        <span>№ 01</span>
        <span style={{ background: AMBER, height: 1, flex: 1, opacity: 0.4 }} />
        <span style={{ color: NAVY, opacity: 0.5 }}>Salg uden mægler</span>
      </div>

      <h1
        className="leading-[0.95] tracking-tight"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
          fontWeight: 400,
          color: NAVY,
        }}
      >
        Sælg din lejlighed.
        <br />
        <em style={{ color: AMBER, fontStyle: 'italic' }}>Uden mægler.</em>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
        <p className="text-base leading-relaxed" style={{ color: NAVY }}>
          Vi køber kontant. Du betaler ingen salær, undgår markedsafslag, og slipper for
          ejerudgifter mens boligen står til salg.
        </p>
        <p className="text-base leading-relaxed" style={{ color: NAVY, opacity: 0.7 }}>
          Tilbuddet bygger på rigtige tinglyste handler i din ejerforening og dit område —
          ikke estimater fra algoritmer der ikke kender dit hus.
        </p>
      </div>
    </div>
  );
}

function AddressForm() {
  return (
    <section className="mb-16">
      <div className="space-y-5">
        <p
          className="text-xs uppercase tracking-[0.2em] font-semibold"
          style={{ color: AMBER }}
        >
          Få estimat på 5 minutter
        </p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Vejnavn + nr, postnr"
            className="w-full px-0 py-4 text-2xl bg-transparent focus:outline-none"
            style={{
              borderBottom: `2px solid ${NAVY}`,
              color: NAVY,
              fontFamily: 'Georgia, serif',
            }}
          />
          <button
            type="button"
            className="px-8 py-4 text-white text-sm tracking-wide font-medium transition-colors hover:opacity-90"
            style={{ background: NAVY, borderRadius: 0 }}
          >
            Vis mit estimat →
          </button>
        </div>
      </div>
    </section>
  );
}

function Numbers() {
  const stats = [
    { num: '87+', label: 'Boliger købt siden 2024' },
    { num: '70.000', label: 'kr typisk sparet i salær' },
    { num: '14 dage – 6 mdr', label: 'Du vælger overtagelsen' },
  ];
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-3 gap-px mb-16"
      style={{ background: RULE, border: `1px solid ${RULE}` }}
    >
      {stats.map((s) => (
        <div key={s.label} className="p-6 sm:p-8" style={{ background: PAPER }}>
          <div
            className="text-3xl sm:text-4xl mb-2 tabular-nums"
            style={{ fontFamily: 'Georgia, serif', color: NAVY }}
          >
            {s.num}
          </div>
          <div className="text-xs uppercase tracking-wider" style={{ color: NAVY, opacity: 0.6 }}>
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}

function Quote() {
  return (
    <blockquote
      className="my-16 py-8 px-6 sm:px-12"
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
      className="mt-16 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs"
      style={{ borderTop: `1px solid ${RULE}`, color: NAVY, opacity: 0.6 }}
    >
      <span>365 Ejendomme · CVR 42 80 04 22</span>
      <span>Sikret af tinglysning</span>
    </footer>
  );
}
