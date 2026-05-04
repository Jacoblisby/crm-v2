/**
 * POST /api/cron/backfill-afkast
 * Recompute Bud@20%ROE + ROE Netto for alle aktive on-market listings.
 * Bruger PDF cost breakdown hvor det findes, ellers monthlyExpense*12 fallback,
 * og estimerer leje fra postnummer*kvm når estimeret_leje_md ikke er sat.
 *
 * Body (alt valgfri):
 *   { "listingId": "<uuid>" }   → kør for én listing
 *   { "onlyMissing": true }     → spring listings over hvor afkast allerede er beregnet
 */
import { NextRequest, NextResponse } from 'next/server';
import { runBackfillAfkastJob } from '@/worker/backfill-afkast';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { listingId?: string; onlyMissing?: boolean } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {}

  try {
    const result = await runBackfillAfkastJob({
      listingId: body.listingId,
      onlyMissing: body.onlyMissing,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST med CRON_SECRET, body: { listingId? } eller { onlyMissing? }',
  });
}
