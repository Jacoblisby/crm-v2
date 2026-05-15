/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 *
 * Layout-filosofi: Zillow-inspired. Stort centreret hero med en eneste CTA-input,
 * ingen stats over fold der konkurrerer. Trust-elementer placeres UNDER fold som
 * Zillow's /how-much-is-my-home-worth siden gor det.
 */
import { Suspense } from 'react';
import { FunnelProvider } from './FunnelContext';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-500">Indlæser…</div>}>
      <FunnelProvider>
        <div className="space-y-12 sm:space-y-16">
          {/* Hero — Zillow-style: rent, centreret, kun H1 + subhead + funnel-input */}
          <section
            aria-labelledby="hero-title"
            className="text-center max-w-2xl mx-auto pt-6 sm:pt-12 px-2"
          >
            <h1
              id="hero-title"
              className="font-black tracking-tight text-[42px] sm:text-[64px] text-slate-900 leading-[1.05] text-balance"
            >
              Hvad er din bolig værd?
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed text-pretty">
              Indtast din adresse for at få et foreløbigt kontant tilbud baseret på sammenlignelige
              handler i dit område. Vi handler uden mægler — du sparer typisk{' '}
              <span className="text-slate-900 font-semibold">70.000 kr i salær</span>.
            </p>
          </section>

          {/* Funnel — adressen i Step 1 fungerer som hero-CTA */}
          <Funnel />

          {/* Trust strip under fold — Zillow-style "social proof" sektion */}
          <TrustStrip />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}

function TrustStrip() {
  return (
    <section
      aria-label="Tillids-tal"
      className="grid grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden max-w-3xl mx-auto"
    >
      <div className="bg-white p-5 sm:p-6 text-center">
        <div className="font-black tracking-tight text-3xl sm:text-4xl text-slate-900 tabular-nums">87+</div>
        <div className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
          Boliger købt siden 2024
        </div>
      </div>
      <div className="bg-white p-5 sm:p-6 text-center">
        <div className="font-black tracking-tight text-3xl sm:text-4xl text-slate-900 tabular-nums whitespace-nowrap">
          <span className="sm:hidden">≤6 mdr</span>
          <span className="hidden sm:inline">14d – 6 mdr</span>
        </div>
        <div className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
          Du vælger overtagelse
        </div>
      </div>
      <div className="bg-white p-5 sm:p-6 text-center">
        <div className="font-black tracking-tight text-3xl sm:text-4xl text-slate-900 tabular-nums">2,5M+</div>
        <div className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">
          Sparet i salær
        </div>
      </div>
    </section>
  );
}
