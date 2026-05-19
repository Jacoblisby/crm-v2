'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function GrundForSalg() {
  const { state, update } = useFunnelV2();
  const value = state.sellReasonRaw;

  const opts = [
    { t: 'Flytter', icon: 'home' },
    { t: 'Arv / dødsbo', icon: 'heart' },
    { t: 'Skilsmisse', icon: 'split' },
    { t: 'Økonomi', icon: 'coin2' },
    { t: 'Investering', icon: 'trending' },
    { t: 'Andet', icon: 'q' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[#5A6166]">
        Vi bruger det her til at tilpasse vores tilbud og finde løsninger der passer dig.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {opts.map((o) => {
          const sel = value === o.t;
          return (
            <button
              key={o.t}
              type="button"
              onClick={() => update({ sellReasonRaw: o.t })}
              className="px-3 py-5 rounded-2xl border-2 flex flex-col items-center gap-2 bg-white active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
              style={{
                borderColor: sel ? '#0F1A1A' : '#EAE7DE',
                transition: `transform 150ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: sel ? '#0F1A1A' : '#F8F2E5',
                  transition: `background-color 200ms ${EASE_OUT}`,
                }}
              >
                <MiniIcon name={o.icon} color={ACCENT} size={18} />
              </div>
              <span className="text-[13.5px] font-semibold text-center text-[#14181A]">{o.t}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
