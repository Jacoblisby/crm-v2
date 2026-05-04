-- Lovable "Deal Flow Hub" schema (extracted via Plan-mode chat 2026-05-04)
-- Source: https://lovable.dev/projects/46b03c04-6919-4f19-97ee-31f3f0a67825

CREATE TABLE public.boliger (
  id BIGINT PRIMARY KEY,
  bfe_nummer INTEGER NOT NULL,
  adresse TEXT NOT NULL,
  vejnavn TEXT,
  husnr TEXT,
  etage TEXT,
  doer TEXT,
  postnr TEXT,
  by_navn TEXT,
  altan BOOLEAN DEFAULT false,
  ejer_navn TEXT,
  ejerskabstype TEXT,
  ejer_adresse TEXT,
  bor_i_lejlighed BOOLEAN DEFAULT false,
  kvm INTEGER,
  antal_vaerelser INTEGER,
  seneste_handelspris TEXT,
  seneste_handelsdato TEXT,
  grundskyld TEXT,
  ejerforening TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navn TEXT NOT NULL,
  email TEXT,
  telefon TEXT,
  adresse TEXT,
  kommune TEXT,
  etage TEXT,
  stoerrelse INTEGER,
  vaerelser INTEGER,
  stand INTEGER,
  stand_notat TEXT,
  vurdering TEXT,
  lejepris TEXT,
  status TEXT NOT NULL DEFAULT 'Ny lead',
  next_step TEXT,
  bud TEXT,
  bud_dkk INTEGER,
  bud_status TEXT,
  source TEXT,
  priority TEXT DEFAULT 'normal',
  bolig_id BIGINT REFERENCES public.boliger(id),
  bfe_nummer INTEGER,
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.kommunikation (
  id BIGINT PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  type TEXT NOT NULL DEFAULT 'note',
  besked TEXT NOT NULL,
  dato TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_stage_history (
  id BIGINT PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lejemaal (
  id BIGINT PRIMARY KEY,
  adresse TEXT NOT NULL,
  lejer TEXT NOT NULL,
  nummer TEXT,
  status TEXT DEFAULT 'Aktiv',
  areal INTEGER,
  boligleje INTEGER,
  leje_pr_kvm INTEGER,
  aarlig_leje INTEGER,
  indflytning TEXT,
  udflytning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.portfolio (
  id BIGINT PRIMARY KEY,
  bfe_nummer INTEGER NOT NULL,
  adresse TEXT NOT NULL,
  vejnavn TEXT,
  husnr TEXT,
  etage TEXT,
  doer TEXT,
  postnr TEXT,
  by_navn TEXT,
  kommune TEXT,
  energimaerke TEXT,
  opfoerelsesaar INTEGER,
  antal_vaerelser INTEGER,
  enhedsareal_beboelse INTEGER,
  tinglyst_areal INTEGER,
  seneste_handelspris TEXT,
  seneste_handelsdato TEXT,
  type TEXT,
  anvendelse TEXT,
  fordelingstal_taeller INTEGER,
  fordelingstal_naevner INTEGER,
  sfe_nummer INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
