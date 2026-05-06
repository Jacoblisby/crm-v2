/**
 * POST /api/admin/bulk-estimate
 * For hver eligible lead (ikke købt, ikke arkiveret, ikke test, ikke boligberegner):
 *   1. Enrich via DAWA + Boligsiden hvis postnr/kvm mangler
 *   2. Kør computeEstimate med sensible defaults
 *   3. Gem bidDkk, valuationDkk, afkastInputs på lead
 *   4. Flyt til stage 'ny-lead' med stageChangedAt = now()
 *   5. Sæt afkastInputs.priceApproved = false (Jacob skal godkende før udsendelse)
 *
 * Auth: Bearer ${CRON_SECRET}
 * Body (valgfri): { dryRun: true } returnerer kun preview uden mutations
 */
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, pipelineStages, properties } from '@/lib/db/schema';
import { searchAddress, getAddressDetails } from '@/lib/services/dawa';
import { lookupPropertyByAddressId } from '@/lib/services/boligsiden';
import { computeEstimate } from '@/lib/services/price-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const TEST_PATTERN = /^(test|crash|qa|demo|gstack|ux\s|repro)/i;
const TEST_EMAIL_PATTERN = /(@example\.|test\+|@test\.|crash@|crash-)/i;
const SUPPORTED_POSTAL = ['2630', '4000', '4100', '4400', '4700'];

// Default antagelser når sælger ikke har givet os data — drift estimeres
// konservativt så vores bud bliver realistisk lavt indtil sælger udfylder.
const DEFAULT_DRIFT_PER_M2_PER_YEAR = 400; // ~32k for 80m² typisk Næstved
const DEFAULT_STAND = 'middel' as const;

interface ResultRow {
  id: string;
  name: string | null;
  address: string | null;
  status: 'estimated' | 'enriched-and-estimated' | 'no-data' | 'lookup-failed' | 'unsupported-postal' | 'estimate-failed';
  bidDkk?: number | null;
  marketEstimate?: number | null;
  error?: string;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
  const dryRun = body.dryRun === true;

  // Hent alle eligible leads (ikke købt, ikke arkiveret/tabt, ikke test, ikke boligberegner)
  const allLeads = await db
    .select({ lead: leads, stage: pipelineStages })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .where(
      and(
        isNull(leads.deletedAt),
        sql`(${leads.source} IS NULL OR ${leads.source} NOT LIKE 'boligberegner%')`,
        eq(pipelineStages.isTerminal, false),
      ),
    );

  const eligible = allLeads.filter((r) => {
    const name = (r.lead.fullName ?? '').trim();
    const email = (r.lead.email ?? '').trim();
    return !(TEST_PATTERN.test(name) || TEST_EMAIL_PATTERN.test(email));
  });

  const results: ResultRow[] = [];

  for (const r of eligible) {
    const lead = r.lead;
    let postalCode = lead.postalCode;
    let city = lead.city;
    let kvm = lead.kvm;
    let yearBuilt = lead.yearBuilt;
    let streetName: string | null = null;
    let houseNumber: string | null = null;
    let bfeNumber: number | null = lead.bfeNumber ? Number(lead.bfeNumber) : null;
    let propertyId: string | null = lead.propertyId;
    let didEnrich = false;

    // 1. Hvis postnr eller kvm mangler — slå op via DAWA + Boligsiden
    const needsEnrichment = !postalCode || !kvm;
    if (needsEnrichment && lead.address) {
      try {
        const suggestions = await searchAddress(lead.address);
        if (suggestions.length > 0) {
          const top = suggestions[0];
          const details = await getAddressDetails(top.adresse.id);
          if (details) {
            postalCode = postalCode ?? details.postalCode;
            city = city ?? details.city;
            streetName = details.streetName;
            houseNumber = details.houseNumber;
            bfeNumber = bfeNumber ?? details.bfeNumber;
            const property = await lookupPropertyByAddressId(top.adresse.id);
            if (property) {
              kvm = kvm ?? property.kvm;
              yearBuilt = yearBuilt ?? property.yearBuilt;
              bfeNumber = bfeNumber ?? property.bfeNumber;
            }
            didEnrich = true;
          }
        }
      } catch (err) {
        results.push({
          id: lead.id,
          name: lead.fullName,
          address: lead.address,
          status: 'lookup-failed',
          error: err instanceof Error ? err.message : String(err),
        });
        continue;
      }
    }

    // 2. Sanity: kan vi estimere?
    if (!postalCode || !kvm) {
      results.push({
        id: lead.id,
        name: lead.fullName,
        address: lead.address,
        status: 'no-data',
        error: !postalCode ? 'kunne ikke finde postnr' : 'kunne ikke finde kvm',
      });
      continue;
    }
    if (!SUPPORTED_POSTAL.includes(postalCode)) {
      results.push({
        id: lead.id,
        name: lead.fullName,
        address: lead.address,
        status: 'unsupported-postal',
        error: `postnr ${postalCode} udenfor område`,
      });
      continue;
    }

    // 3. Auto-estimate
    try {
      const driftDefault = Math.round(kvm * DEFAULT_DRIFT_PER_M2_PER_YEAR);
      const estimate = await computeEstimate({
        postalCode,
        kvm,
        yearBuilt,
        rooms: lead.rooms ? Number(lead.rooms) : null,
        roadName: streetName,
        houseNumber,
        stand: DEFAULT_STAND,
        driftTotalYearly: driftDefault,
        currentListingPrice: null,
      });

      if (!dryRun) {
        // Find/opret property hvis BFE matcher
        if (bfeNumber && !propertyId) {
          const existing = await db
            .select({ id: properties.id })
            .from(properties)
            .where(eq(properties.bfeNumber, String(bfeNumber)))
            .limit(1);
          if (existing[0]) {
            propertyId = existing[0].id;
          } else if (didEnrich) {
            const [created] = await db
              .insert(properties)
              .values({
                bfeNumber: String(bfeNumber),
                address: lead.address ?? '',
                postalCode: postalCode,
                city: city ?? '',
                kvm: kvm,
                rooms: lead.rooms ? String(lead.rooms) : null,
                yearBuilt: yearBuilt,
                importSource: 'bulk-estimate-enrichment',
              })
              .returning({ id: properties.id });
            propertyId = created.id;
          }
        }

        // Gem alt på leadet
        await db
          .update(leads)
          .set({
            postalCode: postalCode,
            city: city ?? lead.city,
            kvm: kvm,
            yearBuilt: yearBuilt ?? lead.yearBuilt,
            bfeNumber: bfeNumber ? String(bfeNumber) : lead.bfeNumber,
            propertyId: propertyId ?? lead.propertyId,
            stageSlug: 'ny-lead',
            stageChangedAt: new Date(),
            valuationDkk: estimate.marketEstimate,
            bidDkk: estimate.netForkortet.finalOffer,
            bidStatus: 'pending-approval',
            afkastInputs: {
              rentMd: estimate.estimatedRentMd,
              driftTotal: driftDefault,
              refurbTotal: estimate.refurbTotal,
              haeftelseEf: 0,
              listePris: estimate.marketEstimate,
              medianPricePerSqm: estimate.medianPricePerSqm,
              sampleSize: estimate.sampleSize,
              sameEfCount: estimate.sameEfCount,
              rentSource: estimate.rentSource,
              rentSampleSize: estimate.rentSampleSize,
            },
            updatedAt: new Date(),
          })
          .where(eq(leads.id, lead.id));
      }

      results.push({
        id: lead.id,
        name: lead.fullName,
        address: lead.address,
        status: didEnrich ? 'enriched-and-estimated' : 'estimated',
        bidDkk: estimate.netForkortet.finalOffer,
        marketEstimate: estimate.marketEstimate,
      });
    } catch (err) {
      results.push({
        id: lead.id,
        name: lead.fullName,
        address: lead.address,
        status: 'estimate-failed',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Summary
  const summary = {
    totalEligible: eligible.length,
    estimated: results.filter((r) => r.status === 'estimated').length,
    enrichedAndEstimated: results.filter((r) => r.status === 'enriched-and-estimated').length,
    noData: results.filter((r) => r.status === 'no-data').length,
    lookupFailed: results.filter((r) => r.status === 'lookup-failed').length,
    unsupportedPostal: results.filter((r) => r.status === 'unsupported-postal').length,
    estimateFailed: results.filter((r) => r.status === 'estimate-failed').length,
    dryRun,
  };

  return NextResponse.json({ ok: true, summary, results });
}
