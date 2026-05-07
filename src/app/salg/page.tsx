/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 */
import { Suspense } from 'react';
import { Pencil, Sparkles, Home, Handshake } from 'lucide-react';
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

          {/* Hvordan-foregar-det i bunden — efter funnel'en */}
          <HowItWorks />
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

function HowItWorks() {
  const steps = [
    {
      Icon: Pencil,
      title: 'Beskriv din bolig',
      time: '5 minutter',
      body: 'Adresse, fotos og udgifter. Vi henter offentlig data automatisk.',
    },
    {
      Icon: Sparkles,
      title: 'Få et foreløbigt tilbud',
      time: 'Med det samme',
      body: 'Bygget på sammenlignelige tinglyste handler i din ejerforening og område.',
    },
    {
      Icon: Home,
      title: 'Gratis besigtigelse',
      time: 'Indenfor 24 timer',
      body: 'Vi kommer forbi, ser boligen, snakker om dine ønsker.',
    },
    {
      Icon: Handshake,
      title: 'Bindende tilbud + handel',
      time: '14 dage – 6 mdr',
      body: 'Du vælger overtagelsesdato. Kontant betaling, ingen mægler.',
    },
  ];
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
          Sådan foregår det
        </p>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-semibold flex items-center justify-center">
                {i + 1}
              </span>
              <s.Icon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                {s.time}
              </p>
              <h3 className="text-base font-semibold text-slate-900 leading-snug">
                {s.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-500 text-center">
        Inspections-garanti: hvis vores endelige tilbud efter besigtigelse afviger mere end 5%,
        kan du trække dig uden konsekvens.
      </p>
    </div>
  );
}
