'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MoneyInput, YesNoRow, SectionHeading, EASE_OUT } from '../components/primitives';

export function Udgifter() {
  const { state, update } = useFunnelV2();

  const total =
    (state.costFaellesudgifter || 0) +
    (state.costGrundvaerdi || 0) +
    (state.costRottebekempelse || 0) +
    (state.costRenovation || 0) +
    (state.costForsikringer || 0) +
    (state.costFaelleslaan || 0) +
    (state.costAndreDrift || 0);

  const setNum = (key: keyof typeof state) => (v: string) =>
    update({ [key]: parseInt(v) || 0 } as Partial<typeof state>);

  return (
    <div className="space-y-8">
      {/* Ejerudgifter */}
      <section className="space-y-3">
        <SectionHeading
          title="Ejerudgifter (kr/år)"
          sub="Udfyld det du kender — felter du ikke har et tal til lader du bare stå tomme. Jo flere du udfylder, jo mere præcist bliver vores tilbud."
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <MoneyInput
            label="Fællesudgifter til ejerforeningen *"
            value={state.costFaellesudgifter || ''}
            onChange={setNum('costFaellesudgifter')}
            placeholder="24.000"
            sub="Måneds-opkrævning × 12 (typisk 18-30k). Påkrævet."
            required
          />
          <MoneyInput
            label="Grundskyld (ejendomsskat)"
            value={state.costGrundvaerdi || ''}
            onChange={setNum('costGrundvaerdi')}
            placeholder="4.500"
            sub="Står på din opkrævning fra kommunen"
          />
          <MoneyInput
            label="Renovation"
            value={state.costRenovation || ''}
            onChange={setNum('costRenovation')}
            placeholder="1.800"
            sub="Skraldegebyr — ofte inkl. i fællesudg., skip ellers"
          />
          <MoneyInput
            label="Bygningsforsikring"
            value={state.costForsikringer || ''}
            onChange={setNum('costForsikringer')}
            placeholder="0"
            sub="Ofte inkl. i fællesudg. — skip ellers"
          />
          <MoneyInput
            label="Andre driftsomkostninger"
            value={state.costAndreDrift || ''}
            onChange={setNum('costAndreDrift')}
            placeholder="0"
            sub="Vicevært, antenne, m.m. (ekskl. vand/varme — nedenunder)"
          />
        </div>
      </section>

      {/* Vand */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading title="Vand" />
        </div>
        <YesNoRow
          label="Betales acontobeløb for vand til ejerforeningen?"
          value={state.waterPaidViaAssoc ? 'Ja' : state.waterAcontoYearly === 0 && !state.waterPaidViaAssoc ? undefined : 'Nej'}
          onChange={(v) => update({ waterPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyInput
          label="Samlet vandregning sidste år"
          value={state.waterUsageLastYearKr || ''}
          onChange={(v) => update({ waterUsageLastYearKr: parseInt(v) || 0 })}
          placeholder="3.500"
          sub="Sum af 4 kvartalsregninger eller årsopgørelse fra forsyningen"
        />
      </section>

      {/* Varme */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading title="Varme" />
        </div>
        <YesNoRow
          label="Betales acontobeløb for varme til ejerforeningen?"
          value={state.heatPaidViaAssoc ? 'Ja' : state.heatAcontoYearly === 0 && !state.heatPaidViaAssoc ? undefined : 'Nej'}
          onChange={(v) => update({ heatPaidViaAssoc: v === 'Ja' })}
        />
        <MoneyInput
          label="Samlet varmeregning sidste år"
          value={state.heatUsageLastYearKr || ''}
          onChange={(v) => update({ heatUsageLastYearKr: parseInt(v) || 0 })}
          placeholder="11.500"
          sub="Årsopgørelse fra fjernvarme/varmeværket"
        />
      </section>

      {/* Gæld */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Gæld i ejerforeningen"
            sub="Har ejerforeningen taget et lån (fx vinduer, tag, energiforbedring) hvor ejerne hæfter solidarisk eller pro rata?"
          />
        </div>
        <YesNoRow
          label="Er der gæld i ejerforeningen?"
          value={state.hasEjerforeningGaeld ? 'Ja' : undefined}
          onChange={(v) => update({ hasEjerforeningGaeld: v === 'Ja' })}
        />
      </section>

      {/* Hæftelse */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Hæftelse til ejerforening"
            sub="Hæftelsen er en sikkerhed ejerforeningen tinglyser foran realkreditlånet. Engangsbeløb — separat fra eventuel gæld i foreningen."
          />
        </div>
        <MoneyInput
          label="Hæftelse jf. tinglysning"
          value={state.ejerforeningHaeftelseKr || ''}
          onChange={(v) => update({ ejerforeningHaeftelseKr: parseInt(v) || 0 })}
          placeholder="0"
          sub="Engangsbeløb — fremgår af tinglysningsattesten"
          unit="kr"
        />
      </section>

      {/* Drift total */}
      <div
        className="rounded-xl px-5 py-4 flex items-center justify-between bg-[#F2F0EB]"
        style={{ transition: `background-color 200ms ${EASE_OUT}` }}
      >
        <span className="text-[14px] text-[#14181A]">Drift (uden vand/varme)</span>
        {total > 0 ? (
          <span className="text-[20px] font-semibold tabular-nums text-[#14181A]">
            {total.toLocaleString('da-DK')} kr/år
          </span>
        ) : (
          <span className="text-[14px] text-[#9C988C]">Indtast for at se total</span>
        )}
      </div>

      {/* Dokumentation */}
      <section className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <SectionHeading
            title="Vedhæft dokumentation (valgfri)"
            sub="Vedhæft gerne salgsopstilling, ejerforeningens årsregnskab, vand/varme-regning eller vurderingsrapport — så dobbelttjekker vi dine tal manuelt."
          />
        </div>
        <button
          type="button"
          className="w-full py-5 rounded-xl border-2 border-dashed bg-white hover:bg-stone-50 text-[14px] font-medium border-[#D6D2C5] text-[#14181A] active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
          style={{ transition: `background-color 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
        >
          Tap for at vedhæfte filer <span className="text-[#9C988C]">(PDF, JPG, DOC)</span>
        </button>
      </section>
    </div>
  );
}
