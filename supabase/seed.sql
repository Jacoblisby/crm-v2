-- Seed-data for CRM v2 — bruges til lokal udvikling og første demo.
-- Kør EFTER 0001_initial_schema.sql.

-- 5 demo-leads i forskellige stages med forskellige SLA-statuser
insert into leads (full_name, email, phone, address, postal_code, city, property_type,
                   housing_area_m2, rooms, year_built, list_price, stage, notes,
                   stage_changed_at, campaign_id) values
  ('Lise Lotte Askjær', 'lise@example.com', '+45 12345678', 'Hovedgaden 12, 1. tv', '4700', 'Næstved',
   'Ejerlejlighed', 78, 3, 1965, 1800000, 'Ny', 'Brevkampagne 04/2026 — venter på svar',
   now() - interval '2 days', 'kampagne-2026-04'),

  ('Morten Hansen', 'morten@example.com', '+45 87654321', 'Parkvej 8, 2. tv', '4700', 'Næstved',
   'Ejerlejlighed', 95, 4, 1972, 2400000, 'Kvalificering', 'Ringede tilbage — interesseret hvis pris er rigtig',
   now() - interval '5 days', 'kampagne-2026-03'),

  ('Anne-Lise Sørensen', 'anne@example.com', null, 'Bredgade 4, st', '4700', 'Næstved',
   'Ejerlejlighed', 65, 2, 1950, 1500000, 'Interesse', 'Fremvisning aftalt fredag',
   now() - interval '4 days', null),

  ('Peter Nielsen', null, '+45 11223344', 'Toldbodgade 7, 1', '4700', 'Næstved',
   'Ejerlejlighed', 110, 4, 1985, 2900000, 'Aktivt bud', 'Bud afgivet 2.7M — afventer svar fra sælger',
   now() - interval '3 days', null),

  ('Karen Marie', 'karen@example.com', '+45 55667788', 'Ringstedgade 88', '4700', 'Næstved',
   'Ejerlejlighed', 72, 3, 1968, 1750000, 'Fremvisning', 'Var med til fremvisning. Skal tænke det igennem.',
   now() - interval '11 days', null);

-- Demo-kommunikation
insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'letter', 'out', 'Brev fra 365 Ejendomme', 'Vi er interesserede i at købe din ejerlejlighed i Næstved...'
from leads where campaign_id is not null;

insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'phone', 'in', null, 'Ringede tilbage. Vil høre mere om processen og hvad du tilbyder.'
from leads where full_name = 'Morten Hansen';

insert into lead_communications (lead_id, type, direction, subject, body)
select id, 'email', 'out', 'Tilbud på Toldbodgade 7', 'Hej Peter, som aftalt fremsender vi hermed vores tilbud på 2.700.000 kr...'
from leads where full_name = 'Peter Nielsen';
