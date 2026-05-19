'use client';

/**
 * Funnel — Opendoor-style split layout, 13-screen flat array.
 *
 * Design-eng key fixes baked in:
 *   1. Step-crossfade (key={screenIdx} + @starting-style) — opacity + translateY,
 *      200ms ease-out — eliminates harsh scroll-jump between steps
 *   2. active:scale(0.97) på Næste-button — tactile press-feedback
 *   3. prefers-reduced-motion handling
 *   4. Custom ease-out curve i stedet for Tailwind default
 *   5. focus-visible rings på alle interaktive elementer
 *   6. Progress bar = linear (constant motion)
 */
import { useFunnelV2 } from './FunnelV2Context';
import { getScreens } from './types';
import { RoomIcon } from './components/icons';
import { EASE_OUT } from './components/primitives';
import { BekraeftAdresse } from './screens/BekraeftAdresse';
import { Kontakt } from './screens/Kontakt';
import { HvornaarFlytter } from './screens/HvornaarFlytter';
import { RoomScreen } from './screens/RoomScreen';
import { SidsteDetaljer } from './screens/SidsteDetaljer';
import { Udgifter } from './screens/Udgifter';
import { GrundForSalg } from './screens/GrundForSalg';
import { EfterSalg } from './screens/EfterSalg';
import { NyBolig } from './screens/NyBolig';
import { Estimat } from './screens/Estimat';

const ACCENT = '#244949';

export function Funnel() {
  const { state, nextScreen, prevScreen } = useFunnelV2();
  const screens = getScreens(state);
  const screen = screens[Math.min(state.screenIdx - 1, screens.length - 1)];
  // screenIdx convention: 0 = Landing, 1..N = funnel screens
  // (svarer til handoff's flat array 1..N, men 0-indexed for Landing-check)
  const localIdx = state.screenIdx - 1;

  if (localIdx < 0 || localIdx >= screens.length + 1) return null;

  // Vis Estimat når vi er på sidste screen + 1
  if (localIdx >= screens.length) {
    return <Estimat />;
  }

  function next() {
    if (localIdx < screens.length - 1) {
      nextScreen();
    } else {
      // Sidste screen → gå til Estimat (index N+1)
      nextScreen();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function prev() {
    prevScreen();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const canProceed = (() => {
    if (screen.id === 'kontakt') return !!(state.email || state.phone);
    if (screen.id === 'hvornaar') return !!state.moveTimeframeRaw;
    if (screen.kind === 'room' && screen.roomId) {
      const map = {
        kokken: state.kitchenStand,
        bad: state.bathroomStand,
        stue: state.livingRoomStand,
        sove: state.bedroomStand,
      };
      return !!map[screen.roomId];
    }
    if (screen.id === 'udgifter') return state.costFaellesudgifter > 0;
    if (screen.id === 'grund') return !!state.sellReasonRaw;
    if (screen.id === 'efter_salg') return !!state.afterSaleRaw;
    return true;
  })();

  const progress = (localIdx + 1) / screens.length;
  const isLastFunnelScreen = localIdx === screens.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16">
          <div
            key={screen.id}
            className="grid lg:grid-cols-12 gap-10 lg:gap-16 salg-screen-enter"
          >
            {/* Left: title */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-10 self-start">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold tracking-[0.12em] uppercase"
                  style={{ background: '#F8F2E5', color: ACCENT }}
                >
                  <RoomIcon name={screen.icon} color={ACCENT} size={12} />
                  {screen.kicker}
                </span>
              </div>

              <h1 className="text-[40px] sm:text-[54px] lg:text-[64px] font-medium tracking-[-0.025em] leading-[0.98] text-balance text-[#14181A]">
                {screen.title}
              </h1>

              <p className="text-[16px] leading-[1.55] max-w-md text-[#5A6166]">
                {screen.sub}
              </p>

              {screen.counter && (
                <div className="inline-flex items-center gap-2 pt-1">
                  <div className="h-1 w-12 rounded-full" style={{ background: ACCENT }} />
                  <span className="text-[12px] font-mono tracking-wider text-[#9C988C]">
                    {screen.counter.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Right: answer */}
            <div className="lg:col-span-7">
              {screen.id === 'bekraeft' && <BekraeftAdresse />}
              {screen.id === 'kontakt' && <Kontakt />}
              {screen.id === 'hvornaar' && <HvornaarFlytter />}
              {screen.kind === 'room' && screen.roomId && <RoomScreen roomId={screen.roomId} />}
              {screen.id === 'detaljer' && <SidsteDetaljer />}
              {screen.id === 'udgifter' && <Udgifter />}
              {screen.id === 'grund' && <GrundForSalg />}
              {screen.id === 'efter_salg' && <EfterSalg />}
              {screen.id === 'ny_bolig' && <NyBolig />}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="sticky bottom-0 bg-white border-t border-[#EAE7DE]">
        <div className="h-[3px] w-full bg-[#F4F1EA]">
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: ACCENT,
              transition: `width 300ms linear`,
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="text-[14px] font-medium hover:opacity-70 flex items-center gap-1 text-[#14181A] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md px-2 py-1 touch-manipulation"
            style={{ transition: `opacity 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {localIdx === 0 ? 'Tilbage til forside' : 'Forrige'}
          </button>
          <div className="flex items-center gap-4">
            {!canProceed && screen.id === 'udgifter' && (
              <span className="text-[12px] hidden sm:inline text-[#9C988C]">
                Fællesudgifter skal udfyldes
              </span>
            )}
            {!canProceed && screen.id === 'kontakt' && (
              <span className="text-[12px] hidden sm:inline text-[#9C988C]">
                Mindst email eller telefon
              </span>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              aria-disabled={!canProceed}
              className="px-7 py-3 rounded-full font-semibold text-[14px] text-white disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] touch-manipulation"
              style={{
                background: !canProceed ? undefined : ACCENT,
                transition: `transform 150ms ${EASE_OUT}, background-color 200ms ${EASE_OUT}, color 200ms ${EASE_OUT}`,
              }}
            >
              {isLastFunnelScreen ? 'Se mit estimat' : 'Næste'} →
            </button>
          </div>
        </div>
      </footer>

      {/* Step-crossfade animation: each screen.id key triggers re-mount with @starting-style */}
      <style>{`
        @keyframes salg-screen-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .salg-screen-enter {
          animation: salg-screen-fade 220ms ${EASE_OUT} both;
        }
        @media (prefers-reduced-motion: reduce) {
          .salg-screen-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
