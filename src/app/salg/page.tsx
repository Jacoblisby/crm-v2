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
        <div className="space-y-6">
          <div className="text-center space-y-2 mt-4 sm:mt-8">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
              365 Ejendomme · Vi opkøber kontant
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Få et tilbud
              <br />
              <span className="text-emerald-600">på 5 minutter</span>
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Få et foreløbigt tilbud baseret på sammenlignelige handler i dit område. Vi handler
              kontant uden mægler — du sparer typisk{' '}
              <strong className="text-slate-900">50.000+ kr i salær</strong>.
            </p>
          </div>
          <Funnel />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}
