'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { initialState, type FunnelState, type Step } from './types';

interface Ctx {
  state: FunnelState;
  update: (patch: Partial<FunnelState>) => void;
  next: () => void;
  prev: () => void;
  goto: (step: Step) => void;
  reset: () => void;
}

const FunnelContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'salg.funnel.v1';

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FunnelState>(initialState);

  // Load fra localStorage på mount (mobil-bruger der kommer tilbage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    // Capture UTM-params hvis kommet via Ads/brev/SEO
    const params = new URLSearchParams(window.location.search);
    const patch: Partial<FunnelState> = {};
    if (params.get('utm_source')) patch.utmSource = params.get('utm_source');
    if (params.get('utm_medium')) patch.utmMedium = params.get('utm_medium');
    if (params.get('utm_campaign')) patch.utmCampaign = params.get('utm_campaign');
    if (Object.keys(patch).length) setState((s) => ({ ...s, ...patch }));
  }, []);

  // Persist hver opdatering
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const update = (patch: Partial<FunnelState>) => {
    setState((s) => ({ ...s, ...patch }));
  };
  const next = () => setState((s) => ({ ...s, step: Math.min(6, s.step + 1) as Step }));
  const prev = () => setState((s) => ({ ...s, step: Math.max(1, s.step - 1) as Step }));
  const goto = (step: Step) => setState((s) => ({ ...s, step }));
  const reset = () => {
    setState(initialState);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <FunnelContext.Provider value={{ state, update, next, prev, goto, reset }}>
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error('useFunnel must be used within FunnelProvider');
  return ctx;
}
