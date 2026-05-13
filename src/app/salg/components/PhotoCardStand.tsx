'use client';

import { Check } from 'lucide-react';
import type { StandLevel } from '@/lib/services/price-engine';

/**
 * Photo-card stand-rating picker — inspireret af Opendoor + Zillow's
 * 'How would you describe your kitchen?' photo cards.
 *
 * Visuelle eksempler kalibrerer brugerens skala (genkendelse > hukommelse).
 * Bygges som 4 cards i grid med billede + label + kort beskrivelse.
 *
 * Vi mapper 5 schema-niveauer (nyrenoveret/god/middel/trænger/slidt) til
 * 4 visuelle niveauer (nyrenoveret/god/slidt/trænger). "Middel" gemmes som
 * default-fallback hvis brugeren tøver, ellers vælger de et af de 4 viste.
 */

export type RoomType = 'kokken' | 'bad' | 'stue' | 'sov';

interface PhotoOption {
  /** Schema-niveau som gemmes i state — kan være middel/trænger/slidt */
  level: StandLevel;
  /** Visuelt label på cardet */
  title: string;
  /** Kort beskrivelse under titlen */
  desc: string;
  /** Filnavn-suffix i /public/salg-photos/ */
  photoKey: 'nyrenoveret' | 'god' | 'slidt' | 'traenger';
}

const KITCHEN_OPTIONS: PhotoOption[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Stenlook-bordplade, integrerede hvidevarer, renoveret <3 år',
    photoKey: 'nyrenoveret',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Velholdt, laminat-bordplade, hvidevarer fra de sidste 10 år',
    photoKey: 'god',
  },
  {
    level: 'trænger',
    title: 'Trænger',
    desc: 'Ældre overflader, hvidevarer kører men begynder at se brugte ud',
    photoKey: 'slidt',
  },
  {
    level: 'slidt',
    title: 'Skal renoveres',
    desc: 'Originalt eller meget slidt — total udskiftning nødvendig',
    photoKey: 'traenger',
  },
];

const BATHROOM_OPTIONS: PhotoOption[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Walk-in shower, hvide fliser, renoveret <3 år',
    photoKey: 'nyrenoveret',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Velholdt, hele fliser, fungerende installationer',
    photoKey: 'god',
  },
  {
    level: 'trænger',
    title: 'Trænger',
    desc: 'Ældre fliser, brusenisten viser slid, men virker',
    photoKey: 'slidt',
  },
  {
    level: 'slidt',
    title: 'Skal renoveres',
    desc: 'Revner, fugt-problemer eller ældre installationer',
    photoKey: 'traenger',
  },
];

const LIVING_OPTIONS: PhotoOption[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Hvide vægge, friskmalede lofter, nye gulve eller slebne',
    photoKey: 'nyrenoveret',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Pæn vægstand, gulve velholdte',
    photoKey: 'god',
  },
  {
    level: 'trænger',
    title: 'Trænger',
    desc: 'Skal males, gulve trænger måske til en slibning',
    photoKey: 'slidt',
  },
  {
    level: 'slidt',
    title: 'Skal renoveres',
    desc: 'Skæve vægge, ødelagte gulve, alt skal om',
    photoKey: 'traenger',
  },
];

const BEDROOM_OPTIONS: PhotoOption[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Friske vægge, nye gulve, klar til indflytning',
    photoKey: 'nyrenoveret',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Velholdt, måske skal males men det er det',
    photoKey: 'god',
  },
  {
    level: 'trænger',
    title: 'Trænger',
    desc: 'Skal males, ældre gulve men intet alvorligt',
    photoKey: 'slidt',
  },
  {
    level: 'slidt',
    title: 'Skal renoveres',
    desc: 'Vægge og gulve trænger til total omgang',
    photoKey: 'traenger',
  },
];

const ROOM_OPTIONS: Record<RoomType, PhotoOption[]> = {
  kokken: KITCHEN_OPTIONS,
  bad: BATHROOM_OPTIONS,
  stue: LIVING_OPTIONS,
  sov: BEDROOM_OPTIONS,
};

const ROOM_LABELS: Record<RoomType, string> = {
  kokken: 'køkken',
  bad: 'badeværelse',
  stue: 'stue',
  sov: 'soveværelse',
};

interface PhotoCardStandProps {
  room: RoomType;
  value: StandLevel | null;
  onChange: (level: StandLevel) => void;
}

export function PhotoCardStand({ room, value, onChange }: PhotoCardStandProps) {
  const options = ROOM_OPTIONS[room];
  const label = ROOM_LABELS[room];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-700">
        Hvilket af disse minder mest om dit {label}?
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {options.map((opt) => {
          // Map old "middel" to either "trænger" or "god" for visuel display
          const isSelected =
            value === opt.level ||
            (opt.level === 'trænger' && value === 'middel');
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => onChange(opt.level)}
              className={`group text-left bg-white rounded-xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={`/salg-photos/${room}-${opt.photoKey}.jpg`}
                  alt={`${label} — ${opt.title}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-slate-900' : 'text-slate-700'
                  }`}
                >
                  {opt.title}
                </div>
                <div className="text-xs text-slate-500 leading-snug">{opt.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
