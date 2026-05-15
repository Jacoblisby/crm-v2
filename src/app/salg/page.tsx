/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 */
import { Suspense } from 'react';
import { FunnelProvider } from './FunnelContext';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Indlæser…</div>}>
      <FunnelProvider>
        <div className="space-y-10">
          <section aria-labelledby="hero-title" className="text-center space-y-4 mt-4 sm:mt-10">
            <p className="text-sm uppercase tracking-[0.18em] text-amber-700 font-semibold">
              365 Ejendomme · Vi opkøber kontant
            </p>
            <h1
              id="hero-title"
              className="font-display text-5xl sm:text-7xl font-semibold text-slate-900 leading-[1.02] text-balance"
            >
              Hvad er din bolig værd?
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed text-pretty">
              Få et foreløbigt tilbud baseret på sammenlignelige handler i dit område. Vi
              handler kontant uden mægler. Du sparer typisk{' '}
              <strong className="text-slate-900">70.000 kr i salær</strong>.
            </p>
          </section>

          {/* Trust-strip oeverst — synlig fra sekund et */}
          <TrustStrip />

          <Funnel />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}

function TrustStrip() {
  return (
    <section aria-label="Tillids-tal" className="grid grid-cols-3 gap-3 text-center">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">87+</div>
        <div className="text-[13px] text-slate-700 mt-1 leading-snug">
          Boliger købt siden 2024
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        {/* Mobile bruger forkortet form sa kortet ikke vokser i hojden */}
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums whitespace-nowrap">
          <span className="sm:hidden">≤ 6 mdr</span>
          <span className="hidden sm:inline">14 dage – 6 mdr</span>
        </div>
        <div className="text-[13px] text-slate-700 mt-1 leading-snug">
          Du vælger overtagelse
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">2,5M+</div>
        <div className="text-[13px] text-slate-700 mt-1 leading-snug">Sparet i salær</div>
      </div>
    </section>
  );
}

