'use client';

/**
 * RoomsOvrigeV3 — kombineret stue + sovevaerelse paa en skaerm.
 * Brydeer 4-rum-i-traek monotonien. Bad + koekken faar foto-grid (dyr renov),
 * stue + sove er enklere maling/gulv-vurdering = chip-baseret.
 */
import { useFunnelV3 } from '../FunnelV3Context';
import type { StandLevel } from '@/lib/services/price-engine';

type RoomId = 'stue' | 'sove';

interface RoomConfig {
  id: RoomId;
  label: string;
  helper: string;
}

const ROOMS: RoomConfig[] = [
  {
    id: 'stue',
    label: 'Stue',
    helper: 'Gulv + vægge — typisk billigste rum at friske op.',
  },
  {
    id: 'sove',
    label: 'Soveværelse',
    helper: 'Samme — primært maling og gulv.',
  },
];

const STAND_OPTS: Array<{ label: string; slug: StandLevel; sub: string }> = [
  { label: 'Nyrenoveret', slug: 'nyrenoveret', sub: 'Klar til indflytning' },
  { label: 'God stand', slug: 'god', sub: 'Velholdt' },
  { label: 'Trænger', slug: 'trænger', sub: 'Skal males' },
  { label: 'Skal renoveres', slug: 'slidt', sub: 'Total omgang' },
];

const STATE_KEY_MAP: Record<RoomId, 'livingRoomStand' | 'bedroomStand'> = {
  stue: 'livingRoomStand',
  sove: 'bedroomStand',
};

export function RoomsOvrigeV3() {
  const { state, update } = useFunnelV3();

  return (
    <div className="space-y-10">
      {ROOMS.map((room) => {
        const standKey = STATE_KEY_MAP[room.id];
        const currentStand = state[standKey];
        return (
          <section key={room.id} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <h3
                className="font-display ink text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.015em]"
                style={{ fontWeight: 400 }}
              >
                {room.label}
              </h3>
              <p className="font-body text-[12.5px] muted">{room.helper}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STAND_OPTS.map((opt) => {
                const sel = currentStand === opt.slug;
                return (
                  <button
                    key={opt.slug}
                    type="button"
                    onClick={() => update({ [standKey]: opt.slug } as Partial<typeof state>)}
                    className="text-left rounded-[12px] px-4 py-3.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
                    style={{
                      background: sel ? 'var(--ink)' : 'var(--paper)',
                      color: sel ? 'var(--cream)' : 'var(--ink)',
                      border: `1px solid ${sel ? 'var(--ink)' : 'var(--border)'}`,
                      boxShadow: sel ? 'var(--shadow-card)' : 'var(--shadow-soft)',
                      transitionProperty: 'transform, background-color, color, border-color, box-shadow',
                      transitionDuration: '200ms',
                      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    }}
                  >
                    <div
                      className="font-display text-[15px] sm:text-[16px] leading-[1.15]"
                      style={{
                        fontWeight: 500,
                        fontVariationSettings: "'opsz' 30, 'SOFT' 30",
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {opt.label}
                    </div>
                    <div
                      className="font-body text-[11.5px] mt-0.5"
                      style={{ color: sel ? 'oklch(0.62 0.022 80 / 0.7)' : 'var(--muted)' }}
                    >
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
