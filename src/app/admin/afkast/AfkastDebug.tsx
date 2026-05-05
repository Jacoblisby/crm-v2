'use client';

import { useState, useMemo } from 'react';
import { computeAfkast, AFKAST_CONSTANTS } from '@/lib/afkast';

export interface AfkastInitial {
  pris?: number;
  lejeMd?: number;
  drift?: number;
  refurb?: number;
  haeftelse?: number;
  betalingPrMio?: number;
  targetRoePct?: number; // 20 = 20%
}

export function AfkastDebug({ initial }: { initial?: AfkastInitial } = {}) {
  const [pris, setPris] = useState<number>(initial?.pris ?? 1_500_000);
  const [lejeMd, setLejeMd] = useState<number>(initial?.lejeMd ?? 8_500);
  const [drift, setDrift] = useState<number>(initial?.drift ?? 36_000);
  const [refurb, setRefurb] = useState<number>(initial?.refurb ?? 45_000);
  const [haeftelse, setHaeftelse] = useState<number>(initial?.haeftelse ?? 0);
  const [betalingPrMio, setBetalingPrMio] = useState<number>(
    initial?.betalingPrMio ?? AFKAST_CONSTANTS.BETALING_PR_MIO,
  );
  const [targetRoe, setTargetRoe] = useState<number>(
    initial?.targetRoePct ?? AFKAST_CONSTANTS.TARGET_ROE * 100,
  );

  const result = useMemo(() => {
    return computeAfkast({
      rentMd: lejeMd,
      listePris: pris,
      driftTotal: drift,
      refurbTotal: refurb,
      haeftelseEf: haeftelse,
      betalingPrMio,
      targetRoe: targetRoe / 100,
    });
  }, [pris, lejeMd, drift, refurb, haeftelse, betalingPrMio, targetRoe]);

  const t = result.trace;
  const ydelsePct = (betalingPrMio / 1_000_000) * 100;

  return (
    <div className="space-y-6">
      {/* INPUTS */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Inputs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Pris (forhandlet eller liste)" value={pris} onChange={setPris} suffix="kr" />
          <Field label="Leje pr. md" value={lejeMd} onChange={setLejeMd} suffix="kr/md" />
          <Field label="Drift (årlig sum)" value={drift} onChange={setDrift} suffix="kr/år" />
          <Field label="Refurbish (engang)" value={refurb} onChange={setRefurb} suffix="kr" />
          <Field label="Hæftelse EF" value={haeftelse} onChange={setHaeftelse} suffix="kr" />
        </div>
      </section>

      {/* HOVEDRESULTAT — ROA + ROE EBT prominent (uden skat) */}
      <section className="bg-emerald-50 border border-emerald-300 rounded-lg p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <BigStat
            label="Bud ved target"
            sublabel={`ROE EBT ≥ ${targetRoe}% (uden skat)`}
            value={result.budAt20PctRoe ? `${fmt(result.budAt20PctRoe)} kr` : '—'}
            color="emerald"
          />
          <BigStat
            label="ROA EBIT"
            sublabel="EBIT / kapitalbehov"
            value={`${result.roaEbitPct}%`}
          />
          <BigStat
            label="ROE EBT"
            sublabel="EBT / egenkapital (før skat)"
            value={`${result.roeEbtPct}%`}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-emerald-200">
          <Stat label="Cash flow / md (EBT)" value={`${fmt(result.cfMd)} kr`} />
          <Stat label="Egenkapital" value={`${fmt(result.egenkapital)} kr`} />
          <Stat label="Kapitalbehov" value={`${fmt(result.kapitalbehov)} kr`} />
          <Stat
            label="ROE Netto (m. skat)"
            value={`${result.roeNettoPct}%`}
            sublabel="kun til reference"
            muted
          />
        </div>
      </section>

      {/* RENTE / YDELSE — vigtigt at se tydeligt */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">📊 Finansiering — rente & ydelse</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">
              Årlig ydelse (rente + evt. afdrag) — kr per lånt mio
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={betalingPrMio || ''}
                onChange={(e) => setBetalingPrMio(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-12 text-sm border border-slate-300 rounded font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                kr/mio
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              = <strong>{ydelsePct.toFixed(2)}%</strong> af hovedstol/år
              {ydelsePct < 4 && <span className="text-amber-600"> (lavt — antager afdragsfri F-kort)</span>}
              {ydelsePct >= 4 && ydelsePct < 6 && <span className="text-slate-500"> (afdragsfri ved 4-6% rente)</span>}
              {ydelsePct >= 6 && <span className="text-slate-500"> (typisk 30-år med afdrag + rente)</span>}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-600 mb-1">Target ROE EBT (uden skat)</div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={targetRoe || ''}
                onChange={(e) => setTargetRoe(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                %
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Bud-modellen finder højeste pris hvor ROE EBT ≥ {targetRoe}%
            </div>
          </div>
          <div className="sm:col-span-2 grid grid-cols-3 gap-3 text-sm bg-white p-3 rounded border border-blue-200">
            <Stat label="Hovedstol" value={`${fmt(t.hovedstol)} kr`} />
            <Stat label="Årlig ydelse" value={`${fmt(t.aarligYdelse)} kr`} sublabel={`= ${ydelsePct.toFixed(2)}%`} />
            <Stat
              label="Rente-andel ca."
              value={
                ydelsePct < 4
                  ? `~${ydelsePct.toFixed(1)}%`
                  : `Skal opdeles manuelt`
              }
              sublabel="afdragsfri = ren rente"
              muted
            />
          </div>
        </div>
      </section>

      {/* MELLEMREGNINGER */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold p-4 pb-2">Mellemregninger</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <SectionRow title="A. KAPITALBEHOV" />
            <Row label="Pris (forhandlet)" value={fmt(pris)} formula="input" />
            <Row label="− Refusion (3 md leje × 2)" value={`-${fmt(t.refusionMd3 * 2)}`} formula={`leje × 3 × 2 = ${lejeMd} × 6`} />
            <Row label="= Kapitalbehov" value={fmt(result.kapitalbehov)} formula="pris − leje×6" highlight />

            <SectionRow title="B. HANDELSOMKOSTNINGER" />
            <Row label="Tinglysning skøde" value={fmt(t.tinglysningSkode)} formula="1.850 + pris × 0,6%" />
            <Row label="+ Refurbish" value={fmt(refurb)} formula="input" />
            <Row label="= Handelsomkostninger" value={fmt(t.handelsomkostninger)} formula="sum" highlight />

            <SectionRow title="C. REALKREDIT-LÅN" />
            <Row label="Bankvurdering" value={fmt(t.bankvurdering)} formula={`pris × ${(AFKAST_CONSTANTS.BANKVURD_PCT * 100).toFixed(0)}% (Antagelser B3)`} />
            <Row label="Realkredit-provenu" value={fmt(t.realkreditProv)} formula={`bankvurd × ${(AFKAST_CONSTANTS.REALKREDIT_PCT * 100).toFixed(0)}% − hæftelse EF`} />
            <Row label="Hovedstol" value={fmt(t.hovedstol)} formula={`provenu / kurs ${AFKAST_CONSTANTS.KURS}`} />

            <SectionRow title="D. LÅNEOMKOSTNINGER" />
            <Row label="Lånsagsgebyr" value={fmt(t.lansgsgebyr)} formula="fast" />
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
            <Row label="Lejeindtægter" value={fmt(result.revenue)} formula={`${lejeMd} × 12`} />
            <Row label="− Drift" value={`-${fmt(result.totalCosts)}`} formula="input" />
            <Row label="= EBIT" value={fmt(result.ebit)} formula="lejeind − drift" highlight />
            <Row label="− Finansiering (årlig ydelse)" value={`-${fmt(t.aarligYdelse)}`} formula={`hovedstol × ${ydelsePct.toFixed(2)}%`} />
            <Row label="= EBT (resultat før skat)" value={fmt(result.ebt)} formula="EBIT − finansiering" highlight />
            <Row label="Selskabsskat (KUN INFO)" value={`-${fmt(t.selskabsskat)}`} formula={`max(0, EBT) × ${(AFKAST_CONSTANTS.SKAT * 100).toFixed(0)}% — IKKE i target`} muted />
            <Row label="Netto resultat efter skat (kun info)" value={fmt(result.netto)} formula="EBT − skat" muted />

            <SectionRow title="G. ROA / ROE" />
            <Row label="ROA EBIT" value={`${result.roaEbitPct}%`} formula="EBIT / kapitalbehov" highlight />
            <Row label="ROE EBT" value={`${result.roeEbtPct}%`} formula="EBT / egenkapital (før skat) ← target" highlight />
            <Row label="ROE Netto (info)" value={`${result.roeNettoPct}%`} formula="netto / egenkapital (efter skat)" muted />

            <SectionRow title="H. BUD AT TARGET ROE EBT" />
            <Row
              label={`Bud ved ${targetRoe}% ROE EBT`}
              value={result.budAt20PctRoe ? fmt(result.budAt20PctRoe) : '—'}
              formula={`Linjesøgning: højeste pris hvor EBT/EK ≥ ${targetRoe}%`}
              highlight
            />
          </tbody>
        </table>
      </section>

      {/* CONSTANTS */}
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1">
        <h3 className="font-semibold text-sm mb-2">Antagelser (constants — ikke editerbare i denne version)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Const label="Bankvurd %" value={`${AFKAST_CONSTANTS.BANKVURD_PCT * 100}%`} />
          <Const label="Realkredit %" value={`${AFKAST_CONSTANTS.REALKREDIT_PCT * 100}%`} />
          <Const label="Kurs" value={`${AFKAST_CONSTANTS.KURS}`} />
          <Const label="Selskabsskat" value={`${AFKAST_CONSTANTS.SKAT * 100}% (kun info)`} />
          <Const label="Lånsagsgebyr" value={`${AFKAST_CONSTANTS.LAANSAG} kr`} />
          <Const label="Kurtage" value={`${AFKAST_CONSTANTS.KURTAGE * 100}%`} />
          <Const label="Tinglysning lån" value={`${AFKAST_CONSTANTS.TINGLYSNING_LAAN * 100}%`} />
          <Const label="Default target ROE" value={`${AFKAST_CONSTANTS.TARGET_ROE * 100}% EBT`} />
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

function BigStat({
  label,
  sublabel,
  value,
  color,
}: {
  label: string;
  sublabel?: string;
  value: string;
  color?: 'emerald';
}) {
  return (
    <div>
      <div className="text-xs text-slate-600">{label}</div>
      {sublabel && <div className="text-[10px] text-slate-500 italic">{sublabel}</div>}
      <div className={`font-bold tabular-nums text-2xl mt-1 ${color === 'emerald' ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sublabel,
  muted,
}: {
  label: string;
  value: string;
  sublabel?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className={`text-xs ${muted ? 'text-slate-400' : 'text-slate-600'}`}>{label}</div>
      <div className={`font-medium tabular-nums ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
        {value}
      </div>
      {sublabel && <div className="text-[10px] text-slate-500 italic">{sublabel}</div>}
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
  muted,
}: {
  label: string;
  value: string;
  formula?: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-emerald-50 font-semibold' : muted ? 'opacity-60' : ''}>
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
