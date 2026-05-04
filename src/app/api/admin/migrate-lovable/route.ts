/**
 * POST /api/admin/migrate-lovable?table={properties|leads|communications}
 *
 * One-shot migration fra Lovable's "Deal Flow Hub" Supabase til crm-v2.
 * Idempotent: properties via bfe_number unique, leads via id (UUID preserved).
 *
 * Body: { rows: Array<LovableRow> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  properties,
  leads,
  leadCommunications,
  housingAssociations,
  pipelineStages,
  portfolioCompanies,
  portfolioProperties,
  tenants,
  leaseAgreements,
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

    // Cap rooms at 99.9 (numeric(3,1) limit) — værdier over er ejerforening-summary rows
    const rooms =
      r.antal_vaerelser != null && r.antal_vaerelser <= 99 ? String(r.antal_vaerelser) : null;
    // Skip Invalid Date (e.g. "1970-01-01" in Lovable means "ukendt" — use null)
    const safeLastSaleDate =
      lastSaleDate && lastSaleDate.getFullYear() > 1990 ? lastSaleDate : null;

    const data = {
      bfeNumber: String(r.bfe_nummer),
      address: r.adresse,
      postalCode: r.postnr ?? '0000',
      city: r.by_navn ?? 'Ukendt',
      associationId,
      kvm: r.kvm ?? null,
      rooms,
      ownerName: r.ejer_navn ?? null,
      ownerKind,
      ownerAddress: r.ejer_adresse ?? null,
      livesInProperty: r.bor_i_lejlighed ?? null,
      lastSalePrice,
      lastSaleDate: safeLastSaleDate,
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
    const rooms =
      r.vaerelser != null && r.vaerelser <= 99 ? String(r.vaerelser) : null;
    const data = {
      id: r.id, // preserve UUID
      fullName: r.navn,
      email: r.email ?? null,
      phone: r.telefon ?? null,
      address: r.adresse ?? null,
      city: r.kommune ?? null,
      kvm: r.stoerrelse ?? null,
      rooms,
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

interface PortfolioRow {
  id: number;
  bfe_nummer: number;
  adresse: string;
  postnr?: string | null;
  by_navn?: string | null;
  kommune?: string | null;
  energimaerke?: string | null;
  opfoerelsesaar?: number | null;
  antal_vaerelser?: number | null;
  enhedsareal_beboelse?: number | null;
  seneste_handelspris?: string | null;
  seneste_handelsdato?: string | null;
  type?: string | null;
  vejnavn?: string | null;
  husnr?: string | null;
  etage?: string | null;
  doer?: string | null;
}

async function migratePortfolio(rows: PortfolioRow[]) {
  let inserted = 0, skipped = 0;
  // Default selskab — Sommerhave ApS
  const companies = await db.select().from(portfolioCompanies);
  const defaultCompany = companies.find((c) => /sommerhave/i.test(c.name)) ?? companies[0];
  if (!defaultCompany) {
    return { inserted: 0, skipped: rows.length, total: rows.length, error: 'no portfolio_companies seeded' };
  }
  // Match property by bfe_number
  const propsByBfe = new Map(
    (await db.select({ id: properties.id, bfe: properties.bfeNumber }).from(properties))
      .filter((p) => p.bfe)
      .map((p) => [p.bfe!, p.id]),
  );

  for (const r of rows) {
    if (!r.bfe_nummer || !r.adresse) {
      skipped++;
      continue;
    }
    const rooms =
      r.antal_vaerelser != null && r.antal_vaerelser <= 99 ? String(r.antal_vaerelser) : null;
    const purchasePrice = parsePrice(r.seneste_handelspris);
    const purchaseDate = parseDate(r.seneste_handelsdato);
    const safePurchaseDate = purchaseDate && purchaseDate.getFullYear() > 1990 ? purchaseDate : null;

    const data = {
      companyId: defaultCompany.id,
      propertyId: propsByBfe.get(String(r.bfe_nummer)) ?? null,
      address: r.adresse,
      postalCode: r.postnr ?? '0000',
      city: r.by_navn ?? 'Ukendt',
      kommune: r.kommune ?? null,
      kvm: r.enhedsareal_beboelse ?? null,
      rooms,
      yearBuilt: r.opfoerelsesaar ?? null,
      energyClass: r.energimaerke ?? null,
      purchasePrice,
      purchaseDate: safePurchaseDate,
    };
    await db.insert(portfolioProperties).values(data);
    inserted++;
  }
  return { inserted, skipped, total: rows.length };
}

interface LejemaalRow {
  id: number;
  adresse: string;
  lejer: string;
  nummer?: string | null;
  status?: string | null;
  areal?: number | null;
  boligleje?: number | null;
  leje_pr_kvm?: number | null;
  aarlig_leje?: number | null;
  indflytning?: string | null;
  udflytning?: string | null;
  created_at?: string | null;
}

// "Date(2024,7,1)" → JS Date (month 0-indexed) → 2024-08-01
function parseDateFn(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = String(s).match(/Date\((\d+),(\d+),(\d+)\)/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
  return parseDate(s);
}

async function migrateLeases(rows: LejemaalRow[]) {
  let inserted = 0, skipped = 0;
  // Match portfolio_property by address
  const portfolios = await db.select({ id: portfolioProperties.id, address: portfolioProperties.address }).from(portfolioProperties);
  const propByAddr = new Map(portfolios.map((p) => [p.address.toLowerCase().replace(/\s+/g, ' ').trim(), p.id]));

  for (const r of rows) {
    if (!r.adresse || !r.lejer) {
      skipped++;
      continue;
    }
    const propId = propByAddr.get(r.adresse.toLowerCase().replace(/\s+/g, ' ').trim());
    if (!propId) {
      skipped++;
      continue;
    }
    const startDate = parseDateFn(r.indflytning);
    if (!startDate) {
      skipped++;
      continue;
    }
    const endDate = parseDateFn(r.udflytning);
    const monthlyRent = r.boligleje ?? 0;
    if (monthlyRent <= 0) {
      skipped++;
      continue;
    }
    // Insert tenant first
    const [tenant] = await db
      .insert(tenants)
      .values({ fullName: r.lejer })
      .returning({ id: tenants.id });

    // Insert lease
    await db.insert(leaseAgreements).values({
      portfolioPropertyId: propId,
      tenantId: tenant.id,
      monthlyRentDkk: monthlyRent,
      startDate,
      endDate,
      notes: r.nummer ? `Lejemål nr. ${r.nummer}` : null,
    });
    inserted++;
  }
  return { inserted, skipped, total: rows.length };
}

interface LeadPropertyLinkRow {
  leadId: string;
  bfeNumber: number;
}

async function linkLeadsToProperties(rows: LeadPropertyLinkRow[]) {
  let linked = 0, missingProperty = 0, missingLead = 0;
  // Pre-fetch property by bfe → uuid map
  const propsByBfe = new Map(
    (await db.select({ id: properties.id, bfe: properties.bfeNumber }).from(properties))
      .filter((p) => p.bfe)
      .map((p) => [p.bfe!, p.id]),
  );
  const existingLeadIds = new Set(
    (await db.select({ id: leads.id }).from(leads)).map((l) => l.id),
  );

  for (const r of rows) {
    if (!existingLeadIds.has(r.leadId)) {
      missingLead++;
      continue;
    }
    const propId = propsByBfe.get(String(r.bfeNumber));
    if (!propId) {
      missingProperty++;
      continue;
    }
    await db
      .update(leads)
      .set({ propertyId: propId, updatedAt: new Date() })
      .where(eq(leads.id, r.leadId));
    linked++;
  }
  return { linked, missingProperty, missingLead, total: rows.length };
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
    else if (table === 'portfolio') result = await migratePortfolio(rows);
    else if (table === 'leases') result = await migrateLeases(rows);
    else if (table === 'lead-property-links') result = await linkLeadsToProperties(rows);
    else {
      return NextResponse.json(
        { error: 'table must be properties|leads|communications|portfolio|leases' },
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
