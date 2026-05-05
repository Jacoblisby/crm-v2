/**
 * Query-laget. Alle SQL-queries lever her, ikke i page-komponenter.
 *
 * Hvorfor:
 * - Test-bart (vi kan mocke db i route-tests)
 * - Single source of truth (en query bruges ofte to steder, fx Inbox + Lead Detail)
 * - Vi kan tilføje cache, retry, telemetry uden at røre routes
 *
 * Hver query returnerer Drizzle-typede rækker.
 */
import { and, desc, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from './client';
import {
  leads,
  leadCommunications,
  leadStageHistory,
  pipelineStages,
  housingAssociations,
  properties,
  onMarketCandidates,
  events,
} from './schema';

// ─── Pipeline stages ──────────────────────────────────────────────────────

export async function listPipelineStages() {
  return db.select().from(pipelineStages).orderBy(pipelineStages.sortOrder);
}

export async function getStageBySlug(slug: string) {
  const rows = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Leads ─────────────────────────────────────────────────────────────────

// Boligberegner-leads har source der starter med 'boligberegner' (fx
// 'boligberegner' eller 'boligberegner-out-of-area'). Vi ekskluderer dem
// fra Inbox + Pipeline-views, så de holdes på deres egen /off-market-side.

/**
 * Liste af aktive leads (ikke i terminale stages, ikke soft-deleted, ikke boligberegner).
 * Joiner pipeline_stages så vi kan beregne SLA i app-laget.
 */
export async function listActiveLeadsWithStage() {
  return db
    .select({
      lead: leads,
      stage: pipelineStages,
    })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .where(
      and(
        eq(pipelineStages.isTerminal, false),
        isNull(leads.deletedAt),
        sql`(${leads.source} IS NULL OR ${leads.source} NOT LIKE 'boligberegner%')`,
      ),
    )
    .orderBy(leads.stageChangedAt);
}

/**
 * Pipeline-view: alle ikke-terminale leads, til kanban.
 * Forskellen til listActive er sortering — pipeline sorterer nyeste først.
 */
export async function listLeadsForPipeline() {
  return db
    .select({
      lead: leads,
      stage: pipelineStages,
    })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .where(
      and(
        ne(leads.stageSlug, 'arkiveret'),
        ne(leads.stageSlug, 'tabt'),
        isNull(leads.deletedAt),
        // Boligberegner-leads har deres egen /off-market liste — ekskluder fra pipeline
        sql`(${leads.source} IS NULL OR ${leads.source} NOT LIKE 'boligberegner%')`,
      ),
    )
    .orderBy(desc(leads.stageChangedAt));
}

export async function getLeadById(id: string) {
  const rows = await db
    .select({
      lead: leads,
      stage: pipelineStages,
      property: properties,
    })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .leftJoin(properties, eq(leads.propertyId, properties.id))
    .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Liste af aktive leads sorteret efter seneste kommunikation (nyeste først).
 * Til Inbox "Samtaler"-view. Inkluderer `latestComm` (kan være null hvis aldrig kontaktet).
 */
export async function listLeadsByLatestComm() {
  // Subquery: latest comm per lead via DISTINCT ON
  const latestComms = db
    .selectDistinctOn([leadCommunications.leadId], {
      leadId: leadCommunications.leadId,
      type: leadCommunications.type,
      direction: leadCommunications.direction,
      subject: leadCommunications.subject,
      body: leadCommunications.body,
      createdAt: leadCommunications.createdAt,
    })
    .from(leadCommunications)
    .orderBy(leadCommunications.leadId, desc(leadCommunications.createdAt))
    .as('latest_comms');

  return db
    .select({
      lead: leads,
      stage: pipelineStages,
      latestComm: {
        type: latestComms.type,
        direction: latestComms.direction,
        subject: latestComms.subject,
        body: latestComms.body,
        createdAt: latestComms.createdAt,
      },
    })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .leftJoin(latestComms, eq(latestComms.leadId, leads.id))
    .where(
      and(
        eq(pipelineStages.isTerminal, false),
        isNull(leads.deletedAt),
        sql`(${leads.source} IS NULL OR ${leads.source} NOT LIKE 'boligberegner%')`,
      ),
    )
    .orderBy(
      sql`${latestComms.createdAt} DESC NULLS LAST`,
      desc(leads.stageChangedAt),
    );
}

/**
 * Off-market leads — alle der er kommet ind via boligberegneren.
 * Til /off-market list-view. Sorteres nyeste først (efter stage_changed_at som
 * er sat ved oprettelse).
 */
export async function listOffMarketLeads() {
  return db
    .select({
      lead: leads,
      stage: pipelineStages,
    })
    .from(leads)
    .innerJoin(pipelineStages, eq(leads.stageSlug, pipelineStages.slug))
    .where(
      and(
        isNull(leads.deletedAt),
        sql`${leads.source} LIKE 'boligberegner%'`,
      ),
    )
    .orderBy(desc(leads.stageChangedAt));
}

export async function getLeadCommunications(leadId: string) {
  return db
    .select()
    .from(leadCommunications)
    .where(eq(leadCommunications.leadId, leadId))
    .orderBy(desc(leadCommunications.createdAt));
}

export async function getLeadStageHistory(leadId: string) {
  return db
    .select()
    .from(leadStageHistory)
    .where(eq(leadStageHistory.leadId, leadId))
    .orderBy(desc(leadStageHistory.changedAt));
}

// ─── Properties + housing associations ────────────────────────────────────

export async function listHousingAssociations() {
  return db.select().from(housingAssociations).orderBy(housingAssociations.name);
}

export async function listPropertiesByAssociation(associationId: string) {
  return db
    .select()
    .from(properties)
    .where(and(eq(properties.associationId, associationId), isNull(properties.deletedAt)))
    .orderBy(properties.address);
}

// ─── On-market kandidater ────────────────────────────────────────────────

export async function listActiveOnMarketCandidates() {
  return db
    .select()
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.status, 'active'))
    .orderBy(desc(onMarketCandidates.scrapedAt));
}

export async function listOnMarketCandidates(opts: {
  status?: 'active' | 'sold' | 'all';
  reviewStatus?: 'all' | 'ny' | 'interesseret' | 'passet' | 'købt';
} = {}) {
  const status = opts.status ?? 'active';
  const reviewStatus = opts.reviewStatus ?? 'all';

  // Sortér efter ROE-margin desc (bedste deals øverst), null/0 i bunden.
  // Recency tie-break når marginer er ens.
  const orderBy = [
    sql`${onMarketCandidates.marginPct} DESC NULLS LAST`,
    desc(onMarketCandidates.scrapedAt),
  ];

  const conditions = [];
  if (status !== 'all') conditions.push(eq(onMarketCandidates.status, status));
  if (reviewStatus !== 'all') conditions.push(eq(onMarketCandidates.reviewStatus, reviewStatus));

  let query = db.select().from(onMarketCandidates).$dynamic();
  if (conditions.length > 0) query = query.where(and(...conditions));
  return query.orderBy(...orderBy);
}

export async function getOnMarketCandidateById(id: string) {
  const rows = await db
    .select()
    .from(onMarketCandidates)
    .where(eq(onMarketCandidates.id, id));
  return rows[0] ?? null;
}

// ─── Events ────────────────────────────────────────────────────────────────

export async function logEvent(input: {
  type: string;
  actor?: string;
  leadId?: string;
  propertyId?: string;
  payload?: Record<string, unknown>;
}) {
  await db.insert(events).values({
    type: input.type,
    actor: input.actor ?? null,
    leadId: input.leadId ?? null,
    propertyId: input.propertyId ?? null,
    payload: input.payload ?? {},
  });
}

// ─── Optimistisk concurrency helper ───────────────────────────────────────

/**
 * Updater en lead-række kun hvis updated_at matcher det klienten har set.
 * Returnerer antal opdaterede rækker (0 = nogen anden har ændret den siden).
 */
export async function updateLeadIfUnchanged(
  id: string,
  ifUnchangedSince: Date | string,
  patch: Partial<typeof leads.$inferInsert>,
): Promise<number> {
  const since = typeof ifUnchangedSince === 'string' ? ifUnchangedSince : ifUnchangedSince.toISOString();
  const result = await db
    .update(leads)
    .set(patch)
    .where(and(eq(leads.id, id), sql`${leads.updatedAt} = ${since}::timestamptz`))
    .returning({ id: leads.id });
  return result.length;
}
