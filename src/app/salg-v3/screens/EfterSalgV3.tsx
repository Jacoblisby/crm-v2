'use client';

import { useFunnelV3 } from '../FunnelV3Context';

const OPTS = [
  {
    t: 'Flytter ud helt',
    sub: 'Jeg har et andet sted at bo eller flytter ud af området.',
  },
  {
    t: 'Vil blive boende som lejer',
    sub: 'Sale-leaseback. Vi køber, du bliver boende.',
    highlight: 'populært',
  },
  {
    t: 'Vil leje en anden bolig',
    sub: 'Vi har lejemål klar. Måske finder vi noget der passer.',
  },
  {
    t: 'Ved ikke endnu',
    sub: 'Vi tager den snak senere.',
  },
];

export function EfterSalgV3() {
  const { state, update } = useFunnelV3();
  const value = state.afterSaleRaw;

  return (
    <div className="space-y-2">
      {OPTS.map((o) => {
        const sel = value === o.t;
        return (
          <button
            key={o.t}
            type="button"
            onClick={() => update({ afterSaleRaw: o.t })}
            className="w-full px-6 py-5 rounded-[12px] flex items-baseline gap-4 text-left active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
            style={{
              background: sel ? 'var(--ink)' : 'var(--paper)',
              color: sel ? 'var(--cream)' : 'var(--ink)',
              border: sel ? '1px solid var(--ink)' : '1px solid var(--border)',
              boxShadow: sel ? 'var(--shadow-card)' : 'var(--shadow-soft)',
              transitionProperty: 'transform, background-color, color, border-color, box-shadow',
              transitionDuration: '220ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span
                  className="font-display"
                  style={{
                    fontSize: 'clamp(20px, 2.5vw, 26px)',
                    fontWeight: 400,
                    fontVariationSettings: "'opsz' 144, 'SOFT' 30",
                    letterSpacing: '-0.015em',
                  }}
                >
                  {o.t}
                </span>
                {o.highlight && (
                  <em
                    className="font-body text-[10.5px] tracking-[0.18em] uppercase accent"
                    style={{ fontStyle: 'italic', fontWeight: 500 }}
                  >
                    {o.highlight}
                  </em>
                )}
              </div>
              <p
                className="font-body text-[13px] leading-[1.5]"
                style={{ color: sel ? 'oklch(0.62 0.022 80 / 0.75)' : 'var(--muted)' }}
              >
                {o.sub}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
