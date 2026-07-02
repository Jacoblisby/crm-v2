'use server';

import { revalidatePath } from 'next/cache';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';
import { logEstimaterSave, logCostBreakdownSave } from '@/lib/calibrations';

interface UpdateEstimaterInput {
  id: string;
  estimeretLejeMd: number;
  refurbGulv: number;
  refurbMaling: number;
  refurbRengoring: number;
  refurbAndre: number;
}

export async function updateEstimaterAction(input: UpdateEstimaterInput) {
  const rows = await db
    .select()
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.id, input.id));
  const c = rows[0];
  if (!c) return { ok: false, error: 'kandidat ikke fundet' };

  const driftTotal =
    c.costGrundvaerdi +
    c.costFaellesudgifter +
    c.costRottebekempelse +
    c.costRenovation +
    c.costForsikringer +
    c.costFaelleslaan +
    c.costGrundfond +
    c.costVicevaert +
    c.costVedligeholdelse +
    c.costAndreDrift;

  const refurbTotal =
    input.refurbGulv +
    input.refurbMaling +
    input.refurbRengoring +
    input.refurbAndre;

  const afk = computeAfkast({
    rentMd: input.estimeretLejeMd,
    pris: c.listPrice,
    forhandletPris: c.forhandletPris ?? null,
    driftTotal,
    refurbTotal,
  });

  // On-market: ingen cap. Listepris er saelgers/maeglers tal — vi byder
  // hvad ROE-modellen siger (budAt20PctRoe). Forhandling sker udenfor systemet.
  const finalBid = afk.budAt20PctRoe ?? null;

  await db
    .update(onMarketCandidates)
    .set({
      estimeretLejeMd: input.estimeretLejeMd,
      refurbGulv: input.refurbGulv,
      refurbMaling: input.refurbMaling,
      refurbRengoring: input.refurbRengoring,
      refurbAndre: input.refurbAndre,
      bidDkk: finalBid,
      marginPct: afk.roeNettoPct.toString(),
      avmValue: afk.forhandletPris,
      avmCalculatedAt: new Date(),
      afkastCalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(onMarketCandidates.id, input.id));

  // Learning agent — log overrides (best-effort, ignorerer fejl)
  try {
    await logEstimaterSave({
      listingId: input.id,
      candidate: c,
      newLejeMd: input.estimeretLejeMd,
      newRefurbGulv: input.refurbGulv,
      newRefurbMaling: input.refurbMaling,
      newRefurbRengoring: input.refurbRengoring,
      newRefurbAndre: input.refurbAndre,
    });
  } catch {
    // ignorer — calibration-log er ikke kritisk
  }

  revalidatePath('/on-market');
  revalidatePath(`/on-market/${input.id}`);
  return { ok: true, afk };
}

export type ReviewStatus = 'ny' | 'interesseret' | 'passet' | 'købt';

export async function setReviewStatusAction(input: {
  id: string;
  reviewStatus: ReviewStatus;
  reviewNote?: string | null;
}) {
  await db
    .update(onMarketCandidates)
    .set({
      reviewStatus: input.reviewStatus,
      reviewNote: input.reviewNote ?? null,
      reviewUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(onMarketCandidates.id, input.id));
  revalidatePath('/on-market');
  revalidatePath(`/on-market/${input.id}`);
  return { ok: true };
}

export async function setPdfUrlAction(input: { id: string; pdfUrl: string | null }) {
  if (input.pdfUrl && !/^https?:\/\//.test(input.pdfUrl)) {
    return { ok: false, error: 'URL skal starte med http(s)://' };
  }
  await db
    .update(onMarketCandidates)
    .set({
      pdfUrl: input.pdfUrl || null,
      pdfStatus: input.pdfUrl ? 'url_known' : 'pending',
      updatedAt: new Date(),
    })
    .where(eq(onMarketCandidates.id, input.id));

  // Auto-trigger PDF parse i baggrunden (best-effort, ignorer fejl)
  let parseResult: { parsed: number; failed: number } | null = null;
  if (input.pdfUrl) {
    try {
      const { runParsePdfJob } = await import('@/worker/parse-pdf');
      const r = await runParsePdfJob({ listingId: input.id });
      parseResult = { parsed: r.parsed, failed: r.failed };
    } catch {
      // ignorer — bruger kan re-trigge manuelt
    }
  }

  revalidatePath('/on-market');
  revalidatePath(`/on-market/${input.id}`);
  return { ok: true, parseResult };
}

/**
 * Drag-and-drop PDF upload. Brugeren uploader filen direkte i stedet for at
 * giver os en URL. Vi parser PDFen server-side med samme parser som URL-flow.
 *
 * Bruges naar URL-fetching fejler (PDF bag login, ikke-deterministisk URL, etc.)
 * eller naar bruger har downloadet PDFen lokalt og vil bare smide den ind.
 */
export async function uploadPdfAction(formData: FormData) {
  const id = formData.get('id') as string;
  const file = formData.get('file') as File | null;

  if (!id) return { ok: false as const, error: 'Mangler listing-id' };
  if (!file) return { ok: false as const, error: 'Mangler PDF-fil' };
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false as const, error: 'Filen skal være en PDF' };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { ok: false as const, error: 'PDF er for stor (max 20MB)' };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const fullText = Array.isArray(text) ? text.join('\n') : text;

    const { parseSalgsopstilling, parseEjerudgiftTotal, parseEjerforeningSikkerhed, parseEjendomsvaerdiskat, assessParseConfidence } = await import('@/worker/parse-pdf');
    const breakdown = parseSalgsopstilling(fullText);
    const declaredTotal = parseEjerudgiftTotal(fullText);
    const ejendomsvaerdiskat = parseEjendomsvaerdiskat(fullText);
    const ejerforeningSikkerhed = parseEjerforeningSikkerhed(fullText);

    // Hent kandidaten for at recompute afkast
    const rows = await db
      .select()
      .from(onMarketCandidates)
      .where(eq(onMarketCandidates.id, id));
    const c = rows[0];
    if (!c) return { ok: false as const, error: 'kandidat ikke fundet' };

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
        ejerforeningSikkerhed,
        bidDkk: afk.budAt20PctRoe,
        marginPct: afk.roeNettoPct.toString(),
        afkastCalculatedAt: new Date(),
        pdfStatus: confidence === 'uncertain' ? 'parsed_uncertain' : 'parsed',
        pdfDownloadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onMarketCandidates.id, id));

    revalidatePath('/on-market');
    revalidatePath(`/on-market/${id}`);

    // Returner breakdown saa UI kan vise hvad der blev fundet
    const total = Object.values(breakdown).reduce((a, b) => a + (b as number), 0);
    return {
      ok: true as const,
      breakdown,
      driftTotal,
      declaredTotal, // "Ejerudgift i alt" fra PDF (hvis fundet) — sanity check
      ejerforeningSikkerhed, // engangsbeloeb
      foundFields: Object.entries(breakdown).filter(([, v]) => (v as number) > 0).length,
      totalFields: Object.keys(breakdown).length,
      empty: total === 0,
    };
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    await db
      .update(onMarketCandidates)
      .set({
        pdfLastError: m.slice(0, 500),
        pdfFetchAttempts: sql`COALESCE(${onMarketCandidates.pdfFetchAttempts}, 0) + 1`,
        updatedAt: new Date(),
      })
      .where(eq(onMarketCandidates.id, id));
    return { ok: false as const, error: `Parse fejlede: ${m.slice(0, 200)}` };
  }
}

/**
 * BULK force-reparse: koerer forceReparsePdfAction-logik mod ALLE active
 * candidates med pdf_url sat. Bruges naar parser-koden er forbedret og vi
 * vil opdatere hele basen paa een gang.
 *
 * Returnerer summary: hvor mange blev re-parset, hvor mange fejlede.
 */
export async function bulkReparsePdfAction() {
  const candidates = await db
    .select()
    .from(onMarketCandidates)
    .where(
      and(
        eq(onMarketCandidates.status, 'active'),
        sql`${onMarketCandidates.pdfUrl} IS NOT NULL`,
      ),
    );

  let parsed = 0;
  let failed = 0;
  const errors: string[] = [];
  const start = Date.now();

  const { extractText, getDocumentProxy } = await import('unpdf');
  const { parseSalgsopstilling, parseEjerudgiftTotal, parseEjerforeningSikkerhed, parseEjendomsvaerdiskat, assessParseConfidence } =
    await import('@/worker/parse-pdf');
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

  for (const c of candidates) {
    if (!c.pdfUrl) continue;
    try {
      const r = await fetch(c.pdfUrl, { headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const bytes = new Uint8Array(await r.arrayBuffer());
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const fullText = Array.isArray(text) ? text.join('\n') : text;
      const breakdown = parseSalgsopstilling(fullText);
      const declaredTotal = parseEjerudgiftTotal(fullText);
      const ejendomsvaerdiskat = parseEjendomsvaerdiskat(fullText);
      const ejerforeningSikkerhed = parseEjerforeningSikkerhed(fullText);

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
          ejerforeningSikkerhed,
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
      errors.push(`${c.address.slice(0, 30)}: ${m.slice(0, 100)}`);
    }
  }

  revalidatePath('/on-market');
  return {
    ok: true as const,
    total: candidates.length,
    parsed,
    failed,
    errors: errors.slice(0, 10),
    durationSeconds: Math.round((Date.now() - start) / 1000),
  };
}

/**
 * Force-reparse: henter PDF fra eksisterende pdf_url og koerer parser
 * uconditionally (uden cost-breakdown-empty-check). Bruges naar:
 *   - Parser-kode er blevet bedre og vi vil overskrive gamle (forkerte) tal
 *   - Brugeren ved at de individuelle felter er off
 *
 * Hurtig vej for brugeren — ingen drag-drop kraevet.
 */
export async function forceReparsePdfAction(input: { id: string }) {
  const rows = await db
    .select()
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.id, input.id));
  const c = rows[0];
  if (!c) return { ok: false as const, error: 'kandidat ikke fundet' };
  if (!c.pdfUrl) return { ok: false as const, error: 'Ingen PDF-URL gemt — upload PDF foerst' };

  try {
    const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const r = await fetch(c.pdfUrl, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!r.ok) throw new Error(`PDF download fejlede: HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());

    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const fullText = Array.isArray(text) ? text.join('\n') : text;

    const { parseSalgsopstilling, parseEjerudgiftTotal, parseEjerforeningSikkerhed, parseEjendomsvaerdiskat, assessParseConfidence } =
      await import('@/worker/parse-pdf');
    const breakdown = parseSalgsopstilling(fullText);
    const declaredTotal = parseEjerudgiftTotal(fullText);
    const ejendomsvaerdiskat = parseEjendomsvaerdiskat(fullText);
    const ejerforeningSikkerhed = parseEjerforeningSikkerhed(fullText);

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
        ejerforeningSikkerhed,
        bidDkk: afk.budAt20PctRoe,
        marginPct: afk.roeNettoPct.toString(),
        afkastCalculatedAt: new Date(),
        pdfStatus: confidence === 'uncertain' ? 'parsed_uncertain' : 'parsed',
        pdfDownloadedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onMarketCandidates.id, input.id));

    revalidatePath('/on-market');
    revalidatePath(`/on-market/${input.id}`);

    const total = Object.values(breakdown).reduce((a, b) => a + (b as number), 0);
    return {
      ok: true as const,
      breakdown,
      driftTotal,
      declaredTotal,
      ejerforeningSikkerhed,
      foundFields: Object.entries(breakdown).filter(([, v]) => (v as number) > 0).length,
      totalFields: Object.keys(breakdown).length,
      empty: total === 0,
    };
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    return { ok: false as const, error: m.slice(0, 200) };
  }
}

/**
 * Manual override af cost-breakdown. Bruges naar PDF-parsing fejler eller
 * giver forkerte resultater — som med Benloeseparken 141 i Ringsted.
 */
export async function updateCostBreakdownAction(input: {
  id: string;
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
  ejerforeningSikkerhed: number;
}) {
  const rows = await db
    .select()
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.id, input.id));
  const c = rows[0];
  if (!c) return { ok: false as const, error: 'kandidat ikke fundet' };

  const driftTotal =
    input.costGrundvaerdi +
    input.costFaellesudgifter +
    input.costRottebekempelse +
    input.costRenovation +
    input.costForsikringer +
    input.costFaelleslaan +
    input.costGrundfond +
    input.costVicevaert +
    input.costVedligeholdelse +
    input.costAndreDrift;

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
      costGrundvaerdi: input.costGrundvaerdi,
      costFaellesudgifter: input.costFaellesudgifter,
      costRottebekempelse: input.costRottebekempelse,
      costRenovation: input.costRenovation,
      costForsikringer: input.costForsikringer,
      costFaelleslaan: input.costFaelleslaan,
      costGrundfond: input.costGrundfond,
      costVicevaert: input.costVicevaert,
      costVedligeholdelse: input.costVedligeholdelse,
      costAndreDrift: input.costAndreDrift,
      ejerforeningSikkerhed: input.ejerforeningSikkerhed,
      bidDkk: afk.budAt20PctRoe,
      marginPct: afk.roeNettoPct.toString(),
      afkastCalculatedAt: new Date(),
      pdfStatus: 'manual',
      updatedAt: new Date(),
    })
    .where(eq(onMarketCandidates.id, input.id));

  // Learning agent — log drift-overrides
  try {
    await logCostBreakdownSave({
      listingId: input.id,
      candidate: c,
      newBreakdown: {
        costFaellesudgifter: input.costFaellesudgifter,
        costGrundvaerdi: input.costGrundvaerdi,
        costRottebekempelse: input.costRottebekempelse,
        costRenovation: input.costRenovation,
        costForsikringer: input.costForsikringer,
        costFaelleslaan: input.costFaelleslaan,
        costGrundfond: input.costGrundfond,
        costVicevaert: input.costVicevaert,
        costVedligeholdelse: input.costVedligeholdelse,
        costAndreDrift: input.costAndreDrift,
      },
    });
  } catch {
    // ignorer
  }

  revalidatePath('/on-market');
  revalidatePath(`/on-market/${input.id}`);
  return { ok: true as const, driftTotal, afk };
}
