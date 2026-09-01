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
import { desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { housingAssociations } from '@/lib/db/schema';
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

  return <ForeningerView raekker={raekker} dbFejl={dbFejl} />;
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

function ForeningerView({ raekker, dbFejl }: { raekker: Raekke[]; dbFejl: string | null }) {
  const maal = raekker.filter((r) => r.status === 'maalgruppe');
  const enheder = maal.reduce((s, r) => s + (r.unitCount ?? 0), 0);
  const ejet = maal.reduce((s, r) => s + r.ownedCount, 0);
  const senest = raekker.map((r) => r.dataUpdatedAt).filter(Boolean).sort().pop() ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <MainHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Ejerforeninger</h1>
          <p className="text-sm text-slate-500 mt-1">
            {raekker.length} foreninger · {maal.length} i målgruppen med {enheder.toLocaleString('da-DK')} enheder,
            hvoraf vi ejer {ejet} ({enheder ? ((100 * ejet) / enheder).toFixed(1) : '0'} %)
            · tal opdateret {fmtDato(senest as Date | null)}
          </p>
        </header>

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
