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
        <div className="space-y-8">
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
          <Funnel />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}
