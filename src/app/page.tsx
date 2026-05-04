/**
 * Inbox — email-style samtale-view.
 * Top: "I dag"-action cards. Midten: Samtaler sorteret efter seneste aktivitet.
 * SLA-overview minimeret nederst.
 */
import Link from 'next/link';
import { listActiveLeadsWithStage, listLeadsByLatestComm } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';

export const dynamic = 'force-dynamic';

type Conv = Awaited<ReturnType<typeof listLeadsByLatestComm>>[number];
type Enriched = Awaited<ReturnType<typeof listActiveLeadsWithStage>>[number] & {
  sla: ReturnType<typeof computeSLA>;
};

export default async function InboxPage() {
  let conversations: Conv[];
  let enriched: Enriched[];
  try {
    const [convs, basic] = await Promise.all([
      listLeadsByLatestComm(),
      listActiveLeadsWithStage(),
    ]);
    conversations = convs;
    enriched = basic.map(({ lead, stage }) => ({
      lead,
      stage,
      sla: computeSLA({ stageChangedAt: lead.stageChangedAt, stage }),
    }));
  } catch (err) {
    return <ConnectionWarning error={err instanceof Error ? err.message : String(err)} />;
  }

  // ─── "I dag"-action buckets ─────────────────────────────────────────────
  const RING_STAGES = new Set(['kontaktet', 'mail-sendt', 'interesse', 'fremvisning']);
  const OPFOLG_STAGES = new Set(['ny-lead', 'mail-sendt', 'kontaktet']);

  const ring = enriched
    .filter((e) => RING_STAGES.has(e.lead.stageSlug) && e.lead.phone && e.sla.daysInStage > 5)
    .sort((a, b) => b.lead.priority - a.lead.priority || b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);
  const opfolg = enriched
    .filter((e) => OPFOLG_STAGES.has(e.lead.stageSlug) && e.lead.email && e.sla.status === 'breach')
    .sort((a, b) => b.lead.priority - a.lead.priority || b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);
  const aktivBud = enriched
    .filter((e) => e.lead.stageSlug === 'aktivt-bud' && e.sla.daysInStage > 3)
    .sort((a, b) => b.sla.daysInStage - a.sla.daysInStage)
    .slice(0, 5);

  // ─── Samtaler-buckets ───────────────────────────────────────────────────
  const unread = conversations.filter(
    (c) => c.latestComm?.direction === 'in',
  );
  const withComms = conversations.filter(
    (c) => c.latestComm && c.latestComm.direction !== 'in',
  );
  const noComms = conversations.filter((c) => !c.latestComm);

  const breach = enriched.filter((e) => e.sla.status === 'breach');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Inbox</h1>
        <p className="text-sm text-slate-500">
          {conversations.length} samtaler · {unread.length} ulæste · {breach.length} i SLA-brud
        </p>
      </div>

      {/* ─── I DAG ──────────────────────────────────────────────────────── */}
      {(ring.length > 0 || opfolg.length > 0 || aktivBud.length > 0) && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-semibold">I dag</h2>
            <span className="text-sm text-slate-500">handlings-fokus</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ring.length > 0 && (
              <ActionCard icon="📞" title={`Ring til ${ring.length}`} subtitle="5+ dage stille" entries={ring} tone="amber" ctaKind="phone" />
            )}
            {opfolg.length > 0 && (
              <ActionCard icon="✉️" title="Send opfølgning" subtitle={`${opfolg.length} i SLA-brud`} entries={opfolg} tone="red" ctaKind="email" />
            )}
            {aktivBud.length > 0 && (
              <ActionCard icon="⭐" title="Aktivt bud" subtitle={`${aktivBud.length} afventer svar`} entries={aktivBud} tone="emerald" ctaKind="phone" />
            )}
          </div>
        </section>
      )}

      {/* ─── ULÆSTE / SAMTALER ──────────────────────────────────────────── */}
      {unread.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="font-semibold">Ulæste svar</h2>
            <span className="text-sm text-slate-500">{unread.length}</span>
          </div>
          <ConversationList items={unread} unread />
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <h2 className="font-semibold">Igangværende samtaler</h2>
          <span className="text-sm text-slate-500">{withComms.length}</span>
        </div>
        {withComms.length > 0 ? (
          <ConversationList items={withComms} />
        ) : (
          <div className="text-sm text-slate-400 text-center py-6 bg-white border border-slate-200 rounded-lg">
            Ingen samtaler i gang.
          </div>
        )}
      </section>

      {/* ─── INGEN KONTAKT ──────────────────────────────────────────────── */}
      <section>
        <details>
          <summary className="flex items-center gap-2 mb-2 cursor-pointer list-none">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <h2 className="font-semibold">Aldrig kontaktet</h2>
            <span className="text-sm text-slate-500">{noComms.length}</span>
            <span className="ml-auto text-xs text-slate-400">klik for at vise</span>
          </summary>
          <ConversationList items={noComms} />
        </details>
      </section>

      {/* ─── SLA-OVERVIEW (minimeret) ───────────────────────────────────── */}
      <section>
        <details>
          <summary className="flex items-center gap-2 mb-2 cursor-pointer list-none">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <h2 className="font-semibold text-sm text-slate-600">SLA-overview</h2>
            <span className="text-xs text-slate-500">{breach.length} brud</span>
            <span className="ml-auto text-xs text-slate-400">klik for at vise</span>
          </summary>
          <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 text-sm">
            {breach.slice(0, 50).map(({ lead, stage, sla }) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
                  <span className={`px-1.5 py-0.5 text-xs rounded border ${slaBadgeColor(sla.status)}`}>
                    {stage.name}
                  </span>
                  <span className="truncate flex-1">{lead.fullName || '(uden navn)'}</span>
                  <span className="text-xs text-slate-400">
                    {Math.floor(sla.daysInStage)}d / {sla.slaDays}d
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}

// ─── Conversation list (Gmail-style) ───────────────────────────────────────
function ConversationList({ items, unread }: { items: Conv[]; unread?: boolean }) {
  if (items.length === 0) return null;
  return (
    <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
      {items.map(({ lead, stage, latestComm }) => (
        <li key={lead.id} className="group">
          <Link
            href={`/leads/${lead.id}?tab=kommunikation`}
            className={`flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 ${
              unread ? 'bg-blue-50/40' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                unread ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {initials(lead.fullName)}
            </div>
            {/* Body */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`truncate ${unread ? 'font-semibold' : 'font-medium'}`}>
                  {lead.fullName || '(uden navn)'}
                </span>
                {lead.priority > 0 && (
                  <span className="text-amber-500 text-xs shrink-0">
                    {'★'.repeat(lead.priority)}
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400 shrink-0">
                  {latestComm ? formatRelative(latestComm.createdAt) : ''}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate">
                {lead.address || lead.email || '—'}
              </div>
              {latestComm && (
                <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                  {latestComm.direction === 'out' && (
                    <span className="text-slate-400">Du → </span>
                  )}
                  {latestComm.direction === 'in' && (
                    <span className="text-blue-600 font-medium">← </span>
                  )}
                  {(latestComm.subject || latestComm.body || '').replace(/\s+/g, ' ').slice(0, 100)}
                </div>
              )}
            </div>
            {/* Stage chip */}
            <div className="shrink-0 self-start">
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                {stage.name}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}

function formatRelative(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const ms = Date.now() - date.getTime();
  const min = ms / 60_000;
  if (min < 1) return 'nu';
  if (min < 60) return `${Math.floor(min)} min`;
  const h = min / 60;
  if (h < 24) return `${Math.floor(h)} t`;
  const d2 = h / 24;
  if (d2 < 7) return `${Math.floor(d2)}d`;
  return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
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

function ConnectionWarning({ error }: { error: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900 mb-2">Database ikke forbundet</h2>
      <p className="text-sm text-amber-800 mb-3">
        For at hente leads, skal <code className="bg-amber-100 px-1 rounded">.env.local</code> udfyldes med{' '}
        <code className="bg-amber-100 px-1 rounded">DATABASE_URL</code>.
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-amber-700">Fejl-detaljer</summary>
        <pre className="mt-2 text-xs bg-amber-100 p-2 rounded overflow-auto">{error}</pre>
      </details>
    </div>
  );
}
