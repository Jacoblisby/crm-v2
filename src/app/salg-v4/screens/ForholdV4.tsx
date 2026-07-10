'use client';

/**
 * ForholdV4 — "Er der noget, vi skal tage højde for?" (03_Udgifter step 2,
 * SÆRLIGE FORHOLD). Fælleslån / gæld til EF / andre økonomiske forhold —
 * designer-copy inkl. "vælg 'ved ikke', hvis du er i tvivl".
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, MoneyInputV4, YesNoV4 } from '../primitives';

export function ForholdV4() {
  const { state, update } = useFunnelV2();
  // Lokale "Ved ikke"-svar — påvirker kun hvilke felter vi folder ud
  const [faelleslaanSvar, setFaelleslaanSvar] = useState<'Ja' | 'Nej' | 'Ved ikke' | null>(
    state.ejerforeningHaeftelseKr > 0 || state.costFaelleslaan > 0 ? 'Ja' : null,
  );
  const [gaeldSvar, setGaeldSvar] = useState<'Ja' | 'Nej' | 'Ved ikke' | null>(
    state.hasEjerforeningGaeld ? 'Ja' : null,
  );
  const [andreSvar, setAndreSvar] = useState<'Ja' | 'Nej' | 'Ved ikke' | null>(
    state.econNotes ? 'Ja' : null,
  );

  return (
    <div className="space-y-8">
      {/* Fælleslån */}
      <section className="bg-white rounded-2xl border p-6 space-y-3" style={{ borderColor: V4.border }}>
        <YesNoV4
          label="Er der fælleslån i ejerforeningen?"
          value={faelleslaanSvar}
          onChange={(v) => {
            setFaelleslaanSvar(v);
            if (v !== 'Ja') update({ ejerforeningHaeftelseKr: 0 });
          }}
          allowUnsure
        />
        {faelleslaanSvar === 'Ja' && (
          <MoneyInputV4
            label="Din andel af fælleslånet"
            value={state.ejerforeningHaeftelseKr}
            onChange={(v) => update({ ejerforeningHaeftelseKr: parseInt(v) || 0 })}
            placeholder="0"
            unit="kr"
            sub="Står ofte i ejerforeningens årsopgørelse."
          />
        )}
      </section>

      {/* Gæld til EF */}
      <section className="bg-white rounded-2xl border p-6 space-y-3" style={{ borderColor: V4.border }}>
        <YesNoV4
          label="Er der gæld til ejerforeningen?"
          value={gaeldSvar}
          onChange={(v) => {
            setGaeldSvar(v);
            update({
              hasEjerforeningGaeld: v === 'Ja',
              ...(v !== 'Ja' ? { ejerforeningGaeldRestgaeld: 0 } : {}),
            });
          }}
          allowUnsure
        />
        {gaeldSvar === 'Ja' && (
          <MoneyInputV4
            label="Din gæld til ejerforeningen"
            value={state.ejerforeningGaeldRestgaeld}
            onChange={(v) => update({ ejerforeningGaeldRestgaeld: parseInt(v) || 0 })}
            placeholder="0"
            unit="kr"
            sub="Fx skyldige bidrag eller restancer."
          />
        )}
      </section>

      {/* Andre økonomiske forhold */}
      <section className="bg-white rounded-2xl border p-6 space-y-3" style={{ borderColor: V4.border }}>
        <YesNoV4
          label="Er der andre økonomiske forhold?"
          value={andreSvar}
          onChange={(v) => {
            setAndreSvar(v);
            if (v !== 'Ja') update({ econNotes: '' });
          }}
          allowUnsure
        />
        {andreSvar === 'Ja' && (
          <div className="space-y-1.5">
            <textarea
              value={state.econNotes || ''}
              onChange={(e) => update({ econNotes: e.target.value })}
              placeholder="Fx tinglyst sikkerhed, afdrag til ejerforening eller særlige aftaler"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border bg-white text-[14px] focus:outline-none resize-y"
              style={{ borderColor: V4.border, color: V4.ink }}
            />
            <p className="text-[12px]" style={{ color: V4.muted }}>
              Skriv kun det, du kender. Vi kan altid følge op senere.
            </p>
          </div>
        )}
      </section>

      <p className="text-[12.5px]" style={{ color: V4.soft }}>
        Udfyld kun hvis det gælder for din bolig. Det kan have betydning for vurderingen.
      </p>
    </div>
  );
}
