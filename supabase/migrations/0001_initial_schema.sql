-- 365 Ejendomme — CRM v2 Initial Schema
-- Migration 0001: Core tables for off-market CRM + on-market scraping
--
-- Design-doc: ~/.gstack/projects/Jacoblisby-avm-pipeline/jacoblisby-claude-amazing-lamport-design-20260429-175319.md
-- Note: Pause-recovery situation — vi bygger fresh schema, ikke 1:1 mirror af paused Loveable-DB.

-- ─── Enums ─────────────────────────────────────────────────────────────────

create type lead_stage as enum (
  'Ny',
  'Kvalificering',
  'Interesse',
  'Fremvisning',
  'Aktivt bud',
  'Underskrevet',
  'Lukket',
  'Arkiveret',  -- terminal, ingen SLA
  'Tabt'        -- terminal, ingen SLA
);

create type communication_type as enum ('email', 'phone', 'sms', 'note', 'letter');
create type communication_direction as enum ('in', 'out');

create type pdf_status as enum (
  'pending',
  'downloaded',
  'failed',
  'pending_email',
  'pending_login'
);

create type listing_status as enum ('active', 'sold', 'withdrawn', 'archived');

-- ─── Off-market CRM ────────────────────────────────────────────────────────

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stage_changed_at timestamptz not null default now(),

  -- Identitet
  full_name text,
  email text,
  phone text,

  -- Bolig
  address text,
  postal_code text,
  city text,
  property_type text,
  housing_area_m2 int,
  rooms numeric(3, 1),
  year_built int,
  list_price bigint,

  -- Pipeline
  stage lead_stage not null default 'Ny',
  notes text,

  -- Kampagne
  campaign_id text,
  campaign_letter_sent_at timestamptz
);

create index leads_stage_idx on leads(stage);
create index leads_stage_changed_at_idx on leads(stage_changed_at);
create index leads_email_idx on leads(email);
create index leads_postal_code_idx on leads(postal_code);

-- ─── Communications log ────────────────────────────────────────────────────

create table lead_communications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  type communication_type not null,
  direction communication_direction not null,
  subject text,
  body text,
  resend_id text  -- Resend message ID for emails sent fra v2
);

create index lead_communications_lead_id_idx on lead_communications(lead_id, created_at desc);
create index lead_communications_resend_id_idx on lead_communications(resend_id);

-- ─── Stage history ─────────────────────────────────────────────────────────

create table lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  changed_at timestamptz not null default now(),
  from_stage lead_stage,
  to_stage lead_stage not null,
  changed_by text  -- user email/name
);

create index lead_stage_history_lead_id_idx on lead_stage_history(lead_id, changed_at desc);

-- Auto-trigger: hver gang stage ændres på leads, log til lead_stage_history
-- (samme mønster som Loveable-DB'en havde)

create or replace function log_lead_stage_change()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    insert into lead_stage_history (lead_id, from_stage, to_stage)
    values (NEW.id, null, NEW.stage);
  elsif TG_OP = 'UPDATE' and OLD.stage is distinct from NEW.stage then
    insert into lead_stage_history (lead_id, from_stage, to_stage)
    values (NEW.id, OLD.stage, NEW.stage);
    NEW.stage_changed_at := now();
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;

create trigger leads_stage_change_trigger
  before insert or update on leads
  for each row
  execute function log_lead_stage_change();

-- ─── On-market candidates (4700 Næstved scrape) ───────────────────────────

create table on_market_candidates (
  id uuid primary key default gen_random_uuid(),
  scraped_at timestamptz not null default now(),
  source text not null default 'boligsiden',
  source_id text not null,
  source_url text not null,
  case_url text,
  realtor_name text,
  broker_kind text,

  address text not null,
  postal_code text not null,
  city text not null,
  housing_area_m2 int not null,
  rooms numeric(3, 1),
  year_built int,
  list_price bigint not null,
  monthly_expense int,

  -- AVM (Uge 5 — fra avm_engine.py)
  avm_value bigint,
  avm_calculated_at timestamptz,

  -- Tilbud (Uge 6 — fra tilbudsformel)
  bid_dkk bigint,
  margin_pct numeric(5, 2),

  -- Salgsopstilling-tracking
  pdf_filename text,
  pdf_status pdf_status not null default 'pending',
  pdf_downloaded_at timestamptz,

  status listing_status not null default 'active',

  unique (source, source_id)
);

create index on_market_postal_code_idx on on_market_candidates(postal_code, status);
create index on_market_status_idx on on_market_candidates(status, scraped_at desc);

-- ─── Views ─────────────────────────────────────────────────────────────────

-- SLA-status view (eksplicit pr. design-doc sektion "SLA Logic")
create or replace view vw_leads_with_sla as
select
  l.*,
  case l.stage
    when 'Ny' then 1
    when 'Kvalificering' then 3
    when 'Interesse' then 7
    when 'Fremvisning' then 14
    when 'Aktivt bud' then 7
    when 'Underskrevet' then 14
    else null  -- Lukket, Arkiveret, Tabt har ingen SLA
  end as sla_days,
  extract(epoch from (now() - l.stage_changed_at)) / 86400 as days_in_stage,
  case
    when l.stage in ('Lukket', 'Arkiveret', 'Tabt') then 'ok'
    when extract(epoch from (now() - l.stage_changed_at)) / 86400 >
         (case l.stage
            when 'Ny' then 1 when 'Kvalificering' then 3
            when 'Interesse' then 7 when 'Fremvisning' then 14
            when 'Aktivt bud' then 7 when 'Underskrevet' then 14
          end)
      then 'breach'
    when extract(epoch from (now() - l.stage_changed_at)) / 86400 >
         (case l.stage
            when 'Ny' then 1 when 'Kvalificering' then 3
            when 'Interesse' then 7 when 'Fremvisning' then 14
            when 'Aktivt bud' then 7 when 'Underskrevet' then 14
          end) * 0.5
      then 'warning'
    else 'ok'
  end as sla_status
from leads l;

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────
-- Internt værktøj — Jacob + 1-2 kolleger via magic-link auth (Uge 3)
-- For nu: enable RLS men giv anon read-access (Uge 1-2 read-only mirror)
-- I Uge 3 strammes til kun authed users.

alter table leads enable row level security;
alter table lead_communications enable row level security;
alter table lead_stage_history enable row level security;
alter table on_market_candidates enable row level security;

-- Midlertidig policy: anon kan læse alt (read-only mirror i Uge 1-2)
-- Strammes i Uge 3 migration: kun authenticated users.
create policy "anon read leads (Uge 1-2)" on leads for select to anon using (true);
create policy "anon read communications (Uge 1-2)" on lead_communications for select to anon using (true);
create policy "anon read history (Uge 1-2)" on lead_stage_history for select to anon using (true);
create policy "anon read candidates" on on_market_candidates for select to anon using (true);
