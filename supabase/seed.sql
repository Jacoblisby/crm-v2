-- Seed-data for CRM v2 — pipeline-stages + demo-leads + portefølje-selskaber.
-- Kør EFTER 0000_initial_schema.sql + 0001_triggers_and_views.sql.

-- ─── 1. Pipeline stages (Loveable's 8 + v2's 2 terminale) ─────────────────

insert into pipeline_stages (slug, name, sla_days, is_terminal, is_bid_ready, sort_order, color) values
  ('ny-lead',         'Ny lead',         1,    false, false, 10, 'slate'),
  ('kontaktet',       'Kontaktet',       3,    false, false, 20, 'sky'),
  ('mail-sendt',      'Mail sendt',      5,    false, false, 30, 'indigo'),
  ('interesse',       'Interesse',       3,    false, true,  40, 'violet'),
  ('afventer-lejer',  'Afventer lejer',  30,   false, false, 50, 'amber'),
  ('fremvisning',     'Fremvisning',     7,    false, true,  60, 'orange'),
  ('aktivt-bud',      'Aktivt bud',      3,    false, true,  70, 'red'),
  ('koebt',           'Købt',            null, true,  false, 80, 'emerald'),
  ('arkiveret',       'Arkiveret',       null, true,  false, 90, 'slate'),
  ('tabt',            'Tabt',            null, true,  false, 100, 'slate');

-- ─── 2. Portefølje-selskaber ───────────────────────────────────────────────

insert into portfolio_companies (name, notes) values
  ('Sommerhave ApS',   'Jacob s primære selskab'),
  ('Sommerhaven ApS',  null),
  ('Herlufshave ApS',  null);

-- ─── 3. Ejerforeninger (de 9 fra Loveable) ────────────────────────────────

insert into housing_associations (name, street_name, postal_code, city) values
  ('Hegnsgården',      'Svendborgvej',                   '4700', 'Næstved'),
  ('Stærmosegaard',    'Odensevej',                      '4700', 'Næstved'),
  ('Kildemarksvænget', 'Kildemarksvej',                  '4700', 'Næstved'),
  ('Hybenparken',      'Odensevej',                      '4700', 'Næstved'),
  ('Blomsterparken',   'Lupin, Hvede, Erantis',          '4700', 'Næstved'),
  ('Hegnsparken',      'Bogensevej',                     '4700', 'Næstved'),
  ('Byskovparken',     'Søndermarksvej',                 '4200', 'Slagelse'),
  ('Benløseparken',    'Benløseparken',                  '4100', 'Ringsted'),
  ('Lindebo',          'Lindebo',                        '2630', 'Taastrup');

-- ─── 4. Demo-leads (overlever indtil rigtig migration fra Loveable) ──────

insert into leads (full_name, email, phone, address, postal_code, city, property_type,
                   kvm, rooms, year_built, list_price, stage_slug, notes,
                   stage_changed_at, source) values
  ('Lise Lotte Askjær', 'lise@example.com', '+45 12345678', 'Hovedgaden 12, 1. tv', '4700', 'Næstved',
   'Ejerlejlighed', 78, 3, 1965, 1800000, 'ny-lead', 'Brevkampagne 04/2026 — venter på svar',
   now() - interval '2 days', 'brev'),

  ('Morten Hansen', 'morten@example.com', '+45 87654321', 'Parkvej 8, 2. tv', '4700', 'Næstved',
   'Ejerlejlighed', 95, 4, 1972, 2400000, 'kontaktet', 'Ringede tilbage — interesseret hvis pris er rigtig',
   now() - interval '5 days', 'telefon'),

  ('Anne-Lise Sørensen', 'anne@example.com', null, 'Bredgade 4, st', '4700', 'Næstved',
   'Ejerlejlighed', 65, 2, 1950, 1500000, 'interesse', 'Fremvisning aftalt fredag',
   now() - interval '4 days', 'henvisning'),

  ('Peter Nielsen', null, '+45 11223344', 'Toldbodgade 7, 1', '4700', 'Næstved',
   'Ejerlejlighed', 110, 4, 1985, 2900000, 'aktivt-bud', 'Bud afgivet 2.7M — afventer svar fra sælger',
   now() - interval '3 days', 'website'),

  ('Karen Marie', 'karen@example.com', '+45 55667788', 'Ringstedgade 88', '4700', 'Næstved',
   'Ejerlejlighed', 72, 3, 1968, 1750000, 'fremvisning', 'Var med til fremvisning. Skal tænke det igennem.',
   now() - interval '11 days', 'brev');

-- Demo-kommunikation
insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'letter', 'out', 'Brev fra 365 Ejendomme', 'Vi er interesserede i at købe din ejerlejlighed i Næstved...'
from leads where source = 'brev';

insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'phone', 'in', null, 'Ringede tilbage. Vil høre mere om processen og hvad du tilbyder.'
from leads where full_name = 'Morten Hansen';

insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'email', 'out', 'Tilbud på Toldbodgade 7', 'Hej Peter, som aftalt fremsender vi hermed vores tilbud på 2.700.000 kr...'
from leads where full_name = 'Peter Nielsen';
