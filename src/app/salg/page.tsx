/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 *
 * Layout-filosofi: Opendoor-inspired. Warm cream baggrund (#FAF7F2), hvide cards
 * der popper, H1 med medium weight (500) og tightt tracking (modsat brutal Black 900).
 * Trust-elementer som kundecitater placeres under fold.
 */
import { Suspense } from 'react';
import { FunnelProvider } from './FunnelContext';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-stone-500">Indlæser…</div>}>
      <FunnelProvider>
        <div className="space-y-14 sm:space-y-20">
          {/* Hero — Opendoor-style: warm cream, refined H1 weight 500 */}
          <section
            aria-labelledby="hero-title"
            className="text-center max-w-3xl mx-auto pt-4 sm:pt-12"
          >
            <h1
              id="hero-title"
              className="text-[44px] sm:text-[72px] font-medium text-slate-900 leading-[0.98] tracking-[-0.035em] text-balance"
            >
              Sælg din bolig.<br />
              <span className="text-stone-500">Den nemme måde.</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-stone-700 max-w-xl mx-auto leading-relaxed text-pretty">
              Få et foreløbigt kontant tilbud baseret på sammenlignelige handler i dit
              område. Ingen mægler, ingen lange ventetider — du sparer typisk{' '}
              <span className="text-slate-900 font-semibold">70.000 kr i salær</span>.
            </p>
          </section>

          {/* Funnel — adressen i Step 1 er hero-CTA'en */}
          <Funnel />

          {/* Kundecitater — Opendoor-style social proof med foto-avatars */}
          <Testimonials />

          {/* Trust-tal */}
          <TrustStrip />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}

function Testimonials() {
  const items = [
    {
      quote:
        '"Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og 3 uger senere var handlen lukket."',
      name: 'Mette K.',
      location: 'Solgt i Næstved, 2025',
    },
    {
      quote:
        '"Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede."',
      name: 'Lars P.',
      location: 'Solgt i Roskilde, 2024',
    },
    {
      quote:
        '"Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Mere transparent end nogen mægler vi har snakket med."',
      name: 'Anne & Søren',
      location: 'Solgt i Ringsted, 2024',
    },
  ];
  return (
    <section
      aria-labelledby="testimonials-title"
      className="max-w-5xl mx-auto space-y-8"
    >
      <div className="space-y-2 max-w-2xl">
        <p className="text-sm text-stone-600">Hvorfor sælgere vælger os</p>
        <h2
          id="testimonials-title"
          className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight"
        >
          87+ boliger købt siden 2024
        </h2>
        <p className="text-base text-stone-600 leading-relaxed">
          Rigtige sælgere. Rigtige historier. Sådan har vi gjort det enkelt for andre på Sjælland.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((t) => (
          <figure
            key={t.name}
            className="bg-stone-100/60 rounded-2xl p-6 sm:p-7 flex flex-col gap-4"
          >
            {/* Avatar placeholder — circular stone background */}
            <div
              aria-hidden="true"
              className="w-12 h-12 rounded-full bg-stone-300/70 flex items-center justify-center text-stone-600 font-semibold text-sm"
            >
              {t.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <blockquote className="text-sm text-slate-800 leading-relaxed italic flex-1">
              {t.quote}
            </blockquote>
            <figcaption className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900">{t.name}</div>
              <div className="text-xs text-stone-600">{t.location}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section
      aria-label="Tillids-tal"
      className="max-w-3xl mx-auto grid grid-cols-3 gap-3 sm:gap-4"
    >
      <Stat value="87+" label="Boliger købt siden 2024" />
      <StatMd mobile="≤6 mdr" desktop="14d – 6 mdr" label="Du vælger overtagelse" />
      <Stat value="2,5M+" label="Sparet i salær" />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 text-center">
      <div className="text-3xl sm:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-xs sm:text-sm text-stone-600 mt-2 leading-snug">{label}</div>
    </div>
  );
}

function StatMd({ mobile, desktop, label }: { mobile: string; desktop: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 text-center">
      <div className="text-3xl sm:text-4xl font-semibold text-slate-900 tabular-nums tracking-tight whitespace-nowrap">
        <span className="sm:hidden">{mobile}</span>
        <span className="hidden sm:inline">{desktop}</span>
      </div>
      <div className="text-xs sm:text-sm text-stone-600 mt-2 leading-snug">{label}</div>
    </div>
  );
}
