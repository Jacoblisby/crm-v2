/**
 * Schema-types for 365 Ejendomme CRM v2.
 * Mirror af eksisterende Loveable-Supabase-skema (project 46b03c04-...).
 *
 * Stages tilføjes via migration 0001_add_archive_stages.sql i Uge 3:
 *   'Arkiveret' og 'Tabt' (terminale stages, ingen SLA)
 */

export type LeadStage =
  | 'Ny'
  | 'Kvalificering'
  | 'Interesse'
  | 'Fremvisning'
  | 'Aktivt bud'
  | 'Underskrevet'
  | 'Lukket'
  | 'Arkiveret'  // ← v2 tilføjelse
  | 'Tabt';      // ← v2 tilføjelse

export type SLAStatus = 'breach' | 'warning' | 'ok';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  stage_changed_at: string;

  // Identitet
  full_name: string | null;
  email: string | null;
  phone: string | null;

  // Bolig
  address: string | null;
  postal_code: string | null;
  city: string | null;
  property_type: string | null;
  housing_area_m2: number | null;
  rooms: number | null;
  year_built: number | null;
  list_price: number | null;

  // Pipeline
  stage: LeadStage;
  notes: string | null;

  // Kampagne (off-market — fra brevkampagner)
  campaign_id: string | null;
  campaign_letter_sent_at: string | null;

  // Computed (via vw_leads_with_sla)
  sla_status?: SLAStatus;
  days_in_stage?: number;
}

export interface LeadCommunication {
  id: string;
  lead_id: string;
  created_at: string;
  type: 'email' | 'phone' | 'sms' | 'note' | 'letter';
  direction: 'in' | 'out';
  subject: string | null;
  body: string | null;
  resend_id: string | null;  // Resend message ID for emails
}

export interface LeadStageHistory {
  id: string;
  lead_id: string;
  changed_at: string;
  from_stage: LeadStage | null;
  to_stage: LeadStage;
  changed_by: string | null;  // User email/name
}

export interface OnMarketCandidate {
  id: string;
  scraped_at: string;
  source: 'boligsiden';
  source_id: string;          // Boligsiden caseID
  source_url: string;          // Boligsiden adresse-URL
  case_url: string | null;     // Mæglerens egen URL
  realtor_name: string | null;
  broker_kind: string | null;  // 'edc' | 'nybolig' | 'home' | ... | 'unknown'

  address: string;
  postal_code: string;
  city: string;
  housing_area_m2: number;
  rooms: number;
  year_built: number | null;
  list_price: number;
  monthly_expense: number | null;

  // AVM-output (Uge 5)
  avm_value: number | null;
  avm_calculated_at: string | null;

  // Tilbud (Uge 6 — efter tilbudsformel)
  bid_dkk: number | null;
  margin_pct: number | null;

  // Salgsopstilling-tracking
  pdf_filename: string | null;
  pdf_status: 'pending' | 'downloaded' | 'failed' | 'pending_email' | 'pending_login';
  pdf_downloaded_at: string | null;

  // Status
  status: 'active' | 'sold' | 'withdrawn' | 'archived';
}

/**
 * SLA-grænser per stage (dage).
 * Defineret eksplicit i design-doc'en. Terminale stages har ingen SLA.
 */
export const SLA_DAYS: Record<LeadStage, number | null> = {
  'Ny': 1,
  'Kvalificering': 3,
  'Interesse': 7,
  'Fremvisning': 14,
  'Aktivt bud': 7,
  'Underskrevet': 14,
  'Lukket': null,
  'Arkiveret': null,
  'Tabt': null,
};

export const BID_READY_STAGES: LeadStage[] = ['Interesse', 'Fremvisning', 'Aktivt bud'];
