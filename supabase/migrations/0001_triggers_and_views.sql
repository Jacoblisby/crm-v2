-- 365 Ejendomme — CRM v2
-- 0001: Triggers + views der ikke genereres af Drizzle.
--
-- 1. updated_at auto-trigger på muterbare rækker (optimistisk concurrency).
-- 2. Stage-change auto-trigger på leads → log til lead_stage_history + events.
-- 3. SLA-view (vw_leads_with_sla) der joiner pipeline_stages og beregner status.

-- ─── 1. updated_at trigger (genbruges på alle muterbare tabeller) ─────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger leads_updated_at_trigger
  before update on leads
  for each row
  execute function set_updated_at();

create trigger properties_updated_at_trigger
  before update on properties
  for each row
  execute function set_updated_at();

create trigger housing_associations_updated_at_trigger
  before update on housing_associations
  for each row
  execute function set_updated_at();

create trigger portfolio_properties_updated_at_trigger
  before update on portfolio_properties
  for each row
  execute function set_updated_at();

create trigger tenants_updated_at_trigger
  before update on tenants
  for each row
  execute function set_updated_at();

create trigger lease_agreements_updated_at_trigger
  before update on lease_agreements
  for each row
  execute function set_updated_at();

create trigger on_market_candidates_updated_at_trigger
  before update on on_market_candidates
  for each row
  execute function set_updated_at();

-- ─── 2. Stage-change trigger på leads ─────────────────────────────────────

create or replace function log_lead_stage_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_stage_history (lead_id, from_stage, to_stage)
    values (new.id, null, new.stage_slug);

    insert into events (type, lead_id, payload)
    values ('lead.created', new.id, jsonb_build_object('stage', new.stage_slug));

  elsif tg_op = 'UPDATE' and old.stage_slug is distinct from new.stage_slug then
    insert into lead_stage_history (lead_id, from_stage, to_stage)
    values (new.id, old.stage_slug, new.stage_slug);

    insert into events (type, lead_id, payload)
    values (
      'lead.stage_changed',
      new.id,
      jsonb_build_object('from', old.stage_slug, 'to', new.stage_slug)
    );

    new.stage_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger leads_stage_change_trigger
  before insert or update on leads
  for each row
  execute function log_lead_stage_change();

-- ─── 3. Bid-change trigger (audit) ────────────────────────────────────────

create or replace function log_lead_bid_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and old.bid_dkk is distinct from new.bid_dkk then
    insert into events (type, lead_id, payload)
    values (
      'lead.bid_changed',
      new.id,
      jsonb_build_object(
        'from', old.bid_dkk,
        'to', new.bid_dkk,
        'status', new.bid_status
      )
    );
  end if;
  return new;
end;
$$;

create trigger leads_bid_change_trigger
  after update on leads
  for each row
  execute function log_lead_bid_change();

-- ─── 4. SLA-view ──────────────────────────────────────────────────────────

create or replace view vw_leads_with_sla as
select
  l.*,
  s.name as stage_name,
  s.sla_days,
  s.is_terminal,
  s.is_bid_ready,
  s.color as stage_color,
  s.sort_order as stage_sort_order,
  extract(epoch from (now() - l.stage_changed_at)) / 86400 as days_in_stage,
  case
    when s.is_terminal then 'ok'
    when s.sla_days is null then 'ok'
    when extract(epoch from (now() - l.stage_changed_at)) / 86400 > s.sla_days then 'breach'
    when extract(epoch from (now() - l.stage_changed_at)) / 86400 > s.sla_days * 0.5 then 'warning'
    else 'ok'
  end as sla_status
from leads l
join pipeline_stages s on s.slug = l.stage_slug
where l.deleted_at is null;
