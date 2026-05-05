/**
 * 365 Ejendomme — CRM v2 datalag
 * Drizzle schema, single source of truth for hele datamodellen.
 *
 * Filosofi:
 * 1. Stages er ROWS (ikke enum) → tilføj/omdøb uden migration.
 * 2. Optimistisk concurrency via updated_at på alle muterbare rækker.
 * 3. Soft-delete (deleted_at) på rækker med kommunikationshistorik.
 * 4. Generisk events-tabel = audit + replay + analytics.
 * 5. Boliger og Ejerforeninger er first-class entities, ikke felter på leads.
 *
 * Domæner (sektioner nedenfor):
 *   A. Pipeline-stages
 *   B. Boliger + ejerforeninger (kampagne-target-databasen, 1.900 rækker)
 *   C. Kampagner (brevkampagner, 6/år)
 *   D. Leads + kommunikation + historik
 *   E. Generisk events-log (audit)
 *   F. Portefølje (Jacob's egne ejendomme + lejere + lejekontrakter)
 *   G. On-market kandidater (4700 Næstved scrape)
 *   H. Auth (better-auth tabeller)
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  bigint,
  numeric,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ─── A. Pipeline stages (data, ikke enum) ─────────────────────────────────

export const pipelineStages = pgTable(
  'pipeline_stages',
  {
    slug: text('slug').primaryKey(), // 'ny-lead', 'kontaktet', ...
    name: text('name').notNull(), // 'Ny lead', 'Kontaktet', ...
    slaDays: integer('sla_days'), // null = terminal stage uden SLA
    isTerminal: boolean('is_terminal').notNull().default(false),
    isBidReady: boolean('is_bid_ready').notNull().default(false),
    sortOrder: integer('sort_order').notNull(),
    color: text('color'), // hex eller tailwind-klasse, til UI
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pipeline_stages_sort_idx').on(t.sortOrder)],
);

// ─── B. Boliger + ejerforeninger ──────────────────────────────────────────

export const housingAssociations = pgTable(
  'housing_associations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // 'Benløseparken', 'Lindebo', ...
    streetName: text('street_name'), // 'Benløseparken' (vej, kan matche navn)
    postalCode: text('postal_code'),
    city: text('city'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('housing_associations_name_idx').on(t.name)],
);

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Dansk BFE-nummer = unik identifier for matrikulær enhed (sikkerhed mod
    // duplikater ved gen-import af xlsx)
    bfeNumber: text('bfe_number'),

    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    city: text('city').notNull(),

    associationId: uuid('association_id').references(() => housingAssociations.id),

    // Bolig-attributter
    propertyType: text('property_type').notNull().default('Ejerlejlighed'),
    kvm: integer('kvm'),
    rooms: numeric('rooms', { precision: 3, scale: 1 }),
    yearBuilt: integer('year_built'),
    energyClass: text('energy_class'), // 'A'..'G', null hvis ukendt

    // Ejer-info (fra OIS / xlsx-import)
    ownerName: text('owner_name'),
    ownerKind: text('owner_kind'), // 'private' | 'company' | 'unknown'
    ownerAddress: text('owner_address'),
    livesInProperty: boolean('lives_in_property'), // null = ukendt; udlejer-detektion

    // Senest registrerede handel (fra OIS)
    lastSalePrice: bigint('last_sale_price', { mode: 'number' }),
    lastSaleDate: timestamp('last_sale_date', { withTimezone: true, mode: 'date' }),
    grundskyldKr: integer('grundskyld_kr'), // årlig grundskyld

    // Sporing af kampagne-aktivitet
    lastLetterSentAt: timestamp('last_letter_sent_at', { withTimezone: true }),
    contactedAt: timestamp('contacted_at', { withTimezone: true }), // første gang lead konverteret

    // Provenance
    importedFromXlsxAt: timestamp('imported_from_xlsx_at', { withTimezone: true }),
    importSource: text('import_source'), // 'ois', 'xlsx-blegdammen', 'manual', ...

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('properties_bfe_idx').on(t.bfeNumber),
    index('properties_association_idx').on(t.associationId),
    index('properties_postal_code_idx').on(t.postalCode),
    index('properties_owner_kind_idx').on(t.ownerKind),
  ],
);

// ─── C. Kampagner (brevkampagner, 6/år) ───────────────────────────────────

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // 'kampagne-2026-04', ...
  kind: text('kind').notNull(), // 'letter' | 'email' | 'phone'
  sentAt: timestamp('sent_at', { withTimezone: true }),
  recipientsCount: integer('recipients_count'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campaignRecipients = pgTable(
  'campaign_recipients',
  {
    campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
    propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.campaignId, t.propertyId] })],
);

// ─── D. Leads + kommunikation + stage-historik ────────────────────────────

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Kontakt
    fullName: text('full_name'),
    email: text('email'),
    phone: text('phone'),

    // Bolig — kobles til property hvis match findes (via "Match med boliger")
    propertyId: uuid('property_id').references(() => properties.id),

    // Snapshot-data (når lead ikke er matchet endnu, eller ejer-info afviger)
    address: text('address'),
    postalCode: text('postal_code'),
    city: text('city'),
    propertyType: text('property_type'),
    kvm: integer('kvm'),
    rooms: numeric('rooms', { precision: 3, scale: 1 }),
    yearBuilt: integer('year_built'),
    listPrice: bigint('list_price', { mode: 'number' }),

    // Pipeline
    stageSlug: text('stage_slug')
      .notNull()
      .references(() => pipelineStages.slug)
      .default('ny-lead'),
    stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }).notNull().defaultNow(),

    // Vurdering / lead-rating
    conditionRating: integer('condition_rating'), // 0-10 fra Loveable's "Stand"-felt
    valuationDkk: bigint('valuation_dkk', { mode: 'number' }), // estimeret/AVM-værdi
    bidDkk: bigint('bid_dkk', { mode: 'number' }), // afgivet bud
    bidStatus: text('bid_status'), // 'afgivet' | 'accepteret' | 'afvist' | 'modtilbud'

    // Workflow
    priority: integer('priority').notNull().default(0), // 0-5 stjerner
    source: text('source'), // 'brev' | 'telefon' | 'website' | 'henvisning'
    assignedTo: text('assigned_to'),
    notes: text('notes'),

    // Boligberegner inputs (snapshot ved submit) — bruges til at re-køre afkast i CRM
    afkastInputs: jsonb('afkast_inputs').$type<{
      rentMd?: number;
      driftTotal?: number;
      refurbTotal?: number;
      haeftelseEf?: number;
      betalingPrMio?: number;
      targetRoe?: number;
      listePris?: number;
      // Comparables snapshot
      medianPricePerSqm?: number;
      sampleSize?: number;
      sameEfCount?: number;
      // Leje-kilde (vores faktiske data eller postnr-fallback)
      rentSource?: 'same-vej' | 'same-postal' | 'no-match' | 'kvm-fallback';
      rentSampleSize?: number;
      // Udspecificerede driftsomkostninger (kr/år) — så vi kan se hvad der gik ind
      costFaellesudgifter?: number;
      costGrundvaerdi?: number;
      costFaelleslaan?: number;
      costRenovation?: number;
      costForsikringer?: number;
      costRottebekempelse?: number;
      costAndreDrift?: number;
      // Vand/varme — ikke i drift, men gemt til reference
      waterCost?: number;
      waterPaidViaAssoc?: boolean;
      heatCost?: number;
      heatPaidViaAssoc?: boolean;
      // Fælleslån-detaljer
      faelleslaanCanPrepay?: 'ja' | 'nej' | 'vedikke' | null;
    }>(),

    // Kampagne-tracking
    campaignId: uuid('campaign_id').references(() => campaigns.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('leads_stage_idx').on(t.stageSlug),
    index('leads_stage_changed_at_idx').on(t.stageChangedAt),
    index('leads_property_idx').on(t.propertyId),
    index('leads_email_idx').on(t.email),
    index('leads_campaign_idx').on(t.campaignId),
  ],
);

export const leadCommunications = pgTable(
  'lead_communications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'email' | 'phone' | 'sms' | 'note' | 'letter'
    direction: text('direction').notNull(), // 'in' | 'out'
    subject: text('subject'),
    body: text('body'),
    resendId: text('resend_id'), // Resend message ID når email sendt fra v2
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: text('created_by'),
  },
  (t) => [
    index('lead_communications_lead_idx').on(t.leadId, t.createdAt),
    index('lead_communications_resend_idx').on(t.resendId),
  ],
);

export const leadStageHistory = pgTable(
  'lead_stage_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    fromStage: text('from_stage').references(() => pipelineStages.slug),
    toStage: text('to_stage').notNull().references(() => pipelineStages.slug),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: text('changed_by'),
  },
  (t) => [index('lead_stage_history_lead_idx').on(t.leadId, t.changedAt)],
);

// ─── E. Events (generisk audit log + replay + analytics) ──────────────────

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),

    // Hvem/hvad
    actor: text('actor'), // user-email, 'system', 'cron:scrape-boligsiden'
    type: text('type').notNull(), // 'lead.created', 'lead.stage_changed', 'lead.bid_changed', 'email.sent', 'property.imported', ...

    // Hvem hænder det på (optional FKs — events kan også være system-events uden subject)
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),

    // Fri payload — type-specifikt JSON
    payload: jsonb('payload').notNull().default({}),
  },
  (t) => [
    index('events_occurred_at_idx').on(t.occurredAt),
    index('events_lead_idx').on(t.leadId, t.occurredAt),
    index('events_type_idx').on(t.type, t.occurredAt),
  ],
);

// ─── F. Portefølje (Jacob's egne ejendomme + lejere + leje) ───────────────

export const portfolioCompanies = pgTable(
  'portfolio_companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(), // 'Sommerhave ApS', 'Herlufshave ApS', ...
    cvr: text('cvr'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('portfolio_companies_name_idx').on(t.name)],
);

export const portfolioProperties = pgTable(
  'portfolio_properties',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => portfolioCompanies.id),

    // Match til den fælles properties-tabel hvis muligt (samme BFE-nummer)
    propertyId: uuid('property_id').references(() => properties.id),

    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    city: text('city').notNull(),
    kommune: text('kommune'),
    propertyType: text('property_type').notNull().default('Ejerlejlighed'),
    kvm: integer('kvm'),
    rooms: numeric('rooms', { precision: 3, scale: 1 }),
    yearBuilt: integer('year_built'),
    energyClass: text('energy_class'),

    purchasePrice: bigint('purchase_price', { mode: 'number' }),
    purchaseDate: timestamp('purchase_date', { withTimezone: true, mode: 'date' }),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('portfolio_properties_company_idx').on(t.companyId),
    index('portfolio_properties_kommune_idx').on(t.kommune),
  ],
);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tenants_email_idx').on(t.email)],
);

export const leaseAgreements = pgTable(
  'lease_agreements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    portfolioPropertyId: uuid('portfolio_property_id')
      .notNull()
      .references(() => portfolioProperties.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),

    monthlyRentDkk: integer('monthly_rent_dkk').notNull(), // mdr. leje i kr
    deposit: integer('deposit_dkk'), // depositum
    prepaidRent: integer('prepaid_rent_dkk'), // forudbetalt leje
    startDate: timestamp('start_date', { withTimezone: true, mode: 'date' }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true, mode: 'date' }), // null = løbende
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('lease_agreements_property_idx').on(t.portfolioPropertyId),
    index('lease_agreements_tenant_idx').on(t.tenantId),
  ],
);

// ─── G. On-market kandidater (Boligsiden 4700 Næstved scrape) ─────────────

export const onMarketCandidates = pgTable(
  'on_market_candidates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scrapedAt: timestamp('scraped_at', { withTimezone: true }).notNull().defaultNow(),
    source: text('source').notNull().default('boligsiden'),
    sourceId: text('source_id').notNull(),
    sourceUrl: text('source_url').notNull(),
    caseUrl: text('case_url'),
    realtorName: text('realtor_name'),
    brokerKind: text('broker_kind'),

    // Matched til property hvis BFE / adresse matcher
    propertyId: uuid('property_id').references(() => properties.id),

    address: text('address').notNull(),
    postalCode: text('postal_code').notNull(),
    city: text('city').notNull(),
    kvm: integer('kvm').notNull(),
    rooms: numeric('rooms', { precision: 3, scale: 1 }),
    yearBuilt: integer('year_built'),
    listPrice: bigint('list_price', { mode: 'number' }).notNull(),
    monthlyExpense: integer('monthly_expense'),

    // Beskrivelse + medier (fra boligsiden-scrape)
    description: text('description'),
    primaryImage: text('primary_image'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    m2Pris: integer('m2_pris'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }),

    // Udspecificerede ejerudgifter (fra prospekt) — DKK/år
    costGrundvaerdi: integer('cost_grundvaerdi').notNull().default(0),
    costFaellesudgifter: integer('cost_faellesudgifter').notNull().default(0),
    costRottebekempelse: integer('cost_rottebekempelse').notNull().default(0),
    costRenovation: integer('cost_renovation').notNull().default(0),
    costForsikringer: integer('cost_forsikringer').notNull().default(0),
    costFaelleslaan: integer('cost_faelleslaan').notNull().default(0),
    costGrundfond: integer('cost_grundfond').notNull().default(0),
    costVicevaert: integer('cost_vicevaert').notNull().default(0),
    costVedligeholdelse: integer('cost_vedligeholdelse').notNull().default(0),
    costAndreDrift: integer('cost_andre_drift').notNull().default(0),

    // Istandsættelse (refurbish) — engangsomkostninger DKK
    refurbGulv: integer('refurb_gulv').notNull().default(0),
    refurbMaling: integer('refurb_maling').notNull().default(0),
    refurbRengoring: integer('refurb_rengoring').notNull().default(0),
    refurbAndre: integer('refurb_andre').notNull().default(0),

    // Brugerredigerbare estimater
    estimeretLejeMd: integer('estimeret_leje_md'),
    forhandletPris: bigint('forhandlet_pris', { mode: 'number' }),

    // AVM (Uge 5)
    avmValue: bigint('avm_value', { mode: 'number' }),
    avmCalculatedAt: timestamp('avm_calculated_at', { withTimezone: true }),

    // Tilbud (Uge 6)
    bidDkk: bigint('bid_dkk', { mode: 'number' }),
    marginPct: numeric('margin_pct', { precision: 5, scale: 2 }),
    afkastCalculatedAt: timestamp('afkast_calculated_at', { withTimezone: true }),

    // Salgsopstilling
    pdfFilename: text('pdf_filename'),
    pdfUrl: text('pdf_url'),  // Direkte link til PDF (broker-host)
    pdfStatus: text('pdf_status').notNull().default('pending'),
    pdfDownloadedAt: timestamp('pdf_downloaded_at', { withTimezone: true }),
    pdfFetchAttempts: integer('pdf_fetch_attempts').notNull().default(0),
    pdfLastError: text('pdf_last_error'),

    // Lifecycle: status='active' → 'sold' når listing forsvinder fra Boligsiden
    status: text('status').notNull().default('active'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    soldAt: timestamp('sold_at', { withTimezone: true }),

    // Vores manuelle review-status: 'ny' (default) | 'interesseret' | 'passet' | 'købt'
    // Sættes via UI på listing-detail. Adskilt fra status (lifecycle) — review er kun
    // et flag for *vores* triage, ikke noget der skifter når Boligsiden opdaterer.
    reviewStatus: text('review_status').notNull().default('ny'),
    reviewNote: text('review_note'),
    reviewUpdatedAt: timestamp('review_updated_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('on_market_source_id_idx').on(t.source, t.sourceId),
    index('on_market_postal_code_idx').on(t.postalCode, t.status),
    index('on_market_status_idx').on(t.status, t.scrapedAt),
    index('on_market_property_idx').on(t.propertyId),
  ],
);

// ─── G2. Scrape-jobs — kører nightly, tracker status pr run ──────────────

export const scrapeJobs = pgTable(
  'scrape_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status').notNull().default('running'),  // running | success | failed
    runKind: text('run_kind').notNull().default('cron'),  // cron | manual
    postnrCodes: jsonb('postnr_codes').$type<string[]>().notNull().default([]),
    listingsScraped: integer('listings_scraped').notNull().default(0),
    listingsNew: integer('listings_new').notNull().default(0),
    listingsUpdated: integer('listings_updated').notNull().default(0),
    listingsMarkedSold: integer('listings_marked_sold').notNull().default(0),
    pdfsFetched: integer('pdfs_fetched').notNull().default(0),
    pdfsFailed: integer('pdfs_failed').notNull().default(0),
    afkastRecomputed: integer('afkast_recomputed').notNull().default(0),
    log: text('log'),  // optional summary/log
    error: text('error'),
  },
  (t) => [
    index('scrape_jobs_started_idx').on(t.startedAt),
    index('scrape_jobs_status_idx').on(t.status, t.startedAt),
  ],
);

// ─── H. Auth (better-auth tabeller — autogenereret, men deklareret her) ───
// Genereres af better-auth CLI når Resend SMTP er klar — pladsholder.
// Se src/lib/auth.ts for konfiguration.

// ─── Eksporterede typer (genereret af Drizzle) ────────────────────────────

export type PipelineStage = typeof pipelineStages.$inferSelect;
export type NewPipelineStage = typeof pipelineStages.$inferInsert;
export type HousingAssociation = typeof housingAssociations.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadCommunication = typeof leadCommunications.$inferSelect;
export type LeadStageHistoryRow = typeof leadStageHistory.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type PortfolioCompany = typeof portfolioCompanies.$inferSelect;
export type PortfolioProperty = typeof portfolioProperties.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type LeaseAgreement = typeof leaseAgreements.$inferSelect;
export type OnMarketCandidate = typeof onMarketCandidates.$inferSelect;
export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type NewScrapeJob = typeof scrapeJobs.$inferInsert;
