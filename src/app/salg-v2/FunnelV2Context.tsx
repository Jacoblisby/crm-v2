'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  initialStateV2,
  type FunnelStateV2,
  TIMEFRAME_DISPLAY_TO_SLUG,
  REASON_DISPLAY_TO_SLUG,
  AFTER_SALE_DISPLAY_TO_SLUG,
} from './types';

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
        setState({ ...initialStateV2, ...parsed });
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
