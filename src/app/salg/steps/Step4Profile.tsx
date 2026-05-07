'use client';

import { useFunnel } from '../FunnelContext';
import type {
  SellTimeframe,
  SellReason,
  AfterSale,
  YesNoUnsure,
} from '../types';

const TIMEFRAME_OPTIONS: { value: SellTimeframe; label: string }[] = [
  { value: 'under1', label: 'Under 1 mdr' },
  { value: '1to3', label: '1–3 mdr' },
  { value: '3to6', label: '3–6 mdr' },
  { value: '6plus', label: '6+ mdr' },
  { value: 'unsure', label: 'Ved ikke endnu' },
];

const REASON_OPTIONS: { value: SellReason; label: string }[] = [
  { value: 'flytter', label: 'Flytter' },
  { value: 'arv', label: 'Arv / dødsbo' },
  { value: 'skilsmisse', label: 'Skilsmisse' },
  { value: 'okonomi', label: 'Økonomi' },
  { value: 'investering', label: 'Investering' },
  { value: 'andet', label: 'Andet' },
];

const AFTER_SALE_OPTIONS: { value: AfterSale; label: string; sub?: string }[] = [
  { value: 'flytter_ud', label: 'Flytter ud helt' },
  { value: 'lejer_andet', label: 'Vil leje noget andet' },
  {
    value: 'blive_boende_lejer',
    label: 'Vil gerne blive boende som lejer',
    sub: 'Sale-leaseback — vi køber, du bliver boende',
  },
  { value: 'ved_ikke', label: 'Ved ikke endnu' },
];

const YES_NO_OPTIONS: { value: YesNoUnsure; label: string }[] = [
  { value: 'ja', label: 'Ja' },
  { value: 'nej', label: 'Nej' },
  { value: 'usikker', label: 'Vil ikke svare' },
];

const BOLIGSTOTTE_OPTIONS: { value: YesNoUnsure; label: string }[] = [
  { value: 'ja', label: 'Ja' },
  { value: 'nej', label: 'Nej' },
  { value: 'usikker', label: 'Usikker' },
];

export function Step4Profile() {
  const { state, update, next, prev } = useFunnel();

  const showAgeFollowUp =
    state.afterSale === 'lejer_andet' || state.afterSale === 'blive_boende_lejer';
  const showBoligstotte = showAgeFollowUp && state.isOver65 === 'ja';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Lidt om dig</h2>
        <p className="text-sm text-slate-500">
          Vi bruger det her til at finde den løsning der passer dig — fx kontant salg,
          sale-leaseback eller noget tredje. Alt er valgfrit.
        </p>
      </div>

      <Question label="Hvornår kunne du tænke dig at sælge?">
        <ChipGroup
          options={TIMEFRAME_OPTIONS}
          value={state.sellTimeframe}
          onChange={(v) => update({ sellTimeframe: v })}
        />
      </Question>

      <Question label="Hvad er hovedgrunden?">
        <ChipGroup
          options={REASON_OPTIONS}
          value={state.sellReason}
          onChange={(v) => update({ sellReason: v })}
        />
      </Question>

      <Question label="Hvad skal du efter salget?">
        <ChipGroup
          options={AFTER_SALE_OPTIONS}
          value={state.afterSale}
          onChange={(v) => update({ afterSale: v })}
        />
      </Question>

      {showAgeFollowUp && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-medium">
            For at skræddersy dit tilbud
          </p>
          <Question label="Er du fyldt 65?">
            <ChipGroup
              options={YES_NO_OPTIONS}
              value={state.isOver65}
              onChange={(v) => update({ isOver65: v })}
            />
          </Question>

          {showBoligstotte && (
            <Question label="Modtager du folkepension eller boligstøtte?">
              <ChipGroup
                options={BOLIGSTOTTE_OPTIONS}
                value={state.receivesBoligstotte}
                onChange={(v) => update({ receivesBoligstotte: v })}
              />
            </Question>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; sub?: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left px-3.5 py-2.5 rounded-lg border text-sm transition-colors ${
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            {opt.sub && (
              <div
                className={`text-xs mt-0.5 ${
                  active ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {opt.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
