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
import { extractText, getDocumentProxy } from 'unpdf';
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
  costGrundfond: number;
  costVicevaert: number;
  costVedligeholdelse: number;
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

// "kr" prefix er optional og kan staa for/efter tallet, eller mangle helt.
// Tal-format: dansk format "1.234,56" eller "1.234" eller "1234".
// MELLEMRUM mellem keyword og number kan vaere op til 80 chars (label kan
// inkludere "(skoen) jf. seneste regnskab")
const NUM = '([\\d.,]+(?:[\\d]{3})*)';
const KR_OPT = '(?:kr\\.?\\s*)?';
const GAP = '[\\s\\S]{0,80}?';

export function parseSalgsopstilling(text: string): CostBreakdown {
  // Grundskyld / ejendomsskat — flere mulige labels
  const grundv = findInt(text,
    new RegExp(`Grundskyld(?:\\s*\\(ejendomsskat\\))?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Ejendomsskat${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  // Faellesudgifter — naesten alle danske salgsopstillinger har dette
  const faellesu = findInt(text,
    new RegExp(`F[æa]llesudgifter?(?:,?\\s*(?:anslået|jf\\.|inkl\\.?\\s*acontovand|i alt))?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Boligens? andel af f[æa]llesudgifter?${GAP}${KR_OPT}${NUM}`, 'i'),
    // Ejerforeningens fælles
    new RegExp(`Ejerforeningens? f[æa]llesudgifter?${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  const rotte = findInt(text,
    new RegExp(`Rottebek[æa]mpelse(?:sgebyr)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Rottegebyr${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  const renov = findInt(text,
    new RegExp(`(?:S[æa]rskilt\\s+)?[Rr]enovation(?:sgebyr)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Affaldsgebyr${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  // Forsikring kun hvis IKKE inkl. i fællesudgifter
  let forsikr = 0;
  const lower = text.toLowerCase();
  if (
    !lower.includes('inkl. i fællesudgifter') &&
    !lower.includes('medholdt fællesudgifterne') &&
    !lower.includes('inkl. acontovand') &&
    !lower.includes('inkluderet i fællesudgifter')
  ) {
    forsikr = findInt(text,
      new RegExp(`(?:Hus|Bygnings|Ejendoms)forsikring${GAP}${KR_OPT}${NUM}`, 'i'),
    );
  }

  const faellsl = findInt(text,
    new RegExp(`(?:Ydelse\\s+(?:p[åa]\\s+)?)?[Ff][æa]llesl[åa]n(?:\\s*\\+\\s*gebyr)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Andelsboligforeningens\\s+l[åa]n${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Ejerforeningens?\\s+(?:fælles)?l[åa]n${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  // NY: Grundfond / opsparing
  const grundfond = findInt(text,
    new RegExp(`Grundfond${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Henl[æa]ggelse(?:r)?(?:\\s+til\\s+grundfond)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Bidrag\\s+til\\s+grundfond${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  // NY: Vicevaert / serviceaftaler
  const vice = findInt(text,
    new RegExp(`Viceværts?(?:bidrag|udgift)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Ejendomsservice${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Trappevask${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  // NY: Vedligeholdelse / drift
  const vedlig = findInt(text,
    new RegExp(`Vedligeholdelse(?:sbidrag)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Henl[æa]ggelse(?:r)?\\s+til\\s+vedligeholdelse${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  const andreD = findInt(text,
    new RegExp(`Arbejdsdag${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Antenne(?:bidrag|forening)?${GAP}${KR_OPT}${NUM}`, 'i'),
    new RegExp(`Internet${GAP}${KR_OPT}${NUM}`, 'i'),
  );

  return {
    costGrundvaerdi: grundv,
    costFaellesudgifter: faellesu,
    costRottebekempelse: rotte,
    costRenovation: renov,
    costForsikringer: forsikr,
    costFaelleslaan: faellsl,
    costGrundfond: grundfond,
    costVicevaert: vice,
    costVedligeholdelse: vedlig,
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
      const pdf = await getDocumentProxy(new Uint8Array(pdfBytes));
      const { text } = await extractText(pdf, { mergePages: true });
      const fullText = Array.isArray(text) ? text.join('\n') : text;
      const breakdown = parseSalgsopstilling(fullText);

      // Recompute afkast med ny breakdown (alle 10 cost-felter)
      const driftTotal =
        breakdown.costGrundvaerdi +
        breakdown.costFaellesudgifter +
        breakdown.costRottebekempelse +
        breakdown.costRenovation +
        breakdown.costForsikringer +
        breakdown.costFaelleslaan +
        breakdown.costGrundfond +
        breakdown.costVicevaert +
        breakdown.costVedligeholdelse +
        breakdown.costAndreDrift;
      const refurbTotal =
        c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
      const afk = computeAfkast({
        rentMd: c.estimeretLejeMd ?? 0,
        pris: c.listPrice,
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
