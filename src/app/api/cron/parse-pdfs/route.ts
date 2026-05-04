/**
 * POST /api/cron/parse-pdfs
 * Triggers PDF cost-breakdown extractor.
 *
 * Body:
 *   { "listingId": "<uuid>" }  → parse one specific listing
 *   { "limit": 20 }            → batch (alle med pdf_url + tom breakdown)
 */
import { NextRequest, NextResponse } from 'next/server';
import { runParsePdfJob } from '@/worker/parse-pdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { listingId?: string; limit?: number } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {}

  try {
    const result = await runParsePdfJob({ listingId: body.listingId, limit: body.limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ info: 'POST med CRON_SECRET, body: { listingId? } eller { limit? }' });
}
