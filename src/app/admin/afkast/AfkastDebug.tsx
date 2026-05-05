'use client';

import { useState, useMemo } from 'react';
import { computeAfkast, AFKAST_CONSTANTS } from '@/lib/afkast';

export function AfkastDebug() {
  const [pris, setPris] = useState<number>(1_500_000);
  const [lejeMd, setLejeMd] = useState<number>(8_500);
  const [drift, setDrift] = useState<number>(36_000);
  const [refurb, setRefurb] = useState<number>(45_000);
  const [haeftelse, setHaeftelse] = useState<number>(0);

  const result = useMemo(() => {
    return computeAfkast({
      rentMd: lejeMd,
      listePris: pris,
      driftTotal: drift,
      refurbTotal: refurb,
      haeftelseEf: haeftelse,
    });
  }, [pris, lejeMd, drift, refurb, haeftelse]);

  const t = result.trace;

  return (
    <div className="space-y-6">
      {/* INPUTS */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Pris (forhandlet eller liste)"
            value={pris}
            onChange={setPris}
            suffix="kr"
          />
          <Field
            label="Leje pr. md"
            value={lejeMd}
            onChange={setLejeMd}
            suffix="kr/md"
          />
          <Field
            label="Drift (årlig sum)"
            value={drift}
            onChange={setDrift}
            suffix="kr/år"
          />
          <Field
            label="Refurbish (engang)"
            value={refurb}
            onChange={setRefurb}
            suffix="kr"
          />
          <Field
            label="Hæftelse EF"
            value={haeftelse}
            onChange={setHaeftelse}
            suffix="kr"
          />
        </div>
      </section>

      {/* HOVEDRESULTAT */}
      <section className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Bud@20% ROE" value={result.budAt20PctRoe ? fmt(result.budAt20PctRoe) : '—'} hi />
        <Stat label="ROE Netto" value={`${result.roeNettoPct}%`} />
        <Stat label="ROE EBT" value={`${result.roeEbtPct}%`} />
        <Stat label="ROA EBIT" value={`${result.roaEbitPct}%`} />
        <Stat label="Cash flow / md (EBT)" value={`${fmt(result.cfMd)} kr`} />
        <Stat label="Egenkapital" value={`${fmt(result.egenkapital)} kr`} />
        <Stat label="Kapitalbehov" value={`${fmt(result.kapitalbehov)} kr`} />
        <Stat label="Netto resultat /år" value={`${fmt(result.netto)} kr`} />
      </section>

      {/* MELLEMREGNINGER */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold p-4 pb-2">Mellemregninger</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <SectionRow title="A. KAPITALBEHOV" />
            <Row label="Pris (forhandlet)" value={fmt(pris)} formula="input" />
            <Row label="− Refusion (3 md leje)" value={`-${fmt(t.refusionMd3)}`} formula={`leje × 3 = ${lejeMd} × 3`} />
            <Row label="− Refusion (3 md leje)" value={`-${fmt(t.refusionMd3)}`} formula="igen — modellen trækker leje × 3 to gange (Excel B14)" />
            <Row label="= Kapitalbehov" value={fmt(result.kapitalbehov)} formula={`pris − leje×6`} highlight />

            <SectionRow title="B. HANDELSOMKOSTNINGER" />
            <Row label="Tinglysning skøde" value={fmt(t.tinglysningSkode)} formula={`1.850 + pris × 0,6%`} />
            <Row label="+ Refurbish" value={fmt(refurb)} formula="input" />
            <Row label="= Handelsomkostninger" value={fmt(t.handelsomkostninger)} formula="sum" highlight />

            <SectionRow title="C. REALKREDIT-LÅN" />
            <Row label="Bankvurdering" value={fmt(t.bankvurdering)} formula={`pris × ${(AFKAST_CONSTANTS.BANKVURD_PCT * 100).toFixed(0)}% (Antagelser B3)`} />
            <Row label="Realkredit-provenu" value={fmt(t.realkreditProv)} formula={`bankvurd × ${(AFKAST_CONSTANTS.REALKREDIT_PCT * 100).toFixed(0)}% − hæftelse EF`} />
            <Row label="Hovedstol" value={fmt(t.hovedstol)} formula={`provenu / kurs ${AFKAST_CONSTANTS.KURS}`} />

            <SectionRow title="D. LÅNEOMKOSTNINGER" />
            <Row label="Lånsagsgebyr" value={fmt(t.lansgsgebyr)} formula={`fast (Antagelser B9)`} />
            <Row label="+ Kurtage" value={fmt(t.kurtage)} formula={`hovedstol × ${(AFKAST_CONSTANTS.KURTAGE * 100).toFixed(2)}%`} />
            <Row label="+ Tinglysning lån" value={fmt(t.tinglysningLaan)} formula={`hovedstol × ${(AFKAST_CONSTANTS.TINGLYSNING_LAAN * 100).toFixed(2)}%`} />
            <Row label="= Låneomk total" value={fmt(t.laanomkTotal)} formula="sum" highlight />
            <Row label="Låneprovenu (kontant)" value={fmt(t.laaneprov)} formula="hovedstol − låneomk" />

            <SectionRow title="E. EGENKAPITAL" />
            <Row label="Kapitalbehov" value={fmt(result.kapitalbehov)} formula="fra A" />
            <Row label="+ Handelsomkostninger" value={fmt(t.handelsomkostninger)} formula="fra B" />
            <Row label="− Låneprovenu" value={`-${fmt(t.laaneprov)}`} formula="fra D" />
            <Row label="= Egenkapital" value={fmt(result.egenkapital)} formula="dit indestående" highlight />

            <SectionRow title="F. RESULTAT (PR ÅR)" />
            <Row label="Lejeindtægter" value={fmt(result.revenue)} formula={`${lejeMd} × 12 = ${fmt(lejeMd * 12)}`} />
            <Row label="− Drift" value={`-${fmt(result.totalCosts)}`} formula="input" />
            <Row label="= EBIT" value={fmt(result.ebit)} formula="lejeind − drift" highlight />
            <Row label="− Finansiering (årlig ydelse)" value={`-${fmt(t.aarligYdelse)}`} formula={`hovedstol × ${AFKAST_CONSTANTS.BETALING_PR_MIO} / 1.000.000 (Antagelser B6)`} />
            <Row label="= EBT" value={fmt(result.ebt)} formula="EBIT − finansiering" highlight />
            <Row label="− Selskabsskat" value={`-${fmt(t.selskabsskat)}`} formula={`max(0, EBT) × ${(AFKAST_CONSTANTS.SKAT * 100).toFixed(0)}%`} />
            <Row label="= Netto resultat" value={fmt(result.netto)} formula="EBT − skat" highlight />

            <SectionRow title="G. ROE / ROA" />
            <Row label="ROA EBIT" value={`${result.roaEbitPct}%`} formula="EBIT / kapitalbehov" />
            <Row label="ROE EBT" value={`${result.roeEbtPct}%`} formula="EBT / egenkapital" />
            <Row label="ROE Netto" value={`${result.roeNettoPct}%`} formula="netto / egenkapital" highlight />

            <SectionRow title="H. BUD AT TARGET ROE" />
            <Row
              label={`Bud ved ${(AFKAST_CONSTANTS.TARGET_ROE * 100).toFixed(0)}% ROE Netto`}
              value={result.budAt20PctRoe ? fmt(result.budAt20PctRoe) : '—'}
              formula={`Linjesøgning: højeste pris hvor netto/egenkapital ≥ ${(AFKAST_CONSTANTS.TARGET_ROE * 100).toFixed(0)}%`}
              highlight
            />
          </tbody>
        </table>
      </section>

      {/* CONSTANTS */}
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1">
        <h3 className="font-semibold text-sm mb-2">Antagelser (constants)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Const label="Bankvurd %" value={`${AFKAST_CONSTANTS.BANKVURD_PCT * 100}%`} />
          <Const label="Realkredit %" value={`${AFKAST_CONSTANTS.REALKREDIT_PCT * 100}%`} />
          <Const label="Kurs" value={`${AFKAST_CONSTANTS.KURS}`} />
          <Const label="Betaling/mio" value={`${AFKAST_CONSTANTS.BETALING_PR_MIO}`} />
          <Const label="Selskabsskat" value={`${AFKAST_CONSTANTS.SKAT * 100}%`} />
          <Const label="Lånsagsgebyr" value={`${AFKAST_CONSTANTS.LAANSAG}`} />
          <Const label="Kurtage" value={`${AFKAST_CONSTANTS.KURTAGE * 100}%`} />
          <Const label="Tinglysning lån" value={`${AFKAST_CONSTANTS.TINGLYSNING_LAAN * 100}%`} />
          <Const label="Target ROE" value={`${AFKAST_CONSTANTS.TARGET_ROE * 100}%`} />
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 pr-12 text-sm border border-slate-300 rounded font-mono"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Stat({
  label,
  value,
  hi,
}: {
  label: string;
  value: string;
  hi?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-600">{label}</div>
      <div className={`font-bold tabular-nums ${hi ? 'text-2xl text-emerald-700' : 'text-base text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function SectionRow({ title }: { title: string }) {
  return (
    <tr className="bg-slate-100">
      <td colSpan={3} className="px-4 py-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {title}
      </td>
    </tr>
  );
}

function Row({
  label,
  value,
  formula,
  highlight,
}: {
  label: string;
  value: string;
  formula?: string;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-emerald-50 font-semibold' : ''}>
      <td className="px-4 py-1.5 text-slate-700">{label}</td>
      <td className={`px-4 py-1.5 text-right tabular-nums ${highlight ? 'text-emerald-900' : ''}`}>
        {value}
      </td>
      <td className="px-4 py-1.5 text-xs text-slate-400 italic w-2/5">{formula}</td>
    </tr>
  );
}

function Const({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-600">{label}:</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString('da-DK');
}
