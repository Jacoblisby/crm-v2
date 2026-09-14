/**
 * /foreninger/[id] — én forening: handelspriser og de faktiske comps.
 *
 * Oversigten viser én median pr. forening. Det er nok til at prioritere
 * mellem foreninger, men ikke til at sætte et bud: dér skal man se de
 * enkelte handler. Hvilken lejlighed, hvor stor, hvornår, til hvad — og om
 * det overhovedet var en fri handel.
 *
 * Handlerne kommer fra Resights (seneste handel pr. lejlighed), samlet i
 * handler-forening.json. Se scripts/bbr/handler.py.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { housingAssociations } from '@/lib/db/schema';
import bbrRollup from '@/lib/data/bbr-forening-rollup.json';
import {
  handlerFor, noegletal, graense, kr, pct, voresKoeb, koebOpsummering,
  HANDLER_GENERERET, HANDLER_MAANEDER, type Noegletal,
} from '@/lib/handler';

export const dynamic = 'force-dynamic';

const fmtDato = (iso: string) =>
  new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

export default async function ForeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [f] = await db.select().from(housingAssociations).where(eq(housingAssociations.id, id)).limit(1);
  if (!f) notFound();

  // Hele historikken bruges til at måle vores køb mod markedet dengang;
  // comps-listen viser kun de seneste 36 måneder.
  const handler = handlerFor(f.name);
  const gVis = graense(HANDLER_MAANEDER);
  const comps = handler.filter((h) => h.dato >= gVis);
  const t12 = noegletal(handler, 12);
  const t24 = noegletal(handler, 24);
  const g12 = graense(12);
  const g24 = graense(24);
  const bbr = bbrRollup.foreninger.find((x) => x.foreningNavn === f.name);
  const KVM_FRA = bbrRollup.kvmFra;
  const KVM_TIL = bbrRollup.kvmTil;
  const koeb = voresKoeb(handler);
  const ops = koebOpsummering(koeb);

  // Kun frie handler i vores størrelse — det er dét, et bud skal måles mod.
  const iStoerrelsen12 = noegletal(
    handler.filter((h) => h.kvm >= KVM_FRA && h.kvm <= KVM_TIL),
    12,
  );

  return (
    <>
      <div className="mb-5">
        <Link href="/foreninger" className="text-sm text-slate-500 hover:text-slate-900">
          ← Alle foreninger
        </Link>
      </div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{f.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {[f.streetName, f.city].filter(Boolean).join(' · ')}
          {f.unitCount ? ` · ${f.unitCount.toLocaleString('da-DK')} enheder` : ''}
          {bbr ? ` · ${bbr.boliger} boliger, ${bbr.iMaalgruppe} i ${KVM_FRA}–${KVM_TIL} kvm` : ''}
          {` · vi ejer ${f.ownedCount}`}
        </p>
      </header>

      {/* ── Nøgletal ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kort titel="Sidste 12 måneder" t={t12} note="alle boliger i foreningen" />
        <Kort titel={`Sidste 12 mdr · ${KVM_FRA}–${KVM_TIL} kvm`} t={iStoerrelsen12} note="den størrelse vi køber" fremhaev />
        <Kort titel="Sidste 24 måneder" t={t24} note="alle boliger i foreningen" />
        <div className="rounded-lg border p-4" style={{ background: '#145d5f', borderColor: '#145d5f', color: '#fff' }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#b9d6d3' }}>Vores køb</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {ops.medianForskelPct !== null ? `${pct(ops.medianForskelPct)}` : '—'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#d5e7e5' }}>
            {ops.antal === 0
              ? 'ingen køb i foreningen'
              : ops.medianForskelPct !== null
                ? `mod markedet på købstidspunktet · median af ${ops.antalMedForskel} køb`
                : `${ops.antal} køb · for få handler at måle mod`}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <dt style={{ color: '#b9d6d3' }}>Antal køb</dt>
            <dd className="text-right tabular-nums">{ops.antal}</dd>
            <dt style={{ color: '#b9d6d3' }}>Vores median</dt>
            <dd className="text-right tabular-nums">
              {ops.medianKrPrKvm !== null ? `${ops.medianKrPrKvm.toLocaleString('da-DK')} kr/kvm` : '—'}
            </dd>
          </dl>
          <div className="text-[11px] mt-2" style={{ color: '#b9d6d3' }}>negativ = under markedet</div>
        </div>
      </section>

      {/* ── Vores køb ─────────────────────────────────────────────
          Hvert køb målt mod foreningens frie handler i de 12 måneder op til
          købsdatoen. Det er den eneste rimelige sammenligning: markedet i
          2021 siger intet om, hvad vi burde have givet i 2026. */}
      {koeb.length > 0 && (
        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div className="flex items-baseline justify-between flex-wrap gap-2 px-4 py-3 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Vores køb</h2>
            <p className="text-xs text-slate-500">Markedet er medianen af frie handler i samme størrelse (±20 % kvm) i månederne op til købet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left font-semibold px-4 py-2.5">Købt</th>
                  <th className="text-left font-semibold px-3 py-2.5">Adresse</th>
                  <th className="text-right font-semibold px-3 py-2.5">Kvm</th>
                  <th className="text-right font-semibold px-3 py-2.5">Pris</th>
                  <th className="text-right font-semibold px-3 py-2.5">Vores kr/kvm</th>
                  <th className="text-right font-semibold px-3 py-2.5">Marked kr/kvm</th>
                  <th className="text-right font-semibold px-4 py-2.5">Forskel</th>
                </tr>
              </thead>
              <tbody>
                {koeb.map((k) => (
                  <tr key={k.bfe} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap tabular-nums text-slate-700">{fmtDato(k.dato)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-900">{k.adresse}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{k.kvm}</td>
                    <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{kr(k.pris)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-900">
                      {k.krPrKvm.toLocaleString('da-DK')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {k.markedKrPrKvm !== null ? (
                        <>
                          {k.markedKrPrKvm.toLocaleString('da-DK')}
                          <span className="text-[11px] text-slate-400"> · {k.markedAntal} handler à {k.markedKvmFra}–{k.markedKvmTil} kvm{k.markedMdr > 12 ? ` / ${k.markedMdr} mdr` : ''}</span>
                        </>
                      ) : (
                        <span className="text-slate-300" title={`Kun ${k.markedAntal} frie handler à ${k.markedKvmFra}–${k.markedKvmTil} kvm i 36 mdr op til købet`}>for få handler</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-2 text-right tabular-nums font-semibold whitespace-nowrap"
                      style={{ color: k.forskelPct === null ? '#cbd5e1' : k.forskelPct < 0 ? '#0f4749' : '#7a4a3d' }}
                    >
                      {pct(k.forskelPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Comps ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-baseline justify-between flex-wrap gap-2 px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Handler</h2>
          <p className="text-xs text-slate-500">
            Seneste {HANDLER_MAANEDER} måneder · seneste handel pr. lejlighed · Resights, opdateret {fmtDato(HANDLER_GENERERET)}
          </p>
        </div>
        {comps.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500 text-center">
            Ingen handler registreret for denne forening. Er den målt op i BBR og med i Resights-udtrækket?
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left font-semibold px-4 py-2.5">Dato</th>
                  <th className="text-left font-semibold px-3 py-2.5">Adresse</th>
                  <th className="text-right font-semibold px-3 py-2.5">Kvm</th>
                  <th className="text-right font-semibold px-3 py-2.5">Pris</th>
                  <th className="text-right font-semibold px-3 py-2.5">Kr/kvm</th>
                  <th className="text-left font-semibold px-4 py-2.5">Handel</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((h, i) => {
                  const inden12 = h.dato >= g12;
                  const inden24 = h.dato >= g24;
                  const iStr = h.kvm >= KVM_FRA && h.kvm <= KVM_TIL;
                  // Skillelinjer hvor 12 og 24 måneder slutter, så man kan se
                  // perioderne uden at regne på datoerne.
                  const foerste24 = !inden12 && inden24 && (i === 0 || comps[i - 1].dato >= g12);
                  const foersteAeldre = !inden24 && (i === 0 || comps[i - 1].dato >= g24);
                  return (
                    <tr
                      key={h.bfe}
                      className={`border-b border-slate-100 last:border-0 ${
                        !h.fri ? 'text-slate-400' : inden12 ? 'text-slate-900' : 'text-slate-600'
                      } ${foerste24 || foersteAeldre ? 'border-t-2 border-t-slate-200' : ''}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                        {fmtDato(h.dato)}
                        {foerste24 && <div className="text-[10px] uppercase tracking-wider text-slate-400">12–24 mdr</div>}
                        {foersteAeldre && <div className="text-[10px] uppercase tracking-wider text-slate-400">over 24 mdr</div>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {h.adresse}
                        {h.vores && (
                          <span className="ml-2 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded align-middle"
                            style={{ background: '#145d5f', color: '#fff' }}>
                            Vores køb
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${iStr && h.fri ? 'font-medium' : ''}`}>
                        {h.kvm}
                        {!iStr && <span className="text-slate-300"> ·</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums whitespace-nowrap">{kr(h.pris)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${h.fri ? '' : 'font-normal'}`}>
                        {h.krPrKvm ? h.krPrKvm.toLocaleString('da-DK') : '—'}
                      </td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        {h.fri ? (
                          <span className="text-slate-500">Fri handel</span>
                        ) : (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded"
                            style={{ background: '#eceae7', color: '#7b8482' }}
                            title="Tæller ikke med i nøgletallene"
                          >
                            {h.metode}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500 mt-4 max-w-2xl leading-relaxed">
        Nøgletallene bygger kun på frie handler af én ejendom, og vores egne køb er holdt ude
        af markedet — de er det, vi måler mod. Hvert køb måles mod lejligheder i samme størrelse
        (±20 % kvm), fordi små og store lejligheder handles til vidt forskellige kvm-priser. Familieoverdragelser og
        porteføljehandler står i listen, gråtonet, men er ikke priser nogen fremmed ville
        betale. Kilden har seneste handel pr. lejlighed, så en lejlighed handlet to gange på
        et år tæller kun med den sidste. En prik efter kvadratmeterne markerer lejligheder
        uden for den størrelse vi køber.
      </p>
    </>
  );
}

function Kort({ titel, t, note, fremhaev }: { titel: string; t: Noegletal; note: string; fremhaev?: boolean }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={fremhaev ? { background: '#f2f6f6', borderColor: '#cce0dc' } : { background: '#fff', borderColor: '#e2e8f0' }}
    >
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{titel}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {t.medianKrPrKvm !== null ? `${t.medianKrPrKvm.toLocaleString('da-DK')} kr/kvm` : '—'}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        median · {t.antal} {t.antal === 1 ? 'fri handel' : 'frie handler'}
        {t.antalAlle > t.antal ? ` (${t.antalAlle - t.antal} sorteret fra)` : ''}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-slate-500">Spænd</dt>
        <dd className="text-right tabular-nums text-slate-700">
          {t.minKrPrKvm !== null ? `${t.minKrPrKvm.toLocaleString('da-DK')}–${t.maxKrPrKvm!.toLocaleString('da-DK')}` : '—'}
        </dd>
        <dt className="text-slate-500">Gennemsnit</dt>
        <dd className="text-right tabular-nums text-slate-700">
          {t.gnsKrPrKvm !== null ? t.gnsKrPrKvm.toLocaleString('da-DK') : '—'}
        </dd>
        <dt className="text-slate-500">Medianpris</dt>
        <dd className="text-right tabular-nums text-slate-700">{kr(t.medianPris)}</dd>
      </dl>
      <div className="text-[11px] text-slate-400 mt-2">{note}</div>
    </div>
  );
}
