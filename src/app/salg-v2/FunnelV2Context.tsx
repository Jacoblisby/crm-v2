'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  initialStateV2,
  type FunnelStateV2,
  type AdditionalDriftItem,
  TIMEFRAME_DISPLAY_TO_SLUG,
  REASON_DISPLAY_TO_SLUG,
  AFTER_SALE_DISPLAY_TO_SLUG,
} from './types';

/**
 * Derive v1 cost-felter fra dynamisk drift-liste.
 * Submit-action læser fra costForsikringer / costFaelleslaan / costAndreDrift —
 * vi syncer dem fra additionalDrift hver gang.
 *
 * BEMÆRK: costRenovation og costGrundfond er IKKE i den dynamiske liste
 * (de er egne MoneyInputs i UI'en). Vi rører dem ikke her, men costGrundfond
 * lægges oven i costAndreDrift af caller.
 */
function syncDriftToCostFields(items: AdditionalDriftItem[]): {
  costForsikringer: number;
  costFaelleslaan: number;
  driftAndre: number;
} {
  let forsikringer = 0;
  let faelleslaan = 0;
  let andre = 0;
  for (const item of items) {
    const amt = item.amount || 0;
    if (item.category === 'Ejendomsforsikring') forsikringer += amt;
    else if (item.category === 'Ydelse på fælleslån') faelleslaan += amt;
    else andre += amt; // Administration, Antenne, Internet, Vedligeholdelseskonto, Andet
  }
  return { costForsikringer: forsikringer, costFaelleslaan: faelleslaan, driftAndre: andre };
}

/**
 * Migration: gamle localStorage-states kan have 'Renovation' eller 'Grundfond'
 * som dropdown-kategorier. De er nu standalone felter — flyt deres beløb derhen.
 */
function migrateLegacyDrift(parsed: Partial<FunnelStateV2>): Partial<FunnelStateV2> {
  if (!Array.isArray(parsed.additionalDrift)) return parsed;
  let migratedRenovation = parsed.costRenovation || 0;
  let migratedGrundfond = parsed.costGrundfond || 0;
  const kept: AdditionalDriftItem[] = [];
  for (const item of parsed.additionalDrift) {
    if (item.category === ('Renovation' as AdditionalDriftItem['category'])) {
      migratedRenovation += item.amount || 0;
    } else if (item.category === ('Grundfond' as AdditionalDriftItem['category'])) {
      migratedGrundfond += item.amount || 0;
    } else {
      kept.push(item);
    }
  }
  return {
    ...parsed,
    additionalDrift: kept,
    costRenovation: migratedRenovation,
    costGrundfond: migratedGrundfond,
  };
}

interface Ctx {
  state: FunnelStateV2;
  update: (patch: Partial<FunnelStateV2>) => void;
  setAnswer: (key: keyof FunnelStateV2, value: FunnelStateV2[keyof FunnelStateV2]) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  gotoScreen: (idx: number) => void;
  reset: () => void;
}

const Ctx = createContext<Ctx | null>(null);

const STORAGE_KEY = 'salg.funnel.v2';

export function FunnelV2Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunnelStateV2>(initialStateV2);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FunnelStateV2>;
        const migrated = migrateLegacyDrift(parsed);
        setState({ ...initialStateV2, ...migrated });
      }
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const patch: Partial<FunnelStateV2> = {};
    if (params.get('utm_source')) patch.utmSource = params.get('utm_source');
    if (params.get('utm_medium')) patch.utmMedium = params.get('utm_medium');
    if (params.get('utm_campaign')) patch.utmCampaign = params.get('utm_campaign');
    if (Object.keys(patch).length) setState((s) => ({ ...s, ...patch }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const update = (patch: Partial<FunnelStateV2>) => {
    setState((s) => {
      const next = { ...s, ...patch };
      // Sync display-strings → v1 slug-felter (så submit-action virker)
      if (patch.moveTimeframeRaw !== undefined) {
        next.sellTimeframe = TIMEFRAME_DISPLAY_TO_SLUG[patch.moveTimeframeRaw] ?? null;
      }
      if (patch.sellReasonRaw !== undefined) {
        next.sellReason = REASON_DISPLAY_TO_SLUG[patch.sellReasonRaw] ?? null;
      }
      if (patch.afterSaleRaw !== undefined) {
        next.afterSale = AFTER_SALE_DISPLAY_TO_SLUG[patch.afterSaleRaw] ?? null;
      }
      // Sync drift → v1 cost-felter. Trigger ved aendring i additionalDrift
      // ELLER costGrundfond, da costAndreDrift = (drift andre) + costGrundfond.
      if (patch.additionalDrift !== undefined || patch.costGrundfond !== undefined) {
        const sums = syncDriftToCostFields(next.additionalDrift);
        next.costForsikringer = sums.costForsikringer;
        next.costFaelleslaan = sums.costFaelleslaan;
        next.costAndreDrift = sums.driftAndre + (next.costGrundfond || 0);
      }
      return next;
    });
  };

  const setAnswer = (key: keyof FunnelStateV2, value: FunnelStateV2[keyof FunnelStateV2]) => {
    update({ [key]: value } as Partial<FunnelStateV2>);
  };

  const nextScreen = () =>
    setState((s) => ({ ...s, screenIdx: s.screenIdx + 1 }));
  const prevScreen = () =>
    setState((s) => ({ ...s, screenIdx: Math.max(0, s.screenIdx - 1) }));
  const gotoScreen = (idx: number) =>
    setState((s) => ({ ...s, screenIdx: Math.max(0, idx) }));
  const reset = () => {
    setState(initialStateV2);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ state, update, setAnswer, nextScreen, prevScreen, gotoScreen, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFunnelV2() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFunnelV2 must be used within FunnelV2Provider');
  return ctx;
}
