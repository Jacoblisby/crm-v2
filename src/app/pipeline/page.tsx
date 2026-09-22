/**
 * Pipeline — kanban-view af alle aktive leads.
 * Mirror af Loveable's pipeline. READ-ONLY i Uge 1-2.5 (drag-drop kommer i Uge 3).
 */
import Link from 'next/link';
import { listLeadsForPipeline, listPipelineStages } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';
import type { Lead, PipelineStage } from '@/lib/types';
import { bookingOversigt, type Booking } from '@/lib/besigtigelse-plan';
import { antalFotos } from '@/lib/fotos';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  let stages: PipelineStage[];
  let rows: Awaited<ReturnType<typeof listLeadsForPipeline>>;
  let booking: Map<string, Booking>;
  let fotos = new Map<string, number>();

  try {
    [stages, rows, booking] = await Promise.all([
      listPipelineStages(),
      listLeadsForPipeline(),
      bookingOversigt().catch(() => new Map<string, Booking>()),
    ]);
    fotos = await antalFotos(rows.map((r) => r.lead.id)).catch(() => new Map<string, number>());
  } catch (err) {
    return <ConnectionWarning error={err instanceof Error ? err.message : String(err)} />;
  }

  // Filter terminale stages væk fra pipeline-visning (Lukket, Arkiveret, Tabt)
  const visibleStages = stages.filter((s) => !s.isTerminal || s.slug === 'koebt');

  const byStage = new Map<string, Lead[]>();
  for (const stage of visibleStages) byStage.set(stage.slug, []);
  for (const { lead } of rows) {
    const list = byStage.get(lead.stageSlug);
    if (list) list.push(lead);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pipeline</h1>
      <p className="text-sm text-slate-500 mb-4">
        {rows.length} aktive leads · scroll horisontalt på mobil ·{' '}
        <Link href="/arkiv" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">Arkiv</Link>
      </p>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {visibleStages.map((stage) => (
          <Column key={stage.slug} stage={stage} leads={byStage.get(stage.slug) || []} booking={booking} fotos={fotos} />
        ))}
      </div>
    </div>
  );
}

function Column({ stage, leads, booking, fotos }: { stage: PipelineStage; leads: Lead[]; booking: Map<string, Booking>; fotos: Map<string, number> }) {
  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{stage.name}</h3>
        <span className="text-xs text-slate-500">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((lead) => {
          const sla = computeSLA({ stageChangedAt: lead.stageChangedAt, stage });
          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="block bg-white rounded p-2 shadow-sm border border-slate-200 hover:border-slate-400 transition-colors"
            >
              <div className="font-medium text-sm truncate">{lead.fullName || '(uden navn)'}</div>
              <div className="text-xs text-slate-500 truncate">{lead.address || '—'}</div>
              {fotos.get(lead.id) ? (
                <div className="mt-1 text-[11px] text-slate-600">📷 {fotos.get(lead.id)} billede{fotos.get(lead.id) === 1 ? '' : 'r'}</div>
              ) : null}
              {(() => {
                const b = booking.get(lead.id);
                if (b?.svar) return <div className="mt-1.5 text-[11px] font-medium text-teal-800">💬 Har svaret</div>;
                if (b?.udkast) return <div className="mt-1.5 text-[11px] font-medium text-amber-800">📝 Udkast klar</div>;
                if (b?.sendt) return <div className="mt-1.5 text-[11px] text-slate-500">📅 Booking sendt</div>;
                return null;
              })()}
              <div className="flex items-center justify-between mt-1.5">
                {lead.listPrice && (
                  <span className="text-xs text-slate-600">
                    {Math.round(lead.listPrice / 1000)}k kr
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded border ${slaBadgeColor(sla.status)}`}>
                  {Math.floor(sla.daysInStage)}d
                </span>
              </div>
            </Link>
          );
        })}
        {leads.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Ingen leads</div>}
      </div>
      {stage.slaDays != null && (
        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200">SLA: {stage.slaDays} dage</div>
      )}
    </div>
  );
}

function ConnectionWarning({ error }: { error: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900">Database ikke forbundet</h2>
      <p className="text-sm text-amber-800 mt-1">Se Inbox-siden for setup-instruktioner. Fejl: {error}</p>
    </div>
  );
}
