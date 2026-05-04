/**
 * Inbox — startsiden. Action-orienteret "I dag"-view + traditional SLA-grupper nedenunder.
 */
import Link from 'next/link';
import { listActiveLeadsWithStage } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';
import type { SLAStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Enriched = {
  lead: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    notes: string | null;
    stageSlug: string;
    priority: number;
    stageChangedAt: Date | string;
    bidDkk: number | null;
    bidStatus: string | null;
  };
  stage: { name: string; slaDays: number | null; isTerminal: boolean };
  sla: ReturnType<typeof computeSLA>;
};

export default async function InboxPage() {
  let rows: Awaited<ReturnType<typeof listActiveLeadsWithStage>>;
  try {
    rows = await listActiveLeadsWithStage();
  } catch (err) {
    return <ConnectionWarning error={err instanceof Error ? err.message : String(err)} />;
  }

  const enriched: Enriched[] = rows.map(({ lead, stage }) => ({
    lead,
    stage,
    sla: computeSLA({ stageChangedAt: lead.stageChangedAt, stage }),
  }));

  // ─── "I dag"-buckets ────────────────────────────────────────────────────────
  const RING_STAGES = new Set(['kontaktet', 'mail-sendt', 'interesse', 'fremvisning']);
  const OPFOLG_STAGES = new Set(['ny-lead', 'mail-sendt', 'kontaktet']);

  const ring = enriched
    .filter(
      (e) =>
        RING_STAGES.has(e.lead.stageSlug) &&
        e.lead.phone &&
        e.sla.daysInStage > 5,
    )
    .sort((a, b) => b.lead.priority - a.lead.priority || b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);

  const opfolg = enriched
    .filter(
      (e) =>
        OPFOLG_STAGES.has(e.lead.stageSlug) &&
        e.lead.email &&
        e.sla.status === 'breach',
    )
    .sort((a, b) => b.lead.priority - a.lead.priority || b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);

  const aktivBud = enriched
    .filter((e) => e.lead.stageSlug === 'aktivt-bud' && e.sla.daysInStage > 3)
    .sort((a, b) => b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);

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

      {/* ─── I DAG ────────────────────────────────────────────────────────── */}
      {(ring.length > 0 || opfolg.length > 0 || aktivBud.length > 0) && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold">I dag</h2>
            <span className="text-sm text-slate-500">handlings-fokus</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ActionCard
              icon="📞"
              title={`Ring til ${ring.length}`}
              subtitle="5+ dage uden kontakt"
              entries={ring}
              tone="amber"
              ctaKind="phone"
            />
            <ActionCard
              icon="✉️"
              title={`Send opfølgning`}
              subtitle={`${opfolg.length} i SLA-brud`}
              entries={opfolg}
              tone="red"
              ctaKind="email"
            />
            <ActionCard
              icon="⭐"
              title={`Aktivt bud`}
              subtitle={`${aktivBud.length} afventer svar`}
              entries={aktivBud}
              tone="emerald"
              ctaKind="phone"
            />
          </div>
        </section>
      )}

      {/* ─── Alle SLA-brud / opfølgning / afventer ─────────────────────────── */}
      <Section title="SLA-brud" tone="breach" entries={breach} />
      <Section title="Opfølgning" tone="warning" entries={warning} />
      <Section title="Afventer" tone="ok" entries={ok} />
    </div>
  );
}

// ─── Action card (top section) ─────────────────────────────────────────────
function ActionCard({
  icon,
  title,
  subtitle,
  entries,
  tone,
  ctaKind,
}: {
  icon: string;
  title: string;
  subtitle: string;
  entries: Enriched[];
  tone: 'amber' | 'red' | 'emerald';
  ctaKind: 'phone' | 'email';
}) {
  if (entries.length === 0) return null;
  const bg =
    tone === 'red'
      ? 'bg-red-50 border-red-200'
      : tone === 'amber'
        ? 'bg-amber-50 border-amber-200'
        : 'bg-emerald-50 border-emerald-200';

  return (
    <div className={`border rounded-lg p-3 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{title}</div>
          <div className="text-xs text-slate-600 truncate">{subtitle}</div>
        </div>
      </div>
      <ul className="space-y-1">
        {entries.map(({ lead, stage, sla }) => (
          <li key={lead.id}>
            <ActionRow lead={lead} stage={stage} sla={sla} ctaKind={ctaKind} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionRow({
  lead,
  stage,
  sla,
  ctaKind,
}: {
  lead: Enriched['lead'];
  stage: Enriched['stage'];
  sla: Enriched['sla'];
  ctaKind: 'phone' | 'email';
}) {
  const dest =
    ctaKind === 'phone' && lead.phone
      ? `tel:${lead.phone.replace(/\s/g, '')}`
      : ctaKind === 'email' && lead.email
        ? `mailto:${lead.email}`
        : null;

  return (
    <div className="flex items-center gap-2 bg-white rounded px-2 py-1.5 text-xs">
      <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1 hover:underline">
        <div className="font-medium truncate">
          {lead.fullName || '(uden navn)'}
          {lead.priority > 0 && (
            <span className="text-amber-500 ml-1">{'★'.repeat(lead.priority)}</span>
          )}
        </div>
        <div className="text-slate-500 truncate">
          {lead.address || ''} · {Math.floor(sla.daysInStage)}d i {stage.name}
        </div>
      </Link>
      {dest && (
        <a
          href={dest}
          className="shrink-0 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
        >
          {ctaKind === 'phone' ? 'Ring' : 'Email'}
        </a>
      )}
    </div>
  );
}

// ─── SLA-grupper (under "I dag") ────────────────────────────────────────────
function Section({ title, tone, entries }: { title: string; tone: SLAStatus; entries: Enriched[] }) {
  if (entries.length === 0) return null;
  const dot = tone === 'breach' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-green-500';
  return (
    <section>
      <details open={tone === 'breach'}>
        <summary className="flex items-center gap-2 mb-2 cursor-pointer list-none">
          <span className={`w-2 h-2 rounded-full ${dot}`} />
          <h2 className="font-semibold">{title}</h2>
          <span className="text-sm text-slate-500">{entries.length}</span>
          <span className="ml-auto text-xs text-slate-400">klik for at vise/skjule</span>
        </summary>
        <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {entries.map(({ lead, stage, sla }) => (
            <li key={lead.id} className="group">
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50">
                <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {lead.fullName || '(uden navn)'}
                        {lead.priority > 0 && (
                          <span className="text-amber-500 ml-1 text-xs">{'★'.repeat(lead.priority)}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {lead.address || '(uden adresse)'} · {lead.city || ''}
                      </div>
                      {lead.notes && <div className="text-xs text-slate-600 mt-1 line-clamp-1">{lead.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded border ${slaBadgeColor(sla.status)}`}
                      >
                        {stage.name}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">
                        {Math.floor(sla.daysInStage)}d{sla.slaDays != null && ` / ${sla.slaDays}d SLA`}
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Quick actions — visible on hover */}
                <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/\s/g, '')}`}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs"
                      title={`Ring til ${lead.phone}`}
                    >
                      📞
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs"
                      title={`Email til ${lead.email}`}
                    >
                      ✉️
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </details>
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
