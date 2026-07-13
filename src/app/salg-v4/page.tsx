'use client';

/**
 * /salg-v4 — designerens flow. Landing bor på /frontpage (designer-note:
 * "Vi redirecter kun til guiden når man har trykket på Tjek din pris").
 * Uden adresse viser vi et minimalt adresse-felt så direkte besøg ikke strander.
 */
import { useFunnelV2 } from '../salg-v2/FunnelV2Context';
import { AddressCta } from '../frontpage/AddressCta';
import { Funnel } from './Funnel';
import { V4 } from './primitives';

export const dynamic = 'force-dynamic';

export default function SalgV4Page() {
  const { state } = useFunnelV2();

  if (state.screenIdx === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: V4.beige }}>
        <header className="px-6 py-5">
          <a href="/frontpage" className="flex items-baseline gap-1.5" style={{ color: V4.ink }}>
            <span className="text-[22px] leading-none" style={{ fontWeight: 400 }}>365</span>
            <span className="text-[11px] tracking-[0.22em]" style={{ fontWeight: 500 }}>EJENDOM</span>
          </a>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 pb-24">
          <div className="w-full max-w-xl text-center space-y-6">
            <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: V4.ink, fontWeight: 500 }}>
              Tjek din pris
            </div>
            <h1 className="text-[34px] sm:text-[44px] leading-[1.12]" style={{ color: V4.ink }}>
              Start med din adresse
            </h1>
            <p className="text-[15px] leading-[1.65] max-w-md mx-auto" style={{ color: V4.muted }}>
              Indtast din adresse, så ser vi på boligen og de offentlige boligdata. Det er
              gratis, diskret og helt uforpligtende.
            </p>
            <AddressCta id="v4-address" />
            <a href="/frontpage" className="inline-block text-[13px] underline hover:no-underline" style={{ color: V4.muted }}>
              Læs mere om, hvordan det virker
            </a>
          </div>
        </main>
      </div>
    );
  }

  return <Funnel />;
}
