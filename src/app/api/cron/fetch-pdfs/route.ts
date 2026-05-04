/**
 * POST /api/cron/fetch-pdfs
 * Triggers per-broker PDF-URL fetch worker.
 *
 * Body (optional JSON):
 *   { "broker": "realmaeglerne" | "all" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { runPdfFetchJob, SUPPORTED_BROKERS } from '@/worker/fetch-pdfs';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization') || '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { broker?: string; limit?: number } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore
  }

  try {
    const result = await runPdfFetchJob({
      broker: (body.broker as 'all' | undefined) ?? 'all',
      limit: body.limit ?? 50,
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
    supportedBrokers: SUPPORTED_BROKERS,
  });
}
