/**
 * PDF-parse worker.
 *
 * For en on_market_candidate hvor pdf_url er sat men cost-breakdown er tom:
 *   1. Download PDF (memory-only, ingen lokal lagring)
 *   2. Extract text via pdf-parse
 *   3. Match danske salgsopstilling-regex (porteret fra POC's parse_and_update.py)
 *   4. Skriv breakdown til DB-kolonner
 *   5. Recompute afkast via computeAfkast() — opdater bid_dkk + margin_pct
 *
 * Triggeres automatisk fra setPdfUrlAction OG via cron 04:30.
 */
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { PDFParse } from 'pdf-parse';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

interface CostBreakdown {
  costGrundvaerdi: number;
  costFaellesudgifter: number;
  costRottebekempelse: number;
  costRenovation: number;
  costForsikringer: number;
  costFaelleslaan: number;
  costAndreDrift: number;
}

function findInt(text: string, ...patterns: RegExp[]): number {
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const s = m[1].replace(/\./g, '').replace(/,/g, '.');
      const n = parseFloat(s);
      if (!Number.isNaN(n)) return Math.round(n);
    }
  }
  return 0;
}

export function parseSalgsopstilling(text: string): CostBreakdown {
  const grundv = findInt(text,
    /Grundskyld[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    /Grundskyld\s+([\d.,]+)/,
  );
  const faellesu = findInt(text,
    /Fællesudgifter?,?\s*(?:anslået|inkl\.?\s*acontovand)?[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    /Fællesudgifter?\s+([\d.,]+)/,
  );
  const rotte = findInt(text,
    /Rottebekæmpelse(?:sgebyr)?,?\s*(?:anslået)?[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    /Rottegebyr[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
  );
  const renov = findInt(text,
    /(?:Særskilt\s+)?[Rr]enovation,?\s*(?:anslået)?[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    /Renovation\s+([\d.,]+)/,
  );
  // Forsikring kun hvis IKKE inkl. i fællesudgifter
  let forsikr = 0;
  const lower = text.toLowerCase();
  if (
    !lower.includes('inkl. i fællesudgifter') &&
    !lower.includes('medholdt fællesudgifterne') &&
    !lower.includes('inkl. acontovand')
  ) {
    forsikr = findInt(text,
      /(?:Husforsikring|Bygningsforsikring)[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    );
  }
  const faellsl = findInt(text,
    /(?:Ydelse\s+)?[Ff]ælleslån(?:\s*\+\s*gebyr)?[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
    /Andelsboligforeningens\s+lån[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
  );
  const andreD = findInt(text,
    /Arbejdsdag[^\n]{0,30}?kr\.?\s*([\d.,]+)/,
  );

  return {
    costGrundvaerdi: grundv,
    costFaellesudgifter: faellesu,
    costRottebekempelse: rotte,
    costRenovation: renov,
    costForsikringer: forsikr,
    costFaelleslaan: faellsl,
    costAndreDrift: andreD,
  };
}

async function fetchPdfBytes(url: string): Promise<Buffer> {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`PDF download failed: HTTP ${r.status}`);
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

export interface ParsePdfRunResult {
  attempted: number;
  parsed: number;
  failed: number;
  errors: string[];
  durationSeconds: number;
}

/**
 * Process all listings hvor pdf_url er sat men cost-breakdown er tom.
 * Eller specifikt én listing hvis id er givet.
 */
export async function runParsePdfJob(opts: {
  listingId?: string;
  limit?: number;
} = {}): Promise<ParsePdfRunResult> {
  const limit = opts.limit ?? 20;
  const start = Date.now();
  let attempted = 0, parsed = 0, failed = 0;
  const errors: string[] = [];

  // Find candidates: pdf_url set, AND (no cost breakdown OR forced re-parse)
  const candidates = opts.listingId
    ? await db
        .select()
        .from(onMarketCandidates)
        .where(eq(onMarketCandidates.id, opts.listingId))
    : await db
        .select()
        .from(onMarketCandidates)
        .where(
          and(
            eq(onMarketCandidates.status, 'active'),
            isNotNull(onMarketCandidates.pdfUrl),
            // Cost breakdown empty (sum = 0)
            sql`COALESCE(${onMarketCandidates.costGrundvaerdi},0) +
                COALESCE(${onMarketCandidates.costFaellesudgifter},0) +
                COALESCE(${onMarketCandidates.costFaelleslaan},0) +
                COALESCE(${onMarketCandidates.costRenovation},0) = 0`,
          ),
        )
        .limit(limit);

  for (const c of candidates) {
    if (!c.pdfUrl) continue;
    attempted++;
    try {
      const pdfBytes = await fetchPdfBytes(c.pdfUrl);
      const parser = new PDFParse({ data: pdfBytes });
      const data = await parser.getText();
      const breakdown = parseSalgsopstilling(data.text);

      // Recompute afkast med ny breakdown
      const driftTotal =
        breakdown.costGrundvaerdi +
        breakdown.costFaellesudgifter +
        breakdown.costRottebekempelse +
        breakdown.costRenovation +
        breakdown.costForsikringer +
        breakdown.costFaelleslaan +
        breakdown.costAndreDrift;
      const refurbTotal =
        c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
      const afk = computeAfkast({
        rentMd: c.estimeretLejeMd ?? 0,
        listePris: c.listPrice,
        forhandletPris: c.forhandletPris ?? null,
        driftTotal,
        refurbTotal,
      });

      await db
        .update(onMarketCandidates)
        .set({
          ...breakdown,
          bidDkk: afk.budAt20PctRoe,
          marginPct: afk.roeNettoPct.toString(),
          afkastCalculatedAt: new Date(),
          pdfStatus: 'parsed',
          pdfDownloadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onMarketCandidates.id, c.id));
      parsed++;
    } catch (err) {
      failed++;
      const m = err instanceof Error ? err.message : String(err);
      errors.push(`${c.sourceId}: ${m.slice(0, 200)}`);
      await db
        .update(onMarketCandidates)
        .set({
          pdfFetchAttempts: (c.pdfFetchAttempts || 0) + 1,
          pdfLastError: m.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(onMarketCandidates.id, c.id));
    }
  }

  return {
    attempted,
    parsed,
    failed,
    errors: errors.slice(0, 20),
    durationSeconds: Math.round((Date.now() - start) / 1000),
  };
}
