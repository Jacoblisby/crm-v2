/**
 * On-market — viser kandidater fra Boligsiden 4700 Næstved.
 * Læser fra on_market_candidates-tabellen. Falder tilbage til POC-manifest
 * som demo-data hvis tabellen er tom (Uge 5 fylder den).
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import Link from 'next/link';
import { listActiveOnMarketCandidates } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

interface ManifestListing {
  address: string;
  city: string;
  case_url: string;
  realtor_name: string;
  broker_kind: string;
  case_number: number | null;
  monthly_expense: number | null;
  price_cash: number | null;
  kvm: number | null;
  rooms: number | null;
  year_built: number | null;
  pdf_filename: string | null;
  pdf_status: string;
  pdf_downloaded_at: string | null;
}

interface Manifest {
  updated: string;
  listings: Record<string, ManifestListing>;
}

interface OnMarketRow {
  key: string;
  id?: string;
  address: string;
  brokerKind: string | null;
  kvm: number | null;
  listPrice: number | null;
  monthlyExpense: number | null;
  pdfStatus: string;
  caseNumber?: number | null;
  bidDkk?: number | null;
  marginPct?: number | null;
  dage?: number | null;
}

export default async function OnMarketPage() {
  // Først: forsøg at læse fra DB. Hvis det fejler eller er tomt, fald tilbage til POC.
  let dbRows: OnMarketRow[] = [];
  let dbError: string | null = null;
  try {
    const candidates = await listActiveOnMarketCandidates();
    dbRows = candidates.map((c) => ({
      key: c.id,
      id: c.id,
      address: c.address,
      brokerKind: c.brokerKind,
      kvm: c.kvm,
      listPrice: c.listPrice,
      monthlyExpense: c.monthlyExpense,
      pdfStatus: c.pdfStatus,
      bidDkk: c.bidDkk,
      marginPct: c.marginPct ? Number(c.marginPct) : null,
      dage: c.firstSeenAt
        ? Math.floor((Date.now() - new Date(c.firstSeenAt).getTime()) / 86_400_000)
        : null,
    }));
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  // Fallback: POC-manifest hvis DB tom eller fejlet
  let pocRows: OnMarketRow[] = [];
  let pocUpdated: string | null = null;
  let pocError: string | null = null;
  if (dbRows.length === 0) {
    const manifestPath = path.join(os.homedir(), 'Desktop/CRM-v2-poc/manifest.json');
    try {
      if (fs.existsSync(manifestPath)) {
        const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        pocUpdated = manifest.updated;
        pocRows = Object.entries(manifest.listings).map(([slug, l]) => ({
          key: slug,
          address: l.address,
          brokerKind: l.broker_kind,
          kvm: l.kvm,
          listPrice: l.price_cash,
          monthlyExpense: l.monthly_expense,
          pdfStatus: l.pdf_status,
          caseNumber: l.case_number,
        }));
      } else {
        pocError = `POC-manifest ikke fundet: ${manifestPath}`;
      }
    } catch (e) {
      pocError = e instanceof Error ? e.message : String(e);
    }
  }

  const unsortedRows = dbRows.length > 0 ? dbRows : pocRows;
  const isPocFallback = dbRows.length === 0 && pocRows.length > 0;
  const downloaded = unsortedRows.filter((r) => r.pdfStatus === 'downloaded').length;
  // Sortér efter ROE Netto faldende (rows uden ROE i bunden)
  const rows = [...unsortedRows].sort((a, b) => {
    const ar = a.marginPct ?? -Infinity;
    const br = b.marginPct ?? -Infinity;
    return br - ar;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">On-market</h1>
      <p className="text-sm text-slate-500 mb-4">
        {rows.length} listings · {downloaded} med salgsopstilling hentet
        {isPocFallback && ' · viser POC-data (DB-tabel er tom indtil Uge 5)'}
      </p>

      {rows.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <strong>Ingen listings.</strong>
          {dbError && <div className="text-xs mt-1">DB-fejl: {dbError}</div>}
          {pocError && <div className="text-xs mt-1">POC-fejl: {pocError}</div>}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Adresse</th>
                  <th className="px-3 py-2 font-medium text-center">Dage</th>
                  <th className="px-3 py-2 font-medium">m²</th>
                  <th className="px-3 py-2 font-medium text-right">Pris</th>
                  <th className="px-3 py-2 font-medium text-right">Bud (20% ROE)</th>
                  <th className="px-3 py-2 font-medium text-right">ROE Netto</th>
                  <th className="px-3 py-2 font-medium text-right">Ejerudg/md</th>
                  <th className="px-3 py-2 font-medium">Mægler</th>
                  <th className="px-3 py-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      {r.id ? (
                        <Link href={`/on-market/${r.id}`} className="font-medium text-blue-700 hover:underline">
                          {r.address}
                        </Link>
                      ) : (
                        <div className="font-medium">{r.address}</div>
                      )}
                      {r.caseNumber != null && <div className="text-xs text-slate-500">Case #{r.caseNumber}</div>}
                    </td>
                    <td className="px-3 py-2 text-center"><DageBadge dage={r.dage} /></td>
                    <td className="px-3 py-2 text-slate-600">{r.kvm ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{r.listPrice?.toLocaleString('da-DK') || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {r.bidDkk ? (
                        <span className="font-medium text-emerald-700">{r.bidDkk.toLocaleString('da-DK')}</span>
                      ) : (
                        <span className="text-xs text-slate-400">ikke nået</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <RoeBadge pct={r.marginPct} />
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{r.monthlyExpense?.toLocaleString('da-DK') || '—'}</td>
                    <td className="px-3 py-2">
                      {r.brokerKind && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{r.brokerKind}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <PdfStatus status={r.pdfStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPocFallback && pocUpdated && (
        <p className="text-xs text-slate-400 mt-3">
          Data fra POC-manifest ({pocUpdated.slice(0, 10)}). Uge 5: migreres til <code>on_market_candidates</code>-tabel.
        </p>
      )}
    </div>
  );
}

function DageBadge({ dage }: { dage: number | null | undefined }) {
  if (dage == null) return <span className="text-slate-400 text-xs">—</span>;
  const cls =
    dage < 14 ? 'bg-emerald-100 text-emerald-700'
      : dage < 60 ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>{dage} d</span>;
}

function RoeBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null) return <span className="text-slate-400">—</span>;
  // Færge-skala: ≥10% grøn, 5-10% gul, <5% rød
  let cls = 'text-red-700';
  if (pct >= 10) cls = 'text-emerald-700 font-semibold';
  else if (pct >= 5) cls = 'text-amber-700';
  return <span className={cls}>{pct.toFixed(1)}%</span>;
}

function PdfStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    downloaded: 'bg-green-100 text-green-700 border-green-200',
    pending_email: 'bg-amber-100 text-amber-700 border-amber-200',
    pending_login: 'bg-blue-100 text-blue-700 border-blue-200',
    missing: 'bg-slate-100 text-slate-500 border-slate-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const label: Record<string, string> = {
    downloaded: '✓ hentet',
    pending_email: '⏳ email',
    pending_login: '🔑 login',
    missing: 'mangler',
    failed: '✗ fejlet',
    pending: 'venter',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-500';
  return <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{label[status] || status}</span>;
}
