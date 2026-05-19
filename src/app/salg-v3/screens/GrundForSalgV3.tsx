'use client';

import { useFunnelV3 } from '../FunnelV3Context';

const OPTS = ['Flytter', 'Arv eller dødsbo', 'Skilsmisse', 'Økonomi', 'Investering', 'Andet'];

export function GrundForSalgV3() {
  const { state, update } = useFunnelV3();
  const value = state.sellReasonRaw;

  // Map "Arv eller dødsbo" til v1's "Arv / dødsbo" for backwards compat
  const v2Map: Record<string, string> = {
    'Arv eller dødsbo': 'Arv / dødsbo',
  };
  const valueDisplay = Object.entries(v2Map).find(([, v]) => v === value)?.[0] ?? value;

  return (
    <div className="space-y-5">
      <p className="font-body text-[14px] muted leading-[1.6] max-w-md">
        Vi bruger det her til at tilpasse vores tilbud og finde løsninger der passer.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {OPTS.map((o) => {
          const sel = valueDisplay === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => update({ sellReasonRaw: v2Map[o] ?? o })}
              className="px-4 py-6 rounded-[12px] flex flex-col items-center text-center gap-2 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
              style={{
                background: sel ? 'var(--ink)' : 'var(--paper)',
                color: sel ? 'var(--cream)' : 'var(--ink)',
                border: sel ? '1px solid var(--ink)' : '1px solid var(--border)',
                boxShadow: sel ? 'var(--shadow-card)' : 'var(--shadow-soft)',
                transitionProperty: 'transform, background-color, color, border-color, box-shadow',
                transitionDuration: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <span
                className="font-display text-center"
                style={{
                  fontSize: 'clamp(15px, 1.6vw, 17px)',
                  fontWeight: 500,
                  fontVariationSettings: "'opsz' 30, 'SOFT' 30",
                  letterSpacing: '-0.01em',
                }}
              >
                {o}
              </span>
            </button>
          );
        })}
      </div>

      {/* Maegler-vurdering */}
      <div className="pt-8 mt-4 border-t border-warm space-y-4">
        <div>
          <p className="font-body text-[11px] tracking-[0.2em] uppercase soft">vurdering</p>
          <h3
            className="font-display ink text-[18px] sm:text-[22px] leading-[1.2] mt-1.5 tracking-[-0.015em]"
            style={{ fontWeight: 400 }}
          >
            Har du fået en mægler-vurdering allerede?
          </h3>
          <p className="font-body text-[13px] muted mt-1 max-w-md">
            Hjælper os med at sætte vores tilbud i kontekst. Ingen forventninger om at matche det.
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { v: false, label: 'Nej, ikke endnu' },
            { v: true, label: 'Ja, jeg har en vurdering' },
          ].map((o) => {
            const sel = state.hasExistingValuation === o.v;
            return (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => update({ hasExistingValuation: o.v })}
                className="px-5 py-2.5 rounded-full font-body text-[13.5px] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
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
                {o.label}
              </button>
            );
          })}
        </div>
        {/* Conditional reveal: vurderings-beløb */}
        <div
          className="grid overflow-hidden"
          style={{
            gridTemplateRows: state.hasExistingValuation ? '1fr' : '0fr',
            transition: 'grid-template-rows 280ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <div className="min-h-0">
            <div className="pt-2 max-w-xs space-y-1.5">
              <label className="font-body text-[13px] ink-soft block" style={{ fontWeight: 500 }}>
                Vurderet beløb
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={state.existingValuation || ''}
                  onChange={(e) => update({ existingValuation: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 })}
                  placeholder="1.200.000"
                  className="w-full px-4 py-3 pr-12 rounded-[10px] bg-paper font-body font-tabular ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
                  style={{
                    border: '1px solid var(--border)',
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-[12px] soft">kr</span>
              </div>
              <p className="font-body text-[12px] muted">Mæglerens estimat. Ca-tal er fint.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
