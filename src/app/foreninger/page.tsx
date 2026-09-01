/**
 * /foreninger — opkøbs-tragten pr. ejerforening.
 *
 * Erstatter regnearkets tre faner med ét view. Den vigtigste kolonne er
 * ANDEL: hvor stor en del af foreningen vi allerede ejer. Det tal fandtes
 * ikke noget sted før — det krævede en manuel krydsning af BFE-listerne mod
 * en Resights-eksport — og det er dét, der afgør hvor næste brevrunde skal
 * hen. Kildemarksvænget giver 20 %, Benløseparken 0,5 %, og Benløseparken er
 * den, der fylder mest i portoen.
 */
import { and, desc, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { housingAssociations, leads } from '@/lib/db/schema';
import { MainHeader } from '@/components/MainHeader';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  maalgruppe:  { label: 'Målgruppe',   bg: '#cce0dc', fg: '#0f4749' },
  undersoeges: { label: 'Undersøges',  bg: '#e8dfde', fg: '#7a4a3d' },
  fravalgt:    { label: 'Fravalgt',    bg: '#eceae7', fg: '#7b8482' },
};

function fmtDato(d: Date | null) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export default async function ForeningerPage() {
  // Kolonnerne kommer fra migrering 0007. Kører siden før den er kørt, fejler
  // forespørgslen — og en 500-side siger ingenting om hvad man skal gøre.
  let raekker: Awaited<ReturnType<typeof hentForeninger>> = [];
  let dbFejl: string | null = null;
  try {
    raekker = await hentForeninger();
  } catch (err) {
    dbFejl = err instanceof Error ? err.message : String(err);
  }

  // Leads fra boligberegneren — tragtens næstsidste niveau
  let beregnerLeads = 0;
  try {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(isNull(leads.deletedAt), sql`${leads.source} LIKE 'boligberegner%'`));
    beregnerLeads = r?.n ?? 0;
  } catch {}

  return <ForeningerView raekker={raekker} dbFejl={dbFejl} beregnerLeads={beregnerLeads} />;
}

async function hentForeninger() {
  return db
    .select({
      id: housingAssociations.id,
      name: housingAssociations.name,
      city: housingAssociations.city,
      street: housingAssociations.streetName,
      unitCount: housingAssociations.unitCount,
      ownedCount: housingAssociations.ownedCount,
      kvmFrom: housingAssociations.kvmFrom,
      kvmTo: housingAssociations.kvmTo,
      status: housingAssociations.status,
      statusReason: housingAssociations.statusReason,
      letterRounds: housingAssociations.letterRounds,
      dataUpdatedAt: housingAssociations.dataUpdatedAt,
      // Andel beregnes i databasen, så sorteringen sker på det rigtige tal
      andel: sql<number>`
        CASE WHEN COALESCE(${housingAssociations.unitCount}, 0) > 0
        THEN ROUND(100.0 * ${housingAssociations.ownedCount} / ${housingAssociations.unitCount}, 1)
        ELSE 0 END`,
    })
    .from(housingAssociations)
    .orderBy(desc(sql`
      CASE WHEN COALESCE(${housingAssociations.unitCount}, 0) > 0
      THEN 100.0 * ${housingAssociations.ownedCount} / ${housingAssociations.unitCount}
      ELSE -1 END`));

}

type Raekke = Awaited<ReturnType<typeof hentForeninger>>[number];

function ForeningerView({
  raekker, dbFejl, beregnerLeads,
}: { raekker: Raekke[]; dbFejl: string | null; beregnerLeads: number }) {
  const maal = raekker.filter((r) => r.status === 'maalgruppe');
  const enheder = maal.reduce((s, r) => s + (r.unitCount ?? 0), 0);
  const ejet = maal.reduce((s, r) => s + r.ownedCount, 0);
  const senest = raekker.map((r) => r.dataUpdatedAt).filter(Boolean).sort().pop() ?? null;

  const alleEnheder = raekker.reduce((s, r) => s + (r.unitCount ?? 0), 0);
  const brevEnheder = raekker
    .filter((r) => r.letterRounds > 0)
    .reduce((s, r) => s + (r.unitCount ?? 0), 0);

  /**
   * Tragten. Hvert niveau er en indsnævring af det forrige.
   *
   * `maalt: false` betyder, at tallet ikke kan udregnes fra data endnu — og
   * det vises som et hul frem for at blive skjult. Tragten fungerer dermed
   * også som et kort over, hvad der mangler at blive registreret: kan et
   * niveau ikke måles, kan man heller ikke styre efter det.
   */
  const trin: {
    navn: string; antal: number | null; note: string; maalt: boolean;
    /** Hvilket trin procenten skal måles mod. Udeladt = trinnet lige over. */
    basisTrin?: number;
  }[] = [
    { navn: 'Enheder i alle foreninger', antal: alleEnheder, maalt: true,
      note: `${raekker.length} foreninger i registret` },
    { navn: 'I foreninger vi vil købe i', antal: enheder, maalt: true,
      note: `${maal.length} foreninger med status målgruppe` },
    { navn: 'I størrelsen vi køber (20–80 kvm)', antal: null, maalt: false,
      note: 'Kræver kvm pr. lejlighed — haves kun for dem vi ejer' },
    { navn: 'Har fået brev', antal: brevEnheder, maalt: true,
      note: 'Enheder i foreninger med mindst én brevrunde' },
    { navn: 'Har brugt boligberegneren', antal: beregnerLeads, maalt: true,
      note: beregnerLeads === 0
        ? 'Ingen endnu — beregneren er lige gået i luften'
        : 'OBS: tallet indeholder testindsendelser fra udviklingen' },
    // Måles mod trin 2, ikke mod trin 5: de købte kom IKKE gennem beregneren,
    // så "procent af forrige" ville sammenligne to urelaterede tal — og gav
    // 197 %, hvilket er tydeligt forkert.
    { navn: 'Købt', antal: ejet, maalt: true, basisTrin: 1,
      note: 'Købt gennem brev og opkald — ikke gennem beregneren' },
  ];
  const top = trin[0].antal || 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <MainHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Opkøbs-tragt</h1>
          <p className="text-sm text-slate-500 mt-1">
            {raekker.length} foreninger · {maal.length} i målgruppen med {enheder.toLocaleString('da-DK')} enheder,
            hvoraf vi ejer {ejet} ({enheder ? ((100 * ejet) / enheder).toFixed(1) : '0'} %)
            · tal opdateret {fmtDato(senest as Date | null)}
          </p>
        </header>

        {/* ── Tragten ─────────────────────────────────────────────────
            Selve pointen med siden: indsnævringen fra alle enheder ned til
            dem vi har købt. Tabellen nedenfor er detaljen bag. */}
        {!dbFejl && raekker.length > 0 && (
          <section className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 mb-6">
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-5">
              <h2 className="font-semibold text-slate-900">Opkøbs-tragten</h2>
              <p className="text-xs text-slate-500">
                Hvert trin er en indsnævring af det forrige · procent viser frafald
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {trin.map((t, i) => {
                const basis =
                  t.basisTrin !== undefined
                    ? trin[t.basisTrin]
                    : i > 0
                      ? trin.slice(0, i).reverse().find((x) => x.antal !== null)
                      : null;
                const andelAfTop = t.antal !== null ? (100 * t.antal) / top : 0;
                const andelAfBasis =
                  t.antal !== null && basis?.antal ? (100 * t.antal) / basis.antal : null;
                return (
                  <div key={t.navn} className="flex items-center gap-3 sm:gap-4">
                    <div className="w-6 text-[11px] font-semibold text-slate-400 tabular-nums">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <span className="text-sm font-medium text-slate-900 truncate">{t.navn}</span>
                        <span className="text-sm tabular-nums font-semibold text-slate-900 shrink-0">
                          {t.maalt ? (t.antal ?? 0).toLocaleString('da-DK') : '—'}
                        </span>
                      </div>
                      {/* Bjælken er bredden i forhold til øverste trin */}
                      <div className="h-6 rounded bg-slate-100 overflow-hidden relative">
                        {t.maalt ? (
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${Math.max(andelAfTop, t.antal ? 1.5 : 0)}%`,
                              background: i === trin.length - 1 ? '#145d5f' : '#7fb0aa',
                            }}
                          />
                        ) : (
                          <div className="h-full w-full rounded border border-dashed border-slate-300 bg-slate-50" />
                        )}
                      </div>
                      <div className="flex items-baseline justify-between gap-3 mt-1">
                        <span className={`text-xs ${t.maalt ? 'text-slate-500' : 'text-amber-700'}`}>
                          {t.maalt ? t.note : `Ikke målt — ${t.note}`}
                        </span>
                        {andelAfBasis !== null && basis && (
                          <span className="text-xs tabular-nums text-slate-400 shrink-0">
                            {andelAfBasis.toFixed(1)} % af{' '}
                            {t.basisTrin !== undefined ? `«${basis.navn.toLowerCase()}»` : 'forrige'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-5 pt-4 border-t border-slate-100 max-w-2xl leading-relaxed">
              De {ejet} købte kom gennem den hidtidige proces — brev, opkald og personlig kontakt —
              ikke gennem boligberegneren, som først lige er sat i luften. Trin 5 er derfor nul i dag,
              og det er dét tal, brev- og mailflowet skal flytte.
            </p>
          </section>
        )}

        {dbFejl ? (
          <div className="bg-white rounded-lg border border-amber-300 p-6">
            <h2 className="font-semibold text-slate-900 mb-1">Databasen mangler kolonnerne</h2>
            <p className="text-sm text-slate-600 mb-3">
              Kør migrering <code className="bg-slate-100 px-1.5 py-0.5 rounded">0007_foreninger_tragt</code> og
              derefter <code className="bg-slate-100 px-1.5 py-0.5 rounded">/api/admin/seed-foreninger</code>.
            </p>
            <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto text-slate-600">{dbFejl}</pre>
          </div>
        ) : raekker.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-600 text-sm">
              Ingen foreninger indlæst endnu. Kør <code className="bg-slate-100 px-1.5 py-0.5 rounded">POST /api/admin/seed-foreninger</code> for
              at hente dem fra regnearket.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="text-left font-semibold px-4 py-3">Forening</th>
                    <th className="text-left font-semibold px-3 py-3">By</th>
                    <th className="text-right font-semibold px-3 py-3">Enheder</th>
                    <th className="text-right font-semibold px-3 py-3">Ejet</th>
                    <th className="text-right font-semibold px-3 py-3">Andel</th>
                    <th className="text-right font-semibold px-3 py-3">Kvm</th>
                    <th className="text-center font-semibold px-3 py-3">Breve</th>
                    <th className="text-left font-semibold px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {raekker.map((r) => {
                    const st = STATUS[r.status] ?? STATUS.undersoeges;
                    const andel = Number(r.andel) || 0;
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{r.name}</div>
                          {r.street && <div className="text-xs text-slate-500">{r.street}</div>}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{r.city ?? '—'}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                          {(r.unitCount ?? 0).toLocaleString('da-DK')}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">
                          {r.ownedCount}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Bjælken gør det muligt at se fordelingen uden at læse tallene */}
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, andel * 4)}%`, background: '#145d5f' }}
                              />
                            </div>
                            <span className="tabular-nums font-semibold text-slate-900 w-12 text-right">
                              {andel.toFixed(1)} %
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-slate-500 whitespace-nowrap">
                          {r.kvmFrom && r.kvmTo ? `${r.kvmFrom}–${r.kvmTo}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-slate-600">
                          {r.letterRounds || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: st.bg, color: st.fg }}
                          >
                            {st.label}
                          </span>
                          {r.statusReason && (
                            <div className="text-xs text-slate-500 mt-1 max-w-[22ch]">{r.statusReason}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4 max-w-2xl leading-relaxed">
          Andel er hvor stor en del af foreningen vi ejer. Tallet kommer fra en krydsning af
          foreningens BFE-numre mod porteføljen og genberegnes ved hver indlæsning — i modsætning
          til regnearket, hvor det blev vedligeholdt i hånden og nåede at blive 27 for lavt.
        </p>
      </main>
    </div>
  );
}
