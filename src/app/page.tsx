/**
 * Inbox — startsiden. 3 sektioner: SLA-brud, Opfølgning, Afventer.
 * Mirror af Loveable's InboxView. READ-ONLY i Uge 1-2.5.
 */
import Link from 'next/link';
import { listActiveLeadsWithStage } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';
import type { SLAStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  let rows: Awaited<ReturnType<typeof listActiveLeadsWithStage>>;
  try {
    rows = await listActiveLeadsWithStage();
  } catch (err) {
    return <ConnectionWarning error={err instanceof Error ? err.message : String(err)} />;
  }

  const enriched = rows.map(({ lead, stage }) => ({
    lead,
    stage,
    sla: computeSLA({ stageChangedAt: lead.stageChangedAt, stage }),
  }));

  const breach = enriched.filter((e) => e.sla.status === 'breach');
  const warning = enriched.filter((e) => e.sla.status === 'warning');
  const ok = enriched.filter((e) => e.sla.status === 'ok');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Inbox</h1>
        <p className="text-sm text-slate-500">
          {enriched.length} åbne leads · {breach.length} i SLA-brud · {warning.length} til opfølgning
        </p>
      </div>

      <Section title="SLA-brud" tone="breach" entries={breach} />
      <Section title="Opfølgning" tone="warning" entries={warning} />
      <Section title="Afventer" tone="ok" entries={ok} />
    </div>
  );
}

type Entry = {
  lead: { id: string; fullName: string | null; address: string | null; city: string | null; notes: string | null; stageSlug: string };
  stage: { name: string };
  sla: ReturnType<typeof computeSLA>;
};

function Section({ title, tone, entries }: { title: string; tone: SLAStatus; entries: Entry[] }) {
  if (entries.length === 0) return null;
  const dot = tone === 'breach' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-green-500';
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-slate-500">{entries.length}</span>
      </div>
      <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {entries.map(({ lead, stage, sla }) => (
          <li key={lead.id}>
            <Link href={`/leads/${lead.id}`} className="block px-4 py-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{lead.fullName || '(uden navn)'}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {lead.address || '(uden adresse)'} · {lead.city || ''}
                  </div>
                  {lead.notes && <div className="text-xs text-slate-600 mt-1 line-clamp-1">{lead.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded border ${slaBadgeColor(sla.status)}`}>
                    {stage.name}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">
                    {Math.floor(sla.daysInStage)}d
                    {sla.slaDays != null && ` / ${sla.slaDays}d SLA`}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConnectionWarning({ error }: { error: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900 mb-2">Database ikke forbundet</h2>
      <p className="text-sm text-amber-800 mb-3">
        For at hente leads, skal <code className="bg-amber-100 px-1 rounded">.env.local</code> udfyldes med{' '}
        <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code>. Se <code>DEPLOY.md</code>.
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-amber-700">Fejl-detaljer</summary>
        <pre className="mt-2 text-xs bg-amber-100 p-2 rounded overflow-auto">{error}</pre>
      </details>
    </div>
  );
}
