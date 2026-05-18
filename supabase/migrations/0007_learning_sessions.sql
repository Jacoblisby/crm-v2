-- 0007_learning_sessions.sql
-- Learning agent Plan B: periodic learning sessions der opdaterer defaults.
--
-- 3 ting:
--   1. ADD absorbed_at + absorbed_in_session paa estimate_calibrations
--   2. Ny tabel learning_sessions (audit log)
--   3. Ny tabel learned_defaults (override af hardcoded konstanter)

-- 1. Absorbed-tracking paa eksisterende calibrations
ALTER TABLE estimate_calibrations
  ADD COLUMN IF NOT EXISTS absorbed_at timestamptz,
  ADD COLUMN IF NOT EXISTS absorbed_in_session uuid;

CREATE INDEX IF NOT EXISTS estimate_calibrations_absorbed_idx
  ON estimate_calibrations (absorbed_at);

-- 2. Learning sessions audit
CREATE TABLE IF NOT EXISTS learning_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at            timestamptz NOT NULL DEFAULT now(),
  proposals_count   integer NOT NULL DEFAULT 0,
  accepted_count    integer NOT NULL DEFAULT 0,
  rejected_count    integer NOT NULL DEFAULT 0,
  samples_absorbed  integer NOT NULL DEFAULT 0,
  notes             text
);

CREATE INDEX IF NOT EXISTS learning_sessions_ran_at_idx
  ON learning_sessions (ran_at);

-- 3. Learned defaults (overrider hardcoded konstanter)
CREATE TABLE IF NOT EXISTS learned_defaults (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field           text NOT NULL,
  postal_code     text,
  value           integer NOT NULL,
  previous_value  integer,
  sample_count    integer NOT NULL,
  session_id      uuid REFERENCES learning_sessions(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Unique pr. (field, postal_code). NULL postal_code er distinct i Postgres
-- saa flere global-defaults med samme field er muligt — vi haandterer det
-- paa app-niveau ved at ALDRIG indsaette med null postal_code (vi bruger
-- '' eller specifik postnr).
CREATE UNIQUE INDEX IF NOT EXISTS learned_defaults_field_postal_uniq
  ON learned_defaults (field, postal_code);
