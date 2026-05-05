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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Hvordan er standen?</h2>
        <p className="text-sm text-slate-500">
          Vælg overall niveau først, og udfyld så detaljer nedenunder. Jo mere konkret, jo bedre
          tilbud.
        </p>
      </div>

      {/* OVERALL */}
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

      {/* KØKKEN */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          🍳 Køkken
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Årgang"
            placeholder="2015"
            value={state.kitchenYear}
            onChange={(v) => update({ kitchenYear: v })}
            min={1900}
            max={2030}
          />
          <TextField
            label="Mærke (valgfrit)"
            placeholder="HTH, Svane, IKEA…"
            value={state.kitchenBrand}
            onChange={(v) => update({ kitchenBrand: v })}
          />
        </div>
      </section>

      {/* BADEVÆRELSE */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          🚿 Badeværelse
        </h3>
        <NumberField
          label="Senest renoveret/årgang"
          placeholder="2020"
          value={state.bathroomYear}
          onChange={(v) => update({ bathroomYear: v })}
          min={1900}
          max={2030}
        />
      </section>

      {/* HVIDEVARER */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          🔌 Hvidevarer der følger med boligen
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <ApplianceToggle
            label="Vaskemaskine"
            value={state.applVaskemaskine}
            onChange={(v) => update({ applVaskemaskine: v })}
          />
          <ApplianceToggle
            label="Tørretumbler"
            value={state.applTorretumbler}
            onChange={(v) => update({ applTorretumbler: v })}
          />
          <ApplianceToggle
            label="Opvaskemaskine"
            value={state.applOpvaskemaskine}
            onChange={(v) => update({ applOpvaskemaskine: v })}
          />
          <ApplianceToggle
            label="Køle-/fryseskab"
            value={state.applKoeleFryseskab}
            onChange={(v) => update({ applKoeleFryseskab: v })}
          />
          <ApplianceToggle
            label="Ovn"
            value={state.applOvn}
            onChange={(v) => update({ applOvn: v })}
          />
          <ApplianceToggle
            label="Komfur"
            value={state.applKomfur}
            onChange={(v) => update({ applKomfur: v })}
          />
          <ApplianceToggle
            label="Mikroovn"
            value={state.applMikroovn}
            onChange={(v) => update({ applMikroovn: v })}
          />
          <ApplianceToggle
            label="Emhætte"
            value={state.applEmhaette}
            onChange={(v) => update({ applEmhaette: v })}
          />
        </div>
      </section>

      {/* SÆRLIGE FORHOLD */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          ℹ️ Særlige forhold
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <ApplianceToggle
            label="Altan/terrasse"
            value={state.hasAltan}
            onChange={(v) => update({ hasAltan: v })}
          />
          <ApplianceToggle
            label="Elevator i bygning"
            value={state.hasElevator}
            onChange={(v) => update({ hasElevator: v })}
          />
          <ApplianceToggle
            label="Aktuelt udlejet"
            value={state.isRented}
            onChange={(v) => update({ isRented: v })}
          />
          <ApplianceToggle
            label="Hæftelse til EF >50k"
            value={state.hasEjerforeningHaeftelse}
            onChange={(v) => update({ hasEjerforeningHaeftelse: v })}
          />
        </div>
      </section>

      {/* UDLEJNINGS-DETALJER */}
      {state.isRented && (
        <section className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
            🏘️ Aktuelt udlejet — vi har brug for kontrakt-detaljer
          </h3>
          <p className="text-xs text-amber-800">
            Vi køber gerne udlejede lejligheder. Detaljerne nedenunder afgør om vi kan beholde
            lejer (godt for os) eller om kontrakten skal ophæves.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField
              label="Månedlig leje"
              suffix="kr/md"
              placeholder="8.500"
              value={state.rentalMonthlyRent}
              onChange={(v) => update({ rentalMonthlyRent: v })}
            />
            <NumberField
              label="Depositum"
              suffix="kr"
              placeholder="25.500"
              value={state.rentalDeposit}
              onChange={(v) => update({ rentalDeposit: v })}
            />
            <NumberField
              label="Forudbetalt leje"
              suffix="kr"
              placeholder="0"
              value={state.rentalPrepaidRent}
              onChange={(v) => update({ rentalPrepaidRent: v })}
            />
          </div>

          <DateField
            label="Indflytningsdato"
            value={state.rentalStartDate}
            onChange={(v) => update({ rentalStartDate: v })}
          />

          <div className="space-y-2">
            <ApplianceToggle
              label="Lejekontrakten er uopsigelig"
              value={state.rentalUopsigelig}
              onChange={(v) => update({ rentalUopsigelig: v })}
            />
            {state.rentalUopsigelig && (
              <NumberField
                label="Antal måneder uopsigelighed tilbage"
                suffix="mdr"
                placeholder="6"
                value={state.rentalUopsigeligMaaneder}
                onChange={(v) => update({ rentalUopsigeligMaaneder: v })}
              />
            )}
          </div>

          <div className="pt-2">
            <label className="block w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg text-center cursor-pointer hover:border-amber-500 hover:bg-amber-100/30">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) update({ rentalContract: { name: f.name, size: f.size } });
                }}
              />
              <span className="text-sm text-amber-900">
                📎{' '}
                {state.rentalContract
                  ? `${state.rentalContract.name} (${(state.rentalContract.size / 1024).toFixed(0)} kB)`
                  : 'Vedhæft lejekontrakt (gør tingene 10x hurtigere)'}
              </span>
            </label>
          </div>
        </section>
      )}

      {/* NOTE */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Tilføj en note (valgfri)
        </label>
        <textarea
          value={state.standNote}
          onChange={(e) => update({ standNote: e.target.value })}
          rows={3}
          placeholder='Eks. "Køkken renoveret 2015 men opvasker er fra 2008", "Bad nyrenoveret 2023 med gulvvarme"'
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </section>

      <div className="flex justify-between gap-3 pt-2">
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

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}

function ApplianceToggle({
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
      className={`px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2 ${
        value
          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-medium'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
          value ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
        }`}
      >
        {value && '✓'}
      </span>
      <span>{label}</span>
    </button>
  );
}
