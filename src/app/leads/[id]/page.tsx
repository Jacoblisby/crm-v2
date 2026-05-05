/**
 * Lead Detail — slide-over på desktop, fullscreen på mobil.
 * 4 tabs: Oversigt, Kommunikation, Stage-historik, Noter.
 * READ-ONLY i Uge 1-2.5.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeadById, getLeadCommunications, getLeadStageHistory, listPipelineStages } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';
import type { Lead, LeadCommunication, LeadStageHistoryRow } from '@/lib/types';
import { SendEmailForm } from './SendEmailForm';
import { LeadActions } from './LeadActions';
import { AfkastDebug } from '@/app/admin/afkast/AfkastDebug';

export const dynamic = 'force-dynamic';

type Tab = 'oversigt' | 'kommunikation' | 'historik' | 'noter' | 'afkast';

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: Tab }>;
}) {
  const { id } = await params;
  const { tab = 'oversigt' } = await searchParams;

  const result = await getLeadById(id).catch((err) => {
    return { error: err instanceof Error ? err.message : String(err) };
  });

  if (result && 'error' in result) return <ConnectionWarning error={result.error} />;
  if (!result) notFound();

  const { lead, stage, property } = result;
  const sla = computeSLA({ stageChangedAt: lead.stageChangedAt, stage });

  const [comms, history, stages] = await Promise.all([
    getLeadCommunications(id),
    getLeadStageHistory(id),
    listPipelineStages(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="min-w-0">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-700">
            ← Inbox
          </Link>
          <h1 className="text-2xl font-bold mt-1 truncate">{lead.fullName || '(uden navn)'}</h1>
          <p className="text-sm text-slate-500 truncate">
            {lead.address || '—'}
            {lead.city && ` · ${lead.city}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2.5 py-1 text-xs rounded border ${slaBadgeColor(sla.status)}`}>
            {stage.name}
          </span>
          <div className="text-xs text-slate-500 mt-1">
            {Math.floor(sla.daysInStage)}d{sla.slaDays != null && ` / ${sla.slaDays}d SLA`}
          </div>
        </div>
      </div>

      <LeadActions leadId={lead.id} currentStage={lead.stageSlug} stages={stages} />

      <div className="flex gap-1 border-b border-slate-200 -mx-4 px-4 overflow-x-auto">
        <TabLink id={id} tab="oversigt" active={tab} label="Oversigt" />
        {lead.afkastInputs && (
          <TabLink id={id} tab="afkast" active={tab} label="💰 Afkast" />
        )}
        <TabLink id={id} tab="kommunikation" active={tab} label={`Kommunikation (${comms.length})`} />
        <TabLink id={id} tab="historik" active={tab} label={`Historik (${history.length})`} />
        <TabLink id={id} tab="noter" active={tab} label="Noter" />
      </div>

      <div className="pt-2">
        {tab === 'oversigt' && <OversigtTab lead={lead} property={property} />}
        {tab === 'afkast' && lead.afkastInputs && (
          <AfkastTab lead={lead} />
        )}
        {tab === 'kommunikation' && (
          <div className="space-y-3">
            <SendEmailForm leadId={lead.id} toEmail={lead.email} toName={lead.fullName} />
            <KommunikationTab comms={comms} />
          </div>
        )}
        {tab === 'historik' && <HistorikTab history={history} />}
        {tab === 'noter' && <NoterTab lead={lead} />}
      </div>
    </div>
  );
}

function AfkastTab({ lead }: { lead: Lead }) {
  const inp = lead.afkastInputs;
  if (!inp) {
    return (
      <div className="text-sm text-slate-400 text-center py-12 bg-white border border-slate-200 rounded-lg">
        Denne lead har ikke afkast-data — kun leads fra boligberegneren har det.
      </div>
    );
  }

  const fmt = (n?: number) => (n ?? 0).toLocaleString('da-DK');
  const costRows: Array<[string, number | undefined]> = [
    ['Fællesudgifter', inp.costFaellesudgifter],
    ['Grundskyld', inp.costGrundvaerdi],
    ['Fælleslån-ydelse', inp.costFaelleslaan],
    ['Renovation', inp.costRenovation],
    ['Bygningsforsikring', inp.costForsikringer],
    ['Rottebekæmpelse', inp.costRottebekempelse],
    ['Andre driftsomkostninger', inp.costAndreDrift],
  ];
  const hasCostBreakdown = costRows.some(([, v]) => (v ?? 0) > 0);
  const rentSourceLabel: Record<string, string> = {
    'same-vej': 'Same vej (samme EF)',
    'same-postal': 'Same postnr',
    'kvm-fallback': 'Postnr × m² fallback',
    'no-match': 'Ingen match',
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            📊 <strong>Beregner-snapshot</strong> for {lead.address}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Median pr m²: <strong>{inp.medianPricePerSqm?.toLocaleString('da-DK') ?? '—'}</strong>
            </span>
            <span>
              Comparables: <strong>{inp.sampleSize ?? 0}</strong>
            </span>
            {(inp.sameEfCount ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                {inp.sameEfCount} i samme EF
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Justér tallene nedenunder for at se hvad det betyder for buddet. Det opdaterer ikke
          leadet — brug det til at simulere alternative scenarier.
        </div>
      </div>

      {/* Drift-udspecificering — alle udgifter brugeren tastede */}
      {(hasCostBreakdown || (inp.waterCost ?? 0) > 0 || (inp.heatCost ?? 0) > 0) && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-sm">Drift-udspecificering (kr/år)</h3>
            <span className="text-xs text-slate-500">
              Total: <strong>{fmt(inp.driftTotal)}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {costRows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-50 py-1">
                <span className={`${(value ?? 0) === 0 ? 'text-slate-400' : 'text-slate-700'}`}>
                  {label}
                </span>
                <span className={`font-medium ${(value ?? 0) === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                  {fmt(value)}
                </span>
              </div>
            ))}
          </div>
          {((inp.waterCost ?? 0) > 0 || (inp.heatCost ?? 0) > 0) && (
            <div className="border-t border-slate-100 pt-3 mt-2 space-y-1 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">
                Vand & varme (ikke i drift — viderefaktureres til lejer)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <div className="flex justify-between">
                  <span>💧 Vand ({inp.waterPaidViaAssoc ? 'aconto via EF' : 'forbrug'})</span>
                  <span className="font-medium">{fmt(inp.waterCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>🔥 Varme ({inp.heatPaidViaAssoc ? 'aconto via EF' : 'forbrug'})</span>
                  <span className="font-medium">{fmt(inp.heatCost)}</span>
                </div>
              </div>
            </div>
          )}
          {inp.faelleslaanCanPrepay && (
            <div className="border-t border-slate-100 pt-2 text-xs text-slate-600">
              Fælleslån kan indfries før tid:{' '}
              <strong>
                {inp.faelleslaanCanPrepay === 'ja' ? 'JA' : inp.faelleslaanCanPrepay === 'nej' ? 'NEJ' : 'Ved ikke'}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Leje-kilde — hvor præcist er leje-estimatet */}
      {inp.rentSource && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex items-center justify-between flex-wrap gap-2">
          <div>
            🏠 <strong>Leje-kilde:</strong>{' '}
            <span
              className={
                inp.rentSource === 'same-vej'
                  ? 'text-emerald-700 font-semibold'
                  : inp.rentSource === 'same-postal'
                    ? 'text-amber-700 font-semibold'
                    : 'text-slate-500'
              }
            >
              {rentSourceLabel[inp.rentSource]}
            </span>
            {(inp.rentSampleSize ?? 0) > 0 && (
              <span className="text-slate-500 text-xs ml-2">({inp.rentSampleSize} af vores lejemål)</span>
            )}
          </div>
          <div className="text-xs text-slate-600">
            Brugt leje: <strong>{fmt(inp.rentMd)} kr/md</strong>
          </div>
        </div>
      )}

      <AfkastDebug
        initial={{
          pris: inp.listePris ?? 0,
          lejeMd: inp.rentMd ?? 0,
          drift: inp.driftTotal ?? 0,
          refurb: inp.refurbTotal ?? 0,
          haeftelse: inp.haeftelseEf ?? 0,
          betalingPrMio: inp.betalingPrMio,
          targetRoePct: inp.targetRoe ? inp.targetRoe * 100 : undefined,
        }}
      />
    </div>
  );
}

function TabLink({ id, tab, active, label }: { id: string; tab: Tab; active: Tab; label: string }) {
  const isActive = active === tab;
  return (
    <Link
      href={`/leads/${id}?tab=${tab}`}
      className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
        isActive ? 'border-slate-900 font-semibold text-slate-900' : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
    </Link>
  );
}

type Property = {
  bfeNumber: string | null;
  kvm: number | null;
  rooms: string | null;
  yearBuilt: number | null;
  energyClass: string | null;
  ownerName: string | null;
  ownerKind: string | null;
  ownerAddress: string | null;
  livesInProperty: boolean | null;
  lastSalePrice: number | null;
  lastSaleDate: Date | null;
  grundskyldKr: number | null;
  associationId: string | null;
} | null;

function OversigtTab({ lead, property }: { lead: Lead; property: Property }) {
  // Foretrek property-data (rigest), fall-back til lead-snapshot
  const kvm = property?.kvm ?? lead.kvm;
  const rooms = property?.rooms ?? lead.rooms;
  const yearBuilt = property?.yearBuilt ?? lead.yearBuilt;
  const lastSalePrice = property?.lastSalePrice ?? null;
  const lastSaleDate = property?.lastSaleDate ?? null;

  const fields: [string, string | number | null][] = [
    ['Email', lead.email],
    ['Telefon', lead.phone],
    ['Adresse', lead.address],
    ['Postnr / By', `${lead.postalCode || ''} ${lead.city || ''}`.trim() || null],
    ['Boligtype', lead.propertyType],
    ['Boligareal (m²)', kvm],
    ['Værelser', rooms ? Number(rooms) : null],
    ['Byggeår', yearBuilt],
    ['Energimærke', property?.energyClass ?? null],
    ['Sidst handelspris', lastSalePrice ? `${lastSalePrice.toLocaleString('da-DK')} kr` : null],
    ['Sidst handelsdato', lastSaleDate ? lastSaleDate.toISOString().slice(0, 10) : null],
    ['Ejer', property?.ownerName ?? null],
    ['Ejertype', property?.ownerKind === 'company' ? 'Selskab' : property?.ownerKind === 'private' ? 'Privatperson' : null],
    ['Ejer adresse', property?.ownerAddress ?? null],
    ['Bor selv i lejligheden?', property?.livesInProperty === true ? 'Ja' : property?.livesInProperty === false ? 'Nej (udlejer)' : null],
    ['Grundskyld/år', property?.grundskyldKr ? `${property.grundskyldKr.toLocaleString('da-DK')} kr` : null],
    ['BFE-nummer', property?.bfeNumber ?? null],
    ['Listpris', lead.listPrice ? `${lead.listPrice.toLocaleString('da-DK')} kr` : null],
    ['Vurdering', lead.valuationDkk ? `${lead.valuationDkk.toLocaleString('da-DK')} kr` : null],
    ['Bud', lead.bidDkk ? `${lead.bidDkk.toLocaleString('da-DK')} kr (${lead.bidStatus || '—'})` : null],
    ['Stand', lead.conditionRating != null ? `${lead.conditionRating}/10` : null],
    ['Prioritet', '★'.repeat(lead.priority || 0) || null],
    ['Kilde', lead.source],
    ['Oprettet', lead.createdAt instanceof Date ? lead.createdAt.toISOString().slice(0, 16).replace('T', ' ') : String(lead.createdAt).slice(0, 16).replace('T', ' ')],
    ['Sidst opdateret', lead.updatedAt instanceof Date ? lead.updatedAt.toISOString().slice(0, 16).replace('T', ' ') : String(lead.updatedAt).slice(0, 16).replace('T', ' ')],
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
      {fields
        .filter(([, v]) => v != null && v !== '')
        .map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="col-span-2 font-medium">{value}</dd>
          </div>
        ))}
    </div>
  );
}

function KommunikationTab({ comms }: { comms: LeadCommunication[] }) {
  if (comms.length === 0) return <EmptyState>Ingen kommunikation endnu.</EmptyState>;
  return (
    <ul className="space-y-2">
      {comms.map((c) => (
        <li key={c.id} className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span
              className={`px-1.5 py-0.5 rounded ${
                c.type === 'email'
                  ? 'bg-blue-100 text-blue-800'
                  : c.type === 'phone'
                    ? 'bg-green-100 text-green-800'
                    : c.type === 'sms'
                      ? 'bg-purple-100 text-purple-800'
                      : c.type === 'letter'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
              }`}
            >
              {c.type}
            </span>
            <span>{c.direction === 'in' ? '← indkommet' : '→ udgående'}</span>
            <span className="ml-auto">
              {c.createdAt instanceof Date ? c.createdAt.toISOString().slice(0, 16).replace('T', ' ') : String(c.createdAt).slice(0, 16).replace('T', ' ')}
            </span>
          </div>
          {c.subject && <div className="font-medium text-sm">{c.subject}</div>}
          {c.body && <div className="text-sm text-slate-700 mt-1 whitespace-pre-line line-clamp-4">{c.body}</div>}
        </li>
      ))}
    </ul>
  );
}

function HistorikTab({ history }: { history: LeadStageHistoryRow[] }) {
  if (history.length === 0) return <EmptyState>Ingen stage-historik endnu.</EmptyState>;
  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-3 pl-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
          <div className="text-xs text-slate-500">
            {h.changedAt instanceof Date ? h.changedAt.toISOString().slice(0, 16).replace('T', ' ') : String(h.changedAt).slice(0, 16).replace('T', ' ')}
          </div>
          <div className="text-sm">
            {h.fromStage ? (
              <>
                <span className="text-slate-500">{h.fromStage}</span> → <span className="font-medium">{h.toStage}</span>
              </>
            ) : (
              <span className="font-medium">Oprettet i {h.toStage}</span>
            )}
          </div>
          {h.changedBy && <div className="text-xs text-slate-400">af {h.changedBy}</div>}
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
      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">Skrive-tilstand kommer i Uge 3.</div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-slate-400 text-center py-12 bg-white border border-slate-200 rounded-lg">{children}</div>
  );
}

function ConnectionWarning({ error }: { error: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900">Database ikke forbundet</h2>
      <p className="text-sm text-amber-800 mt-1">Udfyld <code className="bg-amber-100 px-1 rounded">.env.local</code> og genstart dev-server. Fejl: {error}</p>
    </div>
  );
}
