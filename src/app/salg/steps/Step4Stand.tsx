'use client';

import { useFunnel } from '../FunnelContext';
import type { StandLevel } from '@/lib/services/price-engine';

interface StandOption {
  level: StandLevel;
  emoji: string;
  title: string;
  desc: string;
}

const OPTIONS: StandOption[] = [
  {
    level: 'nyrenoveret',
    emoji: '✨',
    title: 'Nyrenoveret',
    desc: 'Alt opdateret de seneste 2-3 år (køkken, bad, gulve, maling)',
  },
  {
    level: 'god',
    emoji: '👍',
    title: 'God stand',
    desc: 'Velholdt — moderate opdateringer indenfor 5-10 år',
  },
  {
    level: 'middel',
    emoji: '🔨',
    title: 'Middel',
    desc: 'Funktionel men ældre overflader — kan flytte ind, men trænger en omgang',
  },
  {
    level: 'trænger',
    emoji: '🎨',
    title: 'Trænger til kærlighed',
    desc: 'Køkken/bad er ældre — gulve, maling, måske badeværelse skal renoveres',
  },
  {
    level: 'slidt',
    emoji: '🛠️',
    title: 'Slidt / til renovering',
    desc: 'Original eller meget slidt — fuld istandsættelse er nødvendig',
  },
];

export function Step4Stand() {
  const { state, update, next, prev } = useFunnel();

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Hvordan er standen?</h2>
        <p className="text-sm text-slate-500">
          Vælg det der passer bedst. Vi justerer estimatet baseret på dette + dine fotos.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.level}
            type="button"
            onClick={() => update({ stand: opt.level })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              state.stand === opt.level
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-semibold ${
                    state.stand === opt.level ? 'text-emerald-800' : 'text-slate-900'
                  }`}
                >
                  {opt.title}
                </div>
                <div className="text-sm text-slate-600">{opt.desc}</div>
              </div>
              {state.stand === opt.level && <span className="text-emerald-600">✓</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Tilføj en kort note (valgfrit)
        </label>
        <textarea
          value={state.standNote}
          onChange={(e) => update({ standNote: e.target.value })}
          rows={3}
          placeholder='Eks. "Køkken fra 2015, bad nyrenoveret 2023, gulve trænger til slibning"'
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">Særlige forhold (valgfri)</div>
        <div className="grid grid-cols-2 gap-2">
          <Toggle
            label="Altan/terrasse"
            value={state.hasAltan}
            onChange={(v) => update({ hasAltan: v })}
          />
          <Toggle
            label="Elevator"
            value={state.hasElevator}
            onChange={(v) => update({ hasElevator: v })}
          />
          <Toggle
            label="Aktuelt udlejet"
            value={state.isRented}
            onChange={(v) => update({ isRented: v })}
          />
          <Toggle
            label="Hæftelse til EF (>50k)"
            value={state.hasEjerforeningHaeftelse}
            onChange={(v) => update({ hasEjerforeningHaeftelse: v })}
          />
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          disabled={!state.stand}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2.5 rounded-lg border text-sm transition-all ${
        value
          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-medium'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <span className="mr-1">{value ? '✓' : ' '}</span>
      {label}
    </button>
  );
}
