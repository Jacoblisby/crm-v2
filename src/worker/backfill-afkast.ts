/**
 * Backfill afkast worker.
 *
 * Beregner Bud@20%ROE + ROE Netto for ALLE aktive on-market listings
 * — også dem uden parsed PDF.
 *
 * Drift-fallback hierarki:
 *   1. Sum af cost_* kolonner (fra PDF-parse) hvis > 0
 *   2. monthly_expense * 12 (fra Boligsiden)
 *   3. 0 (kun listepris-baseret afkast)
 *
 * Leje-estimat (når estimeret_leje_md ikke er sat):
 *   kvm * postnr-specifik kr/m²/md sats
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates, properties } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';

// Konservative leje-satser pr. postnr (kr/m²/md, ejerlejlighed udlejning)
const LEJE_PR_M2_PR_MD: Record<string, number> = {
  '2630': 120, // Taastrup
  '4000': 115, // Roskilde
  '4100': 90,  // Ringsted
  '4200': 85,  // Slagelse
  '4400': 80,  // Kalundborg
  '4700': 90,  // Næstved
};
const DEFAULT_LEJE_RATE = 90;

function estimateLejeMd(postalCode: string, kvm: number): number {
  const rate = LEJE_PR_M2_PR_MD[postalCode] ?? DEFAULT_LEJE_RATE;
  return Math.round(kvm * rate);
}

export interface BackfillRunResult {
  attempted: number;
  updated: number;
  skipped: number;
  errors: string[];
  durationSeconds: number;
}

export async function runBackfillAfkastJob(opts: {
  listingId?: string;
  onlyMissing?: boolean;
} = {}): Promise<BackfillRunResult> {
  const start = Date.now();
  let attempted = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  const baseQuery = db
    .select({
      candidate: onMarketCandidates,
      grundskyld: properties.grundskyldKr,
    })
    .from(onMarketCandidates)
    .leftJoin(properties, eq(onMarketCandidates.propertyId, properties.id));

  const candidates = opts.listingId
    ? await baseQuery.where(eq(onMarketCandidates.id, opts.listingId))
    : await baseQuery.where(eq(onMarketCandidates.status, 'active'));

  for (const row of candidates) {
    const c = row.candidate;
    const grundskyld = row.grundskyld ?? 0;
    attempted++;
    try {
      // Drift-hierarki (samme som recompute-on-market):
      //   1. PDF cost-breakdown sum hvis > 0
      //   2. monthlyExpense × 12 + grundskyld (matcher mægler-annonce + OIS)
      //   3. Grundskyld alene hvis vi har det
      //   4. 0
      const costBreakdownSum =
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

      let driftTotal = costBreakdownSum;
      if (driftTotal === 0) {
        driftTotal = c.monthlyExpense
          ? c.monthlyExpense * 12 + grundskyld
          : grundskyld;
      }

      const refurbTotal =
        c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;

      // Leje: brug brugerens estimat hvis sat, ellers postnr*kvm-heuristik
      const rentMd = c.estimeretLejeMd ?? estimateLejeMd(c.postalCode, c.kvm);

      // Skip hvis onlyMissing og afkast allerede beregnet
      if (opts.onlyMissing && c.afkastCalculatedAt) {
        skipped++;
        continue;
      }

      const afk = computeAfkast({
        rentMd,
        pris: c.listPrice,
        forhandletPris: c.forhandletPris ?? null,
        driftTotal,
        refurbTotal,
      });

      await db
        .update(onMarketCandidates)
        .set({
          // Hvis leje var estimeret (ikke manuelt sat), gem estimat så UI viser det
          estimeretLejeMd: c.estimeretLejeMd ?? rentMd,
          bidDkk: afk.budAt20PctRoe,
          marginPct: afk.roeNettoPct.toString(),
          afkastCalculatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onMarketCandidates.id, c.id));
      updated++;
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      errors.push(`${c.sourceId}: ${m.slice(0, 200)}`);
    }
  }

  return {
    attempted,
    updated,
    skipped,
    errors: errors.slice(0, 20),
    durationSeconds: Math.round((Date.now() - start) / 1000),
  };
}
