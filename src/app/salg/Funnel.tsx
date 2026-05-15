'use client';

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
    <div className="space-y-10 max-w-3xl">
      {/* Funnel-card "loftet" oppe paa hero via negative margin paa parent */}
      <div className="bg-white rounded-3xl shadow-[0_4px_12px_-2px_rgba(26,40,41,0.08),0_24px_48px_-12px_rgba(26,40,41,0.14)] p-6 sm:p-10 space-y-8 ring-1 ring-brand-100/50">
        <ProgressBar step={state.step} />
        {state.step === 1 && <Step1Address />}
        {state.step === 2 && <Step2Bolig />}
        {state.step === 3 && <Step3Costs />}
        {state.step === 4 && <Step4Profile />}
        {state.step === 5 && <Step5Estimate />}
      </div>
      {state.step === 1 && <FAQ />}
    </div>
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
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isDone = num < step;
          return (
            <div
              key={label}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                isDone || isActive ? 'bg-brand-700' : 'bg-brand-100'
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          return (
            <span
              key={label}
              className={`hidden sm:inline transition-colors ${
                isActive ? 'text-brand-700 font-semibold' : ''
              }`}
            >
              {label}
            </span>
          );
        })}
        <span className="sm:hidden font-semibold text-brand-700">
          Trin {step}/{TOTAL_STEPS} · {STEP_LABELS[step - 1]}
        </span>
      </div>
    </div>
  );
}
