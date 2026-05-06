/**
 * POST /api/admin/recompute-on-market
 * Re-kør afkast-beregningen for alle on_market_candidates med den nuværende
 * version af computeEstimate (så bid_dkk + margin_pct opdateres efter ændringer
 * i refurb-rates, capping-regler eller leje-data).
 *
 * Auth: Bearer ${CRON_SECRET}
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import { computeAfkast } from '@/lib/afkast';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MONTHLY_EXPENSE_BUFFER = 1.3;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

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
    const driftTotal =
      driftFromBreakdown > 0
        ? driftFromBreakdown
        : c.monthlyExpense
          ? Math.round(c.monthlyExpense * 12 * MONTHLY_EXPENSE_BUFFER)
          : 0;
    const refurbTotal =
      c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
    const useRefurb = refurbTotal > 0 ? refurbTotal : Math.round(c.kvm * 450);
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

    // ON-MARKET cap: aldrig over 95% af listepris (vi forhandler).
    const ON_MARKET_BID_CAP_PCT = 0.95;
    const bidCap = Math.round((c.listPrice * ON_MARKET_BID_CAP_PCT) / 1000) * 1000;
    const cappedBid =
      afk.budAt20PctRoe != null ? Math.min(afk.budAt20PctRoe, bidCap) : null;

    await db
      .update(onMarketCandidates)
      .set({
        bidDkk: cappedBid,
        marginPct: afk.roeNettoPct.toString(),
        afkastCalculatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onMarketCandidates.id, c.id));
    updated++;
  }

  return NextResponse.json({ ok: true, total: all.length, updated, skipped });
}
