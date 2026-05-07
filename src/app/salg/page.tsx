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
          <div className="text-center space-y-4 mt-4 sm:mt-10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
              365 Ejendomme · Vi opkøber kontant
            </p>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              Hvad er din bolig værd?
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              Få et foreløbigt tilbud baseret på sammenlignelige handler i dit område. Vi
              handler kontant uden mægler. Du sparer typisk{' '}
              <strong className="text-slate-900">70.000 kr i salær</strong>.
            </p>
          </div>

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
    <div className="grid grid-cols-3 gap-3 text-center text-xs">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-2xl font-bold text-slate-900 tabular-nums">87+</div>
        <div className="text-slate-600 mt-0.5">Boliger købt siden 2024</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        {/* Mobile bruger forkortet form sa kortet ikke vokser i hojden */}
        <div className="text-2xl font-bold text-slate-900 tabular-nums whitespace-nowrap">
          <span className="sm:hidden">≤ 6 mdr</span>
          <span className="hidden sm:inline">14 dage – 6 mdr</span>
        </div>
        <div className="text-slate-600 mt-0.5">Du vælger overtagelse</div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-2xl font-bold text-slate-900 tabular-nums">2,5M+</div>
        <div className="text-slate-600 mt-0.5">Sparet i salær</div>
      </div>
    </div>
  );
}

