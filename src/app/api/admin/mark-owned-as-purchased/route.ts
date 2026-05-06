/**
 * POST /api/admin/mark-owned-as-purchased
 * Læser owned-properties.json og finder leads med matchende adresse
 * (normaliseret: gade, nummer, etage, dør, postnr). Markerer match som
 * stage='koebt' så vi ikke sender salgs-tilbud til ejendomme vi allerede
 * ejer.
 *
 * Auth: Bearer ${CRON_SECRET}
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq, isNull, sql, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import ownedData from '@/lib/data/owned-properties.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface OwnedProperty {
  bfe: number;
  address: string;
  owner: string | null;
  yearBuilt: number | null;
}

const owned = ownedData as OwnedProperty[];

// Normaliser adresse: lowercase, fjern komma + 'Benløse'/by-prefix mellem
// nummer og postnr, fjern dobbelt-mellemrum. "Benløseparken 103, st. th,
// Benløse, 4100 Ringsted" → "benløseparken 103 st th 4100 ringsted"
function normalize(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ekstraher kerneset: gade + husnr + etage + dør + postnr
// "Benløseparken 103 st th 4100 ringsted" → "benløseparken 103 st th 4100"
function coreKey(normalized: string): string {
  // Find første postnr (4 cifre) og tag alt op til og med det
  const match = normalized.match(/^(.+?)\b(\d{4})\b/);
  if (!match) return normalized;
  return `${match[1].trim()} ${match[2]}`;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
  const dryRun = body.dryRun === true;

  // Byg map: normaliseret core-key → owned property
  const ownedKeys = new Map<string, OwnedProperty>();
  for (const o of owned) {
    const key = coreKey(normalize(o.address));
    ownedKeys.set(key, o);
  }

  // Hent alle ikke-slettede leads med adresse + ikke allerede 'koebt'
  const allLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        isNull(leads.deletedAt),
        sql`${leads.address} IS NOT NULL`,
      ),
    );

  const matches: Array<{ leadId: string; name: string | null; address: string; bfe: number; owner: string | null; alreadyPurchased: boolean }> = [];
  const noMatch: Array<{ leadId: string; address: string }> = [];

  for (const lead of allLeads) {
    if (!lead.address) continue;
    const leadKey = coreKey(normalize(lead.address));
    const owned = ownedKeys.get(leadKey);
    if (owned) {
      matches.push({
        leadId: lead.id,
        name: lead.fullName,
        address: lead.address,
        bfe: owned.bfe,
        owner: owned.owner,
        alreadyPurchased: lead.stageSlug === 'koebt',
      });
    } else {
      noMatch.push({ leadId: lead.id, address: lead.address });
    }
  }

  // Update leads der ikke allerede er koebt
  let updated = 0;
  if (!dryRun) {
    const toUpdate = matches.filter((m) => !m.alreadyPurchased);
    for (const m of toUpdate) {
      await db
        .update(leads)
        .set({
          stageSlug: 'koebt',
          stageChangedAt: new Date(),
          notes: sql`COALESCE(${leads.notes}, '') || E'\\n\\n[auto-marked-as-purchased ${new Date().toISOString().slice(0, 10)}: BFE ${m.bfe} matchede vores portfolio-eksport]'`,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, m.leadId));
      updated++;
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      ownedPropertiesTotal: owned.length,
      leadsTotal: allLeads.length,
      matchedTotal: matches.length,
      alreadyPurchased: matches.filter((m) => m.alreadyPurchased).length,
      newlyMarkedPurchased: updated,
      dryRun,
    },
    matches: matches.slice(0, 30), // sample
    sampleNoMatch: noMatch.slice(0, 5),
  });
}
