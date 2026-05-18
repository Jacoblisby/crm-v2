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

/**
 * Find amount efter label i salgsopstilling.
 *
 * Salgsopstilling-table-rows har dette format efter PDF text-extract:
 *   "Ejendomsvaerdiskat 2026 2.190,96"
 *   "Grundskyld 2026 1.271,00"
 *   "Fællesudgifter 2026 13.752,00"
 *   "Rottebekæmpelse 2026 99,21"
 *   "Ejerudgift i alt 1. år: 17.313,17"
 *
 * Strategy: STRIKT TABEL-MATCH foerst
 *   1. Soeg efter `<label> <year> <amount>` pattern (label efterfulgt af aarstal og beloeb)
 *   2. Fallback: `<label> kr <amount>` (linjer uden aarskolonne)
 *   3. Fallback: `<label>: <amount>` med kolon-separator
 *   4. Hvis intet match: return 0
 *
 * Vi tager IKKE FOERSTE amount efter label, fordi label appears multiple times
 * i forskellige sammenhænge (fx "Grundlag for grundskyld: 181.600" foer den
 * faktiske "Grundskyld 2026 1.271,00" table-row).
 */
function findAmountAfter(text: string, ...labels: string[]): number {
  for (const labelPattern of labels) {
    // Pattern 1: <label> <YEAR> <amount> — table-row format
    const tablePattern = new RegExp(
      `${labelPattern}\\s+(?:20\\d{2})\\s+([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'i',
    );
    const tableMatch = text.match(tablePattern);
    if (tableMatch && tableMatch[1]) {
      const val = parseAmount(tableMatch[1]);
      if (val > 0) return val;
    }

    // Pattern 2: <label> kr. <amount> — explicit kr-format
    const krPattern = new RegExp(
      `${labelPattern}[^\\n]{0,30}?kr\\.?\\s*([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'i',
    );
    const krMatch = text.match(krPattern);
    if (krMatch && krMatch[1]) {
      const val = parseAmount(krMatch[1]);
      if (val > 0 && !isYearLike(val, krMatch[1])) return val;
    }

    // Pattern 3: <label>: <amount> — kolon-separator format
    const colonPattern = new RegExp(
      `${labelPattern}:\\s*([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'i',
    );
    const colonMatch = text.match(colonPattern);
    if (colonMatch && colonMatch[1]) {
      const val = parseAmount(colonMatch[1]);
      if (val > 0 && !isYearLike(val, colonMatch[1])) return val;
    }
  }
  return 0;
}

function parseAmount(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(normalized);
  if (Number.isNaN(val) || val <= 0) return 0;
  if (val > 10_000_000) return 0;
  return Math.round(val);
}

function isYearLike(val: number, raw: string): boolean {
  return val >= 2015 && val <= 2035 && !raw.includes(',') && !raw.includes('.');
}

export function parseSalgsopstilling(text: string): CostBreakdown {
  // Grundskyld — KUN grundskyld, IKKE ejendomsvaerdiskat.
  // Ejendomsvaerdiskat betales kun af ejer-bebooere, ikke ved udlejning. Vi
  // koeber boliger til udlejning, saa ejdvaerdiskat er ikke en cost for os.
  const grundv = findAmountAfter(text,
    'Grundskyld(?:\\s*\\(ejendomsskat\\))?',
  );

  const faellesu = findAmountAfter(text,
    'F[æa]llesudgifter?(?:,?\\s*(?:anslået|jf\\.|inkl\\.?\\s*acontovand|i alt))?',
    'Boligens? andel af f[æa]llesudgifter?',
    'Ejerforeningens? f[æa]llesudgifter?',
  );

  const rotte = findAmountAfter(text,
    'Rottebek[æa]mpelse(?:sgebyr)?',
    'Rottegebyr',
  );

  const renov = findAmountAfter(text,
    '(?:S[æa]rskilt\\s+)?[Rr]enovation(?:sgebyr)?',
    'Affaldsgebyr',
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
    forsikr = findAmountAfter(text,
      '(?:Hus|Bygnings|Ejendoms)forsikring',
    );
  }

  const faellsl = findAmountAfter(text,
    '(?:Ydelse\\s+(?:p[åa]\\s+)?)?[Ff][æa]llesl[åa]n(?:\\s*\\+\\s*gebyr)?',
    'Andelsboligforeningens\\s+l[åa]n',
    'Ejerforeningens?\\s+(?:fælles)?l[åa]n',
  );

  const grundfond = findAmountAfter(text,
    'Grundfond',
    'Henl[æa]ggelse(?:r)?(?:\\s+til\\s+grundfond)?',
    'Bidrag\\s+til\\s+grundfond',
  );

  const vice = findAmountAfter(text,
    'Vicev[æa]rts?(?:bidrag|udgift)?',
    'Ejendomsservice',
    'Trappevask',
  );

  const vedlig = findAmountAfter(text,
    'Vedligeholdelse(?:sbidrag)?',
    'Henl[æa]ggelse(?:r)?\\s+til\\s+vedligeholdelse',
  );

  const andreD = findAmountAfter(text,
    'Arbejdsdag',
    'Antenne(?:bidrag|forening)?',
    'Internet',
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

/**
 * Parse "Ejerudgift i alt 1. år: XX.XXX,XX" som sanity check.
 * Bruges af UI til at verificere at vores parse matcher mæglerens total.
 *
 * VIGTIGT: "i alt" + "år" er obligatorisk — ellers ville vi matche
 * "Ejerudgift/md." (1.443) eller "Ejerudgifter pr. md." (forkert tal).
 */
export function parseEjerudgiftTotal(text: string): number {
  // Strikt: kraev "i alt" + "år" — undgaa per-md varianter
  const patterns = [
    /Ejerudgift\s+i\s+alt\s+1\.?\s*[åa]r[:\s]*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/i,
    /Ejerudgifter?\s+i\s+alt[:\s]*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/i,
    /Boligydelse\s+i\s+alt[:\s]*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      const val = parseAmount(m[1]);
      if (val > 0 && !isYearLike(val, m[1])) return val;
    }
  }
  return 0;
}

/**
 * Parse engangsbeløb der følger med købet — typisk kaldet:
 *   - "Sikkerhed til e/f: Ja, med kr. 50.000,00" (danbolig format)
 *   - "Eksisterende sikkerhed: Kr. 49.000 i form af Ejerpantebrev" (realequity format)
 *   - "Sikkerhed til ejerforening: 50.000"
 *   - "Sikkerhedsstillelse: 50.000 kr"
 *   - "Tinglyst sikkerhed: 50.000"
 *
 * Returns 0 hvis ikke fundet ELLER hvis svaret er "nej/ingen".
 * NB: salgsopstilling indeholder ofte ogsaa boilerplate-tekst om "sikkerhed til
 * ejerforeningen" uden konkret beloeb — vi itererer alle matches og returnerer
 * foerste der har gyldigt beloeb i window'en.
 */
export function parseEjerforeningSikkerhed(text: string): number {
  // Pattern-rangordning: mest specifikke foerst (med beloeb i naerheden)
  // Naar bruger har 2 forskellige PDFs vil de to formater begge fanges.
  const labelPatterns = [
    // realequity-format: "Eksisterende sikkerhed: Kr. 49.000"
    /Eksisterende\s+sikkerhed[:\s]/gi,
    // danbolig-format: "Sikkerhed til e/f: Ja, med kr. 50.000"
    /Sikkerhed\s+til\s+e\/f[:\s]/gi,
    /Sikkerhed\s+til\s+ejerforening(?:en)?[:\s]/gi,
    // generic sikkerhedsstillelse
    /Sikkerhedsstillelse(?:\s+til\s+(?:e\/f|ejerforening(?:en)?))?[:\s]/gi,
    // tinglyst sikkerhed
    /Tinglyst\s+sikkerhed[:\s]/gi,
  ];

  for (const labelRe of labelPatterns) {
    labelRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = labelRe.exec(text)) !== null) {
      const windowStart = m.index + m[0].length;
      const window = text.slice(windowStart, windowStart + 200);

      // Skip hvis "nej" eller "ingen" foer foerste tal
      const lower = window.toLowerCase();
      const firstNumMatch = lower.match(/[\d.,]+/);
      if (!firstNumMatch) continue;
      const preNum = lower.slice(0, firstNumMatch.index ?? 0);
      if (/\b(nej|ingen|ikke)\b/.test(preNum)) continue;

      // Extract foerste amount-shaped tal
      const numbers = [...window.matchAll(/(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d{1,3}(?:\.\d{3})+|\d+)/g)];
      for (const n of numbers) {
        const val = parseAmount(n[0]);
        if (val > 0 && !isYearLike(val, n[0])) return val;
      }
    }
  }
  return 0;
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
