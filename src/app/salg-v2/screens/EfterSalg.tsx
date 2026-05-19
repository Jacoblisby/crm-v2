'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function EfterSalg() {
  const { state, update } = useFunnelV2();
  const value = state.afterSaleRaw;

  const opts = [
    {
      t: 'Flytter ud helt',
      sub: 'Jeg har et andet sted at bo eller flytter ud af området.',
      icon: 'door',
    },
    {
      t: 'Vil blive boende som lejer',
      sub: 'Sale-leaseback — vi køber, du bliver boende i din nuværende bolig.',
      icon: 'home',
      highlight: true,
    },
    {
      t: 'Vil leje en anden bolig',
      sub: 'Vi har 18+ lejemål klar — måske kan vi finde noget der passer.',
      icon: 'arrow',
    },
    {
      t: 'Ved ikke endnu',
      sub: 'Vi tager den snak senere.',
      icon: 'q',
    },
  ];

  return (
    <div className="space-y-2.5">
      {opts.map((o) => {
        const sel = value === o.t;
        return (
          <button
            key={o.t}
            type="button"
            onClick={() => update({ afterSaleRaw: o.t })}
            className="w-full px-5 py-4 rounded-2xl border-2 flex items-start gap-4 text-left bg-white active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
            style={{
              borderColor: sel ? '#0F1A1A' : '#EAE7DE',
              transition: `transform 150ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: sel ? '#0F1A1A' : '#F8F2E5',
                transition: `background-color 200ms ${EASE_OUT}`,
              }}
            >
              <MiniIcon name={o.icon} color={ACCENT} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[16px] font-semibold text-[#14181A]">{o.t}</span>
                {o.highlight && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight text-white"
                    style={{ background: ACCENT }}
                  >
                    POPULÆR
                  </span>
                )}
              </div>
              <div className="text-[12.5px] mt-1 leading-relaxed text-[#5A6166]">{o.sub}</div>
            </div>
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
              style={{
                borderColor: sel ? '#0F1A1A' : '#D6D2C5',
                background: sel ? '#0F1A1A' : '#fff',
                transition: `background-color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
              }}
            >
              {sel && (
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
