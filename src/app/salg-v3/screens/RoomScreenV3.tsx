'use client';

import { useFunnelV3 } from '../FunnelV3Context';
import type { StandLevel } from '@/lib/services/price-engine';

type RoomId = 'kokken' | 'bad' | 'stue' | 'sove';

interface RoomConfig {
  id: RoomId;
  label: string;
  yearLabel?: string;
  cards: Array<{ t: 'Nyrenoveret' | 'God stand' | 'Trænger' | 'Skal renoveres'; d: string; img: string }>;
}

const ROOMS: Record<RoomId, RoomConfig> = {
  kokken: {
    id: 'kokken',
    label: 'Køkken',
    yearLabel: 'Køkken-årgang',
    cards: [
      { t: 'Nyrenoveret', d: 'Stenlook-bordplade, integrerede hvidevarer, renoveret indenfor tre år.', img: 'https://picsum.photos/seed/365v3-kokken-ny/600/450' },
      { t: 'God stand', d: 'Velholdt, laminat-bordplade, hvidevarer fra de sidste ti år.', img: 'https://picsum.photos/seed/365v3-kokken-god/600/450' },
      { t: 'Trænger', d: 'Ældre overflader. Hvidevarer kører, men begynder at se brugte ud.', img: 'https://picsum.photos/seed/365v3-kokken-tranger/600/450' },
      { t: 'Skal renoveres', d: 'Originalt eller meget slidt. Total udskiftning nødvendig.', img: 'https://picsum.photos/seed/365v3-kokken-skal/600/450' },
    ],
  },
  bad: {
    id: 'bad',
    label: 'Badeværelse',
    yearLabel: 'Bad-årgang',
    cards: [
      { t: 'Nyrenoveret', d: 'Walk-in shower, hvide fliser, renoveret indenfor tre år.', img: 'https://picsum.photos/seed/365v3-bad-ny/600/450' },
      { t: 'God stand', d: 'Velholdt, hele fliser, fungerende installationer.', img: 'https://picsum.photos/seed/365v3-bad-god/600/450' },
      { t: 'Trænger', d: 'Ældre fliser, brusenisten viser slid — men virker.', img: 'https://picsum.photos/seed/365v3-bad-tranger/600/450' },
      { t: 'Skal renoveres', d: 'Revner, fugt-problemer eller ældre installationer.', img: 'https://picsum.photos/seed/365v3-bad-skal/600/450' },
    ],
  },
  stue: {
    id: 'stue',
    label: 'Stue',
    cards: [
      { t: 'Nyrenoveret', d: 'Hvide vægge, friskmalede lofter, nye gulve eller slebne.', img: 'https://picsum.photos/seed/365v3-stue-ny/600/450' },
      { t: 'God stand', d: 'Pæn vægstand, gulve velholdte.', img: 'https://picsum.photos/seed/365v3-stue-god/600/450' },
      { t: 'Trænger', d: 'Skal males, gulve trænger måske til en slibning.', img: 'https://picsum.photos/seed/365v3-stue-tranger/600/450' },
      { t: 'Skal renoveres', d: 'Skæve vægge, ødelagte gulve — alt skal om.', img: 'https://picsum.photos/seed/365v3-stue-skal/600/450' },
    ],
  },
  sove: {
    id: 'sove',
    label: 'Soveværelse',
    cards: [
      { t: 'Nyrenoveret', d: 'Friske vægge, nye gulve, klar til indflytning.', img: 'https://picsum.photos/seed/365v3-sove-ny/600/450' },
      { t: 'God stand', d: 'Velholdt, måske skal males — men det er det.', img: 'https://picsum.photos/seed/365v3-sove-god/600/450' },
      { t: 'Trænger', d: 'Skal males, ældre gulve men intet alvorligt.', img: 'https://picsum.photos/seed/365v3-sove-tranger/600/450' },
      { t: 'Skal renoveres', d: 'Vægge og gulve trænger til total omgang.', img: 'https://picsum.photos/seed/365v3-sove-skal/600/450' },
    ],
  },
};

const STAND_MAP: Record<string, StandLevel> = {
  'Nyrenoveret': 'nyrenoveret',
  'God stand': 'god',
  'Trænger': 'trænger',
  'Skal renoveres': 'slidt',
};

const STAND_INVERSE: Record<StandLevel, string> = {
  nyrenoveret: 'Nyrenoveret',
  god: 'God stand',
  middel: 'God stand',
  trænger: 'Trænger',
  slidt: 'Skal renoveres',
};

const STATE_KEY_MAP: Record<RoomId, 'kitchenStand' | 'bathroomStand' | 'livingRoomStand' | 'bedroomStand'> = {
  kokken: 'kitchenStand',
  bad: 'bathroomStand',
  stue: 'livingRoomStand',
  sove: 'bedroomStand',
};

export function RoomScreenV3({ roomId }: { roomId: RoomId }) {
  const { state, update } = useFunnelV3();
  const room = ROOMS[roomId];
  const standKey = STATE_KEY_MAP[roomId];
  const currentStand = state[standKey];
  const currentDisplay = currentStand ? STAND_INVERSE[currentStand] : null;

  const isKokken = roomId === 'kokken';
  const isBad = roomId === 'bad';
  const yearValue = isKokken ? state.kitchenYear : isBad ? state.bathroomYear : null;

  function setStand(t: string) {
    const slug = STAND_MAP[t];
    if (slug) update({ [standKey]: slug } as Partial<typeof state>);
  }
  function setYear(v: string) {
    const n = parseInt(v) || null;
    if (isKokken) update({ kitchenYear: n });
    else if (isBad) update({ bathroomYear: n });
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {room.cards.map((c, i) => {
          const sel = currentDisplay === c.t;
          return (
            <button
              key={c.t}
              type="button"
              onClick={() => setStand(c.t)}
              className="text-left overflow-hidden bg-paper active:scale-[0.985] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] salg-v3-card-enter"
              style={{
                borderRadius: '12px',
                animationDelay: `${i * 40}ms`,
                boxShadow: sel
                  ? '0 0 0 2px var(--ink), var(--shadow-card)'
                  : 'var(--shadow-soft)',
                transitionProperty: 'transform, box-shadow',
                transitionDuration: '220ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-cream-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={`${room.label} — ${c.t}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {sel && (
                  <div
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--teal)',
                      boxShadow: '0 4px 12px -2px oklch(0.25 0.05 200 / 0.5)',
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-5 space-y-1.5">
                <div
                  className="font-display ink"
                  style={{
                    fontSize: 'clamp(17px, 1.8vw, 20px)',
                    fontWeight: 500,
                    fontVariationSettings: "'opsz' 30, 'SOFT' 30",
                    letterSpacing: '-0.01em',
                  }}
                >
                  {c.t}
                </div>
                <p className="font-body text-[13px] muted leading-[1.5]">{c.d}</p>
              </div>
            </button>
          );
        })}
      </div>

      {room.yearLabel && (
        <div className="space-y-2 max-w-sm">
          <label className="font-body text-[13px] ink-soft" style={{ fontWeight: 500 }}>
            {room.yearLabel}
          </label>
          <input
            type="text"
            placeholder="2015"
            value={yearValue ?? ''}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] bg-paper font-body font-tabular ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
            style={{
              border: '1px solid var(--border)',
              transition: 'border-color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
          <p className="font-body text-[12px] soft">Året {isKokken ? 'køkkenet' : 'badet'} sidst blev udskiftet (valgfri)</p>
        </div>
      )}

      <style>{`
        @keyframes salg-v3-card-pop {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .salg-v3-card-enter {
          animation: salg-v3-card-pop 280ms cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .salg-v3-card-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
