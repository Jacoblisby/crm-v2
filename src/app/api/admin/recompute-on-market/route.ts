/**
 * POST /api/admin/recompute-on-market
 * Re-kør afkast-beregningen for alle on_market_candidates.
 * Manuel trigger — selve logikken bor i lib/services/recompute-on-market.ts
 * og kores ogsa automatisk efter hver scrape.
 *
 * Auth: Bearer ${CRON_SECRET}
 */
import { NextRequest, NextResponse } from 'next/server';
import { recomputeAllOnMarketAfkast } from '@/lib/services/recompute-on-market';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await recomputeAllOnMarketAfkast();
  return NextResponse.json({ ok: true, ...result });
}
