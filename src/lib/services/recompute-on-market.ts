/**
 * Re-koer afkast-beregning for alle on-market candidates med nuværende
 * version af computeAfkast. Bruges af:
 *
 *   - /api/admin/recompute-on-market (manuel trigger)
 *   - /worker/scrape.ts (chained efter scrape så nye listings far afkast)
 *
 * VIGTIGT: Ingen on-market bid-cap. Vi byder hvad ROE-modellen siger —
 * listepris er sælgers tal og vi forhandler udenom. (Aftalt 2026-05.)
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';

const MONTHLY_EXPENSE_BUFFER = 1.3;
const REFURB_DEFAULT_PER_SQM = 450; // middel-stand fallback

export interface RecomputeResult {
  total: number;
  updated: number;
  skipped: number;
}

export async function recomputeAllOnMarketAfkast(): Promise<RecomputeResult> {
  const all = await db.select().from(onMarketCandidates);
  let updated = 0;
  let skipped = 0;

  for (const c of all) {
    const driftFromBreakdown =
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

    // Hvis salgsopstilling ikke parsed: fallback til monthlyExpense × 12 × buffer
    const driftTotal =
      driftFromBreakdown > 0
        ? driftFromBreakdown
        : c.monthlyExpense
          ? Math.round(c.monthlyExpense * 12 * MONTHLY_EXPENSE_BUFFER)
          : 0;

    const refurbTotal =
      c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
    const useRefurb = refurbTotal > 0 ? refurbTotal : Math.round(c.kvm * REFURB_DEFAULT_PER_SQM);

    const rentMd = c.estimeretLejeMd ?? 0;
    if (rentMd === 0) {
      skipped++;
      continue;
    }

    const afk = computeAfkast({
      rentMd,
      pris: c.listPrice,
      forhandletPris: c.forhandletPris ?? null,
      driftTotal,
      refurbTotal: useRefurb,
    });

    // Ingen cap — vi byder hvad ROE-modellen siger. Listepris er saelgers tal.
    const finalBid = afk.budAt20PctRoe ?? null;

    await db
      .update(onMarketCandidates)
      .set({
        bidDkk: finalBid,
        marginPct: afk.roeNettoPct.toString(),
        afkastCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onMarketCandidates.id, c.id));
    updated++;
  }

  return { total: all.length, updated, skipped };
}
