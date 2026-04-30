/**
 * Pipeline — kanban-view af alle aktive leads.
 * Mirror af Loveable's pipeline. READ-ONLY i Uge 1-2 (drag-drop kommer i Uge 3).
 */
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Lead, LeadStage, SLA_DAYS } from '@/lib/types';
import { computeSLA, slaBadgeColor } from '@/lib/sla';

const STAGES: LeadStage[] = [
  'Ny',
  'Kvalificering',
  'Interesse',
  'Fremvisning',
  'Aktivt bud',
  'Underskrevet',
  'Lukket',
];

export default async function PipelinePage() {
  const supa = await getSupabaseServer();
  const { data: leads, error } = await supa
    .from('leads')
    .select('*')
    .not('stage', 'in', '(Arkiveret,Tabt)')
    .order('stage_changed_at', { ascending: false });

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h2 className="font-semibold text-amber-900">Supabase ikke forbundet</h2>
        <p className="text-sm text-amber-800 mt-1">Se Inbox-siden for setup-instruktioner.</p>
      </div>
    );
  }

  const byStage: Record<LeadStage, Lead[]> = Object.fromEntries(
    STAGES.map(s => [s, [] as Lead[]])
  ) as unknown as Record<LeadStage, Lead[]>;

  for (const lead of leads || []) {
    if (byStage[lead.stage as LeadStage]) {
      byStage[lead.stage as LeadStage].push(lead);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pipeline</h1>
      <p className="text-sm text-slate-500 mb-4">
        {leads?.length || 0} aktive leads · scroll horisontalt på mobil
      </p>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map(stage => (
          <Column key={stage} stage={stage} leads={byStage[stage]} />
        ))}
      </div>
    </div>
  );
}

function Column({ stage, leads }: { stage: LeadStage; leads: Lead[] }) {
  const slaDays = SLA_DAYS[stage];
  return (
    <div className="flex-shrink-0 w-72 bg-slate-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{stage}</h3>
        <span className="text-xs text-slate-500">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map(l => {
          const sla = computeSLA(l);
          return (
            <Link
              key={l.id}
              href={`/leads/${l.id}`}
              className="block bg-white rounded p-2 shadow-sm border border-slate-200 hover:border-slate-400 transition-colors"
            >
              <div className="font-medium text-sm truncate">{l.full_name || '(uden navn)'}</div>
              <div className="text-xs text-slate-500 truncate">{l.address || '—'}</div>
              <div className="flex items-center justify-between mt-1.5">
                {l.list_price && (
                  <span className="text-xs text-slate-600">
                    {(l.list_price / 1000).toFixed(0)}k kr
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded border ${slaBadgeColor(sla.status)}`}>
                  {sla.daysInStage}d
                </span>
              </div>
            </Link>
          );
        })}
        {leads.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">Ingen leads</div>
        )}
      </div>
      {slaDays !== null && (
        <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200">
          SLA: {slaDays} dage
        </div>
      )}
    </div>
  );
}
