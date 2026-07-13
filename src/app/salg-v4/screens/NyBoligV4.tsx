'use client';

/**
 * NyBoligV4 — "Hvad leder du efter?" (ekstra adresse-trin — markeret
 * "IKKE DESIGNET" i Figma-filen; bygget i flowets design-sprog).
 * Ønskerne synces til rentalSearchCity/Type via FunnelV2Context.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, Card, CardLabel, ChipV4, FieldV4 } from '../primitives';

const OMRAADER = ['Næstved', 'Ringsted', 'Roskilde', 'Kalundborg', 'Taastrup', 'København S', 'Andet'];
const MUST_HAVES = ['Altan/terrasse', 'Have', 'Elevator', 'Husdyr tilladt', 'Tæt på togstation', 'Tæt på skole', 'Møbleret', 'Parkering'];
const INDFLYTNING = ['Samtidig med salget', 'Inden for 1 mdr', '1–3 mdr efter', 'Senere', 'Fleksibel'];

export function NyBoligV4() {
  const { state, update } = useFunnelV2();
  const omr = state.nyOmraade || [];
  const must = state.nyMustHave || [];

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-4">
        <CardLabel>Områder</CardLabel>
        <div className="flex flex-wrap gap-2">
          {OMRAADER.map((o) => (
            <ChipV4 key={o} label={o} selected={omr.includes(o)} onClick={() => update({ nyOmraade: toggle(omr, o) })} />
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <CardLabel>Størrelse og husleje</CardLabel>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[13.5px] block" style={{ color: V4.ink, fontWeight: 500 }}>
              Antal værelser (min)
            </label>
            <select
              value={state.nyRoomsMin || '2'}
              onChange={(e) => update({ nyRoomsMin: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-md text-[14.5px] focus:outline-none"
              style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
            >
              {['1', '2', '3', '4', '5+'].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <FieldV4
            label="Boligareal (min)"
            value={state.nySqmMin}
            onChange={(v) => update({ nySqmMin: v })}
            placeholder="60 m²"
            numeric
          />
        </div>
        <FieldV4
          label="Max månedlig husleje"
          value={state.nyHuslejeMax}
          onChange={(v) => update({ nyHuslejeMax: v })}
          placeholder="9.500 kr/md"
          numeric
        />
      </Card>

      <Card className="p-6 space-y-4">
        <CardLabel>Skal-have (valgfri)</CardLabel>
        <div className="flex flex-wrap gap-2">
          {MUST_HAVES.map((m) => (
            <ChipV4 key={m} label={m} selected={must.includes(m)} onClick={() => update({ nyMustHave: toggle(must, m) })} />
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <CardLabel>Hvornår skal du bo i den nye bolig?</CardLabel>
        <div className="flex flex-wrap gap-2">
          {INDFLYTNING.map((o) => (
            <ChipV4 key={o} label={o} selected={state.nyIndflytning === o} onClick={() => update({ nyIndflytning: o })} />
          ))}
        </div>
      </Card>

      <div className="rounded-[10px] px-5 py-4" style={{ background: V4.mintSoft }}>
        <p className="text-[13px] leading-relaxed" style={{ color: V4.ink }}>
          Vi har <strong style={{ fontWeight: 600 }}>+20 lejemål</strong> klar til udlejning indenfor de
          næste 3 måneder i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde.
        </p>
      </div>
    </div>
  );
}
