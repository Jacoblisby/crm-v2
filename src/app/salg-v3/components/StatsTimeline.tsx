'use client';

/**
 * StatsTimeline — drillable månedlig timeline 2024-2026.
 * Brydeer "hero-metric"-template. Bruger interagerer med tallene
 * i stedet for at glide forbi.
 */
import { useState } from 'react';

interface Period {
  label: string; // "feb 25" etc.
  monthIso: string;
  handler: number;
  highlight?: string; // optional anonymized story
}

// Stub-data — kommer fra DB i production
const PERIODS: Period[] = [
  // 2020 — første år, langsom start
  { label: 'mar 20', monthIso: '2020-03', handler: 1, highlight: 'Første handel — startskuddet for 365 Ejendomme.' },
  { label: 'jun 20', monthIso: '2020-06', handler: 1 },
  { label: 'sep 20', monthIso: '2020-09', handler: 2 },
  { label: 'dec 20', monthIso: '2020-12', handler: 1 },
  // 2021 — ramp-up
  { label: 'mar 21', monthIso: '2021-03', handler: 2 },
  { label: 'jun 21', monthIso: '2021-06', handler: 2 },
  { label: 'sep 21', monthIso: '2021-09', handler: 3 },
  { label: 'dec 21', monthIso: '2021-12', handler: 2 },
  // 2022
  { label: 'mar 22', monthIso: '2022-03', handler: 3 },
  { label: 'jun 22', monthIso: '2022-06', handler: 3, highlight: 'Første sale-leaseback til pensioneret enke i Næstved.' },
  { label: 'sep 22', monthIso: '2022-09', handler: 3 },
  { label: 'dec 22', monthIso: '2022-12', handler: 2 },
  // 2023
  { label: 'mar 23', monthIso: '2023-03', handler: 4 },
  { label: 'jun 23', monthIso: '2023-06', handler: 3 },
  { label: 'sep 23', monthIso: '2023-09', handler: 4 },
  { label: 'dec 23', monthIso: '2023-12', handler: 3 },
  // 2024 — kraftig vækst
  { label: 'jan 24', monthIso: '2024-01', handler: 2 },
  { label: 'feb 24', monthIso: '2024-02', handler: 3 },
  { label: 'mar 24', monthIso: '2024-03', handler: 5 },
  { label: 'apr 24', monthIso: '2024-04', handler: 4, highlight: 'Sale-leaseback til 78-årig enkemand i Næstved' },
  { label: 'maj 24', monthIso: '2024-05', handler: 6 },
  { label: 'jun 24', monthIso: '2024-06', handler: 4 },
  { label: 'jul 24', monthIso: '2024-07', handler: 2 },
  { label: 'aug 24', monthIso: '2024-08', handler: 5 },
  { label: 'sep 24', monthIso: '2024-09', handler: 7, highlight: 'Skilsmissesalg lukket på 17 dage' },
  { label: 'okt 24', monthIso: '2024-10', handler: 6 },
  { label: 'nov 24', monthIso: '2024-11', handler: 5 },
  { label: 'dec 24', monthIso: '2024-12', handler: 3 },
  { label: 'jan 25', monthIso: '2025-01', handler: 4 },
  { label: 'feb 25', monthIso: '2025-02', handler: 5 },
  { label: 'mar 25', monthIso: '2025-03', handler: 6, highlight: 'Tre lejligheder i samme EF samme uge' },
  { label: 'apr 25', monthIso: '2025-04', handler: 8 },
  { label: 'maj 25', monthIso: '2025-05', handler: 5 },
  { label: 'jun 25', monthIso: '2025-06', handler: 4 },
  { label: 'jul 25', monthIso: '2025-07', handler: 2 },
  { label: 'aug 25', monthIso: '2025-08', handler: 4 },
  { label: 'sep 25', monthIso: '2025-09', handler: 6 },
  { label: 'okt 25', monthIso: '2025-10', handler: 5 },
  { label: 'nov 25', monthIso: '2025-11', handler: 4 },
  { label: 'dec 25', monthIso: '2025-12', handler: 3 },
  { label: 'jan 26', monthIso: '2026-01', handler: 5 },
  { label: 'feb 26', monthIso: '2026-02', handler: 4 },
  { label: 'mar 26', monthIso: '2026-03', handler: 6 },
  { label: 'apr 26', monthIso: '2026-04', handler: 5, highlight: 'Hurtigste overtagelse: fjorten dage' },
  { label: 'maj 26', monthIso: '2026-05', handler: 2 },
];

export function StatsTimeline() {
  const [active, setActive] = useState<number | null>(null);
  const maxHandler = Math.max(...PERIODS.map((p) => p.handler));
  const totalHandler = PERIODS.reduce((s, p) => s + p.handler, 0);
  const activePeriod = active !== null ? PERIODS[active] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-20 sm:py-28">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-10">
        <div className="lg:col-span-6 space-y-3">
          <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">drevet siden 2020</p>
          <h2 className="font-display ink text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.025em] text-balance" style={{ fontWeight: 400 }}>
            {totalHandler} handler.{' '}
            <em
              className="accent"
              style={{
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                fontStyle: 'italic',
              }}
            >
              Hver en historie.
            </em>
          </h2>
        </div>
        <div className="lg:col-span-6 space-y-4 max-w-md lg:ml-auto">
          <p className="font-body text-[15px] muted leading-[1.6]">
            Vi køber ikke for at flippe. Vi køber for at udleje. Lokalt forankret på Sjælland — Næstved, Ringsted, Roskilde, Kalundborg, Taastrup.
          </p>
          <p className="font-body text-[13px] soft">
            Hold pegepilen over en måned for at se aktiviteten.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="relative"
        onMouseLeave={() => setActive(null)}
      >
        <div className="flex items-end gap-[3px] sm:gap-[4px] h-28 sm:h-32 border-b border-warm">
          {PERIODS.map((p, i) => {
            const isActive = active === i;
            const heightPct = (p.handler / maxHandler) * 100;
            return (
              <button
                key={p.monthIso}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="flex-1 group relative focus:outline-none"
                aria-label={`${p.label}: ${p.handler} handler`}
              >
                <div
                  className="w-full rounded-t-[2px]"
                  style={{
                    height: `${heightPct}%`,
                    background: isActive ? 'var(--teal)' : 'var(--paper)',
                    boxShadow: isActive
                      ? '0 4px 12px -4px oklch(0.25 0.05 200 / 0.4)'
                      : 'inset 0 0 0 1px oklch(0.86 0.02 80)',
                    transitionProperty: 'background-color, box-shadow, transform',
                    transitionDuration: '180ms',
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Year ticks */}
        <div className="grid grid-cols-7 mt-2 font-body text-[11px] soft tracking-[0.1em] uppercase">
          <span>2020</span>
          <span>2021</span>
          <span>2022</span>
          <span>2023</span>
          <span>2024</span>
          <span>2025</span>
          <span className="text-right">2026</span>
        </div>

        {/* Active period detail */}
        <div
          className="mt-8 sm:mt-10 min-h-[100px]"
          aria-live="polite"
        >
          {activePeriod ? (
            <div
              className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 items-baseline"
              style={{
                animation: 'salg-v3-fade 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
              }}
              key={activePeriod.monthIso}
            >
              <div className="font-display font-tabular ink text-[clamp(40px,5vw,64px)] leading-[0.95]" style={{ fontWeight: 400, fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                {activePeriod.handler}
              </div>
              <div className="space-y-1">
                <p className="font-body text-[12px] tracking-[0.18em] uppercase soft">
                  {activePeriod.label} · handler lukket
                </p>
                {activePeriod.highlight && (
                  <p className="font-body text-[15px] ink-soft leading-[1.5] max-w-md">
                    {activePeriod.highlight}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="font-body text-[14px] soft">
              <span className="font-tabular">{totalHandler}</span> handler i alt mellem marts 2020 og maj 2026.
              <span className="block mt-1">Gennemsnit: <span className="font-tabular">{(totalHandler / PERIODS.length).toFixed(1)}</span> handler om måneden.</span>
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes salg-v3-fade {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes salg-v3-fade {
            0%, 100% { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </div>
  );
}
