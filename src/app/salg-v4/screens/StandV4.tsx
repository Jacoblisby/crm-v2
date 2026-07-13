'use client';

/**
 * StandV4 — "Boligens stand" (Figma: 02_Boligen trin 1). ÉN skærm for alle rum:
 *   Køkken (chips + årgang) · Badeværelse (chips + årgang) · Øvrige rum (chips)
 *   + "Har boligen været røgfri?" (Ja/Nej).
 *
 * Designerens 3 niveauer mapper til prismotorens StandLevel:
 *   Nyrenoveret → nyrenoveret · God men brugt → god · Skal renoveres → slidt
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import type { StandLevel } from '@/lib/services/price-engine';
import { V4, Card, ChipGroupV4, QuestionRowV4 } from '../primitives';

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

  return (
    <div className="space-y-5">
      {/* Køkken */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M6 13a4 4 0 0 1-1-7.8 5 5 0 0 1 9.5-1.5 4 4 0 0 1 4.5 5.3A4 4 0 0 1 18 13M6 13v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6M6 13h12" />}
          title="Køkken"
          sub="Vurder køkkenets stand — fx skabe, bordplade, hvidevarer og generelt slid."
        />
        <ChipGroupV4
          options={NIVEAUER}
          value={display(state.kitchenStand)}
          onChange={(v) => update({ kitchenStand: STAND_MAP[v] })}
        />
        <YearRow
          value={state.kitchenYear}
          onChange={(n) => update({ kitchenYear: n })}
          hint="Året køkkenet sidst blev udskiftet (valgfri)"
        />
      </Card>

      {/* Badeværelse */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M3 11h18M5 11V7a3 3 0 0 1 6 0M7 17v2M11 17v2M15 17v2M19 17v2M5 11v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />}
          title="Badeværelse"
          sub="Vurder badeværelsets stand — fx fliser, sanitet, installationer og generelt slid."
        />
        <ChipGroupV4
          options={NIVEAUER}
          value={display(state.bathroomStand)}
          onChange={(v) => update({ bathroomStand: STAND_MAP[v] })}
        />
        <YearRow
          value={state.bathroomYear}
          onChange={(n) => update({ bathroomYear: n })}
          hint="Året badeværelset sidst blev renoveret (valgfri)"
        />
      </Card>

      {/* Øvrige rum */}
      <Card className="p-6 space-y-4">
        <RoomHeader
          icon={<path d="M4 21V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M4 21h16M9 21v-6h6v6" />}
          title="Øvrige rum"
          sub="Vurder boligens øvrige rum — fx stue, værelser, entré og gang."
        />
        <ChipGroupV4
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

function YearRow({ value, onChange, hint }: { value: number | null; onChange: (n: number | null) => void; hint: string }) {
  return (
    <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: V4.border }}>
      <label className="text-[13.5px] shrink-0 pt-3" style={{ color: V4.ink, fontWeight: 500 }}>Årgang</label>
      <div className="pt-3 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d]/g, '')) || null)}
          placeholder="2015"
          className="w-24 px-3 py-2 rounded-md text-[14px] tabular-nums focus:outline-none"
          style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
        />
        <span className="text-[12px]" style={{ color: V4.soft }}>{hint}</span>
      </div>
    </div>
  );
}
