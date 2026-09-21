/**
 * /admin/ryd-pipeline — oprydningen fra 21.09.2026, med forhåndsvisning.
 *
 * Viser hvad der bliver stående, hvad der flyttes, og hvad der arkiveres —
 * slået op i databasen nu, så siden også viser det, når oprydningen er kørt.
 */
import Link from 'next/link';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import data from './data.json';
import { RydKnap } from './Knap';

export const dynamic = 'force-dynamic';

export default async function RydPipelinePage() {
  const alle = [...data.behold, ...data.arkiver.map((a) => a.id)];
  const nu = await db
    .select({ id: leads.id, fullName: leads.fullName, address: leads.address, stageSlug: leads.stageSlug, deletedAt: leads.deletedAt })
    .from(leads)
    .where(inArray(leads.id, alle));
  const status = new Map(nu.map((l) => [l.id, l]));

  const behold = data.behold.map((id) => status.get(id)).filter(Boolean);
  const venter = data.arkiver.filter((a) => {
    const l = status.get(a.id);
    return l && !l.deletedAt && l.stageSlug !== 'arkiveret' && l.stageSlug !== 'koebt';
  });
  const udfoert = data.arkiver.length - venter.length;

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-900">← Pipeline</Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-2">Ryd pipelinen</h1>
        <p className="text-sm text-slate-500 mt-1">
          Besluttet 21.09.2026. Seks leads bliver i Ny lead, købte leads bliver stående, resten arkiveres.
          Arkiverede leads forsvinder fra pipelinen, men mails, noter og historik bevares. De ligger bagefter
          under <Link href="/arkiv" className="underline underline-offset-2">Arkiv</Link> og kan flyttes tilbage.
        </p>
      </header>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Bliver i Ny lead ({behold.length})</h2>
        <ul className="text-sm divide-y divide-slate-100">
          {behold.map((l) => (
            <li key={l!.id} className="py-1.5 flex justify-between gap-3">
              <Link href={`/leads/${l!.id}`} className="font-medium text-slate-900 hover:underline">{l!.fullName}</Link>
              <span className="text-slate-500 truncate">{l!.address}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {data.tilNyLead.includes(l!.id) && l!.stageSlug !== 'ny-lead' ? `${l!.stageSlug} → ny-lead` : l!.stageSlug}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-2">Købte leads røres ikke.</p>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Arkiveres ({venter.length})</h2>
          {udfoert > 0 && (
            <Link href="/arkiv" className="text-xs text-teal-800 hover:underline">
              {udfoert} arkiveret — se dem i Arkiv →
            </Link>
          )}
        </div>
        <RydKnap antal={venter.length} />
        {venter.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-slate-600 cursor-pointer">Vis de {venter.length} leads</summary>
            <ul className="text-sm divide-y divide-slate-100 mt-2 max-h-96 overflow-y-auto">
              {venter.map((a) => (
                <li key={a.id} className="py-1 flex justify-between gap-3">
                  <span className="text-slate-800">{a.navn || '—'}</span>
                  <span className="text-slate-500 truncate">{a.adresse}</span>
                  <span className="text-xs text-slate-400 shrink-0">{a.stage}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
