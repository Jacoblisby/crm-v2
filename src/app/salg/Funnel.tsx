'use client';

import { Pencil, Sparkles, Home, Handshake } from 'lucide-react';
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
    <div className="space-y-5 pt-6">
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
