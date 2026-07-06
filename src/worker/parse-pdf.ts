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
 *   "Grundskyld bolig 2026 3.669,00"            ← danbolig variant m. "bolig"
 *   "Rottebekæmpelse Anslået 2026 200,00"        ← variant m. "Anslået" mellem
 *   "VVS fælleslån Anslået 2026 6.553,92"
 *   "Opsparing tagfond 2026 10.845,00"
 *   "Fællesudgifter 2026 13.752,00"
 *   "Ejerudgift i alt 1. år: 17.313,17"
 *
 * Strategy: STRIKT TABEL-MATCH foerst
 *   1. Soeg efter `<label> [<optional-word>] <year> <amount>` pattern.
 *      Optional ord taeller ting som "bolig", "Anslået", "anslået", "jf." etc
 *      som maeglere proppe ind mellem label og aar.
 *   2. Fallback: `<label> kr <amount>` (linjer uden aarskolonne)
 *   3. Fallback: `<label>: <amount>` med kolon-separator. KUN aktiv hvis ikke
 *      foretaget pattern 1 match — fordi "Grundlag for grundskyld: 582.400"
 *      ville ellers fange beskatningsgrundlag i stedet for actual grundskyld.
 *      Vi anchorer derfor labelet med (?<![\\wæøå]) word-boundary foran.
 *   4. Hvis intet match: return 0
 *
 * Vi tager IKKE FOERSTE amount efter label, fordi label appears multiple times
 * i forskellige sammenhænge (fx "Grundlag for grundskyld: 181.600" foer den
 * faktiske "Grundskyld 2026 1.271,00" table-row).
 */
/**
 * Konverter et table-row-match til AARLIGT beloeb ud fra hvad der staar
 * lige efter beloebet i teksten:
 *
 * 1. To-kolonne "Pr. md. / Pr. år" (estaldo): "Grundskyld 166 kr. 1.989 kr."
 *    — vi fangede md-beloebet; aars-beloebet foelger som "kr. <aar> kr.".
 *    Hvis aars-beloeb > md-beloeb bruges det.
 * 2. "pr. md"-suffix (danbolig Slagelse): "Fællesudgifter kr. 1.490 pr. md.
 *    17.880,00" — brug aars-beloebet bagefter, ellers md × 12.
 * 3. Ellers: beloebet ER aarligt.
 */
function resolveAnnualAmount(text: string, matchEnd: number, val: number): number {
  const after = text.slice(matchEnd, matchEnd + 50);

  const twoColMatch = after.match(
    /^\s*kr\.\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)\s*kr\./i,
  );
  if (twoColMatch && twoColMatch[1]) {
    const annual = parseAmount(twoColMatch[1]);
    if (annual > val) return annual;
  }

  const mdMatch = after.match(
    /^\s*(?:kr\.?\s*)?pr\.?\s*md\.?\s*(?:kr\.?\s*)?([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)?/i,
  );
  if (mdMatch) {
    if (mdMatch[1]) {
      const annual = parseAmount(mdMatch[1]);
      if (annual > 0) return annual;
    }
    return Math.round(val * 12);
  }
  return val;
}

/**
 * Summér ALLE table-row-matches for et sæt labels — til poster der kan
 * optræde flere gange i samme salgsopstilling, fx flere anlægslån:
 *   "Anlægslån (taglån) 2026 3.077,28"
 *   "Anlægslån (radiator) 2026 689,04"
 *   "Anlægslån (asfalt m.m.) 2026 686,88"
 * findAmountAfter returnerer kun FOERSTE match — denne summerer alle.
 *
 * Dedup via amount-position i teksten saa overlappende alias-moenstre
 * (fx "Ydelse på fælleslån" og "fælleslån" der rammer samme row) ikke
 * taeller samme beloeb dobbelt.
 */
function sumTableAmounts(text: string, ...labels: string[]): number {
  const seenAmountPos = new Set<number>();
  let sum = 0;
  for (const labelPattern of labels) {
    const re = new RegExp(
      `(?<![\\p{L}])${labelPattern}(?:\\s+[\\p{L}.]+|\\s*\\([^)]{0,80}\\)){0,2}\\s+(?:20\\d{2}\\s+)?([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'giu',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const val = parseAmount(m[1]);
      if (val <= 0) continue;
      const amountPos = m.index + m[0].length - m[1].length;
      if (seenAmountPos.has(amountPos)) continue;
      seenAmountPos.add(amountPos);
      sum += resolveAnnualAmount(text, m.index + m[0].length, val);
    }
  }
  return sum;
}

function findAmountAfter(text: string, ...labels: string[]): number {
  for (const labelPattern of labels) {
    // Pattern 1: <label> [<word>|<(parens)>]{0,2} [<YEAR>] <amount> — table-row format
    // Optional mellem-indhold fanger varianter som:
    //   "Grundskyld bolig 2026 3.669,00"     ← Lindevangshusene-format m. aar
    //   "Grundskyld bolig 6.029,00"          ← Kählersvej-format UDEN aar
    //   "Rottebekæmpelse Anslået 2026 200,00"
    //   "VVS fælleslån Anslået 2026 6.553,92"
    //   "Fællesudgifter 10.500,00"           ← samme uden aar
    //   "Fællesudgifter (fratrukket YouSee - afmeldt) 15.852,00" ← home-format
    //                                          m. parentes mellem label og beloeb
    //   "Fællesudgifter kr. 1.490 pr. md. 17.880,00" ← danbolig md+aar-format:
    //                                          md-beloeb FOERST, aars-beloeb sidst
    // \\p{L}+ matcher unicode-bogstaver (incl. å, ø, æ) pga 'u' flag.
    // Vi anchorer labelet med (?<![\\p{L}]) saa "for grundskyld" eller
    // "andel af fælleslån" ikke matcher (de er allerede dekkkt af colon-fallback,
    // men her hvor aar er optional faar vi flere false positives uden anchor).
    const tablePattern = new RegExp(
      `(?<![\\p{L}])${labelPattern}(?:\\s+[\\p{L}.]+|\\s*\\([^)]{0,80}\\)){0,2}\\s+(?:20\\d{2}\\s+)?([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'iu',
    );
    const tableMatch = tablePattern.exec(text);
    if (tableMatch && tableMatch[1]) {
      const val = parseAmount(tableMatch[1]);
      if (val > 0) {
        return resolveAnnualAmount(text, tableMatch.index + tableMatch[0].length, val);
      }
    }

    // Pattern 2: <label> kr. <amount> — explicit kr-format
    const krPattern = new RegExp(
      `${labelPattern}[^\\n]{0,30}?kr\\.?\\s*([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'iu',
    );
    const krMatch = text.match(krPattern);
    if (krMatch && krMatch[1]) {
      const val = parseAmount(krMatch[1]);
      if (val > 0 && !isYearLike(val, krMatch[1])) return val;
    }

    // Pattern 3: <label>: <amount> — kolon-separator format.
    // Vi kraever word-boundary foran labelet saa "Grundlag for grundskyld: X"
    // ikke matcher "Grundskyld" som label. Pre-context "for " eller "af "
    // foran label skal afvises.
    const colonPattern = new RegExp(
      `(?<![\\w])(?<!\\bfor\\s)(?<!\\baf\\s)${labelPattern}:\\s*([\\d]{1,3}(?:\\.[\\d]{3})*(?:,[\\d]{1,2})?|[\\d]+,[\\d]{1,2})`,
      'iu',
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

export interface ColumnarParseResult {
  breakdown: CostBreakdown;
  ejendomsvaerdiskat: number;
  declaredTotal: number;
}

/**
 * EDC-format: to-kolonne PDF-layout hvor text-extraktion laeser kolonnevis —
 * ALLE labels foerst (med kolon), derefter ALLE beloeb i samme raekkefoelge:
 *
 *   "Ejerudgift 1. år: Pr. år: Kontantbehov ved køb: Ejendomsværdiskat:
 *    Grundskyld: Fællesudgifter: Grundfond: Rottebekæmpelsesgebyr: Ejerlaug:
 *    Særskilt renovationsbidrag: Ejerudgift i alt 1.år:
 *    kr. 3.831,00 kr. 2.516,64 kr. 10.857,60 kr. 1.080,00 kr. 82,30
 *    kr. 1.868,04 kr. 1.406,00 kr. kr. kr. 21.641,58"
 *
 * Vi zipper label[i] → beloeb[i]. Returns null hvis teksten ikke matcher
 * kolonne-signaturen (saa falder caller tilbage til raekke-parseren).
 */
export function parseColumnarCosts(text: string): ColumnarParseResult | null {
  const startMatch = text.match(/Ejerudgift(?:er)?\s+1\.?\s*[åa]r:/i);
  if (!startMatch || startMatch.index === undefined) return null;
  const window = text.slice(startMatch.index, startMatch.index + 1500);

  // Beloebs-blokken starter ved foerste "kr. <tal>"
  const firstAmount = window.search(/kr\.\s*[\d]/i);
  if (firstAmount < 0) return null;

  const labelPart = window.slice(0, firstAmount);
  // Labels = kolon-separerede tokens. Filtrér headers væk.
  const rawLabels = labelPart.split(':').map((s) => s.trim()).filter(Boolean);
  const labels = rawLabels.filter(
    (l) =>
      !/^ejerudgift(?:er)?\s+1\.?\s*[åa]r$/i.test(l) && // section-header
      !/^pr\.?\s*[åa]r$/i.test(l) &&
      !/kontantbehov/i.test(l),
  );
  // Kolonne-signatur kraever: mindst 3 labels, ingen cifre i labels
  // (raekke-format har beloeb mellem labels og ville fejle her), og
  // sidste label skal vaere "i alt"-totalen.
  if (labels.length < 3) return null;
  if (labels.some((l) => /\d/.test(l.replace(/1\.?\s*[åa]r/i, '')))) return null;
  if (!/i\s*alt/i.test(labels[labels.length - 1])) return null;

  // Beloeb i raekkefoelge — "kr." uden tal (tomme celler) springes over
  // automatisk fordi regex kraever cifre efter.
  const amountPart = window.slice(firstAmount);
  const amounts = [...amountPart.matchAll(/kr\.\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)/gi)]
    .map((m) => parseAmount(m[1]));
  if (amounts.length < labels.length) return null;

  const breakdown: CostBreakdown = {
    costGrundvaerdi: 0,
    costFaellesudgifter: 0,
    costRottebekempelse: 0,
    costRenovation: 0,
    costForsikringer: 0,
    costFaelleslaan: 0,
    costGrundfond: 0,
    costVicevaert: 0,
    costVedligeholdelse: 0,
    costAndreDrift: 0,
  };
  let ejendomsvaerdiskat = 0;
  let declaredTotal = 0;

  labels.forEach((label, i) => {
    const val = amounts[i];
    if (!val) return;
    if (/i\s*alt/i.test(label)) declaredTotal = val;
    else if (/ejendomsv[æa]rdiskat/i.test(label)) ejendomsvaerdiskat = val;
    else if (/grundskyld/i.test(label)) breakdown.costGrundvaerdi += val;
    else if (/f[æa]llesudgift/i.test(label)) breakdown.costFaellesudgifter += val;
    else if (/grundfond|tagfond|henl[æa]ggelse/i.test(label)) breakdown.costGrundfond += val;
    else if (/rottebek|skadedyr/i.test(label)) breakdown.costRottebekempelse += val;
    else if (/renovation|affald/i.test(label)) breakdown.costRenovation += val;
    else if (/forsikring/i.test(label)) breakdown.costForsikringer += val;
    else if (/l[åa]n/i.test(label)) breakdown.costFaelleslaan += val;
    else if (/vicev[æa]rt|ejendomsservice|trappevask/i.test(label)) breakdown.costVicevaert += val;
    else if (/vedligehold/i.test(label)) breakdown.costVedligeholdelse += val;
    else breakdown.costAndreDrift += val; // ejerlaug, antenne, adm, ...
  });

  return { breakdown, ejendomsvaerdiskat, declaredTotal };
}

export function parseSalgsopstilling(text: string): CostBreakdown {
  // EDC-kolonne-format detekteres FOERST — der er raekke-moenstrene ubrugelige
  // og kan fange garbage (fx "Fællesudgifter" matchet mod et tal langt vaek).
  const columnar = parseColumnarCosts(text);
  if (columnar) return columnar.breakdown;

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
    // estaldo bruger bare "Ejerforening <beloeb>" som fællesudgift-row.
    // Negative lookahead (?![\\p{L}]) saa "Ejerforeningens forsikring" ikke fanges.
    'Ejerforening(?![\\p{L}])',
  );

  const rotte = findAmountAfter(text,
    'Rottebek[æa]mpelse(?:sgebyr)?',
    'Skadedyrsbek[æa]mpelse(?:sgebyr)?', // home-mæglerens betegnelse
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

  // Fælleslån kan optræde som FLERE rows i samme opstilling (fx tre
  // anlægslån: taglån + radiator + asfalt) — derfor summeres alle
  // table-row-matches. Fallback til enkelt-match for kolon/kr-formater.
  // Aliaserne daekker alle laane-betegnelser vi har set + gaengse EF-
  // projektnavne. Misses et navn alligevel, fanger parse-confidence-checket
  // mismatchen mod mæglerens "Ejerudgift i alt" og flagger listingen gult.
  const faellslSum = sumTableAmounts(text,
    '(?:Ydelse\\s+(?:p[åa]\\s+)?)?[Ff][æa]llesl[åa]n(?:\\s*\\+\\s*gebyr)?',
    'Anl[æa]gsl[åa]n', // danbolig: "Anlægslån (taglån)" etc
    'VVS[\\s-]*l[åa]n',
    'Tagl[åa]n',
    'Renoveringsl[åa]n',
    'Byggel[åa]n',
    'Moderniseringsl[åa]n',
    'Facadel[åa]n',
    'Altanl[åa]n',
    'Vinduesl[åa]n',
    'Elevatorl[åa]n',
    'Kloakl[åa]n',
    'Faldstammel[åa]n',
    'Byggeteknisk\\s+l[åa]n',
    'L[åa]n\\s+til\\s+[\\p{L}]+', // "Lån til vinduer 2026 1.234,00" etc
  );
  const faellsl = faellslSum > 0
    ? faellslSum
    : findAmountAfter(text,
        '(?:Ydelse\\s+(?:p[åa]\\s+)?)?[Ff][æa]llesl[åa]n(?:\\s*\\+\\s*gebyr)?',
        'Andelsboligforeningens\\s+l[åa]n',
        'Ejerforeningens?\\s+(?:fælles)?l[åa]n',
      );

  // Grundfond + tagfond/vedligeholdelsesfond — EF-opsparing til kommende
  // store-projekter. Danbolig bruger "Opsparing tagfond" som table-row;
  // andre maeglere bruger "Henlæggelse til grundfond" osv. Vi samler alle
  // under costGrundfond (semantisk: EF reserve-bidrag).
  const grundfond = findAmountAfter(text,
    'Opsparing(?:\\s+til)?(?:\\s+(?:tag|grund|vedligeholdelses))?fond',
    'Henl[æa]ggelse(?:r)?(?:\\s+til\\s+(?:tag|grund|vedligeholdelses)?fond)?',
    'Bidrag\\s+til\\s+(?:tag|grund)?fond',
    'Tagfond',
    'Grundfond',
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
  // EDC-kolonne-format: totalen ligger i den zippede label→beloeb-mapping.
  const columnar = parseColumnarCosts(text);
  if (columnar && columnar.declaredTotal > 0) return columnar.declaredTotal;

  // Strikt: kraev "i alt" + "år" — undgaa per-md varianter
  const patterns = [
    // estaldo to-kolonne: "Ejerudgifter i alt 1. år 1.617 kr. 19.404 kr."
    // → tag aars-beloebet (det andet), ikke md-beloebet (det foerste).
    /Ejerudgifter?\s+i\s+alt\s+1\.?\s*[åa]r\s+[\d.,]+\s*kr\.\s*([\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{1,2})?)\s*kr/i,
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
 * Parse ejendomsvaerdiskat (aarlig). Vi ekskluderer den fra drift (kun
 * ejer-bebooere betaler den, ikke ved udlejning), men vi bruger den til at
 * afstemme vores drift mod mæglerens "Ejerudgift i alt":
 *   mæglers total = vores drift + ejendomsvaerdiskat
 * Genbruger findAmountAfter saa den haandterer alle formater (aar-optional,
 * to-kolonne md/aar, parentes, "pr. md").
 */
export function parseEjendomsvaerdiskat(text: string): number {
  // EDC-kolonne-format foerst — raekke-moenstre kan ikke laese det.
  const columnar = parseColumnarCosts(text);
  if (columnar && columnar.ejendomsvaerdiskat > 0) return columnar.ejendomsvaerdiskat;
  return findAmountAfter(text, 'Ejendomsv[æa]rdiskat(?:sbidrag)?');
}

export type ParseConfidence = 'ok' | 'uncertain';

/**
 * Sanity-check: afstemmer vores parsede drift mod mæglerens erklaerede total.
 *
 * Forventet: driftTotal + ejendomsvaerdiskat ≈ declaredTotal.
 * Naar de afviger mere end tolerancen har parseren sandsynligvis misset et
 * felt (nyt mægler-format) — returnér 'uncertain' saa UI'et kan flagge det
 * i stedet for at vise falsk grøn "✓ udspecificeret".
 *
 * declaredTotal <= 0 → ingen reference at validere mod → 'ok' (neutral).
 */
export function assessParseConfidence(opts: {
  driftTotal: number;
  declaredTotal: number;
  ejendomsvaerdiskat: number;
}): ParseConfidence {
  const { driftTotal, declaredTotal, ejendomsvaerdiskat } = opts;
  if (declaredTotal <= 0) return 'ok';
  const expectedDrift = declaredTotal - ejendomsvaerdiskat;
  if (expectedDrift <= 0) return 'ok';
  const diff = Math.abs(driftTotal - expectedDrift);
  const tolerance = Math.max(1000, declaredTotal * 0.05);
  return diff > tolerance ? 'uncertain' : 'ok';
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
      const declaredTotal = parseEjerudgiftTotal(fullText);
      const ejendomsvaerdiskat = parseEjendomsvaerdiskat(fullText);

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
      const confidence = assessParseConfidence({ driftTotal, declaredTotal, ejendomsvaerdiskat });
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
          pdfStatus: confidence === 'uncertain' ? 'parsed_uncertain' : 'parsed',
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
