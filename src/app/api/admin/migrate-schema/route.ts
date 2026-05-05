/**
 * POST /api/admin/migrate-schema
 * Kører `drizzle-kit migrate`-style migrations idempotent.
 * Bruger 'IF NOT EXISTS' hvor muligt så det kan kaldes flere gange.
 *
 * Body: { migration: '0004_afkast_inputs' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

const MIGRATIONS: Record<string, () => Promise<void>> = {
  '0004_afkast_inputs': async () => {
    await db.execute(
      sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "afkast_inputs" jsonb`,
    );
  },
  '0005_review_status': async () => {
    await db.execute(sql`
      ALTER TABLE "on_market_candidates"
      ADD COLUMN IF NOT EXISTS "review_status" text NOT NULL DEFAULT 'ny',
      ADD COLUMN IF NOT EXISTS "review_note" text,
      ADD COLUMN IF NOT EXISTS "review_updated_at" timestamp with time zone
    `);
  },
};

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const migration = body.migration as string;

  if (!migration || !MIGRATIONS[migration]) {
    return NextResponse.json(
      { error: `Unknown migration. Available: ${Object.keys(MIGRATIONS).join(', ')}` },
      { status: 400 },
    );
  }

  try {
    await MIGRATIONS[migration]();
    return NextResponse.json({ ok: true, applied: migration });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
