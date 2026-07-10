'use client';

/**
 * RoomV4 — Boligens stand (02_Boligen trin 1-3).
 * Køkken og Badeværelse har egne skærme; "Øvrige rum" dækker stue, værelser,
 * entré og gang (sætter livingRoomStand + bedroomStand samlet).
 *
 * Designer-labels: Nyrenoveret / God men brugt / Trænger / Skal renoveres.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import type { StandLevel } from '@/lib/services/price-engine';
import { V4, EASE, TextInputV4 } from '../primitives';

type RoomId = 'kokken' | 'bad' | 'ovrige';

const STAND_MAP: Record<string, StandLevel> = {
  'Nyrenoveret': 'nyrenoveret',
  'God men brugt': 'god',
  'Trænger': 'trænger',
  'Skal renoveres': 'slidt',
};

const STAND_INVERSE: Record<StandLevel, string> = {
  nyrenoveret: 'Nyrenoveret',
  god: 'God men brugt',
  middel: 'God men brugt',
  trænger: 'Trænger',
  slidt: 'Skal renoveres',
};

const ROOM_CARDS: Record<RoomId, Array<{ t: string; d: string; img: string }>> = {
  kokken: [
    { t: 'Nyrenoveret', d: 'Stenlook-bordplade, integrerede hvidevarer, renoveret indenfor tre år.', img: '/salg-photos/stand/kokken-ny.jpg' },
    { t: 'God men brugt', d: 'Velholdt, laminat-bordplade, hvidevarer fra de sidste ti år.', img: '/salg-photos/stand/kokken-god.jpg' },
    { t: 'Trænger', d: 'Ældre overflader. Hvidevarer kører, men begynder at se brugte ud.', img: '/salg-photos/stand/kokken-tranger.jpg' },
    { t: 'Skal renoveres', d: 'Originalt eller meget slidt. Total udskiftning nødvendig.', img: '/salg-photos/stand/kokken-skal.jpg' },
  ],
  bad: [
    { t: 'Nyrenoveret', d: 'Walk-in shower, hvide fliser, renoveret indenfor tre år.', img: '/salg-photos/stand/bad-ny.jpg' },
    { t: 'God men brugt', d: 'Velholdt, hele fliser, fungerende installationer.', img: '/salg-photos/stand/bad-god.jpg' },
    { t: 'Trænger', d: 'Ældre fliser, brusenisten viser slid — men virker.', img: '/salg-photos/stand/bad-tranger.jpg' },
    { t: 'Skal renoveres', d: 'Revner, fugt-problemer eller ældre installationer.', img: '/salg-photos/stand/bad-skal.jpg' },
  ],
  ovrige: [
    { t: 'Nyrenoveret', d: 'Friske vægge, nye eller nyslebne gulve — klar til indflytning.', img: '/salg-photos/stand/stue-ny.jpg' },
    { t: 'God men brugt', d: 'Pæn vægstand, gulve velholdte.', img: '/salg-photos/stand/stue-god.jpg' },
    { t: 'Trænger', d: 'Skal males, gulve trænger måske til en slibning.', img: '/salg-photos/stand/stue-tranger.jpg' },
    { t: 'Skal renoveres', d: 'Skæve vægge, ødelagte gulve — alt skal om.', img: '/salg-photos/stand/stue-skal.jpg' },
  ],
};

export function RoomV4({ roomId }: { roomId: RoomId }) {
  const { state, update } = useFunnelV2();

  const currentStand =
    roomId === 'kokken' ? state.kitchenStand
    : roomId === 'bad' ? state.bathroomStand
    : state.livingRoomStand;
  const currentDisplay = currentStand ? STAND_INVERSE[currentStand] : null;

  function setStand(display: string) {
    const slug = STAND_MAP[display];
    if (!slug) return;
    if (roomId === 'kokken') update({ kitchenStand: slug });
    else if (roomId === 'bad') update({ bathroomStand: slug });
    else update({ livingRoomStand: slug, bedroomStand: slug });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {ROOM_CARDS[roomId].map((c) => {
          const sel = currentDisplay === c.t;
          return (
            <button
              key={c.t}
              type="button"
              onClick={() => setStand(c.t)}
              className="text-left rounded-xl overflow-hidden bg-white transition-all active:scale-[0.99]"
              style={{
                border: `1px solid ${sel ? V4.green : V4.border}`,
                boxShadow: sel ? `inset 0 0 0 1px ${V4.green}, 0 12px 28px -12px rgba(20,93,95,0.28)` : 'none',
                transitionDuration: '200ms',
                transitionTimingFunction: EASE,
              }}
            >
              <div className="aspect-[4/3] relative overflow-hidden" style={{ background: V4.cream }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.t} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                {sel && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md" style={{ background: V4.green }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[14.5px] mb-1" style={{ color: V4.ink, fontWeight: 600 }}>{c.t}</div>
                <div className="text-[12.5px] leading-[1.45]" style={{ color: V4.muted }}>{c.d}</div>
              </div>
            </button>
          );
        })}
      </div>

      {roomId === 'kokken' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInputV4
            label="Køkken-årgang (valgfri)"
            value={state.kitchenYear ? String(state.kitchenYear) : ''}
            onChange={(v) => update({ kitchenYear: parseInt(v.replace(/[^\d]/g, '')) || null })}
            placeholder="2015"
            inputMode="numeric"
            sub="Året køkkenet sidst blev udskiftet"
          />
          <TextInputV4
            label="Mærke (valgfri)"
            value={state.kitchenBrand}
            onChange={(v) => update({ kitchenBrand: v })}
            placeholder="HTH, Svane, IKEA..."
          />
        </div>
      )}
      {roomId === 'bad' && (
        <div className="max-w-sm">
          <TextInputV4
            label="Bad-årgang (valgfri)"
            value={state.bathroomYear ? String(state.bathroomYear) : ''}
            onChange={(v) => update({ bathroomYear: parseInt(v.replace(/[^\d]/g, '')) || null })}
            placeholder="2015"
            inputMode="numeric"
            sub="Året badeværelset sidst blev renoveret"
          />
        </div>
      )}
    </div>
  );
}
