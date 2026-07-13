'use client';

/**
 * DetaljerV4 — "Tilføj de sidste detaljer" (Figma: 02_Boligen trin 2 — højre
 * side markeret "IKKE DESIGNET"; bygget i samme design-sprog som resten).
 * Hvidevarer-chips · billeder (valgfri) · andre ting (textarea) ·
 * særlige forhold (chips) · conditional udlejnings-felter.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, Card, CardLabel, ChipV4, FieldV4 } from '../primitives';

const HVIDEVARER: Array<{ label: string; key: 'applVaskemaskine' | 'applTorretumbler' | 'applOpvaskemaskine' | 'applKoeleFryseskab' | 'applOvn' | 'applKomfur' | 'applMikroovn' | 'applEmhaette' }> = [
  { label: 'Vask', key: 'applVaskemaskine' },
  { label: 'Tørretumbler', key: 'applTorretumbler' },
  { label: 'Opvask', key: 'applOpvaskemaskine' },
  { label: 'Køl/frys', key: 'applKoeleFryseskab' },
  { label: 'Ovn', key: 'applOvn' },
  { label: 'Komfur', key: 'applKomfur' },
  { label: 'Mikro', key: 'applMikroovn' },
  { label: 'Emhætte', key: 'applEmhaette' },
];

const SPECIAL: Array<{ t: string; key: 'hasAltan' | 'hasElevator' | 'hasSolarPanels' | 'isRented' }> = [
  { t: 'Altan', key: 'hasAltan' },
  { t: 'Elevator', key: 'hasElevator' },
  { t: 'Solceller', key: 'hasSolarPanels' },
  { t: 'Aktuelt udlejet', key: 'isRented' },
];

const PRIS_FORHOLD: Array<{ t: string; key: 'hasRenovationPlans' | 'hasTinglysteServitutter' }> = [
  { t: 'Renoveringsplaner i EF', key: 'hasRenovationPlans' },
  { t: 'Tinglyste servitutter', key: 'hasTinglysteServitutter' },
];

export function DetaljerV4() {
  const { state, update } = useFunnelV2();

  return (
    <div className="space-y-5">
      {/* Hvidevarer */}
      <Card className="p-6 space-y-3.5">
        <CardLabel>Hvidevarer der følger med</CardLabel>
        <div className="flex flex-wrap gap-2">
          {HVIDEVARER.map((h) => {
            const sel = !!state[h.key];
            return (
              <ChipV4
                key={h.key}
                label={h.label}
                selected={sel}
                onClick={() => update({ [h.key]: !sel } as Partial<typeof state>)}
              />
            );
          })}
        </div>
      </Card>

      {/* Billeder */}
      <Card className="p-6 space-y-3.5">
        <CardLabel>Tilføj billeder (valgfri)</CardLabel>
        <button
          type="button"
          className="w-full py-7 rounded-md border border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-[#faf9f7]"
          style={{ borderColor: '#c9cfcc' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={V4.soft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-[13.5px]" style={{ color: V4.ink, fontWeight: 500 }}>
            Tryk for at vedhæfte op til 10 billeder
          </span>
          <span className="text-[12px]" style={{ color: V4.soft }}>
            Altan, plantegning, entré, andet rum du vil have os til at se
          </span>
        </button>
      </Card>

      {/* Andre ting */}
      <Card className="p-6 space-y-3.5">
        <div>
          <label className="text-[13.5px] block mb-1.5" style={{ color: V4.ink, fontWeight: 500 }}>
            Andre ting vi bør vide (valgfri)
          </label>
          <textarea
            value={state.notes || ''}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Fx fælles tagterrasse, husdyr accepteret af EF…"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-md text-[14px] focus:outline-none resize-y"
            style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
          />
        </div>
      </Card>

      {/* Særlige forhold */}
      <Card className="p-6 space-y-4">
        <CardLabel>Særlige forhold</CardLabel>
        <div className="space-y-3">
          <div>
            <div className="text-[13px] mb-2" style={{ color: V4.muted }}>Boligens specielle ting</div>
            <div className="flex flex-wrap gap-2">
              {SPECIAL.map((s) => {
                const sel = !!state[s.key];
                return (
                  <ChipV4
                    key={s.key}
                    label={s.t}
                    selected={sel}
                    onClick={() => update({ [s.key]: !sel } as Partial<typeof state>)}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[13px] mb-2" style={{ color: V4.muted }}>Forhold der kan påvirke prisen</div>
            <div className="flex flex-wrap gap-2">
              {PRIS_FORHOLD.map((s) => {
                const sel = !!state[s.key];
                return (
                  <ChipV4
                    key={s.key}
                    label={s.t}
                    selected={sel}
                    onClick={() => update({ [s.key]: !sel } as Partial<typeof state>)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Udlejning — conditional når "Aktuelt udlejet" er valgt */}
      {state.isRented && (
        <Card className="p-6 space-y-4">
          <CardLabel>Udlejning</CardLabel>
          <p className="text-[13px] -mt-2" style={{ color: V4.muted }}>
            Vi køber gerne udlejede boliger — men har brug for kontraktdetaljer for at give et præcist tilbud.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <FieldV4
              label="Månedlig leje"
              value={state.rentalMonthlyRent ? String(state.rentalMonthlyRent) : ''}
              onChange={(v) => update({ rentalMonthlyRent: parseInt(v) || 0 })}
              placeholder="9.500 kr/md"
              numeric
              hint="Hvad lejeren betaler hver måned"
            />
            <FieldV4
              label="Depositum"
              value={state.rentalDeposit ? String(state.rentalDeposit) : ''}
              onChange={(v) => update({ rentalDeposit: parseInt(v) || 0 })}
              placeholder="28.500 kr"
              numeric
              hint="Typisk 3 måneders leje"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
