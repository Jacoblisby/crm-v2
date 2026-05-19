'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function HvornaarFlytter() {
  const { state, update } = useFunnelV2();
  const value = state.moveTimeframeRaw;

  const opts = [
    { t: 'Hurtigst muligt', sub: 'Inden for 1 måned', icon: 'bolt' },
    { t: '1–3 måneder', sub: 'Vi har lidt fleksibilitet', icon: 'cal1' },
    { t: '3–6 måneder', sub: 'Planlagt, men ikke hastværk', icon: 'cal2' },
    { t: '6+ måneder', sub: 'Vi undersøger først', icon: 'cal3' },
    { t: 'Ved ikke endnu', sub: 'Vi undersøger først', icon: 'q' },
  ];

  return (
    <div className="space-y-2.5">
      {opts.map((o) => {
        const sel = value === o.t;
        return (
          <button
            key={o.t}
            type="button"
            onClick={() => update({ moveTimeframeRaw: o.t })}
            className="w-full px-5 py-4 rounded-2xl border-2 flex items-center gap-4 text-left bg-white active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
            style={{
              borderColor: sel ? '#0F1A1A' : '#EAE7DE',
              transition: `transform 150ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: sel ? '#0F1A1A' : '#F8F2E5',
                transition: `background-color 200ms ${EASE_OUT}`,
              }}
            >
              <MiniIcon name={o.icon} color={ACCENT} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[#14181A]">{o.t}</div>
              <div className="text-[12.5px] mt-0.5 text-[#5A6166]">{o.sub}</div>
            </div>
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: sel ? '#0F1A1A' : '#D6D2C5',
                background: sel ? '#0F1A1A' : '#fff',
                transition: `background-color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
              }}
            >
              {sel && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-[12.5px] pt-3 text-[#9C988C]">
        Det her påvirker ikke dit tilbud — men hjælper os med at planlægge.
      </p>
    </div>
  );
}
