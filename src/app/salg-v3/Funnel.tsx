'use client';

/**
 * Funnel v3 — foundation pass.
 * Genbruger v2 screens men wrapper i v3 type-system + tokens.
 * (Drag-to-explore pris + comparative slider polishes næste pass.)
 */
import { useFunnelV3 } from './FunnelV3Context';
import { getScreens } from '../salg-v2/types';
import { BekraeftV3 } from './screens/BekraeftV3';
import { HvornaarFlytterV3 } from './screens/HvornaarFlytterV3';
import { RoomScreenV3 } from './screens/RoomScreenV3';
import { SidsteDetaljer } from '../salg-v2/screens/SidsteDetaljer';
import { Udgifter } from '../salg-v2/screens/Udgifter';
import { GrundForSalg } from '../salg-v2/screens/GrundForSalg';
import { EfterSalg } from '../salg-v2/screens/EfterSalg';
import { NyBolig } from '../salg-v2/screens/NyBolig';
import { EstimatV3 } from './screens/EstimatV3';

export function Funnel() {
  const { state, nextScreen, prevScreen } = useFunnelV3();
  const screens = getScreens(state);
  const screen = screens[Math.min(state.screenIdx - 1, screens.length - 1)];
  const localIdx = state.screenIdx - 1;

  if (localIdx < 0 || localIdx >= screens.length + 1) return null;
  if (localIdx >= screens.length) {
    return <EstimatV3 />;
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16">
          <div
            key={screen.id}
            className="grid lg:grid-cols-12 gap-10 lg:gap-16 salg-v3-screen-enter"
          >
            {/* Venstre — editorial title */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-32 self-start">
              <p className="font-body text-[11px] tracking-[0.2em] uppercase soft">
                {screen.kicker.toLowerCase()}
              </p>
              <h1
                className="font-display ink text-[clamp(40px,5.5vw,68px)] leading-[1.0] tracking-[-0.025em] text-balance"
                style={{ fontWeight: 400 }}
              >
                {screen.title}
              </h1>
              <p className="font-body text-[16px] muted leading-[1.6] max-w-md">
                {screen.sub}
              </p>
              {screen.counter && (
                <p className="font-body text-[12px] tracking-[0.18em] uppercase soft pt-1 font-tabular">
                  {screen.counter}
                </p>
              )}
            </div>

            {/* Højre — answer */}
            <div className="lg:col-span-7">
              {screen.id === 'bekraeft' && <BekraeftV3 />}
              {screen.id === 'hvornaar' && <HvornaarFlytterV3 />}
              {screen.kind === 'room' && screen.roomId && <RoomScreenV3 roomId={screen.roomId} />}
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
      <footer className="sticky bottom-0 bg-paper border-t border-warm relative z-[3]">
        <div className="h-[2px] w-full" style={{ background: 'var(--cream-deep)' }}>
          <div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: 'var(--teal)',
              transition: 'width 280ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="font-body text-[14px] muted hover:ink flex items-center gap-1.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] rounded-md px-2 py-1 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {localIdx === 0 ? 'Tilbage til forside' : 'Forrige'}
          </button>
          <div className="flex items-center gap-4">
            {!canProceed && screen.id === 'udgifter' && (
              <span className="font-body text-[12px] hidden sm:inline soft">
                fællesudgifter skal udfyldes
              </span>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!canProceed}
              aria-disabled={!canProceed}
              className="px-6 py-3 rounded-full font-body text-[14px] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] disabled:cursor-not-allowed touch-manipulation"
              style={{
                background: !canProceed ? 'var(--cream-deep)' : 'var(--ink)',
                color: !canProceed ? 'var(--soft)' : 'var(--cream)',
                fontWeight: 500,
                transitionProperty: 'transform, background-color, color',
                transitionDuration: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {isLastFunnelScreen ? 'se mit estimat' : 'næste'} →
            </button>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes salg-v3-screen-fade {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .salg-v3-screen-enter {
          animation: salg-v3-screen-fade 240ms cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .salg-v3-screen-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
