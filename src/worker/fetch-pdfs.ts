/**
 * Per-broker PDF-URL fetch worker.
 *
 * For hver broker har vi en specific fetcher der finder den direkte
 * salgsopstilling-URL fra mæglerens case-side. URL'en gemmes i
 * on_market_candidates.pdf_url så den kan downloades on-demand fra UI'en
 * eller af en separat parser-worker.
 *
 * Strategi per broker:
 *   realmaeglerne — server-side HTML fetch + regex (ingen JS-rendering nødvendig)
 *   edc, nybolig, danbolig, estate, ... — kommer senere
 *   home — separat email-flow worker
 */
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

interface FetchResult {
  ok: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * realmaeglerne: Hent salgsopstilling-link fra case-side.
 * URL-pattern: api.prod.realequity.dk/api/blobs/v2/datanodes/<guid>
 */
async function fetchRealmaeglernePdfUrl(caseUrl: string): Promise<FetchResult> {
  try {
    // Follow redirect (case_url er ofte en /301-redirect/?mgl=X&sagsnr=Y)
    const r = await fetch(caseUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const html = await r.text();
    // Find Salgsopstilling-link (ikke Energimærke)
    // Pattern: <a href="https://api.prod.realequity.dk/api/blobs/v2/datanodes/<guid>">Hent Salgsopstilling
    const re = /<a[^>]+href="(https:\/\/api\.prod\.realequity\.dk\/api\/blobs\/v2\/datanodes\/[a-f0-9-]+)"[^>]*>[^<]*Salgsopstilling/i;
    const m = html.match(re);
    if (!m) return { ok: false, error: 'Salgsopstilling-link ikke fundet på siden' };
    return { ok: true, pdfUrl: m[1] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const FETCHERS: Record<string, (caseUrl: string) => Promise<FetchResult>> = {
  realmaeglerne: fetchRealmaeglernePdfUrl,
};

export interface PdfFetchRunResult {
  broker: string | 'all';
  attempted: number;
  resolved: number;
  failed: number;
  errors: string[];
  durationSeconds: number;
}

export async function runPdfFetchJob(opts: {
  broker?: keyof typeof FETCHERS | 'all';
  limit?: number;
} = {}): Promise<PdfFetchRunResult> {
  const broker = opts.broker ?? 'all';
  const limit = opts.limit ?? 50;
  const start = Date.now();

  const brokers = broker === 'all' ? Object.keys(FETCHERS) : [broker];
  let attempted = 0, resolved = 0, failed = 0;
  const errors: string[] = [];

  for (const b of brokers) {
    const fetcher = FETCHERS[b];
    if (!fetcher) continue;

    const candidates = await db
      .select()
      .from(onMarketCandidates)
      .where(
        and(
          eq(onMarketCandidates.brokerKind, b),
          eq(onMarketCandidates.status, 'active'),
          isNull(onMarketCandidates.pdfUrl),
        ),
      )
      .limit(limit);

    for (const c of candidates) {
      attempted++;
      if (!c.caseUrl) {
        errors.push(`${c.sourceId}: no caseUrl`);
        failed++;
        continue;
      }
      const result = await fetcher(c.caseUrl);
      if (result.ok && result.pdfUrl) {
        await db
          .update(onMarketCandidates)
          .set({
            pdfUrl: result.pdfUrl,
            pdfStatus: 'url_known',
            pdfFetchAttempts: (c.pdfFetchAttempts || 0) + 1,
            pdfLastError: null,
            updatedAt: new Date(),
          })
          .where(eq(onMarketCandidates.id, c.id));
        resolved++;
      } else {
        await db
          .update(onMarketCandidates)
          .set({
            pdfFetchAttempts: (c.pdfFetchAttempts || 0) + 1,
            pdfLastError: result.error || 'unknown',
            updatedAt: new Date(),
          })
          .where(eq(onMarketCandidates.id, c.id));
        failed++;
        errors.push(`${c.sourceId}: ${result.error}`);
      }
    }
  }

  return {
    broker,
    attempted,
    resolved,
    failed,
    errors: errors.slice(0, 20),
    durationSeconds: Math.round((Date.now() - start) / 1000),
  };
}

export const SUPPORTED_BROKERS = Object.keys(FETCHERS);
