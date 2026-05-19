'use client';

import { useState } from 'react';
import { useFunnelV2 } from '../FunnelV2Context';
import { MoneyInput, YesNoRow, SectionHeading, EASE_OUT } from '../components/primitives';
import { MiniIcon } from '../components/icons';
import { DRIFT_CATEGORIES, type AdditionalDriftItem, type DriftCategory } from '../types';

const ACCENT = '#244949';

export function Udgifter() {
  const { state, update } = useFunnelV2();

  const driftItems = state.additionalDrift ?? [];

  const dynamicTotal = driftItems.reduce((s, item) => s + (item.amount || 0), 0);
  const total =
    (state.costFaellesudgifter || 0) +
    (state.costGrundvaerdi || 0) +
    dynamicTotal;

  function addDrift(category: DriftCategory) {
    const newItem: AdditionalDriftItem = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      category,
      amount: 0,
    };
    update({ additionalDrift: [...driftItems, newItem] });
  }

  function updateDrift(id: string, patch: Partial<AdditionalDriftItem>) {
    update({
      additionalDrift: driftItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }

  function removeDrift(id: string) {
    update({
      additionalDrift: driftItems.filter((i) => i.id !== id),
    });
  }

  return (
    <div className="space-y-8">
      {/* Ejerudgifter (faste top-felter) */}
      <section className="space-y-3">
        <SectionHeading
          title="Ejerudgifter (kr/år)"
          sub="Udfyld det du kender — jo flere du udfylder, jo mere præcist bliver vores tilbud."
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <MoneyInput
            label="Fællesudgifter til ejerforeningen *"
            value={state.costFaellesudgifter || ''}
            onChange={(v) => update({ costFaellesudgifter: parseInt(v) || 0 })}
            placeholder="24.000"
            sub="Måneds-opkrævning × 12 (typisk 18-30k). Påkrævet."
            required
          />
          <MoneyInput
            label="Grundskyld (ejendomsskat)"
            value={state.costGrundvaerdi || ''}
            onChange={(v) => update({ costGrundvaerdi: parseInt(v) || 0 })}
            placeholder="4.500"
            sub="Står på din opkrævning fra kommunen"
          />
        </div>
      </section>

      {/* Øvrige driftudgifter — dynamisk liste */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Øvrige driftudgifter"
            sub="Tilføj de udgifter der gælder for din bolig. Du kan tilføje så mange linjer du har brug for."
          />
        </div>

        {/* Tilføjede linjer */}
        <div className="space-y-2.5">
          {driftItems.map((item) => (
            <DriftRow
              key={item.id}
              item={item}
              onChange={(patch) => updateDrift(item.id, patch)}
              onRemove={() => removeDrift(item.id)}
            />
          ))}
        </div>

        {/* + Tilføj udgift knap */}
        <AddDriftButton onAdd={addDrift} hasItems={driftItems.length > 0} />
      </section>

      {/* Vand */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading title="Vand" />
        </div>
        <YesNoRow
          label="Betales acontobeløb for vand til ejerforeningen?"
          value={state.waterPaidViaAssoc ? 'Ja' : undefined}
          onChange={(v) => update({ waterPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyInput
          label="Samlet vandregning sidste år"
          value={state.waterUsageLastYearKr || ''}
          onChange={(v) => update({ waterUsageLastYearKr: parseInt(v) || 0 })}
          placeholder="3.500"
          sub="Sum af 4 kvartalsregninger eller årsopgørelse"
        />
      </section>

      {/* Varme */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading title="Varme" />
        </div>
        <YesNoRow
          label="Betales acontobeløb for varme til ejerforeningen?"
          value={state.heatPaidViaAssoc ? 'Ja' : undefined}
          onChange={(v) => update({ heatPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyInput
          label="Samlet varmeregning sidste år"
          value={state.heatUsageLastYearKr || ''}
          onChange={(v) => update({ heatUsageLastYearKr: parseInt(v) || 0 })}
          placeholder="11.500"
          sub="Årsopgørelse fra fjernvarme/varmeværket"
        />
      </section>

      {/* Hæftelse */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Hæftelse til ejerforening"
            sub="Hæftelsen er en sikkerhed ejerforeningen tinglyser foran realkreditlånet. Engangsbeløb — separat fra eventuel gæld."
          />
        </div>
        <MoneyInput
          label="Hæftelse jf. tinglysning"
          value={state.ejerforeningHaeftelseKr || ''}
          onChange={(v) => update({ ejerforeningHaeftelseKr: parseInt(v) || 0 })}
          placeholder="0"
          sub="Engangsbeløb — fremgår af tinglysningsattesten"
          unit="kr"
        />
      </section>

      {/* Drift total */}
      <div
        className="rounded-xl px-5 py-4 flex items-center justify-between bg-[#F2F0EB]"
        style={{ transition: `background-color 200ms ${EASE_OUT}` }}
      >
        <span className="text-[14px] text-[#14181A]">Drift (uden vand/varme)</span>
        {total > 0 ? (
          <span
            className="text-[20px] font-semibold text-[#14181A]"
            style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
          >
            {total.toLocaleString('da-DK')} kr/år
          </span>
        ) : (
          <span className="text-[14px] text-[#9C988C]">Indtast for at se total</span>
        )}
      </div>

      {/* Dokumentation */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Vedhæft dokumentation (valgfri)"
            sub="Vedhæft gerne salgsopstilling, EF-årsregnskab, vand/varme-regning eller vurderingsrapport."
          />
        </div>
        <button
          type="button"
          className="w-full py-5 rounded-xl border-2 border-dashed bg-white hover:bg-stone-50 text-[14px] font-medium border-[#D6D2C5] text-[#14181A] active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
          style={{ transition: `background-color 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
        >
          Tap for at vedhæfte filer <span className="text-[#9C988C]">(PDF, JPG, DOC)</span>
        </button>
      </section>
    </div>
  );
}

// ─── DriftRow — én linje med kategori-dropdown + amount + delete ───────────
function DriftRow({
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
      className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[180px_1fr_auto] gap-2 sm:gap-3 items-stretch salg-drift-row-enter"
      style={{ animationDelay: '0ms' }}
    >
      {/* Kategori dropdown */}
      <div className="relative">
        <select
          value={item.category}
          onChange={(e) => onChange({ category: e.target.value as DriftCategory })}
          className="w-full appearance-none px-4 pr-9 py-3 rounded-xl border-2 bg-white text-[14px] font-medium border-[#E5E2DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] text-[#14181A] cursor-pointer"
          style={{ transition: `border-color 180ms ${EASE_OUT}` }}
          aria-label="Kategori"
        >
          {DRIFT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-[#9C988C]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* Amount input (+ optional custom label for "Andet") */}
      <div className="space-y-1.5 min-w-0">
        {isCustom && (
          <input
            type="text"
            value={item.customLabel ?? ''}
            onChange={(e) => onChange({ customLabel: e.target.value })}
            placeholder="Beskriv udgift..."
            className="w-full px-3 py-2 rounded-lg border bg-white text-[13px] border-[#E5E2DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] focus:border-stone-400 text-[#14181A]"
            style={{ transition: `border-color 180ms ${EASE_OUT}` }}
          />
        )}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={item.amount || ''}
            onChange={(e) => onChange({ amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 })}
            placeholder="0"
            className="w-full px-4 py-3 pr-16 rounded-xl border-2 bg-white text-[14px] tabular-nums border-[#E5E2DA] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] focus:border-stone-400 text-[#14181A]"
            style={{ transition: `border-color 180ms ${EASE_OUT}` }}
            aria-label={`Beløb for ${item.category}`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#9C988C]">kr/år</span>
        </div>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Fjern ${item.category}`}
        className="self-start w-11 h-11 rounded-xl flex items-center justify-center text-[#5A6166] hover:text-[#14181A] hover:bg-[#F2F0EB] active:scale-[0.92] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
        style={{ transition: `background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, transform 120ms ${EASE_OUT}` }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        @keyframes salg-drift-row-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .salg-drift-row-enter {
          animation: salg-drift-row-in 220ms ${EASE_OUT} both;
        }
        @media (prefers-reduced-motion: reduce) {
          .salg-drift-row-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}

// ─── AddDriftButton — + Tilføj udgift m. inline picker ─────────────────────
function AddDriftButton({
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
      <div className="rounded-2xl border-2 bg-white p-3 space-y-1 border-[#244949] salg-drift-picker-enter">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
            Vælg kategori
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Annullér"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#5A6166] hover:bg-[#F2F0EB] active:scale-[0.9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#244949]"
            style={{ transition: `background-color 150ms ${EASE_OUT}, transform 120ms ${EASE_OUT}` }}
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
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[14px] font-medium text-[#14181A] hover:bg-[#F8F2E5] active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:bg-[#F8F2E5] focus-visible:ring-2 focus-visible:ring-[#244949]"
              style={{ transition: `background-color 120ms ${EASE_OUT}, transform 120ms ${EASE_OUT}` }}
            >
              <MiniIcon name={iconForCategory(c)} color={ACCENT} size={14} />
              {c}
            </button>
          ))}
        </div>
        <style>{`
          @keyframes salg-drift-picker-in {
            0%   { opacity: 0; transform: scale(0.97) translateY(-4px); transform-origin: top; }
            100% { opacity: 1; transform: scale(1) translateY(0); transform-origin: top; }
          }
          .salg-drift-picker-enter {
            animation: salg-drift-picker-in 200ms ${EASE_OUT} both;
            transform-origin: top;
          }
          @media (prefers-reduced-motion: reduce) {
            .salg-drift-picker-enter { animation: none; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-[14px] font-medium border-[#D6D2C5] text-[#14181A] hover:bg-stone-50 hover:border-[#244949] active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
      style={{ transition: `background-color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {hasItems ? 'Tilføj endnu en udgift' : 'Tilføj udgift'}
    </button>
  );
}

function iconForCategory(c: DriftCategory): string {
  switch (c) {
    case 'Ejendomsforsikring': return 'doc';
    case 'Grundfond': return 'coin2';
    case 'Ydelse på fælleslån': return 'warn';
    case 'Administration': return 'users';
    case 'Antenne': return 'arrows';
    case 'Internet': return 'arrows';
    case 'Renovation': return 'wrench';
    case 'Andet': return 'plus';
  }
}
