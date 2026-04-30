/**
 * Re-eksport af de Drizzle-genererede typer + brand types der bruges i UI-laget.
 *
 * Drizzle's $inferSelect/$inferInsert er sandheden for DB-rækker.
 * Disse types er bare aliasser så routes ikke skal importere fra db/schema direkte.
 */
export type {
  PipelineStage,
  HousingAssociation,
  Property,
  Lead,
  LeadCommunication,
  LeadStageHistoryRow,
  Event,
  Campaign,
  PortfolioCompany,
  PortfolioProperty,
  Tenant,
  LeaseAgreement,
  OnMarketCandidate,
} from './db/schema';

// SLA-status som beregnes af vw_leads_with_sla view eller computeSLA() i kode.
export type SLAStatus = 'breach' | 'warning' | 'ok';

// Lead-row beriget med SLA-felter (svarer 1:1 til vw_leads_with_sla).
import type { Lead } from './db/schema';
export type LeadWithSLA = Lead & {
  stage_name: string;
  sla_days: number | null;
  is_terminal: boolean;
  is_bid_ready: boolean;
  stage_color: string | null;
  stage_sort_order: number;
  days_in_stage: number;
  sla_status: SLAStatus;
};

// Subset of pipeline_stages der bruges i UI hvor vi ikke vil hente alt fra DB
// (fx hardcoded fallback hvis pipeline_stages ikke er seedet).
export const STAGE_FALLBACK = [
  { slug: 'ny-lead',         name: 'Ny lead',         sortOrder: 10 },
  { slug: 'kontaktet',       name: 'Kontaktet',       sortOrder: 20 },
  { slug: 'mail-sendt',      name: 'Mail sendt',      sortOrder: 30 },
  { slug: 'interesse',       name: 'Interesse',       sortOrder: 40 },
  { slug: 'afventer-lejer',  name: 'Afventer lejer',  sortOrder: 50 },
  { slug: 'fremvisning',     name: 'Fremvisning',     sortOrder: 60 },
  { slug: 'aktivt-bud',      name: 'Aktivt bud',      sortOrder: 70 },
  { slug: 'koebt',           name: 'Købt',            sortOrder: 80 },
] as const;
