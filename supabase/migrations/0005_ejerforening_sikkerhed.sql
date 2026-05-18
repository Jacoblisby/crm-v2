-- Add ejerforening_sikkerhed column to on_market_candidates.
-- Engangsbeløb der følger med købet ("Sikkerhed til e/f" på salgsopstilling).
-- Ikke en del af årlig drift — vises separat i UI.
ALTER TABLE on_market_candidates
  ADD COLUMN IF NOT EXISTS ejerforening_sikkerhed integer NOT NULL DEFAULT 0;
