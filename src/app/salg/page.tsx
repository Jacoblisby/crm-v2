/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 *
 * Layout-arkitektur (Opendoor-mod):
 *   - Mode A (Landing): hero med embedded adresse-input + marketing-sektioner
 *   - Mode B (Funnel): fokuseret single-step view, ingen marketing
 *
 * Mode-toggling sker i SalgContent baseret paa FunnelContext.state.
 * FunnelProvider sidder i layout.tsx (deles med SalgHeader).
 */
import { Suspense } from 'react';
import { SalgContent } from './SalgContent';

export const dynamic = 'force-dynamic';

export default function SalgPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted">Indlæser…</div>}>
      <SalgContent />
    </Suspense>
  );
}
