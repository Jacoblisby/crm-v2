'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';

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
    listePris: c.listPrice,
    forhandletPris: c.forhandletPris ?? null,
    driftTotal,
    refurbTotal,
  });

  await db
    .update(onMarketCandidates)
    .set({
      estimeretLejeMd: input.estimeretLejeMd,
      refurbGulv: input.refurbGulv,
      refurbMaling: input.refurbMaling,
      refurbRengoring: input.refurbRengoring,
      refurbAndre: input.refurbAndre,
      bidDkk: afk.budAt20PctRoe,
      marginPct: afk.roeNettoPct.toString(),
      avmValue: afk.forhandletPris,
      avmCalculatedAt: new Date(),
      afkastCalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(onMarketCandidates.id, input.id));

  revalidatePath('/on-market');
  revalidatePath(`/on-market/${input.id}`);
  return { ok: true, afk };
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
