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
    <div className="space-y-10 max-w-3xl mx-auto">
      <div className="bg-paper-50 rounded-3xl shadow-[0_4px_12px_-2px_rgba(31,38,36,0.06),0_24px_48px_-12px_rgba(31,38,36,0.10)] p-6 sm:p-10 space-y-8 border border-sage-300/40">
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
                isDone || isActive ? 'bg-brass-500' : 'bg-sage-300/50'
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] tracking-wider uppercase font-semibold text-muted">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          return (
            <span
              key={label}
              className={`hidden sm:inline transition-colors ${
                isActive ? 'text-brass-600' : ''
              }`}
            >
              {label}
            </span>
          );
        })}
        <span className="sm:hidden text-brass-600">
          Trin {step}/{TOTAL_STEPS} · {STEP_LABELS[step - 1]}
        </span>
      </div>
    </div>
  );
}
