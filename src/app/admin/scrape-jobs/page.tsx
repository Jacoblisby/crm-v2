/**
 * /admin/scrape-jobs — viser sidste 50 scrape-runs.
 *
 * TODO når auth er sat op: kræv login + admin role.
 */
import { db } from '@/lib/db/client';
import { scrapeJobs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ScrapeJobsPage() {
  const jobs = await db
    .select()
    .from(scrapeJobs)
    .orderBy(desc(scrapeJobs.startedAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Scrape-jobs</h1>
        <p className="text-sm text-slate-500">
          {jobs.length} seneste runs. Cron triggeres nightly via Coolify scheduled task.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Started</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Kind</th>
              <th className="px-3 py-2 font-medium">Postnr</th>
              <th className="px-3 py-2 font-medium text-right">Scraped</th>
              <th className="px-3 py-2 font-medium text-right">New</th>
              <th className="px-3 py-2 font-medium text-right">Updated</th>
              <th className="px-3 py-2 font-medium text-right">Sold</th>
              <th className="px-3 py-2 font-medium text-right">Varighed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                  Ingen runs endnu. Trigger med POST /api/cron/scrape (auth: Bearer CRON_SECRET).
                </td>
              </tr>
            ) : (
              jobs.map((j) => {
                const dur = j.finishedAt
                  ? Math.round((new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()) / 1000)
                  : null;
                return (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {new Date(j.startedAt).toLocaleString('da-DK')}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-600">{j.runKind}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {(j.postnrCodes as string[]).join(', ')}
                    </td>
                    <td className="px-3 py-2 text-right">{j.listingsScraped}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{j.listingsNew || ''}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{j.listingsUpdated || ''}</td>
                    <td className="px-3 py-2 text-right text-amber-700">{j.listingsMarkedSold || ''}</td>
                    <td className="px-3 py-2 text-right text-slate-500 text-xs">
                      {dur != null ? `${dur}s` : '–'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {jobs[0]?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <strong>Sidste fejl:</strong>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{jobs[0].error}</pre>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{status}</span>;
}
