/**
 * On-market — viser scrappede listings fra Boligsiden 4700 Næstved.
 * I Uge 1-2: viser POC-data fra ~/Desktop/CRM-v2-poc/manifest.json som demo.
 * I Uge 5: trækker fra on_market_candidates Supabase-tabel.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

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

export default function OnMarketPage() {
  const manifestPath = path.join(os.homedir(), 'Desktop/CRM-v2-poc/manifest.json');
  let manifest: Manifest | null = null;
  let error: string | null = null;

  try {
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } else {
      error = `Manifest ikke fundet: ${manifestPath}`;
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (!manifest) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">On-market</h1>
        <p className="text-sm text-slate-500 mb-4">Boligsiden 4700 Næstved · ejerlejligheder</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <strong>Manifest ikke tilgængelig.</strong> {error}
        </div>
      </div>
    );
  }

  const listings = Object.entries(manifest.listings)
    .map(([slug, l]) => ({ slug, ...l }))
    .sort((a, b) => (b.monthly_expense || 0) / (b.kvm || 1) - (a.monthly_expense || 0) / (a.kvm || 1));

  const downloaded = listings.filter(l => l.pdf_status === 'downloaded').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">On-market</h1>
      <p className="text-sm text-slate-500 mb-4">
        {listings.length} listings i 4700 Næstved · {downloaded} med salgsopstilling hentet
      </p>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Adresse</th>
                <th className="px-3 py-2 font-medium">m²</th>
                <th className="px-3 py-2 font-medium text-right">Pris</th>
                <th className="px-3 py-2 font-medium text-right">Ejerudg/md</th>
                <th className="px-3 py-2 font-medium">Mægler</th>
                <th className="px-3 py-2 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map(l => (
                <tr key={l.slug} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.address}</div>
                    <div className="text-xs text-slate-500">Case #{l.case_number}</div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.kvm}</td>
                  <td className="px-3 py-2 text-right">{l.price_cash?.toLocaleString('da-DK') || '—'}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{l.monthly_expense?.toLocaleString('da-DK') || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {l.broker_kind}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <PdfStatus status={l.pdf_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Data fra POC-manifest ({manifest.updated.slice(0, 10)}). Uge 5: migreres til <code>on_market_candidates</code>-tabel.
      </p>
    </div>
  );
}

function PdfStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    downloaded: 'bg-green-100 text-green-700 border-green-200',
    pending_email: 'bg-amber-100 text-amber-700 border-amber-200',
    pending_login: 'bg-blue-100 text-blue-700 border-blue-200',
    missing: 'bg-slate-100 text-slate-500 border-slate-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
  };
  const label: Record<string, string> = {
    downloaded: '✓ hentet',
    pending_email: '⏳ email',
    pending_login: '🔑 login',
    missing: 'mangler',
    failed: '✗ fejlet',
  };
  const cls = styles[status] || 'bg-slate-100 text-slate-500';
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>
      {label[status] || status}
    </span>
  );
}
