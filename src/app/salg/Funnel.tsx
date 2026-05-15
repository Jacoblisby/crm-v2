'use client';

import Image from 'next/image';
import { useFunnel } from './FunnelContext';
import { Step1Address } from './steps/Step1Address';
import { Step2Bolig } from './steps/Step2Bolig';
import { Step3Costs } from './steps/Step3Costs';
import { Step4Profile } from './steps/Step4Profile';
import { Step5Estimate } from './steps/Step5Estimate';
import { FAQ } from './components/FAQ';

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  'Adresse',
  'Boligen',
  'Udgifter',
  'Lidt om dig',
  'Estimat',
];

export function Funnel() {
  const { state } = useFunnel();
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <ProgressBar step={state.step} />
      <div className="bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] p-5 sm:p-8">
        {state.step === 1 && <Step1Address />}
        {state.step === 2 && <Step2Bolig />}
        {state.step === 3 && <Step3Costs />}
        {state.step === 4 && <Step4Profile />}
        {state.step === 5 && <Step5Estimate />}
      </div>
      {state.step === 1 && (
        <>
          <HowItWorks />
          <FAQ />
        </>
      )}
    </div>
  );
}

/**
 * HowItWorks — hand-drawn proces-overblik inspireret af Offerpad's
 * illustrated flowchart-mønster. Bryder den polerede SaaS-look og giver
 * et menneskeligt, varmt indtryk. AI-genererede watercolor-illustrationer
 * i konsistent dansk skandinavisk stil.
 */
function HowItWorks() {
  const steps = [
    {
      img: '/salg-photos/flow/01-beskriv.png',
      title: 'Beskriv din bolig',
      time: '5 minutter',
      body: 'Adresse, fotos og udgifter. Vi henter offentlig data fra OIS automatisk.',
    },
    {
      img: '/salg-photos/flow/02-estimat.png',
      title: 'Få et foreløbigt tilbud',
      time: 'Med det samme',
      body: 'Bygget på sammenlignelige tinglyste handler i din ejerforening og område.',
    },
    {
      img: '/salg-photos/flow/03-besigtigelse.png',
      title: 'Gratis besigtigelse',
      time: 'Indenfor 24 timer',
      body: 'Vi kommer forbi, ser boligen, snakker om dine ønsker og overtagelsesdato.',
    },
    {
      img: '/salg-photos/flow/04-handel.png',
      title: 'Bindende tilbud + handel',
      time: '14 dage – 6 mdr',
      body: 'Du vælger overtagelsesdato. Kontant betaling, ingen mægler, ingen forbehold.',
    },
  ];
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="space-y-8 pt-12 border-t border-slate-200"
    >
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h2
          id="how-it-works-title"
          className="font-black tracking-tight text-3xl sm:text-4xl text-slate-900 leading-tight text-balance"
        >
          Fra adresse til handel på fire skridt
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Vi gør salget enkelt — fra du udfylder formularen til vi underskriver handlen.
        </p>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
          >
            {/* Hand-drawn illustration — eksplicit width/height undgaar CLS */}
            <div className="aspect-square rounded-lg bg-slate-50 overflow-hidden">
              <Image
                src={s.img}
                alt={s.title}
                width={600}
                height={600}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold tabular-nums"
                >
                  {i + 1}
                </span>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <span className="sr-only">Trin {i + 1}, </span>
                  {s.time}
                </p>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed text-pretty">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 max-w-3xl mx-auto">
        <p className="text-sm text-slate-700 text-center leading-relaxed">
          <strong className="text-slate-900">Inspections-garanti:</strong> hvis vores endelige
          tilbud efter besigtigelse afviger mere end 5%, kan du trække dig uden konsekvens.
        </p>
      </div>
    </section>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div
      className="space-y-2.5"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Trin ${step} af ${TOTAL_STEPS}`}
    >
      {/* Single continuous bar (Zillow-style) — segmenter via flex */}
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div
              key={label}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                isDone ? 'bg-slate-900' : isActive ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          return (
            <span
              key={label}
              className={`hidden sm:inline transition-colors ${
                isActive ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              {label}
            </span>
          );
        })}
        <span className="sm:hidden font-semibold text-slate-900">
          Trin {step}/{TOTAL_STEPS} · {STEP_LABELS[step - 1]}
        </span>
      </div>
    </div>
  );
}
