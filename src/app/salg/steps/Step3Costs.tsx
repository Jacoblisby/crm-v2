'use client';

import { useFunnel } from '../FunnelContext';
import { TOTAL_DRIFT } from '../types';

interface CostField {
  key: keyof CostKeys;
  label: string;
  hint: string;
  placeholder: string;
}

interface CostKeys {
  costGrundvaerdi: number;
  costFaellesudgifter: number;
  costRottebekempelse: number;
  costRenovation: number;
  costForsikringer: number;
  costFaelleslaan: number;
  costAndreDrift: number;
}

const FIELDS: CostField[] = [
  {
    key: 'costFaellesudgifter',
    label: 'Fællesudgifter til ejerforeningen',
    hint: 'Står på din månedlige opkrævning × 12. Inkl. evt. acontovand.',
    placeholder: '24.000',
  },
  {
    key: 'costGrundvaerdi',
    label: 'Grundskyld',
    hint: 'Ejendomsskat fra kommunen. Står på din opkrævning.',
    placeholder: '4.500',
  },
  {
    key: 'costFaelleslaan',
    label: 'Ydelse på fælleslån',
    hint: 'Hvis ejerforeningen har lån, din andel/år.',
    placeholder: '6.800',
  },
  {
    key: 'costRenovation',
    label: 'Renovation',
    hint: 'Skraldegebyr fra kommunen, hvis særskilt.',
    placeholder: '1.800',
  },
  {
    key: 'costForsikringer',
    label: 'Bygningsforsikring',
    hint: 'Hvis du betaler særskilt — ofte inkl. i fællesudgifter.',
    placeholder: '0',
  },
  {
    key: 'costRottebekempelse',
    label: 'Rottebekæmpelse',
    hint: 'Lille gebyr fra kommunen.',
    placeholder: '120',
  },
  {
    key: 'costAndreDrift',
    label: 'Andre driftsomkostninger',
    hint: 'Vand, varme, vicevært — det der ikke er dækket ovenover.',
    placeholder: '0',
  },
];

export function Step3Costs() {
  const { state, update, next, prev } = useFunnel();
  const total = TOTAL_DRIFT(state);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Faste udgifter (kr/år)</h2>
        <p className="text-sm text-slate-500">
          Vi bruger dem til at beregne et nøjagtigt afkast — så bliver vores tilbud bedst muligt.
          Dropper du dem, regner vi med kommunale gennemsnit (typisk{' '}
          <strong>50.000-100.000 kr lavere</strong> tilbud).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <CostInput
            key={field.key}
            field={field}
            value={state[field.key] as number}
            onChange={(v) => update({ [field.key]: v })}
          />
        ))}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-700">Total drift/år:</span>
          <span className="text-2xl font-bold text-emerald-700">
            {total.toLocaleString('da-DK')} kr
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ~{Math.round(total / 12).toLocaleString('da-DK')} kr/md.
        </div>
      </div>

      <details className="bg-slate-50 rounded-lg p-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          📄 Har du salgsopstillingen som PDF?
        </summary>
        <p className="text-xs text-slate-600 mt-2">
          PDF-upload kommer snart — i mellemtiden kan du indtaste tallene manuelt fra
          ejerforeningens årsregnskab eller seneste opkrævning.
        </p>
      </details>

      <div className="flex justify-between gap-3">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function CostInput({
  field,
  value,
  onChange,
}: {
  field: CostField;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{field.label}</div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={field.placeholder}
          className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          kr
        </span>
      </div>
      <div className="text-xs text-slate-500 mt-1">{field.hint}</div>
    </label>
  );
}
