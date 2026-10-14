/**
 * POST /api/cron/lead-sla
 *
 * SLA-vagt: finder boligberegner-leads der har ventet over 18 timer uden at
 * et menneske har taget kontakt, og sender én samlet påmindelse. Se
 * worker/lead-sla.ts for hvorfor grænsen er 18 og ikke 24.
 *
 * Auth: Bearer ${CRON_SECRET}
 *
 * Body (alt valgfrit):
 *   { "hours": 18 }      → anden grænse (til test)
 *   { "dryRun": true }   → find og returnér, men send intet og markér intet
 *
 * Coolify scheduled task, hver time:
 *   curl -X POST https://crm.365ejendom.dk/api/cron/lead-sla \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
import { NextRequest, NextResponse } from 'next/server';
import { runLeadSlaJob } from '@/worker/lead-sla';
import { runMailvagtWatchdog } from '@/worker/mailvagt-watchdog';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { hours?: number; dryRun?: boolean } = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {}

  try {
    const result = await runLeadSlaJob({ hours: body.hours, dryRun: body.dryRun });
    // Samme time-job passer også på mailvagten. Fejler den, må SLA-svaret ikke gå tabt.
    const mailvagt = body.dryRun ? undefined : await runMailvagtWatchdog().catch((e) => ({ status: `fejl: ${e instanceof Error ? e.message : e}` }));
    return NextResponse.json({ ok: true, ...result, mailvagt });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
