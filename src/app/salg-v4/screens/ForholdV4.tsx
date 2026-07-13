'use client';

/**
 * ForholdV4 — "Er der noget, vi skal tage højde for?" (Figma: 03_Udgifter step 2).
 * To kort: EJERFORENINGEN (fælleslån + gæld, Ja/Nej/Ved ikke) og ANDET (textarea).
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, Card, CardLabel, FieldV4, QuestionRowV4 } from '../primitives';

export function ForholdV4() {
  const { state, update } = useFunnelV2();
  const [faelleslaanSvar, setFaelleslaanSvar] = useState<string | null>(
    state.ejerforeningHaeftelseKr > 0 || state.costFaelleslaan > 0 ? 'Ja' : null,
  );
  const [gaeldSvar, setGaeldSvar] = useState<string | null>(
    state.hasEjerforeningGaeld ? 'Ja' : null,
  );

  return (
    <div className="space-y-5">
      {/* Ejerforeningen */}
      <Card className="p-6 space-y-5">
        <CardLabel>Ejerforeningen</CardLabel>

        <div className="space-y-3">
          <QuestionRowV4
            label="Er der fælleslån i ejerforeningen?"
            options={['Ja', 'Nej', 'Ved ikke']}
            value={faelleslaanSvar}
            onChange={(v) => {
              setFaelleslaanSvar(v);
              if (v !== 'Ja') update({ ejerforeningHaeftelseKr: 0 });
            }}
          />
          {faelleslaanSvar === 'Ja' && (
            <FieldV4
              label="Din andel af fælleslånet"
              value={state.ejerforeningHaeftelseKr ? String(state.ejerforeningHaeftelseKr) : ''}
              onChange={(v) => update({ ejerforeningHaeftelseKr: parseInt(v) || 0 })}
              placeholder="0 kr"
              numeric
              hint="Står ofte i ejerforeningens årsopgørelse."
            />
          )}
        </div>

        <div className="space-y-3 pt-4 border-t" style={{ borderColor: V4.border }}>
          <QuestionRowV4
            label="Er der gæld til ejerforeningen?"
            options={['Ja', 'Nej', 'Ved ikke']}
            value={gaeldSvar}
            onChange={(v) => {
              setGaeldSvar(v);
              update({
                hasEjerforeningGaeld: v === 'Ja',
                ...(v !== 'Ja' ? { ejerforeningGaeldRestgaeld: 0 } : {}),
              });
            }}
          />
          {gaeldSvar === 'Ja' && (
            <FieldV4
              label="Din gæld til ejerforeningen"
              value={state.ejerforeningGaeldRestgaeld ? String(state.ejerforeningGaeldRestgaeld) : ''}
              onChange={(v) => update({ ejerforeningGaeldRestgaeld: parseInt(v) || 0 })}
              placeholder="0 kr"
              numeric
              hint="Fx skyldige bidrag eller restancer."
            />
          )}
        </div>
      </Card>

      {/* Andet */}
      <Card className="p-6 space-y-4">
        <CardLabel>Andet</CardLabel>
        <div className="space-y-1.5">
          <label className="text-[13.5px] block" style={{ color: V4.ink, fontWeight: 500 }}>
            Er der andre økonomiske forhold?
          </label>
          <textarea
            value={state.econNotes || ''}
            onChange={(e) => update({ econNotes: e.target.value })}
            placeholder="Fx tinglyst sikkerhed, afdrag til ejerforening eller særlige aftaler"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-md text-[14px] focus:outline-none resize-y"
            style={{ background: '#f2f0ed', border: `1px solid ${V4.border}`, color: V4.ink }}
          />
          <p className="text-[12px]" style={{ color: V4.soft }}>
            Skriv kun det, du kender. Vi kan altid følge op senere.
          </p>
        </div>
      </Card>
    </div>
  );
}
