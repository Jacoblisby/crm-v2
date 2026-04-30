# 365 Ejendomme — CRM v2

Internt Buy List & CRM. Mobile-first Next.js-app der erstatter Loveable. Selvhostet på Hetzner + Coolify.

## Tech stack

| Lag | Valg | Hvorfor |
|-----|------|---------|
| Frontend | Next.js 16 + React 19 + Tailwind 4 | Server components → minimalt JS til klient |
| DB-adgang | Drizzle ORM + `postgres` driver | Compile-time SQL-safety, schema som TS |
| Database | Plain Postgres 17 | Ingen vendor lock-in |
| Auth | better-auth + magic-link via Resend | Self-hostet, email-whitelist |
| Email | Resend | Eksisterende `administration@365ejendom.dk` reputation |
| Tests | Vitest | SLA-logik testet, 12 test cases |
| Observability | Sentry (valgfri) | Fra dag 1 |
| Hosting | Hetzner CX22 + Coolify | ~€5/md, vendor-neutral |

## Routes

| Path | Status | Note |
|------|--------|------|
| `/` Inbox | ✅ Read-only | 3 sektioner: SLA-brud, Opfølgning, Afventer |
| `/pipeline` | ✅ Read-only | Kanban (drag-drop kommer i Uge 3) |
| `/leads/[id]` | ✅ Read-only | 4 tabs: Oversigt / Komm. / Historik / Noter |
| `/on-market` | ✅ Demo | Læser fra `on_market_candidates`-tabel, falder tilbage til POC |
| `/buy-list` | ⏳ Uge 6 | Stub — afventer tilbudsformel |
| `/api/auth/*` | ✅ Magic-link | Når `RESEND_API_KEY` + `BETTER_AUTH_SECRET` er sat |

## Datamodel (komplet — i Uge 2.5)

```
pipeline_stages         (10 rows: 8 fra Loveable + Arkiveret + Tabt)
housing_associations    (9 ejerforeninger)
properties              (~1.900 ejerlejligheder fra OIS/xlsx)
campaigns + recipients  (brevkampagner 6/år)
leads                   (~121 i pipeline, koblet til properties via FK)
lead_communications     (emails/calls/notes/letters)
lead_stage_history      (auto-trigger: hver stage-ændring)
events                  (generisk audit log: bid_changed, email.sent, ...)
portfolio_companies     (Sommerhave / Sommerhaven / Herlufshave ApS)
portfolio_properties    (Jacob's egne ~87 ejendomme)
tenants + lease_agreements (lejer-tracking)
on_market_candidates    (4700 Næstved Boligsiden-scrape, Uge 5)
```

## Lokal udvikling

```bash
cp .env.local.example .env.local
# Udfyld DATABASE_URL — peg på en lokal Postgres eller staging-instans

npm install
npm run db:migrate   # kør migrations
psql $DATABASE_URL -f supabase/seed.sql   # demo-data

npm run dev          # http://localhost:3000
```

## Vigtige scripts

| Script | Hvad |
|--------|------|
| `npm run dev` | Next.js dev-server |
| `npm run build` | Produktions-build |
| `npm test` | Vitest test-suite |
| `npm run typecheck` | TypeScript |
| `npm run db:generate` | Generér ny SQL-migration fra schema-ændringer |
| `npm run db:migrate` | Kør pending migrations mod `DATABASE_URL` |
| `npm run db:studio` | Drizzle Studio (DB UI) |

## Deploy

Se [DEPLOY.md](./DEPLOY.md) for end-to-end runbook (Hetzner + Coolify, ~30-45 min første gang).

## 8-ugers plan

- [x] **Uge 1-2:** App skelet + read-only routes
- [x] **Uge 2.5:** Robust foundation — Drizzle + auth + tests + CI + Sentry + DEPLOY-runbook
- [ ] **Uge 3-4:** Write-operationer (drag-drop, note-logging) + Resend email-sending
- [ ] **Uge 5:** On-market modul (4700 Næstved scrape + AVM-engine wrapper)
- [ ] **Uge 6:** Tilbudsberegner + `/buy-list/today`
- [ ] **Uge 7:** Cut-over rehearsal (data-migration fra Loveable's Supabase)
- [ ] **Uge 8:** Cut-over + monitoring

## Migration fra Loveable

Loveable kører videre uændret indtil cut-over. Migration-script (Uge 7) tager engangs `pg_dump` fra Loveable's Supabase, transformerer til v2-schemaet, importerer i `crm`-databasen.

Kritiske mappings:
- Loveable `stage` (TEXT) → v2 `stage_slug` (FK til pipeline_stages)
- Loveable `Boliger`-tabel → v2 `properties` + `housing_associations`
- Loveable `Portefølje`-data → v2 `portfolio_companies` + `portfolio_properties` + `tenants` + `lease_agreements`

Detaljer kommer i `MIGRATION.md` når Loveable's faktiske schema er inspiceret.
