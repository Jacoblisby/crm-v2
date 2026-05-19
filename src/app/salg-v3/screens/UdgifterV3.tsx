'use client';

/**
 * UdgifterV3 — editorial re-skin af v2 Udgifter.
 * Behold den dynamiske drift-liste m. + tilfoej.
 * Skift: Fraunces til section-titler, Geist body, paper-bg paa MoneyInputs,
 * lowercase kickers, tinted shadows, ingen border-2.
 */
import { useState } from 'react';
import { useFunnelV3 } from '../FunnelV3Context';
import { DRIFT_CATEGORIES, type AdditionalDriftItem, type DriftCategory } from '../../salg-v2/types';

export function UdgifterV3() {
  const { state, update } = useFunnelV3();
  const driftItems = state.additionalDrift ?? [];

  function addDrift(category: DriftCategory) {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    update({ additionalDrift: [...driftItems, { id, category, amount: 0 }] });
  }
  function updateDrift(id: string, patch: Partial<AdditionalDriftItem>) {
    update({
      additionalDrift: driftItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }
  function removeDrift(id: string) {
    update({ additionalDrift: driftItems.filter((i) => i.id !== id) });
  }

  return (
    <div className="space-y-12">
      {/* Faste top-felter (2x2) */}
      <section className="space-y-5">
        <SectionTitle kicker="kerne-udgifter (kr/år)" title="Det vi altid har brug for" />
        <div className="grid sm:grid-cols-2 gap-4">
          <MoneyField
            label="Fællesudgifter til ejerforeningen"
            required
            value={state.costFaellesudgifter}
            onChange={(v) => update({ costFaellesudgifter: v })}
            placeholder="24.000"
            sub="Måneds-opkrævning × 12 (typisk 18-30k)."
          />
          <MoneyField
            label="Grundskyld"
            value={state.costGrundvaerdi}
            onChange={(v) => update({ costGrundvaerdi: v })}
            placeholder="4.500"
            sub="Står på opkrævningen fra kommunen"
          />
          <MoneyField
            label="Renovation"
            value={state.costRenovation}
            onChange={(v) => update({ costRenovation: v })}
            placeholder="1.800"
            sub="Skraldegebyr — ofte inkl. i fællesudg."
          />
          <MoneyField
            label="Grundfond"
            value={state.costGrundfond}
            onChange={(v) => update({ costGrundfond: v })}
            placeholder="2.400"
            sub="EFs reserve-bidrag pr. år — ofte inkl. i fællesudg."
          />
        </div>
      </section>

      {/* Dynamic drift */}
      <section className="space-y-5 pt-6 border-t border-warm">
        <SectionTitle kicker="øvrige udgifter" title="Tilføj de poster der gælder" />
        <div className="space-y-3">
          {driftItems.map((item) => (
            <DriftRowV3
              key={item.id}
              item={item}
              onChange={(patch) => updateDrift(item.id, patch)}
              onRemove={() => removeDrift(item.id)}
            />
          ))}
        </div>
        <AddDriftButtonV3 onAdd={addDrift} hasItems={driftItems.length > 0} />
      </section>

      {/* Vand */}
      <section className="space-y-5 pt-6 border-t border-warm">
        <SectionTitle kicker="vand" />
        <YesNo
          label="Betales acontobeløb for vand til ejerforeningen?"
          value={state.waterPaidViaAssoc ? 'Ja' : undefined}
          onChange={(v) => update({ waterPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyField
          label="Samlet vandregning sidste år"
          value={state.waterUsageLastYearKr}
          onChange={(v) => update({ waterUsageLastYearKr: v })}
          placeholder="3.500"
          sub="Sum af kvartalsregninger eller årsopgørelse"
        />
      </section>

      {/* Varme */}
      <section className="space-y-5 pt-6 border-t border-warm">
        <SectionTitle kicker="varme" />
        <YesNo
          label="Betales acontobeløb for varme til ejerforeningen?"
          value={state.heatPaidViaAssoc ? 'Ja' : undefined}
          onChange={(v) => update({ heatPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyField
          label="Samlet varmeregning sidste år"
          value={state.heatUsageLastYearKr}
          onChange={(v) => update({ heatUsageLastYearKr: v })}
          placeholder="11.500"
          sub="Årsopgørelse fra fjernvarme eller varmeværket"
        />
      </section>

      {/* Hæftelse */}
      <section className="space-y-5 pt-6 border-t border-warm">
        <SectionTitle
          kicker="hæftelse til ejerforening"
          title="Engangsbeløb — separat fra gæld"
          sub="Hæftelsen er en sikkerhed ejerforeningen tinglyser foran realkreditlånet."
        />
        <MoneyField
          label="Hæftelse jf. tinglysning"
          value={state.ejerforeningHaeftelseKr}
          onChange={(v) => update({ ejerforeningHaeftelseKr: v })}
          placeholder="0"
          unit="kr"
        />
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────
function SectionTitle({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title?: string;
  sub?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-body text-[11px] tracking-[0.2em] uppercase soft">{kicker}</p>
      {title && (
        <h3
          className="font-display ink text-[20px] sm:text-[24px] leading-[1.15] tracking-[-0.015em]"
          style={{ fontWeight: 400 }}
        >
          {title}
        </h3>
      )}
      {sub && (
        <p className="font-body text-[13px] muted leading-[1.55] max-w-md">{sub}</p>
      )}
    </div>
  );
}

function MoneyField({
  label,
  required,
  value,
  onChange,
  placeholder,
  sub,
  unit = 'kr/år',
}: {
  label: string;
  required?: boolean;
  value: number | undefined | null;
  onChange: (v: number) => void;
  placeholder?: string;
  sub?: string;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-body text-[13px] ink-soft flex items-baseline gap-1.5" style={{ fontWeight: 500 }}>
        {label}
        {required && <span className="accent text-[10px] italic">påkrævet</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-16 rounded-[10px] bg-paper font-body font-tabular ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
          style={{
            border: '1px solid var(--border)',
            transition: 'border-color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-[12px] soft">{unit}</span>
      </div>
      {sub && <p className="font-body text-[12px] muted leading-[1.5]">{sub}</p>}
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: 'Ja' | 'Nej') => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 flex-wrap">
      <span className="font-body text-[14px] ink-soft" style={{ fontWeight: 500 }}>
        {label}
      </span>
      <div className="flex gap-2 shrink-0">
        {(['Ja', 'Nej'] as const).map((v) => {
          const sel = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="px-5 py-2 rounded-full font-body text-[13px] active:scale-[0.97]"
              style={{
                background: sel ? 'var(--ink)' : 'var(--paper)',
                color: sel ? 'var(--cream)' : 'var(--ink)',
                border: `1px solid ${sel ? 'var(--ink)' : 'var(--border)'}`,
                fontWeight: 500,
                transitionProperty: 'transform, background-color, color, border-color',
                transitionDuration: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DriftRowV3({
  item,
  onChange,
  onRemove,
}: {
  item: AdditionalDriftItem;
  onChange: (patch: Partial<AdditionalDriftItem>) => void;
  onRemove: () => void;
}) {
  const isCustom = item.category === 'Andet';
  return (
    <div
      className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[220px_1fr_auto] gap-3 items-stretch"
      style={{
        animation: 'salg-v3-row-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
      }}
    >
      <div className="relative">
        <select
          value={item.category}
          onChange={(e) => onChange({ category: e.target.value as DriftCategory })}
          className="w-full appearance-none px-4 pr-10 py-3 rounded-[10px] bg-paper font-body ink text-[14px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
          style={{
            border: '1px solid var(--border)',
            fontWeight: 500,
          }}
        >
          {DRIFT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 soft pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      <div className="space-y-1.5 min-w-0">
        {isCustom && (
          <input
            type="text"
            value={item.customLabel ?? ''}
            onChange={(e) => onChange({ customLabel: e.target.value })}
            placeholder="Beskriv udgift..."
            className="w-full px-3 py-2 rounded-[8px] bg-paper font-body ink text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
            style={{ border: '1px solid var(--border)' }}
          />
        )}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={item.amount || ''}
            onChange={(e) => onChange({ amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 })}
            placeholder="0"
            className="w-full px-4 py-3 pr-16 rounded-[10px] bg-paper font-body font-tabular ink text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
            style={{ border: '1px solid var(--border)' }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-[12px] soft">kr/år</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Fjern ${item.category}`}
        className="self-start w-11 h-11 rounded-[10px] flex items-center justify-center muted hover:ink active:scale-[0.92] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--border)',
          transitionProperty: 'color, background-color, transform',
          transitionDuration: '180ms',
        }}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        @keyframes salg-v3-row-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AddDriftButtonV3({
  onAdd,
  hasItems,
}: {
  onAdd: (category: DriftCategory) => void;
  hasItems: boolean;
}) {
  const [open, setOpen] = useState(false);

  function pick(c: DriftCategory) {
    onAdd(c);
    setOpen(false);
  }

  if (open) {
    return (
      <div
        className="rounded-[12px] bg-paper p-3"
        style={{
          border: '1px solid var(--teal)',
          boxShadow: 'var(--shadow-card)',
          animation: 'salg-v3-picker-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
          transformOrigin: 'top',
        }}
      >
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="font-body text-[11px] tracking-[0.18em] uppercase soft">vælg kategori</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Annullér"
            className="w-7 h-7 rounded-md flex items-center justify-center muted hover:bg-cream-deep active:scale-[0.9]"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {DRIFT_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="text-left px-3 py-2.5 rounded-lg font-body text-[14px] ink hover:bg-cream-deep active:scale-[0.98]"
              style={{
                fontWeight: 500,
                transitionProperty: 'background-color, transform',
                transitionDuration: '120ms',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <style>{`
          @keyframes salg-v3-picker-in {
            0% { opacity: 0; transform: scale(0.97) translateY(-4px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full py-4 rounded-[12px] bg-paper flex items-center justify-center gap-2 font-body text-[14px] ink hover:bg-cream-deep active:scale-[0.99]"
      style={{
        border: '1px dashed var(--border)',
        fontWeight: 500,
        transitionProperty: 'background-color, border-color, transform',
        transitionDuration: '180ms',
      }}
    >
      <svg className="w-3.5 h-3.5 accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {hasItems ? 'tilføj endnu en udgift' : 'tilføj udgift'}
    </button>
  );
}
