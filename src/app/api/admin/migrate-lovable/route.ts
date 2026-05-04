/**
 * POST /api/admin/migrate-lovable?table={properties|leads|communications}
 *
 * One-shot migration fra Lovable's "Deal Flow Hub" Supabase til crm-v2.
 * Idempotent: properties via bfe_number unique, leads via id (UUID preserved).
 *
 * Body: { rows: Array<LovableRow> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  properties,
  leads,
  leadCommunications,
  housingAssociations,
  pipelineStages,
} from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Lovable status → v2 stage_slug
const STAGE_MAP: Record<string, string> = {
  'Ny lead': 'ny-lead',
  'Forsøgt kontaktet': 'kontaktet',
  'Kontaktet': 'kontaktet',
  'Mail sendt': 'mail-sendt',
  'Ren interesse': 'interesse',
  'Interesse': 'interesse',
  'Kontakter os når lejer flytter': 'afventer-lejer',
  'Benløseparken Afvent': 'afventer-lejer',
  'Afventer lejer': 'afventer-lejer',
  'Fremvisning': 'fremvisning',
  'Bud': 'aktivt-bud',
  'Aktivt bud': 'aktivt-bud',
  'Bud afvist': 'tabt',
  'Ikke interessant': 'tabt',
  'Tabt': 'tabt',
  'Købt': 'koebt',
};

function parsePrice(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = String(s).match(/[\d.]+/);
  if (!m) return null;
  const n = parseInt(m[0].replace(/\./g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

interface BoligerRow {
  id: number;
  bfe_nummer: number;
  adresse: string;
  postnr?: string | null;
  by_navn?: string | null;
  kvm?: number | null;
  antal_vaerelser?: number | null;
  ejer_navn?: string | null;
  ejerskabstype?: string | null;
  ejer_adresse?: string | null;
  bor_i_lejlighed?: boolean | null;
  seneste_handelspris?: string | null;
  seneste_handelsdato?: string | null;
  grundskyld?: string | null;
  ejerforening?: string | null;
}

interface LeadsRow {
  id: string;
  navn: string;
  email?: string | null;
  telefon?: string | null;
  adresse?: string | null;
  kommune?: string | null;
  stoerrelse?: number | null;
  vaerelser?: number | null;
  stand?: number | null;
  stand_notat?: string | null;
  lejepris?: string | null;
  status: string;
  next_step?: string | null;
  bud?: string | null;
  bud_dkk?: number | null;
  bud_status?: string | null;
  source?: string | null;
  priority?: string | null;
  bolig_id?: number | null;
  stage_changed_at?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface KommunikationRow {
  id: number;
  lead_id: string;
  dato: string;
  type: string;
  besked: string;
  created_at: string;
}

async function migrateProperties(rows: BoligerRow[]) {
  let inserted = 0, updated = 0, skipped = 0;
  // Pre-fetch housing_associations for matching by name
  const associations = await db.select().from(housingAssociations);
  const assocMap = new Map(associations.map((a) => [a.name.toLowerCase(), a.id]));

  for (const r of rows) {
    if (!r.bfe_nummer || !r.adresse) {
      skipped++;
      continue;
    }
    const associationId = r.ejerforening
      ? assocMap.get(r.ejerforening.toLowerCase()) ?? null
      : null;
    const ownerKind =
      r.ejerskabstype === 'Selskab'
        ? 'company'
        : r.ejerskabstype === 'Person'
          ? 'private'
          : 'unknown';
    const lastSalePrice = parsePrice(r.seneste_handelspris);
    const lastSaleDate = parseDate(r.seneste_handelsdato);
    const grundskyld = parsePrice(r.grundskyld);

    const data = {
      bfeNumber: String(r.bfe_nummer),
      address: r.adresse,
      postalCode: r.postnr ?? '0000',
      city: r.by_navn ?? 'Ukendt',
      associationId,
      kvm: r.kvm ?? null,
      rooms: r.antal_vaerelser != null ? String(r.antal_vaerelser) : null,
      ownerName: r.ejer_navn ?? null,
      ownerKind,
      ownerAddress: r.ejer_adresse ?? null,
      livesInProperty: r.bor_i_lejlighed ?? null,
      lastSalePrice,
      lastSaleDate,
      grundskyldKr: grundskyld,
      importSource: 'lovable',
    };

    const result = await db
      .insert(properties)
      .values(data)
      .onConflictDoUpdate({
        target: properties.bfeNumber,
        set: { ...data, updatedAt: new Date() },
      })
      .returning({ id: properties.id });
    if (result.length) inserted++;
  }
  return { inserted, updated, skipped, total: rows.length };
}

async function migrateLeads(rows: LeadsRow[]) {
  let inserted = 0, skipped = 0;
  // Pre-fetch property by bfe_number → uuid map for bolig_id lookup
  const props = await db
    .select({ id: properties.id, bfe: properties.bfeNumber })
    .from(properties);
  // Lovable's bolig_id is BIGINT — but we only have bfe_nummer in v2.
  // For now: skip property matching unless we have bfe-mapping data.
  // Will be resolved on subsequent run when boliger.id → bfe lookup is available.

  // Validate stages exist
  const validStages = new Set(
    (await db.select({ slug: pipelineStages.slug }).from(pipelineStages)).map((s) => s.slug),
  );

  for (const r of rows) {
    const stageSlug = STAGE_MAP[r.status] ?? 'ny-lead';
    if (!validStages.has(stageSlug)) {
      skipped++;
      continue;
    }
    const data = {
      id: r.id, // preserve UUID
      fullName: r.navn,
      email: r.email ?? null,
      phone: r.telefon ?? null,
      address: r.adresse ?? null,
      city: r.kommune ?? null,
      kvm: r.stoerrelse ?? null,
      rooms: r.vaerelser != null ? String(r.vaerelser) : null,
      conditionRating: r.stand ?? null,
      notes: r.stand_notat ?? null,
      stageSlug,
      stageChangedAt: parseDate(r.stage_changed_at) ?? new Date(r.created_at),
      bidDkk: r.bud_dkk ?? parsePrice(r.bud),
      bidStatus:
        r.bud_status === 'afgivet' || r.bud_status === 'accepteret' || r.bud_status === 'afvist'
          ? r.bud_status
          : null,
      priority: r.priority === 'high' ? 3 : r.priority === 'low' ? 0 : 1,
      source: r.source ?? null,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
    await db.insert(leads).values(data).onConflictDoUpdate({
      target: leads.id,
      set: { ...data, updatedAt: new Date() },
    });
    inserted++;
  }
  return { inserted, skipped, total: rows.length };
}

async function migrateCommunications(rows: KommunikationRow[]) {
  let inserted = 0, skipped = 0;
  // Pre-fetch existing lead IDs to avoid FK violation
  const existingLeadIds = new Set(
    (await db.select({ id: leads.id }).from(leads)).map((l) => l.id),
  );

  for (const r of rows) {
    if (!existingLeadIds.has(r.lead_id)) {
      skipped++;
      continue;
    }
    const direction = r.type === 'email' && r.besked.includes('📤') ? 'out' : 'in';
    const data = {
      leadId: r.lead_id,
      type: r.type,
      direction,
      body: r.besked,
      createdAt: new Date(r.created_at),
    };
    await db.insert(leadCommunications).values(data);
    inserted++;
  }
  return { inserted, skipped, total: rows.length };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const table = url.searchParams.get('table');
  const body = await req.json();
  const rows = body.rows;

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'body.rows must be array' }, { status: 400 });
  }

  try {
    let result;
    if (table === 'properties') result = await migrateProperties(rows);
    else if (table === 'leads') result = await migrateLeads(rows);
    else if (table === 'communications') result = await migrateCommunications(rows);
    else {
      return NextResponse.json(
        { error: 'table must be properties|leads|communications' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, table, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
