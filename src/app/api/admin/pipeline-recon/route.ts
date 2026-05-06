/**
 * GET /api/admin/pipeline-recon
 * Read-only inspection af pipeline før vi laver bulk-operations.
 * Returnerer kategorisering af aktive leads så Jacob kan godkende
 * hvad der bliver flyttet til 'ny-lead' og auto-estimeret.
 *
 * Auth: Bearer ${CRON_SECRET}
 */
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, pipelineStages } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const TEST_PATTERN = /^(test|crash|qa|demo|gstack|ux\s|repro)/i;
const TEST_EMAIL_PATTERN = /(@example\.|test\+|@test\.|crash@|crash-)/i;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1. Hent alle ikke-slettede, ikke-boligberegner leads
  const allLeads = await db
    .select({ lead: leads, stage: pipelineStages })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .where(
      and(
        isNull(leads.deletedAt),
        sql`(${leads.source} IS NULL OR ${leads.source} NOT LIKE 'boligberegner%')`,
      ),
    );

  // 2. Kategoriser
  const total = allLeads.length;
  const purchased = allLeads.filter((r) => r.stage.slug === 'koebt');
  const archived = allLeads.filter((r) => r.stage.slug === 'arkiveret' || r.stage.slug === 'tabt');
  const test = allLeads.filter((r) => {
    const name = (r.lead.fullName ?? '').trim();
    const email = (r.lead.email ?? '').trim();
    return TEST_PATTERN.test(name) || TEST_EMAIL_PATTERN.test(email);
  });

  // 'eligible' = ikke købt, ikke arkiveret/tabt, ikke test
  const eligible = allLeads.filter((r) => {
    const isTerminal = r.stage.isTerminal;
    const name = (r.lead.fullName ?? '').trim();
    const email = (r.lead.email ?? '').trim();
    const isTest = TEST_PATTERN.test(name) || TEST_EMAIL_PATTERN.test(email);
    return !isTerminal && !isTest;
  });

  // 3. For eligible: split efter om vi har data nok til at auto-estimere
  const SUPPORTED_POSTAL = ['2630', '4000', '4100', '4400', '4700'];
  const canEstimate = eligible.filter((r) => {
    return (
      r.lead.kvm != null &&
      r.lead.kvm > 0 &&
      r.lead.postalCode &&
      SUPPORTED_POSTAL.includes(r.lead.postalCode)
    );
  });
  const missingData = eligible.filter((r) => !canEstimate.some((c) => c.lead.id === r.lead.id));

  // 4. Stage-fordeling for eligible
  const byStage: Record<string, number> = {};
  for (const r of eligible) {
    byStage[r.stage.slug] = (byStage[r.stage.slug] ?? 0) + 1;
  }

  return NextResponse.json({
    summary: {
      total,
      purchased: purchased.length,
      archived: archived.length,
      test: test.length,
      eligibleForBulkMove: eligible.length,
      canAutoEstimate: canEstimate.length,
      missingData: missingData.length,
    },
    eligibleByStage: byStage,
    sampleEligible: eligible.slice(0, 8).map((r) => ({
      id: r.lead.id,
      name: r.lead.fullName,
      address: r.lead.address,
      postalCode: r.lead.postalCode,
      kvm: r.lead.kvm,
      stage: r.stage.slug,
    })),
    sampleTest: test.slice(0, 5).map((r) => ({
      name: r.lead.fullName,
      email: r.lead.email,
    })),
    sampleMissingData: missingData.slice(0, 5).map((r) => ({
      name: r.lead.fullName,
      address: r.lead.address,
      postalCode: r.lead.postalCode,
      kvm: r.lead.kvm,
      reason: !r.lead.kvm
        ? 'mangler kvm'
        : !r.lead.postalCode
          ? 'mangler postnr'
          : !SUPPORTED_POSTAL.includes(r.lead.postalCode)
            ? `postnr ${r.lead.postalCode} udenfor område`
            : 'ukendt',
    })),
  });
}
