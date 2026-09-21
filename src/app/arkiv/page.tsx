/**
 * /arkiv — leads der er taget ud af pipelinen.
 *
 * Arkiverede leads er ikke slettet: kontaktoplysninger, mails, noter og
 * historik er intakte. Pipelinen skjuler bare stagen «arkiveret». Uden
 * denne side fandtes de kun via et direkte link.
 *
 * Et lead hentes tilbage fra sin egen side med «Flyt stage».
 */
import Link from 'next/link';
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const fmt = (d: Date | string) => (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

export default async function ArkivPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const soeg = q.trim();

  const rows = await db
    .select({
      id: leads.id,
      fullName: leads.fullName,
      address: leads.address,
      email: leads.email,
      phone: leads.phone,
      source: leads.source,
      stageChangedAt: leads.stageChangedAt,
    })
    .from(leads)
    .where(
      and(
        eq(leads.stageSlug, 'arkiveret'),
        isNull(leads.deletedAt),
        soeg
          ? or(ilike(leads.fullName, `%${soeg}%`), ilike(leads.address, `%${soeg}%`), ilike(leads.email, `%${soeg}%`))
          : undefined,
      ),
    )
    .orderBy(desc(leads.stageChangedAt));

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <Link href="/pipeline" className="text-sm text-slate-500 hover:text-slate-900">← Pipeline</Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Arkiv</h1>
          <p className="text-sm text-slate-500 mt-1">
            {rows.length} {soeg ? `arkiverede leads matcher «${soeg}»` : 'leads taget ud af pipelinen'} · intet er slettet.
            Hent et lead tilbage med «Flyt stage» på leadets side.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={soeg}
            placeholder="Søg navn, adresse eller mail"
            className="w-64 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm">Søg</button>
        </form>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            {soeg ? 'Ingen arkiverede leads matcher.' : 'Arkivet er tomt.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left font-semibold px-4 py-2.5">Navn</th>
                  <th className="text-left font-semibold px-3 py-2.5">Adresse</th>
                  <th className="text-left font-semibold px-3 py-2.5">Kontakt</th>
                  <th className="text-left font-semibold px-3 py-2.5">Kilde</th>
                  <th className="text-right font-semibold px-4 py-2.5">Arkiveret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/leads/${l.id}`} className="font-medium text-slate-900 hover:underline underline-offset-2">
                        {l.fullName || '(uden navn)'}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{l.address || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{l.email || l.phone || '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{l.source || '—'}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-500">{fmt(l.stageChangedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
