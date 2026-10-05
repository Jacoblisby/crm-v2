/**
 * Pipeline — kanban-view af alle aktive leads.
 * Mirror af Loveable's pipeline. READ-ONLY i Uge 1-2.5 (drag-drop kommer i Uge 3).
 */
import Link from 'next/link';
import { listLeadsForPipeline, listPipelineStages } from '@/lib/db/queries';
import { computeSLA, slaBadgeColor } from '@/lib/sla';
import type { Lead, PipelineStage } from '@/lib/types';
import { bookingStatus } from '@/lib/besigtigelse-plan';
import { udkastOversigt, skalParkeres, type LeadUdkast } from '@/lib/udkast';
import { antalFotos } from '@/lib/fotos';
import { antalUplacerede } from '@/lib/uplaceret';
import { budRunder, flyt, flytEfterBooking, HANDLING, sikrStadier } from '@/lib/pipeline-stages';
import { tidTekst } from '@/lib/besigtigelse';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  let stages: PipelineStage[];
  let rows: Awaited<ReturnType<typeof listLeadsForPipeline>>;
  let booking: Map<string, LeadUdkast>;
  let fotos = new Map<string, number>();

  let bud = new Map<string, number>();
  let uplacerede = 0;

  try {
    // Stadierne skrives og leads flyttes efter, hvad der faktisk er sket
    // (booking sendt, tid bekræftet, besigtigelse overstået) — før tavlen
    // tegnes, så kortene står det rigtige sted med det samme.
    await sikrStadier();
    await flytEfterBooking(await bookingStatus()).catch((e) =>
      console.warn('[pipeline] kunne ikke flytte leads:', e),
    );

    // Tre opfølgninger uden svar: leadet parkeres, så tavlen kun viser det,
    // der stadig er i spil.
    for (const id of await skalParkeres().catch(() => [])) {
      await flyt(id, 'besigtigelse-foreslaaet', 'vil-ikke-saelge-nu', 'automatik');
    }

    [stages, rows, booking] = await Promise.all([
      listPipelineStages(),
      listLeadsForPipeline(),
      udkastOversigt().catch(() => new Map<string, LeadUdkast>()),
    ]);
    uplacerede = await antalUplacerede().catch(() => 0);
    const ids = rows.map((r) => r.lead.id);
    [fotos, bud] = await Promise.all([
      antalFotos(ids).catch(() => new Map<string, number>()),
      budRunder(ids).catch(() => new Map<string, number>()),
    ]);
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
      {uplacerede > 0 && (
        <Link href="/admin/uplacerede" className="inline-block mb-3 text-sm px-3 py-1.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 font-medium">
          ✉️ {uplacerede} {uplacerede === 1 ? 'svar' : 'svar'} fra kunder kunne ikke placeres. Se dem
        </Link>
      )}

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {visibleStages.map((stage) => (
          <Column key={stage.slug} stage={stage} leads={byStage.get(stage.slug) || []} booking={booking} fotos={fotos} bud={bud} />
        ))}
      </div>
    </div>
  );
}

function Column({ stage, leads, booking, fotos, bud }: { stage: PipelineStage; leads: Lead[]; booking: Map<string, LeadUdkast>; fotos: Map<string, number>; bud: Map<string, number> }) {
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
              <Maerke lead={lead} stage={stage.slug} booking={booking.get(lead.id)} runder={bud.get(lead.id) ?? 0} />
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
      {HANDLING[stage.slug] && (
        <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">{HANDLING[stage.slug]}</div>
      )}
    </div>
  );
}

const DAG = 24 * 60 * 60_000;

/**
 * Det ene, der er værd at vide om kortet her og nu. Rækkefølgen er
 * vigtigst først: et svar skal ses før en påmindelse om at følge op.
 */
function Maerke({
  lead,
  stage,
  booking,
  runder,
}: {
  lead: Lead;
  stage: string;
  booking: LeadUdkast | undefined;
  runder: number;
}) {
  const linje = (tekst: string, farve: string) => <div className={`mt-1.5 text-[11px] font-medium ${farve}`}>{tekst}</div>;

  // Er der et udkast, er DET næste handling — uanset hvad kortet ellers
  // kunne fortælle.
  const u = booking?.udkast;
  if (u) {
    switch (u.type) {
      case 'booking':
        return linje('📝 Booking-udkast klar', 'text-amber-800');
      case 'opfoelgning1':
      case 'opfoelgning2':
      case 'opfoelgning3':
        return linje(`⏰ Følg op (${u.type.slice(-1)} af 3)`, 'text-rose-700');
      case 'bekraeftelse':
        return linje('💬 Har svaret — bekræft tiden', 'text-teal-800');
      case 'paamindelse':
        return linje('🔔 Mind om i morgen', 'text-amber-800');
      case 'tak-for-besoeget':
        return linje('📝 Tak for besøget', 'text-amber-800');
      case 'bud':
        return linje('💰 Send buddet', 'text-amber-800');
      case 'bud-opfoelgning':
        return linje('⏰ Følg op på buddet', 'text-rose-700');
      case 'maanedlig':
      case 'kvartal':
        return linje('🔔 Tid til at skrive', 'text-rose-700');
      case 'handlen':
        return linje('📝 Send «Sådan foregår handlen»', 'text-amber-800');
    }
  }

  if (booking?.svar) return linje('💬 Kunden har svaret', 'text-teal-800');
  if (stage === 'besigtigelse-aftalt' && booking?.sendt?.tid)
    return linje(`📅 ${tidTekst(booking.sendt.tid)}`, 'text-slate-700');
  if (stage === 'besigtigelse-foreslaaet' && booking?.sendt) {
    const dage = Math.floor((Date.now() - booking.sendt.sendtAt.getTime()) / DAG);
    return linje(`📤 Sendt ${dage === 0 ? 'i dag' : dage === 1 ? 'i går' : `for ${dage} dage siden`}`, 'text-slate-500');
  }
  if (stage === 'bud-afgivet' && lead.bidDkk)
    return linje(`💰 Bud ${Math.max(1, runder)}: ${Math.round(lead.bidDkk / 1000).toLocaleString('da-DK')}k kr`, 'text-slate-700');
  if (stage === 'ikke-enige-om-pris' || stage === 'vil-ikke-saelge-nu') {
    const dage = Math.floor((Date.now() - new Date(lead.stageChangedAt).getTime()) / DAG);
    const om = (stage === 'ikke-enige-om-pris' ? 30 : 90) - dage;
    return om > 0 ? linje(`🗓 Skriver igen om ${om} dage`, 'text-slate-500') : null;
  }
  return null;
}

function ConnectionWarning({ error }: { error: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="font-semibold text-amber-900">Database ikke forbundet</h2>
      <p className="text-sm text-amber-800 mt-1">Se Inbox-siden for setup-instruktioner. Fejl: {error}</p>
    </div>
  );
}
