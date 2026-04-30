/**
 * Lead Detail — slide-over på desktop, fullscreen på mobil.
 * 4 tabs: Oversigt, Kommunikation, Stage-historik, Noter.
 * READ-ONLY i Uge 1-2.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { Lead, LeadCommunication, LeadStageHistory } from '@/lib/types';
import { computeSLA, slaBadgeColor } from '@/lib/sla';

type Tab = 'oversigt' | 'kommunikation' | 'historik' | 'noter';

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: Tab }>;
}) {
  const { id } = await params;
  const { tab = 'oversigt' } = await searchParams;
  const supa = await getSupabaseServer();

  const [leadRes, commsRes, historyRes] = await Promise.all([
    supa.from('leads').select('*').eq('id', id).maybeSingle(),
    supa.from('lead_communications').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
    supa.from('lead_stage_history').select('*').eq('lead_id', id).order('changed_at', { ascending: false }),
  ]);

  if (leadRes.error || !leadRes.data) {
    if (leadRes.error?.message?.includes('URL') || leadRes.error?.message?.includes('Key')) {
      return <SupabaseWarning />;
    }
    notFound();
  }

  const lead = leadRes.data as Lead;
  const sla = computeSLA(lead);
  const comms = (commsRes.data as LeadCommunication[]) || [];
  const history = (historyRes.data as LeadStageHistory[]) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="min-w-0">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">← Inbox</Link>
          <h1 className="text-2xl font-bold mt-1 truncate">{lead.full_name || '(uden navn)'}</h1>
          <p className="text-sm text-slate-500 truncate">
            {lead.address || '—'}{lead.city && ` · ${lead.city}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2.5 py-1 text-xs rounded border ${slaBadgeColor(sla.status)}`}>
            {lead.stage}
          </span>
          <div className="text-xs text-slate-500 mt-1">
            {sla.daysInStage}d{sla.slaDays != null && ` / ${sla.slaDays}d SLA`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 -mx-4 px-4 overflow-x-auto">
        <TabLink id={id} tab="oversigt" active={tab} label="Oversigt" />
        <TabLink id={id} tab="kommunikation" active={tab} label={`Kommunikation (${comms.length})`} />
        <TabLink id={id} tab="historik" active={tab} label={`Historik (${history.length})`} />
        <TabLink id={id} tab="noter" active={tab} label="Noter" />
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {tab === 'oversigt' && <OversigtTab lead={lead} />}
        {tab === 'kommunikation' && <KommunikationTab comms={comms} />}
        {tab === 'historik' && <HistorikTab history={history} />}
        {tab === 'noter' && <NoterTab lead={lead} />}
      </div>
    </div>
  );
}

function TabLink({ id, tab, active, label }: { id: string; tab: Tab; active: Tab; label: string }) {
  const isActive = active === tab;
  return (
    <Link
      href={`/leads/${id}?tab=${tab}`}
      className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
        isActive
          ? 'border-slate-900 font-semibold text-slate-900'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
    </Link>
  );
}

function OversigtTab({ lead }: { lead: Lead }) {
  const fields: [string, string | number | null | undefined][] = [
    ['Email', lead.email],
    ['Telefon', lead.phone],
    ['Adresse', lead.address],
    ['Postnr / By', `${lead.postal_code || ''} ${lead.city || ''}`.trim() || null],
    ['Boligtype', lead.property_type],
    ['Boligareal (m²)', lead.housing_area_m2],
    ['Værelser', lead.rooms],
    ['Byggeår', lead.year_built],
    ['Listpris', lead.list_price ? `${lead.list_price.toLocaleString('da-DK')} kr` : null],
    ['Kampagne ID', lead.campaign_id],
    ['Brev sendt', lead.campaign_letter_sent_at?.slice(0, 10) || null],
    ['Oprettet', lead.created_at?.slice(0, 16).replace('T', ' ')],
    ['Sidst opdateret', lead.updated_at?.slice(0, 16).replace('T', ' ')],
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
      {fields.filter(([, v]) => v != null && v !== '').map(([label, value]) => (
        <div key={label} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
          <dt className="text-slate-500">{label}</dt>
          <dd className="col-span-2 font-medium">{value}</dd>
        </div>
      ))}
    </div>
  );
}

function KommunikationTab({ comms }: { comms: LeadCommunication[] }) {
  if (comms.length === 0) {
    return <EmptyState>Ingen kommunikation endnu.</EmptyState>;
  }
  return (
    <ul className="space-y-2">
      {comms.map(c => (
        <li key={c.id} className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className={`px-1.5 py-0.5 rounded ${
              c.type === 'email' ? 'bg-blue-100 text-blue-800'
              : c.type === 'phone' ? 'bg-green-100 text-green-800'
              : c.type === 'sms' ? 'bg-purple-100 text-purple-800'
              : 'bg-slate-100 text-slate-700'
            }`}>{c.type}</span>
            <span>{c.direction === 'in' ? '← indkommet' : '→ udgående'}</span>
            <span className="ml-auto">{c.created_at.slice(0, 16).replace('T', ' ')}</span>
          </div>
          {c.subject && <div className="font-medium text-sm">{c.subject}</div>}
          {c.body && <div className="text-sm text-slate-700 mt-1 whitespace-pre-line line-clamp-4">{c.body}</div>}
        </li>
      ))}
    </ul>
  );
}

function HistorikTab({ history }: { history: LeadStageHistory[] }) {
  if (history.length === 0) {
    return <EmptyState>Ingen stage-historik endnu.</EmptyState>;
  }
  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-3 pl-4">
      {history.map(h => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
          <div className="text-xs text-slate-500">{h.changed_at.slice(0, 16).replace('T', ' ')}</div>
          <div className="text-sm">
            {h.from_stage ? (
              <><span className="text-slate-500">{h.from_stage}</span> → <span className="font-medium">{h.to_stage}</span></>
            ) : (
              <span className="font-medium">Oprettet i {h.to_stage}</span>
            )}
          </div>
          {h.changed_by && <div className="text-xs text-slate-400">af {h.changed_by}</div>}
        </li>
      ))}
    </ol>
  );
}

function NoterTab({ lead }: { lead: Lead }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      {lead.notes ? (
        <div className="text-sm whitespace-pre-line text-slate-700">{lead.notes}</div>
      ) : (
        <div className="text-sm text-slate-400">Ingen noter endnu.</div>
      )}
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        Skrive-tilstand kommer i Uge 3.
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-slate-400 text-center py-12 bg-white border border-slate-200 rounded-lg">
      {children}
    </div>
  );
}

function SupabaseWarning() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900">Supabase ikke forbundet</h2>
      <p className="text-sm text-amber-800 mt-1">
        Udfyld <code className="bg-amber-100 px-1 rounded">.env.local</code> og genstart dev-server.
      </p>
    </div>
  );
}
