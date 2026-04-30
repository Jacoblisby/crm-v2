/**
 * Inbox — startsiden. 3 sektioner: SLA-brud, Opfølgning, Afventer.
 * Mirror af Loveable's InboxView. READ-ONLY i Uge 1-2.
 */
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Lead } from '@/lib/types';
import { computeSLA, slaBadgeColor } from '@/lib/sla';

export default async function InboxPage() {
  const supa = await getSupabaseServer();
  const { data: leads, error } = await supa
    .from('leads')
    .select('*')
    .not('stage', 'in', '(Lukket,Arkiveret,Tabt)')
    .order('stage_changed_at', { ascending: true });

  if (error) {
    return (
      <ConnectionWarning error={error.message} />
    );
  }

  const enriched = (leads || []).map((l: Lead) => ({ ...l, _sla: computeSLA(l) }));
  const breach = enriched.filter(l => l._sla.status === 'breach');
  const warning = enriched.filter(l => l._sla.status === 'warning');
  const ok = enriched.filter(l => l._sla.status === 'ok');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Inbox</h1>
        <p className="text-sm text-slate-500">
          {enriched.length} åbne leads · {breach.length} i SLA-brud · {warning.length} til opfølgning
        </p>
      </div>

      <Section title="SLA-brud" tone="breach" count={breach.length} leads={breach} />
      <Section title="Opfølgning" tone="warning" count={warning.length} leads={warning} />
      <Section title="Afventer" tone="ok" count={ok.length} leads={ok} />
    </div>
  );
}

function Section({ title, tone, count, leads }: {
  title: string;
  tone: 'breach' | 'warning' | 'ok';
  count: number;
  leads: (Lead & { _sla: ReturnType<typeof computeSLA> })[];
}) {
  if (count === 0) return null;
  const dot = tone === 'breach' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-green-500';
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-slate-500">{count}</span>
      </div>
      <ul className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {leads.map(l => (
          <li key={l.id}>
            <Link href={`/leads/${l.id}`} className="block px-4 py-3 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{l.full_name || '(uden navn)'}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {l.address || '(uden adresse)'} · {l.city || ''}
                  </div>
                  {l.notes && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-1">{l.notes}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded border ${slaBadgeColor(l._sla.status)}`}>
                    {l.stage}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">
                    {l._sla.daysInStage}d
                    {l._sla.slaDays != null && ` / ${l._sla.slaDays}d SLA`}
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
      <h2 className="font-semibold text-amber-900 mb-2">Supabase ikke forbundet</h2>
      <p className="text-sm text-amber-800 mb-3">
        For at hente leads, skal <code className="bg-amber-100 px-1 rounded">.env.local</code> udfyldes med Supabase-credentials.
      </p>
      <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
        <li>Kopier <code className="bg-amber-100 px-1 rounded">.env.local.example</code> → <code className="bg-amber-100 px-1 rounded">.env.local</code></li>
        <li>Hent <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> fra Supabase dashboard (Settings → API)</li>
        <li>Genstart dev-server: <code className="bg-amber-100 px-1 rounded">npm run dev</code></li>
      </ol>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-amber-700">Fejl-detaljer</summary>
        <pre className="mt-2 text-xs bg-amber-100 p-2 rounded overflow-auto">{error}</pre>
      </details>
    </div>
  );
}
