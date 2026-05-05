/**
 * POST /api/admin/soft-delete-leads
 * Soft-sletter leads ved at sætte deleted_at = now() på de givne IDs.
 * Reversibelt — DBA kan altid sætte deleted_at NULL igen.
 *
 * Bruges til at rydde test-leads efter QA-runs.
 *
 * Auth: Bearer ${CRON_SECRET}
 * Body: { ids: string[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'body must be { ids: [string, ...] }' }, { status: 400 });
  }

  const result = await db
    .update(leads)
    .set({ deletedAt: new Date() })
    .where(inArray(leads.id, body.ids))
    .returning({ id: leads.id, fullName: leads.fullName });

  return NextResponse.json({ ok: true, deleted: result.length, leads: result });
}
