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
    </div>
  );
}
