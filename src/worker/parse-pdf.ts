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
 * Find amount efter label i en window — filtrerer aarstal vaek.
 *
 * Salgsopstilling-table-rows ser typisk saadan ud (efter PDF text-extract):
 *   "Ejendomsvaerdiskat 2026 2.190,96"
 *   "Grundskyld 2026 1.271,00"
 *
 * Naiv regex matcher FOERSTE tal (= aaret 2026). Vi vil have SIDSTE
 * "amount-shaped" tal i window'en.
 *
 * Strategy:
 *   1. Find label i text
 *   2. Tag de naeste 150 chars som window
 *   3. Stop window ved naeste section-header (CAPS letter + space + non-digit)
 *   4. Extract alle tal-strenge
 *   5. Filtrer aarstal (2015-2035 integers uden komma/decimal)
 *   6. Returner den SIDSTE amount (= det rigtige beloeb)
 */
function findAmountAfter(text: string, ...labels: string[]): number {
  for (const labelPattern of labels) {
    const labelRe = new RegExp(labelPattern, 'gi');
    let match: RegExpExecArray | null;
    labelRe.lastIndex = 0;
    while ((match = labelRe.exec(text)) !== null) {
      const windowStart = match.index + match[0].length;
      const window = text.slice(windowStart, windowStart + 150);

      // Find alle tal — dansk format: 1.234,56 ELLER 1.234 ELLER 1234
      const numbers = [...window.matchAll(/(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d{1,3}(?:\.\d{3})+|\d+)/g)];

      const amounts: number[] = [];
      for (const n of numbers) {
        const raw = n[0];
        // Parse: dansk format med komma som decimal
        const normalized = raw.replace(/\./g, '').replace(',', '.');
        const val = parseFloat(normalized);
        if (Number.isNaN(val) || val <= 0) continue;

        // Filter aarstal: 2015-2035 uden decimal
        const isYearLike = val >= 2015 && val <= 2035 && !raw.includes(',') && !raw.includes('.');
        if (isYearLike) continue;

        // Filter ekstreme "case-numre" eller andre noise (over 10M)
        if (val > 10_000_000) continue;

        amounts.push(val);
      }

      if (amounts.length === 0) continue;
      // Tag SIDSTE amount (typisk beloebet, ikke aarstal eller side-tal)
      return Math.round(amounts[amounts.length - 1]);
    }
  }
  return 0;
}

export function parseSalgsopstilling(text: string): CostBreakdown {
  // Grundskyld + Ejendomsvaerdiskat — begge er ejer-skatter, summeres i grundvaerdi
  // (kunne adskilles i schema, men nuvaerende model behandler dem som "skat")
  const grundskyld = findAmountAfter(text,
    'Grundskyld(?:\\s*\\(ejendomsskat\\))?',
    '(?<!værdi)Ejendomsskat\\b',
  );
  const ejdvaerdi = findAmountAfter(text,
    'Ejendomsv[æa]rdiskat',
  );
  // Saml i costGrundvaerdi
  const grundv = grundskyld + ejdvaerdi;

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
 */
export function parseEjerudgiftTotal(text: string): number {
  return findAmountAfter(
    text,
    'Ejerudgift(?:\\s+i\\s+alt)?(?:\\s+1\\.?\\s*[åa]r)?',
    'Boligydelse\\s+i\\s+alt',
  );
}

/**
 * Parse "Sikkerhed til e/f: Ja, med kr. 50.000,00" — engangsbeløb.
 *
 * Linjen kan have format:
 *   "Sikkerhed til e/f: Ja, med kr. 50.000,00 I form af ..."
 *   "Sikkerhed til ejerforening: 50.000"
 *   "Sikkerhedsstillelse: 50.000 kr"
 *
 * Returns 0 hvis ikke fundet ELLER hvis svaret er "nej/ingen".
 */
export function parseEjerforeningSikkerhed(text: string): number {
  // Find label
  const labelRe = /Sikkerhed(?:sstillelse)?\s+til\s+(?:e\/f|ejerforening)/i;
  const m = text.match(labelRe);
  if (!m) return 0;

  // Tag 200 chars window efter label
  const windowStart = (m.index ?? 0) + m[0].length;
  const window = text.slice(windowStart, windowStart + 200);

  // Hvis "nej" eller "ingen" foer foerste tal → ingen sikkerhed
  const lower = window.toLowerCase();
  const firstNumMatch = lower.match(/[\d.,]+/);
  if (firstNumMatch) {
    const preNum = lower.slice(0, firstNumMatch.index ?? 0);
    if (/\b(nej|ingen)\b/.test(preNum)) return 0;
  } else {
    return 0;
  }

  // Extract first amount-shaped tal (her er det FOERSTE — ikke aaret, fordi
  // strukturen er "Ja, med kr. 50.000,00")
  const numbers = [...window.matchAll(/(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d{1,3}(?:\.\d{3})+|\d+)/g)];
  for (const n of numbers) {
    const raw = n[0];
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    if (Number.isNaN(val) || val <= 0) continue;
    // Filter aarstal
    if (val >= 2015 && val <= 2035 && !raw.includes(',') && !raw.includes('.')) continue;
    // Filter ekstreme noise
    if (val > 10_000_000) continue;
    return Math.round(val);
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
