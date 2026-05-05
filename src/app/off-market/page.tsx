/**
 * Off-market — alle leads der er kommet ind via boligberegneren.
 * Sælger har selv henvendt sig (ikke fra Boligsiden), så vi har proprietary
 * indsigt og potentielt bedre vilkår.
 */
import Link from 'next/link';
import { listOffMarketLeads } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export default async function OffMarketPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const sp = await searchParams;
  const filterStage = sp.stage ?? 'all';

  let rows: Awaited<ReturnType<typeof listOffMarketLeads>> = [];
  let error: string | null = null;
  try {
    rows = await listOffMarketLeads();
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const filtered =
    filterStage === 'all'
      ? rows
      : filterStage === 'aktive'
        ? rows.filter((r) => !r.stage.isTerminal)
        : filterStage === 'arkiveret'
          ? rows.filter((r) => r.stage.slug === 'arkiveret' || r.stage.slug === 'tabt')
          : rows.filter((r) => r.stage.slug === filterStage);

  const counts = {
    all: rows.length,
    aktive: rows.filter((r) => !r.stage.isTerminal).length,
    arkiveret: rows.filter((r) => r.stage.slug === 'arkiveret' || r.stage.slug === 'tabt').length,
  };

  // Stats — gennemsnitlige tilbud, antal med fuld data
  const withBids = rows.filter((r) => r.lead.bidDkk && r.lead.bidDkk > 0);
  const avgBid =
    withBids.length > 0
      ? Math.round(withBids.reduce((sum, r) => sum + (r.lead.bidDkk ?? 0), 0) / withBids.length)
      : 0;
  const totalPipelineValue = withBids.reduce((sum, r) => sum + (r.lead.bidDkk ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Off-market</h1>
      <p className="text-sm text-slate-500 mb-2">
        {rows.length} leads via boligberegneren · {withBids.length} med tilbud · pipeline-værdi{' '}
        <strong>{totalPipelineValue.toLocaleString('da-DK')} kr</strong>
        {avgBid > 0 && <> · gns. tilbud {avgBid.toLocaleString('da-DK')} kr</>}
      </p>

      <nav className="mb-4 flex gap-2 text-sm">
        {(['all', 'aktive', 'arkiveret'] as const).map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/off-market' : `/off-market?stage=${s}`}
            className={`px-3 py-1 rounded ${
              filterStage === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? `Alle (${counts.all})` : s === 'aktive' ? `Aktive (${counts.aktive})` : `Arkiveret/Tabt (${counts.arkiveret})`}
          </Link>
        ))}
      </nav>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <strong>Fejl:</strong> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <strong>Ingen leads i dette view.</strong>{' '}
          {rows.length === 0 && 'Ingen har endnu brugt boligberegneren — del linket /salg med dit netværk.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Lead</th>
                  <th className="px-3 py-2 font-medium text-center">Dage</th>
                  <th className="px-3 py-2 font-medium">Adresse</th>
                  <th className="px-3 py-2 font-medium">m²</th>
                  <th className="px-3 py-2 font-medium">Stand</th>
                  <th className="px-3 py-2 font-medium text-right">Markedspris</th>
                  <th className="px-3 py-2 font-medium text-right">Vores tilbud</th>
                  <th className="px-3 py-2 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const dage = r.lead.stageChangedAt
                    ? Math.floor(
                        (Date.now() - new Date(r.lead.stageChangedAt).getTime()) / 86_400_000,
                      )
                    : null;
                  const stand = ratingToStand(r.lead.conditionRating);
                  return (
                    <tr key={r.lead.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">
                        <Link
                          href={`/leads/${r.lead.id}?tab=afkast`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {r.lead.fullName || '(uden navn)'}
                        </Link>
                        {r.lead.source === 'boligberegner-out-of-area' && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            udenfor område
                          </span>
                        )}
                        {r.lead.email && <div className="text-xs text-slate-500">{r.lead.email}</div>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <DageBadge dage={dage} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-700">{r.lead.address || '—'}</div>
                        {r.lead.city && (
                          <div className="text-xs text-slate-500">
                            {r.lead.postalCode} {r.lead.city}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.lead.kvm ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{stand}</td>
                      <td className="px-3 py-2 text-right">
                        {r.lead.valuationDkk?.toLocaleString('da-DK') || '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.lead.bidDkk ? (
                          <span className="font-medium text-emerald-700">
                            {r.lead.bidDkk.toLocaleString('da-DK')}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StageBadge slug={r.stage.slug} name={r.stage.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DageBadge({ dage }: { dage: number | null }) {
  if (dage == null) return <span className="text-slate-400 text-xs">—</span>;
  const cls =
    dage < 2
      ? 'bg-emerald-100 text-emerald-700'
      : dage < 7
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{dage} d</span>;
}

function StageBadge({ slug, name }: { slug: string; name: string }) {
  const cls =
    slug === 'arkiveret' || slug === 'tabt'
      ? 'bg-slate-100 text-slate-500'
      : slug === 'interesse'
        ? 'bg-blue-100 text-blue-700'
        : slug === 'ny-lead'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{name}</span>;
}

function ratingToStand(rating: number | null): string {
  if (rating == null) return '—';
  if (rating >= 9) return '✨ Nyrenoveret';
  if (rating >= 7) return '👍 God';
  if (rating >= 5) return '🔨 Middel';
  if (rating >= 3) return '🎨 Trænger';
  return '🛠️ Slidt';
}
