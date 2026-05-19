'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { STAGE_LABELS, STAGE_ORDER, getScreens, type V2Stage } from '../types';
import { EASE_OUT } from './primitives';

const ACCENT = '#244949';

export function SalgHeader({ embed }: { embed?: boolean }) {
  const { state, reset } = useFunnelV2();
  if (embed) return null;

  const isLanding = state.screenIdx === 0 && !state.fullAddress;
  if (isLanding) {
    return (
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
          <a href="https://365ejendom.dk" className="inline-flex items-baseline gap-1 min-h-[44px] text-white">
            <span className="text-[20px] font-semibold tracking-tight">365</span>
            <span className="text-[14px] font-medium text-white/80">ejendomme</span>
          </a>
          <a href="tel:+4589876634" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white min-h-[44px] px-3 rounded-full hover:bg-white/10"
             style={{ transition: `background-color 150ms ${EASE_OUT}` }}>
            +45 89 87 66 34
          </a>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-[#EAE7DE] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => reset()}
            className="flex items-baseline gap-1 hover:opacity-70 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md"
            style={{ transition: `opacity 150ms ${EASE_OUT}` }}
          >
            <span className="text-[18px] font-semibold tracking-tight text-[#14181A]">365</span>
            <span className="text-[12px] font-medium text-[#5A6166]">ejendomme</span>
          </button>
          <span className="text-[14px] text-[#C9C5BA] hidden sm:inline">/</span>
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[14px] font-medium truncate text-[#14181A]">
              {state.fullAddress || '—'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <a
            href="tel:+4589876634"
            className="hidden sm:flex items-center gap-1.5 text-[13.5px] font-medium hover:opacity-70 text-[#5A6166]"
            style={{ transition: `opacity 150ms ${EASE_OUT}` }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
            </svg>
            +45 89 87 66 34
          </a>
          <button
            type="button"
            className="text-[13.5px] font-medium hover:opacity-70 text-[#14181A] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md px-2 py-1"
            style={{ transition: `opacity 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
          >
            Gem
          </button>
        </div>
      </div>

      {/* Stage rail */}
      <StageRail />
    </header>
  );
}

function StageRail() {
  const { state } = useFunnelV2();
  const screens = getScreens(state);
  const screen = screens[Math.min(state.screenIdx, screens.length - 1)];
  const currentStage: V2Stage = screen?.stage ?? 'adresse';
  const currentStageIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 pb-5">
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {STAGE_ORDER.map((stageId) => {
          const isCurrent = stageId === currentStage;
          const stageIdx = STAGE_ORDER.indexOf(stageId);
          const done = stageIdx < currentStageIdx;
          return (
            <div key={stageId} className="space-y-1.5">
              <div
                className="h-[3px] rounded-full"
                style={{
                  background: done || isCurrent ? ACCENT : '#F0EBE0',
                  transition: `background-color 200ms ${EASE_OUT}`,
                }}
              ></div>
              <div
                className="text-[11px] sm:text-[12.5px] tracking-tight"
                style={{
                  color: isCurrent ? ACCENT : done ? '#14181A' : '#9C988C',
                  fontWeight: isCurrent ? 700 : done ? 500 : 400,
                  transition: `color 200ms ${EASE_OUT}`,
                }}
              >
                {STAGE_LABELS[stageId]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
