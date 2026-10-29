'use client';

/**
 * StandV4 — "Boligens stand" (Figma: 02_Boligen trin 1). ÉN skærm for alle rum:
 *   Køkken · Badeværelse · Øvrige rum (radioknapper, ét niveau hver)
 *   + "Har boligen været røgfri?" (Ja/Nej). Årgang på bad er fjernet efter mødet
 *   23.10.2026; køkkenets årstal er tilbage som valgfrit felt (29.10.2026).
 *
 * Designerens 3 niveauer mapper til prismotorens StandLevel:
 *   Nyrenoveret → nyrenoveret · God men brugt → god · Skal renoveres → slidt
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import type { StandLevel } from '@/lib/services/price-engine';
import { V4, Card, ChipGroupV4, FieldV4, QuestionRowV4 } from '../primitives';

const NIVEAUER = ['Nyrenoveret', 'God men brugt', 'Skal renoveres'];

const STAND_MAP: Record<string, StandLevel> = {
  'Nyrenoveret': 'nyrenoveret',
  'God men brugt': 'god',
  'Skal renoveres': 'slidt',
};

const STAND_INVERSE: Record<StandLevel, string> = {
  nyrenoveret: 'Nyrenoveret',
  god: 'God men brugt',
  middel: 'God men brugt',
  trænger: 'God men brugt',
  slidt: 'Skal renoveres',
};

export function StandV4() {
  const { state, update } = useFunnelV2();

  const display = (s: StandLevel | null) => (s ? STAND_INVERSE[s] : null);

  // Lokal streng, så man kan skrive årstallet ciffer for ciffer; state får kun et gyldigt årstal.
  const [koekkenAar, setKoekkenAar] = useState(state.kitchenYear ? String(state.kitchenYear) : '');
  const setAar = (v: string) => {
    const tal = v.slice(0, 4);
    setKoekkenAar(tal);
    const n = Number(tal);
    update({ kitchenYear: tal.length === 4 && n >= 1900 && n <= new Date().getFullYear() ? n : null });
  };

  return (
    <div className="space-y-5">
      {/* Køkken */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M6 13a4 4 0 0 1-1-7.8 5 5 0 0 1 9.5-1.5 4 4 0 0 1 4.5 5.3A4 4 0 0 1 18 13M6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6M6 13h12" />}
          title="Køkken"
          sub="Skabe, bordplade, hvidevarer og slid."
        />
        <ChipGroupV4
          ariaLabel="Køkkenets stand"
          options={NIVEAUER}
          value={display(state.kitchenStand)}
          onChange={(v) => update({ kitchenStand: STAND_MAP[v] })}
        />
        <FieldV4
          label="Årstal for køkkenet (valgfrit)"
          value={koekkenAar}
          onChange={setAar}
          placeholder="Fx 2019"
          numeric
        />
      </Card>

      {/* Badeværelse */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M3 11h18M5 11V7a3 3 0 0 1 6 0M7 17v2M11 17v2M15 17v2M19 17v2M5 11v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />}
          title="Badeværelse"
          sub="Fliser, sanitet, installationer og slid."
        />
        <ChipGroupV4
          ariaLabel="Badeværelsets stand"
          options={NIVEAUER}
          value={display(state.bathroomStand)}
          onChange={(v) => update({ bathroomStand: STAND_MAP[v] })}
        />
      </Card>

      {/* Øvrige rum */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M4 21V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M4 21h16M9 21v-6h6v6" />}
          title="Øvrige rum"
          sub="Stue, værelser, entré og gang."
        />
        <ChipGroupV4
          ariaLabel="Øvrige rums stand"
          options={NIVEAUER}
          value={display(state.livingRoomStand)}
          onChange={(v) => update({ livingRoomStand: STAND_MAP[v], bedroomStand: STAND_MAP[v] })}
        />
      </Card>

      {/* Røgfri */}
      <Card className="px-6 py-4">
        <QuestionRowV4
          label="Har boligen været røgfri?"
          options={['Ja', 'Nej']}
          value={state.smokeFree}
          onChange={(v) => update({ smokeFree: v as 'Ja' | 'Nej' })}
        />
      </Card>
    </div>
  );
}

function RoomHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={V4.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
        <h3 className="text-[16.5px]" style={{ color: V4.ink, fontWeight: 600 }}>{title}</h3>
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: V4.muted }}>{sub}</p>
    </div>
  );
}
