'use client';

/**
 * Funnel v4 — designerens flow-shell.
 *
 * UX-noter fra .fig:
 *   - "Logo med baggrund er sticky ved scroll" — sticky top-bar
 *   - "Hvis adresse er meget lang får den '...' Den må ikke gå på 2 linier"
 *   - "Telefon nr. expander ved klik"
 *   - "Fixed bund. Den grønne streg indikerer hvor langt man er i flowet."
 */
import { useState } from 'react';
import { useFunnelV2 } from '../salg-v2/FunnelV2Context';
import { getScreensV4, V4_STAGE_LABELS, V4_STAGE_ORDER } from './types';
import { V4, EASE, SectionKicker } from './primitives';
import { BekraeftV4 } from './screens/BekraeftV4';
import { KontaktV4 } from './screens/KontaktV4';
import { HvornaarV4 } from './screens/HvornaarV4';
import { EfterSalgV4 } from './screens/EfterSalgV4';
import { NyBoligV4 } from './screens/NyBoligV4';
import { RoomV4 } from './screens/RoomV4';
import { DetaljerV4 } from './screens/DetaljerV4';
import { UdgifterV4 } from './screens/UdgifterV4';
import { ForholdV4 } from './screens/ForholdV4';
import { EstimatV4 } from './screens/EstimatV4';

export function Funnel() {
  const { state, nextScreen, prevScreen } = useFunnelV2();
  const screens = getScreensV4(state);
  const localIdx = state.screenIdx - 1;
  const screen = screens[Math.min(localIdx, screens.length - 1)];

  if (localIdx < 0) return null;
  if (localIdx >= screens.length) {
    return <EstimatV4 />;
  }

  function next() {
    nextScreen();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function prev() {
    prevScreen();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const canProceed = (() => {
    if (screen.id === 'kontakt')
      return !!(state.fullName && state.email && state.phone);
    if (screen.id === 'hvornaar') return !!state.moveTimeframeRaw;
    if (screen.id === 'efter_salg') return !!state.afterSaleRaw;
    if (screen.id === 'kokken') return !!state.kitchenStand;
    if (screen.id === 'bad') return !!state.bathroomStand;
    if (screen.id === 'ovrige') return !!state.livingRoomStand;
    if (screen.id === 'udgifter') return state.costFaellesudgifter > 0;
    return true;
  })();

  const hint = !canProceed
    ? screen.id === 'kontakt'
      ? 'Navn, email og telefon'
      : screen.id === 'udgifter'
        ? 'Fællesudgift skal udfyldes'
        : screen.kind === 'room' || screen.id === 'hvornaar' || screen.id === 'efter_salg'
          ? 'Vælg en mulighed'
          : null
    : null;

  const progress = (localIdx + 1) / (screens.length + 1);
  const isLast = localIdx === screens.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V4Header stage={screen.stage} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
          <div key={screen.id} className="grid lg:grid-cols-12 gap-10 lg:gap-16 v4-screen-enter">
            {/* Venstre: titel */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-32 self-start">
              <SectionKicker>{screen.kicker}</SectionKicker>
              <h1 className="text-[34px] sm:text-[44px] lg:text-[50px] leading-[1.1] text-balance" style={{ color: V4.ink }}>
                {screen.title}
              </h1>
              <p className="text-[15px] leading-[1.65] max-w-md" style={{ color: V4.muted }}>
                {screen.sub}
              </p>
            </div>

            {/* Højre: svar */}
            <div className="lg:col-span-7">
              {screen.id === 'bekraeft' && <BekraeftV4 />}
              {screen.id === 'kontakt' && <KontaktV4 />}
              {screen.id === 'hvornaar' && <HvornaarV4 />}
              {screen.id === 'efter_salg' && <EfterSalgV4 />}
              {screen.id === 'ny_bolig' && <NyBoligV4 />}
              {screen.kind === 'room' && screen.roomId && <RoomV4 roomId={screen.roomId} />}
              {screen.id === 'detaljer' && <DetaljerV4 />}
              {screen.id === 'udgifter' && <UdgifterV4 />}
              {screen.id === 'forhold' && <ForholdV4 />}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bund m. grøn progress-streg */}
      <footer className="sticky bottom-0 bg-white border-t z-10" style={{ borderColor: V4.border }}>
        <div className="h-[3px] w-full" style={{ background: V4.cream }}>
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: V4.green,
              transition: `width 300ms ${EASE}`,
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="text-[14px] flex items-center gap-1.5 hover:opacity-70 active:scale-[0.97] rounded-md px-2 py-1 transition-all"
            style={{ color: V4.ink, fontWeight: 500 }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {localIdx === 0 ? 'Tilbage til forside' : 'Tilbage'}
          </button>
          <div className="flex items-center gap-4">
            {hint && (
              <span className="text-[12px] hidden sm:inline" style={{ color: V4.soft }}>
                {hint}
              </span>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              className="px-7 py-3 rounded-lg text-[14px] transition-all active:scale-[0.97] disabled:cursor-not-allowed inline-flex items-center gap-2"
              style={{
                background: canProceed ? V4.green : V4.cream,
                color: canProceed ? '#fff' : V4.soft,
                fontWeight: 500,
                transitionDuration: '180ms',
                transitionTimingFunction: EASE,
              }}
            >
              {isLast ? 'Se mit tilbud' : 'Næste'}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes v4-screen-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .v4-screen-enter { animation: v4-screen-fade 240ms ${EASE} both; }
        @media (prefers-reduced-motion: reduce) {
          .v4-screen-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ─── Header: sticky logo + adresse (ellipsis, 1 linje) + tlf-expander + stage-rail ─ */
export function V4Header({ stage }: { stage: 'adresse' | 'boligen' | 'udgifter' | 'estimat' }) {
  const { state } = useFunnelV2();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const currentStageIdx = V4_STAGE_ORDER.indexOf(stage);

  return (
    <header className="sticky top-0 z-20 bg-white/90 border-b" style={{ borderColor: V4.border, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/frontpage" className="flex items-baseline gap-1.5 shrink-0" style={{ color: V4.ink }}>
            <span className="text-[20px] leading-none" style={{ fontWeight: 400 }}>365</span>
            <span className="text-[10px] tracking-[0.22em]" style={{ fontWeight: 500 }}>EJENDOM</span>
          </a>
          {state.fullAddress && (
            <>
              <span className="hidden sm:inline text-[14px]" style={{ color: V4.border }}>/</span>
              <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={V4.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {/* Designer: lang adresse får "..." — aldrig 2 linjer */}
                <span className="text-[13.5px] truncate whitespace-nowrap max-w-[320px]" style={{ color: V4.ink, fontWeight: 500 }}>
                  {state.fullAddress}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Telefon expander ved klik (designer-note) */}
        <button
          type="button"
          onClick={() => setPhoneOpen(!phoneOpen)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] shrink-0 transition-all"
          style={{
            background: V4.cta,
            color: V4.greenDeep,
            fontWeight: 500,
            transitionDuration: '200ms',
            transitionTimingFunction: EASE,
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
          {phoneOpen ? (
            <a href="tel:+4589876634" onClick={(e) => e.stopPropagation()}>+45 89 87 66 34</a>
          ) : (
            <span className="hidden sm:inline">Ring til os</span>
          )}
        </button>
      </div>

      {/* Stage-rail: 4 stages */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pb-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {V4_STAGE_ORDER.map((stageId) => {
            const isCurrent = stageId === stage;
            const done = V4_STAGE_ORDER.indexOf(stageId) < currentStageIdx;
            return (
              <div key={stageId} className="space-y-1.5">
                <div
                  className="h-[3px] rounded-full"
                  style={{
                    background: done || isCurrent ? V4.green : V4.cream,
                    transition: `background-color 200ms ${EASE}`,
                  }}
                />
                <div
                  className="text-[11px] sm:text-[12.5px] tracking-tight"
                  style={{
                    color: isCurrent ? V4.green : done ? V4.ink : V4.soft,
                    fontWeight: isCurrent ? 600 : done ? 500 : 400,
                  }}
                >
                  {V4_STAGE_LABELS[stageId]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
