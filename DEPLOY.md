# Deploy CRM v2 — selvhostet på Hetzner + Coolify

End-to-end runbook. Forventet tid: **30-45 minutter første gang**, hvoraf det meste er ventetid på Hetzner provisioning og DNS-propagation.

Kør sektionerne i rækkefølge. Hver sektion har en "✓ verifikation" — gå ikke videre før den lykkes.

---

## 1. Hetzner VPS (5 min provisioning + 2 min)

1. Opret konto på [hetzner.com/cloud](https://www.hetzner.com/cloud) hvis du ikke har en
2. **New Project** → "365 Ejendomme CRM"
3. **Add Server**:
   - Location: Helsinki (FSN1) eller Nuremberg (NBG1) — billigst, lavest latens fra DK
   - Image: **Ubuntu 24.04**
   - Type: **CX22** (€4.51/md, 2 vCPU, 4 GB RAM, 40 GB SSD) — dækker både app og Postgres
   - SSH key: tilføj din public key (eller lad Hetzner sende root-password)
   - Name: `crm-365` (frit)
4. Vent ~30 sek på provision. Notér public IPv4-adressen.

**✓ verifikation:** `ssh root@<ip>` virker.

---

## 2. DNS (1 min + venter på propagation)

Pege et subdomæne på serverens IP. Eksempel: `crm.365ejendom.dk`.

Hos din DNS-udbyder (Cloudflare/Simply/UnoEuro/...):
- **Type:** A
- **Name:** `crm`
- **Value:** Hetzner-IP'en
- **TTL:** Auto (eller 300)
- **Proxy/Cloudflare:** **Sluk** for orange-cloud (Coolify håndterer TLS direkte)

**✓ verifikation:** `dig +short crm.365ejendom.dk` returnerer Hetzner-IP. Kan tage 1-15 min.

---

## 3. Coolify install på VPS (5 min)

SSH ind på serveren:

```bash
ssh root@<ip>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Scriptet installerer Docker, Docker Compose, og Coolify selv. Tager 3-5 min.

Når det er færdigt printer det en URL: `http://<ip>:8000`.

Åbn den i browser, opret admin-konto (din email + et password). **Det er den eneste konto med adgang til Coolify-dashboardet.**

**✓ verifikation:** Du er logget ind på Coolify dashboardet på `http://<ip>:8000`.

---

## 4. Coolify: peg på dit subdomæne (2 min)

I Coolify → **Settings** → **General**:
- **FQDN:** `https://coolify.365ejendom.dk` (eller hvilken som helst sub du vil bruge til Coolify selv — kan være samme tld)
- Tilføj DNS A-record for det subdomæne også, peger på samme IP

Coolify kan også køre på IP'en direkte hvis du foretrækker det. Det vigtige er at du har en stabil måde at logge ind.

---

## 5. Postgres database i Coolify (3 min)

I Coolify → **+ New** → **Database** → **PostgreSQL 16**:
- **Name:** `crm-db`
- **Database name:** `crm`
- **Username:** `crm`
- **Password:** generer et stærkt (Coolify har en knap)
- Klik **Deploy**

Når status = "Running", åbn database-siden og kopier **Internal URL** (formatet `postgres://crm:...@crm-db:5432/crm`). Det er din `DATABASE_URL`.

**Backup:** Coolify → din database → **Backups** → enable daily, point til en S3/B2-bucket eller et eksternt destination. **Test restore før du går i produktion.**

**✓ verifikation:** Database-status er grøn, internal URL noteret.

---

## 6. App-deploy i Coolify (5 min)

Først: push CRM-v2-repoet til GitHub hvis det ikke allerede er der.

```bash
cd ~/Desktop/crm-v2
git remote add origin git@github.com:<dit-org>/crm-v2.git  # første gang
git push -u origin main
```

I Coolify → **+ New** → **Application** → **Public/Private repository**:
- Repository: din GitHub-URL
- Branch: `main`
- Build Pack: **Dockerfile**
- Port: `3000`
- **FQDN:** `https://crm.365ejendom.dk`
- Coolify ordner Let's Encrypt-cert automatisk

**Environment variables** (Settings → Environment):

```env
DATABASE_URL=postgres://crm:<password>@crm-db:5432/crm
NEXT_PUBLIC_APP_URL=https://crm.365ejendom.dk

BETTER_AUTH_SECRET=<openssl rand -hex 32>
BETTER_AUTH_URL=https://crm.365ejendom.dk
ALLOWED_EMAILS=jacob@faurholt.com

RESEND_API_KEY=<fra resend.com>
EMAIL_FROM=administration@365ejendom.dk

# Sentry (valgfri — tom = deaktiveret)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

Klik **Deploy**. Første build tager ~3-5 min.

**✓ verifikation:** `https://crm.365ejendom.dk` viser appen (formentlig "Database ikke forbundet"-fejl indtil step 7).

---

## 7. Kør migrations + seed (2 min)

Migrations skal køres mod den nye Postgres. To måder:

**Option A — fra din lokale maskine** (hurtigst første gang):

```bash
cd ~/Desktop/crm-v2

# Brug Coolify's "External URL" (eksponeret med port-forwarding) eller SSH-tunnel
ssh -L 5432:crm-db:5432 root@<ip> &
DATABASE_URL='postgres://crm:<password>@localhost:5432/crm' npm run db:migrate

# Seed (pipeline-stages, portefølje-selskaber, ejerforeninger, demo-leads):
psql 'postgres://crm:<password>@localhost:5432/crm' -f supabase/seed.sql
```

**Option B — via Coolify Terminal** (hvis du foretrækker UI):

I Coolify → din `crm-v2`-app → **Terminal** → kør:
```bash
DATABASE_URL=$DATABASE_URL npm run db:migrate
psql $DATABASE_URL -f supabase/seed.sql
```

**✓ verifikation:** Refresh `https://crm.365ejendom.dk` — Inbox viser 5 demo-leads med SLA-bands (rød/gul/grøn).

---

## 8. Resend (3 min)

1. Opret konto på [resend.com](https://resend.com)
2. **Domains** → **Add Domain** → `365ejendom.dk`
3. Tilføj de 3 DNS-records Resend viser (SPF, DKIM, MX) hos din DNS-udbyder
4. Vent 5-10 min på verification, refresh til **Verified** ✓
5. **API Keys** → **Create** → Permission: `Sending access` → kopier key
6. Sæt `RESEND_API_KEY` i Coolify env-variables → **Restart** appen

**✓ verifikation:** På `https://crm.365ejendom.dk/login` (når den eksisterer i Uge 3), email-flowet sender et magic-link.

---

## 9. Sentry (3 min — valgfri men stærkt anbefalet)

1. Opret konto på [sentry.io](https://sentry.io) — free tier dækker 5k events/md
2. **+ Create Project** → Platform: **Next.js** → Name: `crm-v2`
3. Kopier DSN
4. Sæt i Coolify:
   - `SENTRY_DSN` (server)
   - `NEXT_PUBLIC_SENTRY_DSN` (client)
   - `SENTRY_ORG`, `SENTRY_PROJECT` (for source maps)
5. Restart app

**✓ verifikation:** I Sentry → Issues, skab en kunstig fejl ved at besøge `https://crm.365ejendom.dk/sentry-test` (når test-route er sat op). Fejlen dukker op inden 1 min.

---

## 10. Backup-test (5 min — VIGTIGSTE robusthedstrin)

Backup uden restore-test er ikke en backup.

1. Coolify → `crm-db` → **Backups** → kør manuel backup
2. Bekræft backup-fil endte i din S3/B2-bucket
3. Lav en test-tabel: `psql $DB_URL -c "create table _backup_test (id int)"`
4. Restore backup'en til en ny test-database (Coolify har "Restore"-knap)
5. Verificer at `_backup_test` er der i den restorede DB
6. Drop test-databasen + test-tabellen

**✓ verifikation:** Du har personligt set en backup blive til en kørende DB.

---

## 11. CI/CD (når du er klar)

Allerede sat op i `.github/workflows/ci.yml`. Hver PR/push til main kører typecheck + tests + build.

For auto-deploy på push til `main`:
- Coolify → din app → **Webhooks** → kopier deploy-URL
- GitHub repo → Settings → Webhooks → Add → URL fra Coolify, content type `application/json`, trigger `push`

Eller manuelt: Coolify → din app → **Redeploy**-knap.

---

## Daglig drift

| Operation | Hvor |
|-----------|------|
| Se logs | Coolify → app → **Logs** |
| Restart | Coolify → app → **Restart** |
| Skala op (RAM/CPU) | Hetzner Cloud → server → **Rescale** (ned er ikke muligt — kør up til CX32 hvis nødvendigt) |
| Manuel backup | Coolify → DB → **Backups** → **Backup now** |
| Restore | Coolify → DB → **Backups** → vælg fil → **Restore** |
| DB-konsol | Coolify → DB → **Terminal** (åbner psql) |
| Migrations | `npm run db:migrate` lokalt mod produktions-`DATABASE_URL` |

---

## Troubleshooting

**App siger "Database ikke forbundet":**
- Tjek `DATABASE_URL` i Coolify env-vars
- Tjek at DB'en er i samme Coolify "project" som appen (de skal dele network)
- I Coolify → DB → **Logs** → er der "ready to accept connections"?

**Magic-link email kommer ikke:**
- Tjek Resend Dashboard → **Logs** → er request modtaget?
- Tjek SPF/DKIM records er **Verified** i Resend
- Tjek `ALLOWED_EMAILS` indeholder den email du prøver at logge ind med
- Tjek `EMAIL_FROM` matcher en Verified domain i Resend

**Build fejler i Coolify:**
- Tjek Coolify → app → **Build logs**
- Hvis "out of memory": rescaler VPS midlertidigt op til CX32, build'er, ned igen

**TLS-cert fejler:**
- DNS skal pege RIGTIGT (ikke Cloudflare orange-cloud) før Let's Encrypt kan validere
- Coolify → app → **Configuration** → klik **Force HTTPS regenerate**

---

## Næste skridt (efter deploy)

1. **Migrér data fra Loveable's Supabase** (engangs, se MIGRATION.md når den er skrevet)
2. **Uge 3:** Write-operationer (drag-drop på pipeline, note-logging, email-send)
3. **Uge 5:** On-market scrape + AVM-engine wrapper
4. **Uge 6:** Tilbudsberegner + `/buy-list/today`
