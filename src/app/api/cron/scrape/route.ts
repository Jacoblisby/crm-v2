/**
 * POST /api/cron/scrape
 * Triggers Boligsiden-scrape worker. Auth via CRON_SECRET header (set in Coolify env).
 *
 * Body (optional JSON):
 *   { "postnrCodes": ["4700"], "runKind": "manual" }
 *
 * Response: { jobId, scraped, newListings, updated, markedSold, durationSeconds }
 *
 * Coolify scheduled task: nightly POST med Authorization: Bearer <CRON_SECRET>
 */
import { NextRequest, NextResponse } from 'next/server';
import { runScrapeJob, POSTAL_CODES } from '@/worker/scrape';

export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 min max

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { postnrCodes?: string[]; runKind?: 'cron' | 'manual' } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore body parse errors
  }

  try {
    const result = await runScrapeJob({
      postnrCodes: body.postnrCodes,
      runKind: body.runKind ?? 'cron',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST hit denne route med Authorization: Bearer <CRON_SECRET>',
    defaultPostalCodes: POSTAL_CODES,
  });
}
