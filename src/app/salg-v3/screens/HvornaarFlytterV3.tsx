'use client';

import { useFunnelV3 } from '../FunnelV3Context';

const OPTS = [
  { t: 'Hurtigst muligt', sub: 'Inden for en måned' },
  { t: '1–3 måneder', sub: 'Vi har lidt fleksibilitet' },
  { t: '3–6 måneder', sub: 'Planlagt, men ikke hastværk' },
  { t: '6+ måneder', sub: 'Vi undersøger først' },
  { t: 'Ved ikke endnu', sub: 'Vi tager den snak senere' },
];

export function HvornaarFlytterV3() {
  const { state, update } = useFunnelV3();
  const value = state.moveTimeframeRaw;

  return (
    <div className="space-y-2">
      {OPTS.map((o) => {
        const sel = value === o.t;
        return (
          <button
            key={o.t}
            type="button"
            onClick={() => update({ moveTimeframeRaw: o.t })}
            className="w-full px-6 py-5 rounded-[12px] flex items-baseline gap-4 text-left active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
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
            <span
              className="font-display flex-1"
              style={{
                fontSize: 'clamp(20px, 2.5vw, 26px)',
                fontWeight: 400,
                fontVariationSettings: "'opsz' 144, 'SOFT' 30",
                letterSpacing: '-0.015em',
              }}
            >
              {o.t}
            </span>
            <span
              className="font-body text-[13px]"
              style={{ color: sel ? 'oklch(0.62 0.022 80 / 0.7)' : 'var(--muted)' }}
            >
              {o.sub}
            </span>
          </button>
        );
      })}
      <p className="font-body text-[13px] soft leading-[1.55] pt-4">
        Det her påvirker ikke dit tilbud, men hjælper os med at planlægge.
      </p>
    </div>
  );
}
