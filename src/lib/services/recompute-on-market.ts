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
import { estimateMonthlyRent } from '@/lib/services/our-rentals';

const REFURB_DEFAULT_PER_SQM = 450; // middel-stand fallback

// Postnr-baseret leje-fallback hvis vi ikke har lejedata for nærområdet.
// Matcher LEJE_PR_M2_PR_MD i price-engine.ts. Bruges KUN naar
// estimateMonthlyRent returnerer no-match.
const LEJE_PR_M2_PR_MD: Record<string, number> = {
  '2630': 120, // Taastrup
  '4000': 115, // Roskilde
  '4100': 90,  // Ringsted
  '4200': 85,  // Slagelse
  '4400': 80,  // Kalundborg
  '4700': 90,  // Næstved
};
const DEFAULT_LEJE_RATE = 90;
const RENT_SAFETY_DISCOUNT = 0.85;

export interface RecomputeResult {
  total: number;
  updated: number;
  skipped: number;
}

/**
 * Beregner et leje-estimat for en listing baseret pa:
 *   1. Faktisk leje fra our-rentals.json (samme vej eller postnr)
 *   2. Postnr-rate × kvm fallback
 * Returnerer 0 hvis hverken kvm eller postnr giver et estimat.
 */
function deriveLejeMd(postalCode: string | null, kvm: number | null, roadName?: string | null): number {
  if (!postalCode || !kvm || kvm <= 0) return 0;
  const match = estimateMonthlyRent({ postalCode, roadName });
  if (match.monthlyRent > 0) {
    return Math.round(match.monthlyRent * RENT_SAFETY_DISCOUNT);
  }
  const rate = LEJE_PR_M2_PR_MD[postalCode] ?? DEFAULT_LEJE_RATE;
  return Math.round(kvm * rate * RENT_SAFETY_DISCOUNT);
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

    // Drift-hierarki:
    //   1. PDF cost-breakdown sum hvis > 0 (mest præcis — fra prospektet)
    //   2. monthlyExpense × 12 (matcher mægler-annoncen 1:1; mæglers
    //      "Mdl ejerudgifter" inkluderer ALLEREDE grundskyld + ejendomsskat
    //      + EF-bidrag — vi skal ikke tilføje noget på top)
    //   3. 0 (skip)
    const driftTotal =
      driftFromBreakdown > 0
        ? driftFromBreakdown
        : c.monthlyExpense
          ? c.monthlyExpense * 12
          : 0;

    const refurbTotal =
      c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
    const useRefurb = refurbTotal > 0 ? refurbTotal : Math.round(c.kvm * REFURB_DEFAULT_PER_SQM);

    // Hvis ingen manuel leje sat, derive fra our-rentals + postnr-fallback.
    // Tidligere sprang vi listings over uden leje — nu beregner vi en saa
    // alle on-market faar et bidDkk.
    let rentMd = c.estimeretLejeMd ?? 0;
    let derivedRent = false;
    if (rentMd === 0) {
      // Extract roadName fra address (alt før første tal): "Byskov Alle 18..." → "Byskov Alle"
      const roadName = c.address?.split(/\s+\d/)[0]?.trim() || null;
      rentMd = deriveLejeMd(c.postalCode, c.kvm, roadName);
      derivedRent = rentMd > 0;
    }

    if (rentMd === 0) {
      // Stadig 0 — postnr eller kvm mangler. Spring over.
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
        // Persistér derived leje saa den vises i UI + spares ved naeste recompute.
        ...(derivedRent ? { estimeretLejeMd: rentMd } : {}),
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
