'use client';

/**
 * RoomScreen — 2x2 photo grid + condition select. Bruges for køkken/bad/stue/sove.
 * Mapper til v1 stand-fields:
 *   kokken → kitchenStand
 *   bad    → bathroomStand
 *   stue   → livingRoomStand
 *   sove   → bedroomStand
 *
 * Design-eng fixes:
 *   - active:scale på photo cards
 *   - Stagger animation (40ms between cards) — cinematic entrance
 *   - prefers-reduced-motion handling
 */
import { useFunnelV2 } from '../FunnelV2Context';
import { RoomIcon } from '../components/icons';
import { EASE_OUT } from '../components/primitives';
import type { StandLevel } from '@/lib/services/price-engine';

const ACCENT = '#244949';

type RoomId = 'kokken' | 'bad' | 'stue' | 'sove';

interface RoomConfig {
  id: RoomId;
  label: string;
  icon: string;
  yearLabel?: string;
  yearHint?: string;
  showBrand?: boolean;
  cards: Array<{ t: 'Nyrenoveret' | 'God stand' | 'Trænger' | 'Skal renoveres'; d: string; img: string }>;
}

const ROOMS: Record<RoomId, RoomConfig> = {
  kokken: {
    id: 'kokken',
    label: 'Køkken',
    icon: 'kitchen',
    yearLabel: 'Køkken-årgang',
    yearHint: 'Året køkkenet sidst blev udskiftet (valgfri)',
    showBrand: true,
    cards: [
      { t: 'Nyrenoveret', d: 'Stenlook-bordplade, integrerede hvidevarer, renoveret <3 år', img: '/salg-photos/stand/kokken-ny.jpg' },
      { t: 'God stand', d: 'Velholdt, laminat-bordplade, hvidevarer fra de sidste 10 år', img: '/salg-photos/stand/kokken-god.jpg' },
      { t: 'Trænger', d: 'Ældre overflader, hvidevarer kører men begynder at se brugte ud', img: '/salg-photos/stand/kokken-tranger.jpg' },
      { t: 'Skal renoveres', d: 'Originalt eller meget slidt — total udskiftning nødvendig', img: '/salg-photos/stand/kokken-skal.jpg' },
    ],
  },
  bad: {
    id: 'bad',
    label: 'Badeværelse',
    icon: 'bath',
    yearLabel: 'Bad-årgang',
    yearHint: 'Året badet sidst blev renoveret (valgfri)',
    cards: [
      { t: 'Nyrenoveret', d: 'Walk-in shower, hvide fliser, renoveret <3 år', img: '/salg-photos/stand/bad-ny.jpg' },
      { t: 'God stand', d: 'Velholdt, hele fliser, fungerende installationer', img: '/salg-photos/stand/bad-god.jpg' },
      { t: 'Trænger', d: 'Ældre fliser, brusenisten viser slid, men virker', img: '/salg-photos/stand/bad-tranger.jpg' },
      { t: 'Skal renoveres', d: 'Revner, fugt-problemer eller ældre installationer', img: '/salg-photos/stand/bad-skal.jpg' },
    ],
  },
  stue: {
    id: 'stue',
    label: 'Stue',
    icon: 'sofa',
    cards: [
      { t: 'Nyrenoveret', d: 'Hvide vægge, friskmalede lofter, nye gulve eller slebne', img: '/salg-photos/stand/stue-ny.jpg' },
      { t: 'God stand', d: 'Pæn vægstand, gulve velholdte', img: '/salg-photos/stand/stue-god.jpg' },
      { t: 'Trænger', d: 'Skal males, gulve trænger måske til en slibning', img: '/salg-photos/stand/stue-tranger.jpg' },
      { t: 'Skal renoveres', d: 'Skæve vægge, ødelagte gulve, alt skal om', img: '/salg-photos/stand/stue-skal.jpg' },
    ],
  },
  sove: {
    id: 'sove',
    label: 'Soveværelse',
    icon: 'bed',
    cards: [
      { t: 'Nyrenoveret', d: 'Friske vægge, nye gulve, klar til indflytning', img: '/salg-photos/stand/sove-ny.jpg' },
      { t: 'God stand', d: 'Velholdt, måske skal males men det er det', img: '/salg-photos/stand/sove-god.jpg' },
      { t: 'Trænger', d: 'Skal males, ældre gulve men intet alvorligt', img: '/salg-photos/stand/sove-tranger.jpg' },
      { t: 'Skal renoveres', d: 'Vægge og gulve trænger til total omgang', img: '/salg-photos/stand/sove-skal.jpg' },
    ],
  },
};

// Display string → StandLevel slug
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
  'trænger': 'Trænger',
  slidt: 'Skal renoveres',
};

const STATE_KEY_MAP: Record<RoomId, 'kitchenStand' | 'bathroomStand' | 'livingRoomStand' | 'bedroomStand'> = {
  kokken: 'kitchenStand',
  bad: 'bathroomStand',
  stue: 'livingRoomStand',
  sove: 'bedroomStand',
};

export function RoomScreen({ roomId }: { roomId: RoomId }) {
  const { state, update } = useFunnelV2();
  const room = ROOMS[roomId];
  const standKey = STATE_KEY_MAP[roomId];
  const currentStand = state[standKey];
  const currentDisplay = currentStand ? STAND_INVERSE[currentStand] : null;

  const isKokken = roomId === 'kokken';
  const isBad = roomId === 'bad';
  const yearValue = isKokken ? state.kitchenYear : isBad ? state.bathroomYear : null;
  const brandValue = isKokken ? state.kitchenBrand : '';

  function setStand(t: string) {
    const slug = STAND_MAP[t];
    if (slug) update({ [standKey]: slug } as Partial<typeof state>);
  }
  function setYear(v: string) {
    const n = parseInt(v) || null;
    if (isKokken) update({ kitchenYear: n });
    else if (isBad) update({ bathroomYear: n });
  }
  function setBrand(v: string) {
    if (isKokken) update({ kitchenBrand: v });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3">
        {room.cards.map((c, i) => {
          const sel = currentDisplay === c.t;
          return (
            <button
              key={c.t}
              type="button"
              onClick={() => setStand(c.t)}
              className="text-left rounded-2xl overflow-hidden border-2 bg-white active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] salg-card-enter"
              style={{
                borderColor: sel ? '#0F1A1A' : '#EAE7DE',
                animationDelay: `${i * 40}ms`,
                transition: `transform 150ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}`,
              }}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={`${room.label} — ${c.t}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                {sel && (
                  <div
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ background: ACCENT }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[15px] font-semibold mb-1 text-[#14181A]">{c.t}</div>
                <div className="text-[12.5px] leading-[1.45] text-[#5A6166]">{c.d}</div>
              </div>
            </button>
          );
        })}
      </div>

      {(room.yearLabel || room.showBrand) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {room.yearLabel && (
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#14181A]">{room.yearLabel}</label>
              <input
                type="text"
                placeholder="2015"
                value={yearValue ?? ''}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#EAE7DE] focus:border-stone-400"
                style={{ transition: `border-color 180ms ${EASE_OUT}` }}
              />
              {room.yearHint && (
                <p className="text-[12px] text-[#9C988C]">{room.yearHint}</p>
              )}
            </div>
          )}
          {room.showBrand && (
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#14181A]">Mærke (valgfri)</label>
              <input
                type="text"
                placeholder="HTH, Svane, IKEA..."
                value={brandValue}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#EAE7DE] focus:border-stone-400"
                style={{ transition: `border-color 180ms ${EASE_OUT}` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="pt-2 border-t border-[#EAE7DE]">
        <div className="flex items-center gap-2 mb-1.5 pt-5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#5A6166" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-[14px] font-medium text-[#14181A]">Tilføj foto (valgfri)</span>
        </div>
        <p className="text-[12px] mb-3 text-[#5A6166]">
          Med billeder kan vi give dig et endnu mere præcist tilbud — men din vurdering ovenfor er nok.
        </p>
        <button
          type="button"
          className="w-full py-10 rounded-2xl border-2 border-dashed border-[#DAD5C5] flex flex-col items-center justify-center gap-2 hover:bg-stone-50/50 active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
          style={{ transition: `background-color 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
        >
          <RoomIcon name={room.icon} color="#9C988C" size={22} />
          <span className="text-[13px] text-[#5A6166]">Tap for at uploade foto</span>
        </button>
      </div>

      <style>{`
        @keyframes salg-card-pop {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .salg-card-enter {
          animation: salg-card-pop 250ms ${EASE_OUT} both;
        }
        @media (prefers-reduced-motion: reduce) {
          .salg-card-enter { animation: none; }
        }
      `}</style>
    </div>
  );
}
