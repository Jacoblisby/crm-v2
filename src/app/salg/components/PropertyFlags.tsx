'use client';

import { useState } from 'react';
import {
  Check,
  Home,
  ArrowUpDown,
  Sun,
  Users,
  TriangleAlert,
  Wrench,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import type { FunnelState } from '../types';

/**
 * Property Flags — Zillow-inspireret 'select all that apply'-skærm
 * der konsoliderer 8 edge-case flags på ÉN side i stedet for spredte
 * toggles. Brugeren sætter kryds ved det der gælder; uchecked = ingen
 * af de spørgsmål de slipper for at se.
 *
 * Sub-forms (rental info, EF-gæld restgæld, renoveringsplaner) expand
 * inline når relevante checkboxes er sat.
 *
 * Erstatter sektionerne "Særlige forhold" + "Aktuelt udlejet" i Step2.
 */

interface FlagDef {
  key: keyof FunnelState;
  label: string;
  desc?: string;
  Icon: LucideIcon;
  /** Risk-flag visualiseres i mørkere farve — typisk negativ for pris */
  isRisk?: boolean;
}

const FEATURE_FLAGS: FlagDef[] = [
  {
    key: 'hasAltan',
    label: 'Altan eller terrasse',
    Icon: Home,
  },
  {
    key: 'hasElevator',
    label: 'Elevator i bygningen',
    Icon: ArrowUpDown,
  },
  {
    key: 'hasSolarPanels',
    label: 'Solceller/solfanger',
    desc: 'Installeret på taget',
    Icon: Sun,
  },
  {
    key: 'isRented',
    label: 'Aktuelt udlejet',
    desc: 'Vi køber gerne udlejede',
    Icon: Users,
  },
];

const RISK_FLAGS: FlagDef[] = [
  {
    key: 'hasEjerforeningGaeld',
    label: 'Fælleslån i ejerforeningen',
    desc: 'EF har optaget lån du betaler andel af',
    Icon: TriangleAlert,
    isRisk: true,
  },
  {
    key: 'hasRenovationPlans',
    label: 'Renoveringsplaner i EF',
    desc: 'Kommende projekter (tag/facade/vinduer)',
    Icon: Wrench,
    isRisk: true,
  },
  {
    key: 'hasTinglysteServitutter',
    label: 'Tinglyste servitutter',
    desc: 'Specielle vilkår noteret på matriklen',
    Icon: ScrollText,
    isRisk: true,
  },
];

export function PropertyFlags() {
  const { state, update } = useFunnel();

  function toggle(key: keyof FunnelState) {
    update({ [key]: !state[key] } as Partial<FunnelState>);
  }

  const anyChecked =
    state.hasAltan ||
    state.hasElevator ||
    state.hasSolarPanels ||
    state.isRented ||
    state.hasEjerforeningGaeld ||
    state.hasRenovationPlans ||
    state.hasTinglysteServitutter;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Særlige forhold
        </h3>
        <p className="text-xs text-slate-500">
          Sæt kryds ved det der gælder — eller spring forbi hvis intet
        </p>
      </div>

      {/* Positive features */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-600">
          Boligens specielle ting
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEATURE_FLAGS.map((f) => (
            <FlagCheckbox
              key={f.key}
              flag={f}
              checked={state[f.key] as boolean}
              onToggle={() => toggle(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Inline sub-form: Aktuelt udlejet */}
      {state.isRented && <RentalSubForm />}

      {/* Risk flags */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-medium text-slate-600">
          Forhold der kan påvirke prisen
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RISK_FLAGS.map((f) => (
            <FlagCheckbox
              key={f.key}
              flag={f}
              checked={state[f.key] as boolean}
              onToggle={() => toggle(f.key)}
            />
          ))}
        </div>
      </div>

      {/* Inline sub-form: Renoveringsplaner */}
      {state.hasRenovationPlans && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <p className="text-xs text-amber-900 font-medium">
            Hvilke renoveringer planlægger ejerforeningen?
          </p>
          <textarea
            value={state.renovationPlansNote}
            onChange={(e) => update({ renovationPlansNote: e.target.value })}
            placeholder='Fx "Nyt tag i 2027, ca. 80.000 kr pr. lejlighed" eller "Vinduer-udskiftning i 2026"'
            rows={2}
            className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
      )}

      {/* "Ingen af disse" status */}
      {!anyChecked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>Ingen særlige forhold — det gør det hele lidt nemmere.</span>
        </div>
      )}
    </section>
  );
}

function FlagCheckbox({
  flag,
  checked,
  onToggle,
}: {
  flag: FlagDef;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = flag.Icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
        checked
          ? flag.isRisk
            ? 'border-amber-400 bg-amber-50'
            : 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white hover:border-slate-400'
      }`}
    >
      <div
        className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
          checked
            ? flag.isRisk
              ? 'border-amber-500 bg-amber-500'
              : 'border-white bg-white'
            : 'border-slate-300 bg-white'
        }`}
      >
        {checked && (
          <Check
            className={`w-3 h-3 ${flag.isRisk ? 'text-white' : 'text-slate-900'}`}
            strokeWidth={3.5}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-4 h-4 shrink-0 ${
              checked
                ? flag.isRisk
                  ? 'text-amber-700'
                  : 'text-white'
                : 'text-slate-500'
            }`}
            strokeWidth={2}
          />
          <span
            className={`text-sm font-medium ${
              checked
                ? flag.isRisk
                  ? 'text-amber-900'
                  : 'text-white'
                : 'text-slate-900'
            }`}
          >
            {flag.label}
          </span>
        </div>
        {flag.desc && (
          <div
            className={`text-xs mt-0.5 ${
              checked
                ? flag.isRisk
                  ? 'text-amber-800'
                  : 'text-slate-300'
                : 'text-slate-500'
            }`}
          >
            {flag.desc}
          </div>
        )}
      </div>
    </button>
  );
}

function RentalSubForm() {
  const { state, update } = useFunnel();
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <p className="text-xs text-slate-700">
        Vi køber gerne udlejede lejligheder. Detaljerne her hjælper os med at vurdere
        kontrakten.
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
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={state.rentalUopsigelig}
          onChange={(e) => update({ rentalUopsigelig: e.target.checked })}
          className="w-4 h-4 rounded border-slate-300"
        />
        <span className="text-sm text-slate-700">Lejekontrakten er uopsigelig</span>
      </label>
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
            : 'Vedhæft lejekontrakt — gør tingene 10× hurtigere'}
        </span>
      </label>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
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
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
      />
    </label>
  );
}
