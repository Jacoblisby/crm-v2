'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import type { StandLevel } from '@/lib/services/price-engine';

interface StandOption {
  level: StandLevel;
  title: string;
  desc: string;
}

const OPTIONS: StandOption[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Alt opdateret de seneste 2-3 år (køkken, bad, gulve, maling).',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Velholdt. Moderate opdateringer indenfor 5-10 år.',
  },
  {
    level: 'middel',
    title: 'Middel',
    desc: 'Funktionel, men ældre overflader. Kan flytte ind, men trænger en omgang.',
  },
  {
    level: 'trænger',
    title: 'Trænger til kærlighed',
    desc: 'Køkken og bad er ældre. Gulve, maling og evt. bad skal renoveres.',
  },
  {
    level: 'slidt',
    title: 'Slidt / til renovering',
    desc: 'Original eller meget slidt. Fuld istandsættelse er nødvendig.',
  },
];

export function Step4Stand() {
  const { state, update, next, prev } = useFunnel();

  // Auto-vis 'detaljer' hvis brugeren har udfyldt noget
  const hasDetails =
    !!state.kitchenYear ||
    !!state.bathroomYear ||
    state.applVaskemaskine ||
    state.applTorretumbler ||
    state.applOpvaskemaskine ||
    state.applKoeleFryseskab ||
    state.applOvn ||
    state.applKomfur ||
    state.applMikroovn ||
    state.applEmhaette ||
    state.hasAltan ||
    state.hasElevator ||
    !!state.standNote;
  const [showDetails, setShowDetails] = useState(hasDetails);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Hvordan er standen?</h2>
        <p className="text-sm text-slate-500">
          Vælg det niveau der passer bedst. Det styrer hvor meget vi regner med at
          istandsætte for.
        </p>
      </div>

      {/* OVERALL — primær action */}
      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = state.stand === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => update({ stand: opt.level })}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 hover:border-slate-400 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
                    {opt.title}
                  </div>
                  <div className={`text-sm ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                    {opt.desc}
                  </div>
                </div>
                {active && <Check className="w-4 h-4 text-white shrink-0" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* EKSTRA DETALJER — collapsible */}
      {state.stand && (
        <div className="border-t border-slate-200 pt-4">
          {!showDetails ? (
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100"
            >
              <div className="text-sm font-medium text-slate-700">
                + Tilføj detaljer for et mere præcist tilbud (valgfri)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Køkken-årgang, hvidevarer, altan/elevator m.m. — kan give op til{' '}
                <strong>30.000 kr højere tilbud</strong>
              </div>
            </button>
          ) : (
            <div className="space-y-5">
              {/* KØKKEN + BAD */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Køkken & bad
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Køkken-årgang"
                    placeholder="2015"
                    helperText="Året køkkenet sidst blev udskiftet"
                    value={state.kitchenYear}
                    onChange={(v) => update({ kitchenYear: v })}
                    min={1900}
                    max={2030}
                  />
                  <NumberField
                    label="Bad-årgang"
                    placeholder="2020"
                    helperText="Året badet sidst blev renoveret"
                    value={state.bathroomYear}
                    onChange={(v) => update({ bathroomYear: v })}
                    min={1900}
                    max={2030}
                  />
                </div>
                <TextField
                  label="Køkken-mærke (valgfri)"
                  placeholder="HTH, Svane, IKEA…"
                  value={state.kitchenBrand}
                  onChange={(v) => update({ kitchenBrand: v })}
                />
              </section>

              {/* HVIDEVARER */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Hvidevarer der følger med
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <ApplianceToggle
                    label="Vask"
                    value={state.applVaskemaskine}
                    onChange={(v) => update({ applVaskemaskine: v })}
                  />
                  <ApplianceToggle
                    label="Tørretumbler"
                    value={state.applTorretumbler}
                    onChange={(v) => update({ applTorretumbler: v })}
                  />
                  <ApplianceToggle
                    label="Opvask"
                    value={state.applOpvaskemaskine}
                    onChange={(v) => update({ applOpvaskemaskine: v })}
                  />
                  <ApplianceToggle
                    label="Køl/frys"
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
                    label="Mikro"
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
                </div>
              </section>

              {/* NOTE */}
              <section className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Andre ting vi bør vide (valgfri)
                </label>
                <textarea
                  value={state.standNote}
                  onChange={(e) => update({ standNote: e.target.value })}
                  rows={3}
                  placeholder='Fx "Fælles tagterrasse i bygningen", "Husdyr accepteret af EF", "Kommende ombygning af bad i 2026"'
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </section>
            </div>
          )}
        </div>
      )}

      {/* AKTUELT UDLEJET — egen sektion fordi det udløser meget data */}
      <section className="border-t border-slate-200 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Er lejligheden udlejet i dag?
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update({ isRented: false })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium ${
              !state.isRented
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Nej, jeg bor selv eller står tom
          </button>
          <button
            type="button"
            onClick={() => update({ isRented: true })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium ${
              state.isRented
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Ja, har en lejer
          </button>
        </div>

        {state.isRented && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <p className="text-xs text-slate-700">
              Vi køber gerne udlejede lejligheder. Sig nej til at de skal flytte.
              Detaljerne her hjælper os med at vurdere kontrakten.
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
            <label className="block w-full px-4 py-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-slate-500 hover:bg-white">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) update({ rentalContract: { name: f.name, size: f.size } });
                }}
              />
              <span className="text-sm text-slate-700">
                {state.rentalContract
                  ? `${state.rentalContract.name} (${(state.rentalContract.size / 1024).toFixed(0)} kB)`
                  : 'Vedhæft lejekontrakt. Gør tingene 10x hurtigere.'}
              </span>
            </label>
          </div>
        )}
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
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
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
  helperText,
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  helperText?: string;
  min?: number;
  max?: number;
}) {
  const showFormatted = value != null && value > 0 && suffix && suffix.includes('kr');
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
          className="w-full px-3 py-2.5 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {showFormatted && (
        <div className="text-xs text-slate-700 mt-1">
          {value!.toLocaleString('da-DK')} {suffix}
        </div>
      )}
      {!showFormatted && helperText && (
        <div className="text-xs text-slate-500 mt-1">{helperText}</div>
      )}
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
          ? 'bg-slate-900 border-slate-900 text-white font-medium'
          : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center ${
          value ? 'bg-white border-white' : 'border-slate-300'
        }`}
      >
        {value && <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />}
      </span>
      <span>{label}</span>
    </button>
  );
}
