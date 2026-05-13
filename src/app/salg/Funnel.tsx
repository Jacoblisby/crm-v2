'use client';

import { useFunnel } from './FunnelContext';
import { Step1Address } from './steps/Step1Address';
import { Step2Bolig } from './steps/Step2Bolig';
import { Step3Costs } from './steps/Step3Costs';
import { Step4Profile } from './steps/Step4Profile';
import { Step5Estimate } from './steps/Step5Estimate';

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
    <div className="space-y-6">
      <ProgressBar step={state.step} />
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
        {state.step === 1 && <Step1Address />}
        {state.step === 2 && <Step2Bolig />}
        {state.step === 3 && <Step3Costs />}
        {state.step === 4 && <Step4Profile />}
        {state.step === 5 && <Step5Estimate />}
      </div>
      {state.step === 1 && <HowItWorks />}
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
    <div className="space-y-6 pt-8 border-t border-dashed border-slate-300">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
          Sådan foregår det
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">
          Fra adresse til handel på fire skridt
        </h2>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3 relative"
          >
            {/* Step number badge — overlapper øverst */}
            <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-slate-900 text-white text-base font-bold flex items-center justify-center shadow-md ring-4 ring-white">
              {i + 1}
            </div>

            {/* Hand-drawn illustration */}
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/30 overflow-hidden">
              <img
                src={s.img}
                alt={s.title}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-3xl mx-auto">
        <p className="text-sm text-emerald-900 text-center">
          <strong>Inspections-garanti:</strong> hvis vores endelige tilbud efter besigtigelse
          afviger mere end 5%, kan du trække dig uden konsekvens.
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  isDone || isActive ? 'bg-slate-900' : 'bg-slate-200'
                }`}
              />
            </div>
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
              className={`hidden sm:inline ${
                isActive ? 'text-slate-900 font-medium' : ''
              }`}
            >
              {label}
            </span>
          );
        })}
        <span className="sm:hidden font-medium text-slate-900">
          Trin {step}/{TOTAL_STEPS} · {STEP_LABELS[step - 1]}
        </span>
      </div>
    </div>
  );
}
