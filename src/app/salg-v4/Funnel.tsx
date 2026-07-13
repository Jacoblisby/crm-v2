'use client';

/**
 * Funnel v4 — shell pixel-matchet mod Figma-framesene:
 *   - Header: hvid, logo · "1. ADRESSE  2. BOLIGEN  3. UDGIFTER  4. ESTIMAT"
 *     (kun aktiv er mørk) · telefon m. ikon. Under: adresse-pill.
 *   - Skærm-bg: beige #F5F2F1. Split: venstre kicker/H1/sub/counter, højre svar.
 *   - Bund: hvid bar m. tynd petroleum progress-streg ØVERST,
 *     "Forrige" (mint-grå) og "Næste" (petroleum) — kantede knapper.
 */
import { useFunnelV2 } from '../salg-v2/FunnelV2Context';
import { getScreensV4, V4_STAGE_LABELS, V4_STAGE_ORDER } from './types';
import { V4, EASE } from './primitives';
import { BekraeftV4 } from './screens/BekraeftV4';
import { KontaktV4 } from './screens/KontaktV4';
import { HvornaarV4 } from './screens/HvornaarV4';
import { EfterSalgV4 } from './screens/EfterSalgV4';
import { NyBoligV4 } from './screens/NyBoligV4';
import { StandV4 } from './screens/StandV4';
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
    if (screen.id === 'stand')
      return !!(state.kitchenStand && state.bathroomStand && state.livingRoomStand);
    if (screen.id === 'udgifter') return state.costFaellesudgifter > 0;
    return true;
  })();

  const hint = !canProceed
    ? screen.id === 'kontakt'
      ? 'Navn, email og telefon'
      : screen.id === 'udgifter'
        ? 'Fællesudgift skal udfyldes'
        : screen.id === 'stand'
          ? 'Vurder alle tre områder'
          : 'Vælg en mulighed'
    : null;

  const progress = (localIdx + 1) / (screens.length + 1);
  const isLast = localIdx === screens.length - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: V4.beige }}>
      <V4Header stage={screen.stage} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
          <div key={screen.id} className="grid lg:grid-cols-12 gap-10 lg:gap-16 v4-screen-enter">
            {/* Venstre: kicker / titel / sub / counter */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-36 self-start">
              <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: V4.ink, fontWeight: 500 }}>
                {screen.kicker}
              </div>
              <h1 className="text-[34px] sm:text-[42px] leading-[1.15] text-balance" style={{ color: V4.ink, fontWeight: 400 }}>
                {screen.title}
              </h1>
              <p className="text-[14.5px] leading-[1.65] max-w-md" style={{ color: V4.muted }}>
                {screen.sub}
              </p>
              <div className="text-[12px] tracking-[0.14em] uppercase pt-2" style={{ color: V4.soft }}>
                {screen.counter}
              </div>
            </div>

            {/* Højre: svar */}
            <div className="lg:col-span-7">
              {screen.id === 'bekraeft' && <BekraeftV4 />}
              {screen.id === 'kontakt' && <KontaktV4 />}
              {screen.id === 'hvornaar' && <HvornaarV4 />}
              {screen.id === 'efter_salg' && <EfterSalgV4 />}
              {screen.id === 'ny_bolig' && <NyBoligV4 />}
              {screen.id === 'stand' && <StandV4 />}
              {screen.id === 'detaljer' && <DetaljerV4 />}
              {screen.id === 'udgifter' && <UdgifterV4 />}
              {screen.id === 'forhold' && <ForholdV4 />}
            </div>
          </div>
        </div>
      </main>

      {/* Bund-bar: progress-streg øverst, Forrige/Næste */}
      <footer className="sticky bottom-0 bg-white z-10">
        <div className="h-[3px] w-full" style={{ background: '#e8e6e2' }}>
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: V4.selected,
              transition: `width 300ms ${EASE}`,
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-md text-[14px] transition-all active:scale-[0.98]"
            style={{
              background: V4.prevBtn,
              color: V4.greenDeep,
              fontWeight: 500,
              transitionDuration: '160ms',
              transitionTimingFunction: EASE,
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {localIdx === 0 ? 'Til forsiden' : 'Forrige'}
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
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-md text-[14px] transition-all active:scale-[0.98] disabled:cursor-not-allowed"
              style={{
                background: canProceed ? V4.green : '#dcdad6',
                color: canProceed ? '#fff' : V4.soft,
                fontWeight: 500,
                transitionDuration: '160ms',
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

/* ─── Header: logo · nummererede stages · telefon — og adresse-pill under ─── */
export function V4Header({ stage }: { stage: 'adresse' | 'boligen' | 'udgifter' | 'estimat' }) {
  const { state } = useFunnelV2();

  return (
    <header className="sticky top-0 z-20 bg-white/95" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 1px 0 rgba(28,43,43,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between gap-4">
        <a href="/frontpage" className="flex items-baseline gap-1.5 shrink-0" style={{ color: V4.green }}>
          <span className="text-[22px] leading-none" style={{ fontWeight: 500 }}>365</span>
          <span className="text-[10.5px] tracking-[0.2em]" style={{ fontWeight: 500, color: V4.ink }}>EJENDOM</span>
        </a>

        {/* Nummererede stages — kun aktiv er mørk */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {V4_STAGE_ORDER.map((stageId, i) => {
            const isCurrent = stageId === stage;
            return (
              <span
                key={stageId}
                className="text-[12.5px] tracking-[0.08em] uppercase whitespace-nowrap"
                style={{
                  color: isCurrent ? V4.ink : '#a3aeac',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {i + 1}. {V4_STAGE_LABELS[stageId]}
              </span>
            );
          })}
        </nav>

        <a
          href="tel:+4589876634"
          className="hidden sm:inline-flex items-center gap-2 text-[13.5px] shrink-0 hover:opacity-70 transition-opacity"
          style={{ color: V4.ink, fontWeight: 500 }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
          </svg>
          +45 89 87 66 34
        </a>
      </div>

      {/* Adresse-pill (mobil-stages vises også her) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pb-3.5 flex items-center justify-between gap-3">
        {state.fullAddress ? (
          <div
            className="inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-white max-w-full"
            style={{ boxShadow: '0 3px 12px -4px rgba(28,43,43,0.18)', border: '1px solid #eeece8' }}
          >
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: V4.green }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
              </svg>
            </span>
            {/* Designer: lang adresse får "..." — aldrig 2 linjer */}
            <span className="text-[13px] truncate whitespace-nowrap" style={{ color: V4.ink, fontWeight: 500 }}>
              {state.fullAddress}
            </span>
          </div>
        ) : <span />}

        <span className="md:hidden text-[11.5px] uppercase tracking-wide shrink-0" style={{ color: V4.ink, fontWeight: 600 }}>
          {V4_STAGE_ORDER.indexOf(stage) + 1}. {V4_STAGE_LABELS[stage]}
        </span>
      </div>
    </header>
  );
}
