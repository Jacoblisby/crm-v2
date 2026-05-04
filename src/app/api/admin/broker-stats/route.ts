/**
 * GET /api/admin/broker-stats
 * Returnerer statistik per broker + 3 sample case URLs uden pdf_url.
 * Bruges til at bygge per-broker PDF-fetchers.
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Stats per broker
  const stats = await db
    .select({
      broker: onMarketCandidates.brokerKind,
      total: sql<number>`count(*)::int`,
      withPdf: sql<number>`count(${onMarketCandidates.pdfUrl})::int`,
      missingPdf: sql<number>`count(*) filter (where ${onMarketCandidates.pdfUrl} is null)::int`,
    })
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.status, 'active'))
    .groupBy(onMarketCandidates.brokerKind)
    .orderBy(desc(sql`count(*)`));

  // Sample case URLs per broker (op til 3 hvor pdf_url er null)
  const samples: Record<string, Array<{ id: string; address: string; caseUrl: string | null; sourceUrl: string }>> = {};
  for (const s of stats) {
    if (!s.broker) continue;
    const rows = await db
      .select({
        id: onMarketCandidates.id,
        address: onMarketCandidates.address,
        caseUrl: onMarketCandidates.caseUrl,
        sourceUrl: onMarketCandidates.sourceUrl,
      })
      .from(onMarketCandidates)
      .where(
        and(
          eq(onMarketCandidates.status, 'active'),
          eq(onMarketCandidates.brokerKind, s.broker),
          isNull(onMarketCandidates.pdfUrl),
        ),
      )
      .limit(3);
    samples[s.broker] = rows;
  }

  return NextResponse.json({ ok: true, stats, samples });
}
