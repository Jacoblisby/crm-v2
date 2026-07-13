'use client';

/**
 * UdgifterV4 — "Boligens udgifter" (Figma: 03_Udgifter step 1).
 * Hvide kort: VIGTIGSTE UDGIFTER (2×2 inputs m. hints) · VAND (Ja/Nej/Ved ikke
 * + beløb ved svar) · VARME · ØVRIGE UDGIFTER (+ Tilføj udgift).
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { DRIFT_CATEGORIES, type AdditionalDriftItem, type DriftCategory } from '../../salg-v2/types';
import { V4, Card, CardLabel, FieldV4, QuestionRowV4 } from '../primitives';

export function UdgifterV4() {
  const { state, update } = useFunnelV2();
  const driftItems = state.additionalDrift ?? [];

  const [vandSvar, setVandSvar] = useState<string | null>(
    state.waterPaidViaAssoc ? 'Ja' : state.waterUsageLastYearKr > 0 ? 'Nej' : null,
  );
  const [varmeSvar, setVarmeSvar] = useState<string | null>(
    state.heatPaidViaAssoc ? 'Ja' : state.heatUsageLastYearKr > 0 ? 'Nej' : null,
  );

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

  const total =
    (state.costFaellesudgifter || 0) +
    (state.costGrundvaerdi || 0) +
    (state.costRenovation || 0) +
    (state.costGrundfond || 0) +
    driftItems.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Vigtigste udgifter */}
      <Card className="p-6 space-y-4">
        <div className="space-y-1.5">
          <CardLabel>Vigtigste udgifter</CardLabel>
          <p className="text-[13px]" style={{ color: V4.muted }}>
            Udfyld de beløb, du kender. De står ofte i ejerforeningens opkrævninger eller årsopgørelser.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <FieldV4
            label="Fællesudgift"
            value={state.costFaellesudgifter ? String(state.costFaellesudgifter) : ''}
            onChange={(v) => update({ costFaellesudgifter: parseInt(v) || 0 })}
            placeholder="24.000 kr / år"
            numeric
            hint="Står ofte på opkrævningen fra ejerforeningen."
          />
          <FieldV4
            label="Grundskyld"
            value={state.costGrundvaerdi ? String(state.costGrundvaerdi) : ''}
            onChange={(v) => update({ costGrundvaerdi: parseInt(v) || 0 })}
            placeholder="4.500 kr /år"
            numeric
            hint="Står på kommunens opgørelse eller skat.dk."
          />
          <FieldV4
            label="Renovation"
            value={state.costRenovation ? String(state.costRenovation) : ''}
            onChange={(v) => update({ costRenovation: parseInt(v) || 0 })}
            placeholder="1.800 kr/år"
            numeric
            hint="Udfyld hvis det betales separat."
          />
          <FieldV4
            label="Grundfond"
            value={state.costGrundfond ? String(state.costGrundfond) : ''}
            onChange={(v) => update({ costGrundfond: parseInt(v) || 0 })}
            placeholder="2.400 kr/år"
            numeric
            hint="Udfyld hvis ejerforeningen opkræver til vedligehold."
          />
        </div>
      </Card>

      {/* Vand */}
      <Card className="p-6 space-y-4">
        <CardLabel>Vand</CardLabel>
        <QuestionRowV4
          label="Betaler du vand gennem ejerforeningen?"
          options={['Ja', 'Nej', 'Ved ikke']}
          value={vandSvar}
          onChange={(v) => {
            setVandSvar(v);
            update({ waterPaidViaAssoc: v === 'Ja' });
          }}
        />
        {(vandSvar === 'Ja' || vandSvar === 'Nej') && (
          <FieldV4
            label="Samlet vandudgift sidste år"
            value={
              state.waterPaidViaAssoc
                ? state.waterAcontoYearly ? String(state.waterAcontoYearly) : ''
                : state.waterUsageLastYearKr ? String(state.waterUsageLastYearKr) : ''
            }
            onChange={(v) => {
              const n = parseInt(v) || 0;
              if (state.waterPaidViaAssoc) update({ waterAcontoYearly: n });
              else update({ waterUsageLastYearKr: n });
            }}
            placeholder="3.500 kr/år"
            numeric
            hint="Står ofte i årsopgørelsen eller forbrugsregnskabet."
          />
        )}
      </Card>

      {/* Varme */}
      <Card className="p-6 space-y-4">
        <CardLabel>Varme</CardLabel>
        <QuestionRowV4
          label="Betaler du varme gennem ejerforeningen?"
          options={['Ja', 'Nej', 'Ved ikke']}
          value={varmeSvar}
          onChange={(v) => {
            setVarmeSvar(v);
            update({ heatPaidViaAssoc: v === 'Ja' });
          }}
        />
        {(varmeSvar === 'Ja' || varmeSvar === 'Nej') && (
          <FieldV4
            label="Samlet varmeudgift sidste år"
            value={
              state.heatPaidViaAssoc
                ? state.heatAcontoYearly ? String(state.heatAcontoYearly) : ''
                : state.heatUsageLastYearKr ? String(state.heatUsageLastYearKr) : ''
            }
            onChange={(v) => {
              const n = parseInt(v) || 0;
              if (state.heatPaidViaAssoc) update({ heatAcontoYearly: n });
              else update({ heatUsageLastYearKr: n });
            }}
            placeholder="11.500 kr/år"
            numeric
            hint="Står ofte i årsopgørelsen eller varmeregnskabet."
          />
        )}
      </Card>

      {/* Øvrige udgifter */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <CardLabel>Øvrige udgifter</CardLabel>
            <p className="text-[13px]" style={{ color: V4.muted }}>
              Tilføj kun de udgifter, der er relevante for boligen.
            </p>
          </div>
          <button
            type="button"
            onClick={addDrift}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-[13.5px] transition-all active:scale-[0.98]"
            style={{ background: '#eef0ed', color: V4.ink, fontWeight: 500 }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tilføj udgift
          </button>
        </div>

        {driftItems.length > 0 && (
          <div className="space-y-2 pt-1">
            {driftItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <select
                  value={item.category}
                  onChange={(e) => patchDrift(item.id, { category: e.target.value as DriftCategory })}
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-md text-[14px] focus:outline-none"
                  style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
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
                    className="w-full px-3 py-2.5 pr-12 rounded-md text-[14px] tabular-nums focus:outline-none"
                    style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: V4.soft }}>kr/år</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDrift(item.id)}
                  aria-label="Fjern udgift"
                  className="w-9 h-9 shrink-0 rounded-md flex items-center justify-center hover:bg-[#fff2ee] transition-colors"
                  style={{ color: '#a3452e' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Drift-total */}
      {total > 0 && (
        <div className="rounded-[10px] px-6 py-4 flex items-center justify-between" style={{ background: V4.mintSoft }}>
          <span className="text-[14px]" style={{ color: V4.ink }}>Drift (uden vand/varme)</span>
          <span className="text-[18px] tabular-nums" style={{ color: V4.greenDeep, fontWeight: 600 }}>
            {total.toLocaleString('da-DK')} kr/år
          </span>
        </div>
      )}
    </div>
  );
}
