'use client';

/**
 * CostBreakdownForm — manuel override af de 10 cost-felter.
 *
 * Bruges naar PDF-parsing fejler eller giver forkerte resultater (fx Benloese-
 * parken 141 i Ringsted hvor ejerudgifter ikke blev hentet). Brugeren kan
 * indtaste tallene direkte fra salgsopstillingen og recompute afkast.
 */
import { useState, useTransition } from 'react';
import { updateCostBreakdownAction } from './actions';

interface Props {
  id: string;
  current: {
    costGrundvaerdi: number;
    costFaellesudgifter: number;
    costRottebekempelse: number;
    costRenovation: number;
    costForsikringer: number;
    costFaelleslaan: number;
    costGrundfond: number;
    costVicevaert: number;
    costVedligeholdelse: number;
    costAndreDrift: number;
    ejerforeningSikkerhed: number;
  };
}

type AnnualKey =
  | 'costFaellesudgifter'
  | 'costGrundvaerdi'
  | 'costFaelleslaan'
  | 'costForsikringer'
  | 'costRenovation'
  | 'costRottebekempelse'
  | 'costGrundfond'
  | 'costVicevaert'
  | 'costVedligeholdelse'
  | 'costAndreDrift';

const ANNUAL_FIELDS: Array<{ key: AnnualKey; label: string; hint?: string }> = [
  { key: 'costFaellesudgifter', label: 'Fællesudgifter', hint: 'inkl. evt. acontovand' },
  { key: 'costGrundvaerdi', label: 'Grundskyld', hint: 'ekskl. ejendomsværdiskat (udlejning)' },
  { key: 'costFaelleslaan', label: 'Fælleslån', hint: 'EF eller A/B' },
  { key: 'costForsikringer', label: 'Forsikringer' },
  { key: 'costRenovation', label: 'Renovation' },
  { key: 'costRottebekempelse', label: 'Rottebekæmpelse' },
  { key: 'costGrundfond', label: 'Grundfond', hint: 'henlæggelser' },
  { key: 'costVicevaert', label: 'Vicevært', hint: 'service/trappevask' },
  { key: 'costVedligeholdelse', label: 'Vedligeholdelse' },
  { key: 'costAndreDrift', label: 'Andet', hint: 'antenne, arbejdsdag, internet' },
];

export function CostBreakdownForm({ id, current }: Props) {
  const [values, setValues] = useState({ ...current });
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  // Drift-total = kun aarlige felter (IKKE engangsbeloeb som sikkerhed)
  const driftTotal = ANNUAL_FIELDS.reduce((sum, f) => sum + (values[f.key] || 0), 0);
  const allEmpty = driftTotal === 0;
  const dirty =
    ANNUAL_FIELDS.some((f) => values[f.key] !== current[f.key]) ||
    values.ejerforeningSikkerhed !== current.ejerforeningSikkerhed;

  function setField(key: keyof Props['current'], v: number) {
    setValues((p) => ({ ...p, [key]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await updateCostBreakdownAction({ id, ...values });
      if (r.ok) {
        setMsg(
          `Gemt — drift ${r.driftTotal.toLocaleString('da-DK')} kr/år · nyt bud ${r.afk?.budAt20PctRoe?.toLocaleString('da-DK') ?? 'n/a'} kr (ROE ${r.afk?.roeNettoPct}%)`,
        );
      } else {
        setMsg(`Fejl: ${r.error}`);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Ejerudgifter (kr/år)</h2>
          <p className="text-xs text-slate-500">
            {allEmpty
              ? 'Ingen tal endnu — indtast manuelt eller upload PDF ovenfor'
              : 'Override hvis PDF-parsing gav forkerte tal'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Drift total
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {driftTotal.toLocaleString('da-DK')} kr
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
        {ANNUAL_FIELDS.map((f) => (
          <CostField
            key={f.key}
            label={f.label}
            hint={f.hint}
            value={values[f.key]}
            onChange={(v) => setField(f.key, v)}
          />
        ))}
      </div>

      {/* Engangsbeloeb — separat sektion fordi det ikke er aarlig drift */}
      <div className="border-t border-slate-200 pt-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Engangsbeløb
            </h3>
            <p className="text-[11px] text-slate-500">
              Ikke en del af drift, men følger med købet
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <CostField
            label="Sikkerhed til e/f"
            hint="bankgaranti / depositum"
            value={values.ejerforeningSikkerhed}
            onChange={(v) => setField('ejerforeningSikkerhed', v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="px-4 py-1.5 rounded bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? 'Gemmer…' : 'Gem og recompute'}
        </button>
        {dirty && !pending && (
          <button
            type="button"
            onClick={() => setValues({ ...current })}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Annullér ændringer
          </button>
        )}
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
      </div>
    </form>
  );
}

function CostField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-0.5 truncate" title={label}>
        {label}
      </div>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
        placeholder="0"
        min={0}
        step={100}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
      />
      {hint && (
        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{hint}</div>
      )}
    </label>
  );
}
