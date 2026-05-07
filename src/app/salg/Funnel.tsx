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
