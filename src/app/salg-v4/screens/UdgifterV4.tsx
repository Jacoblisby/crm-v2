'use client';

/**
 * UdgifterV4 — "Boligens udgifter" (03_Udgifter step 1).
 *
 * Designer-struktur:
 *   VIGTIGSTE UDGIFTER — Fællesudgift* / Grundskyld / Renovation / Grundfond
 *   Vand — "Betaler du vand gennem ejerforeningen?" + samlet vandudgift
 *   Varme — tilsvarende
 *   ØVRIGE UDGIFTER — dynamisk "Tilføj udgift" (kategori + beløb)
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { DRIFT_CATEGORIES, type AdditionalDriftItem, type DriftCategory } from '../../salg-v2/types';
import { V4, EASE, MoneyInputV4, YesNoV4 } from '../primitives';

export function UdgifterV4() {
  const { state, update } = useFunnelV2();
  const driftItems = state.additionalDrift ?? [];
  // Ja/Nej-svar er lokale (state har kun boolean uden "ubesvaret"-tilstand)
  const [vandSvar, setVandSvar] = useState<'Ja' | 'Nej' | 'Ved ikke' | null>(
    state.waterPaidViaAssoc ? 'Ja' : state.waterUsageLastYearKr > 0 ? 'Nej' : null,
  );
  const [varmeSvar, setVarmeSvar] = useState<'Ja' | 'Nej' | 'Ved ikke' | null>(
    state.heatPaidViaAssoc ? 'Ja' : state.heatUsageLastYearKr > 0 ? 'Nej' : null,
  );

  const total =
    (state.costFaellesudgifter || 0) +
    (state.costGrundvaerdi || 0) +
    (state.costRenovation || 0) +
    (state.costGrundfond || 0) +
    driftItems.reduce((s, i) => s + (i.amount || 0), 0);

  function addDrift() {
    const item: AdditionalDriftItem = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      category: 'Administration',
      amount: 0,
    };
    update({ additionalDrift: [...driftItems, item] });
  }
  function patchDrift(id: string, patch: Partial<AdditionalDriftItem>) {
    update({ additionalDrift: driftItems.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }
  function removeDrift(id: string) {
    update({ additionalDrift: driftItems.filter((i) => i.id !== id) });
  }

  return (
    <div className="space-y-9">
      {/* Vigtigste udgifter */}
      <section className="space-y-3">
        <Heading
          title="Vigtigste udgifter"
          sub="Udfyld de beløb, du kender. De står ofte i ejerforeningens opkrævninger eller årsopgørelser."
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <MoneyInputV4
            label="Fællesudgift *"
            value={state.costFaellesudgifter}
            onChange={(v) => update({ costFaellesudgifter: parseInt(v) || 0 })}
            placeholder="24.000"
            sub="Står ofte på opkrævningen fra ejerforeningen."
          />
          <MoneyInputV4
            label="Grundskyld"
            value={state.costGrundvaerdi}
            onChange={(v) => update({ costGrundvaerdi: parseInt(v) || 0 })}
            placeholder="4.500"
            sub="Står på kommunens opgørelse eller skat.dk."
          />
          <MoneyInputV4
            label="Renovation"
            value={state.costRenovation}
            onChange={(v) => update({ costRenovation: parseInt(v) || 0 })}
            placeholder="1.800"
            sub="Udfyld hvis det betales separat."
          />
          <MoneyInputV4
            label="Grundfond"
            value={state.costGrundfond}
            onChange={(v) => update({ costGrundfond: parseInt(v) || 0 })}
            placeholder="0"
            sub="Udfyld hvis ejerforeningen opkræver til vedligehold."
          />
        </div>
      </section>

      {/* Vand */}
      <section className="space-y-3 pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <Heading title="Vand" />
        </div>
        <YesNoV4
          label="Betaler du vand gennem ejerforeningen?"
          value={vandSvar}
          onChange={(v) => {
            setVandSvar(v);
            update({ waterPaidViaAssoc: v === 'Ja' });
          }}
        />
        <MoneyInputV4
          label="Samlet vandudgift sidste år"
          value={state.waterPaidViaAssoc ? state.waterAcontoYearly : state.waterUsageLastYearKr}
          onChange={(v) => {
            const n = parseInt(v) || 0;
            if (state.waterPaidViaAssoc) update({ waterAcontoYearly: n });
            else update({ waterUsageLastYearKr: n });
          }}
          placeholder="3.500"
          sub="Står ofte i årsopgørelsen eller forbrugsregnskabet."
        />
      </section>

      {/* Varme */}
      <section className="space-y-3 pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <Heading title="Varme" />
        </div>
        <YesNoV4
          label="Betaler du varme gennem ejerforeningen?"
          value={varmeSvar}
          onChange={(v) => {
            setVarmeSvar(v);
            update({ heatPaidViaAssoc: v === 'Ja' });
          }}
        />
        <MoneyInputV4
          label="Samlet varmeudgift sidste år"
          value={state.heatPaidViaAssoc ? state.heatAcontoYearly : state.heatUsageLastYearKr}
          onChange={(v) => {
            const n = parseInt(v) || 0;
            if (state.heatPaidViaAssoc) update({ heatAcontoYearly: n });
            else update({ heatUsageLastYearKr: n });
          }}
          placeholder="11.500"
          sub="Står ofte i årsopgørelsen eller varmeregnskabet."
        />
      </section>

      {/* Øvrige udgifter */}
      <section className="space-y-3 pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <Heading title="Øvrige udgifter" sub="Tilføj kun de udgifter, der er relevante for boligen." />
        </div>

        {driftItems.length > 0 && (
          <div className="space-y-2">
            {driftItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <select
                  value={item.category}
                  onChange={(e) => patchDrift(item.id, { category: e.target.value as DriftCategory })}
                  className="flex-1 min-w-0 px-3 py-3 rounded-lg border bg-white text-[14px] focus:outline-none"
                  style={{ borderColor: V4.border, color: V4.ink }}
                >
                  {DRIFT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="relative w-36 shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={item.amount || ''}
                    onChange={(e) => patchDrift(item.id, { amount: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-3 pr-12 rounded-lg border bg-white text-[14px] tabular-nums focus:outline-none"
                    style={{ borderColor: V4.border, color: V4.ink }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: V4.soft }}>kr/år</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDrift(item.id)}
                  aria-label="Fjern udgift"
                  className="w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center hover:bg-[#fff5f2] transition-colors"
                  style={{ borderColor: V4.border, color: '#a3452e' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addDrift}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13.5px] transition-all active:scale-[0.98]"
          style={{ borderColor: V4.green, color: V4.green, fontWeight: 500, transitionDuration: '150ms', transitionTimingFunction: EASE }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tilføj udgift
        </button>
      </section>

      {/* Drift total */}
      <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: V4.cream }}>
        <span className="text-[14px]" style={{ color: V4.ink }}>Drift (uden vand/varme)</span>
        {total > 0 ? (
          <span className="text-[19px] tabular-nums" style={{ color: V4.greenDeep, fontWeight: 600 }}>
            {total.toLocaleString('da-DK')} kr/år
          </span>
        ) : (
          <span className="text-[13px]" style={{ color: V4.soft }}>Indtast for at se total</span>
        )}
      </div>
    </div>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>{title}</div>
      {sub && <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: V4.muted }}>{sub}</p>}
    </div>
  );
}
