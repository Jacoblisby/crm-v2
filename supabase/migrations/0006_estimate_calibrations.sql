-- 0006_estimate_calibrations.sql
-- Learning agent: log brugerens manuelle overrides på estimater
-- så vi kan finde bedre defaults pr. postnr / standniveau.
-- Plan A: log + suggest, ingen auto-apply.

CREATE TABLE IF NOT EXISTS estimate_calibrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES on_market_candidates(id) ON DELETE CASCADE,
  field           text NOT NULL,
  default_value   integer NOT NULL,
  actual_value    integer NOT NULL,
  kvm             integer,
  postal_code     text,
  stand_level     text,
  broker_kind     text,
  year_built      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estimate_calibrations_field_postal_idx
  ON estimate_calibrations (field, postal_code);

CREATE INDEX IF NOT EXISTS estimate_calibrations_listing_idx
  ON estimate_calibrations (listing_id);

CREATE INDEX IF NOT EXISTS estimate_calibrations_created_idx
  ON estimate_calibrations (created_at);
