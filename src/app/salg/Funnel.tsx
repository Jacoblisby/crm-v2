'use client';

import { useFunnel } from './FunnelContext';
import { Step1Address } from './steps/Step1Address';
import { Step2Photos } from './steps/Step2Photos';
import { Step3Costs } from './steps/Step3Costs';
import { Step4Stand } from './steps/Step4Stand';
import { Step5Contact } from './steps/Step5Contact';
import { Step6Estimate } from './steps/Step6Estimate';

export function Funnel() {
  const { state } = useFunnel();
  return (
    <div className="space-y-6">
      <ProgressBar step={state.step} />
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8">
        {state.step === 1 && <Step1Address />}
        {state.step === 2 && <Step2Photos />}
        {state.step === 3 && <Step3Costs />}
        {state.step === 4 && <Step4Stand />}
        {state.step === 5 && <Step5Contact />}
        {state.step === 6 && <Step6Estimate />}
      </div>
      {state.step < 6 && <SocialProof />}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const labels = ['Adresse', 'Fotos', 'Udgifter', 'Stand', 'Kontakt', 'Estimat'];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {labels.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  isDone || isActive ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        {labels.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          return (
            <span
              key={label}
              className={`hidden sm:inline ${isActive ? 'text-emerald-700 font-medium' : ''}`}
            >
              {label}
            </span>
          );
        })}
        <span className="sm:hidden font-medium text-emerald-700">
          Step {step}/6 — {labels[step - 1]}
        </span>
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <div className="grid grid-cols-3 gap-3 text-center text-xs">
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-slate-900">87+</div>
        <div className="text-slate-600">Boliger købt siden 2024</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-slate-900">14 dage</div>
        <div className="text-slate-600">Gns. fra ja til overtagelse</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-emerald-600">2.5M+</div>
        <div className="text-slate-600">Sparet sælgere i salær</div>
      </div>
    </div>
  );
}
