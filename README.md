# 365 Ejendomme — CRM v2

Internal Buy List & CRM. Mobile-first Next.js app der erstatter Loveable.

## Status

**Uge 1-2: App skelet + Supabase read-only mirror** (in progress).
Følger 8-ugers MVP plan i `~/.gstack/projects/Jacoblisby-avm-pipeline/jacoblisby-claude-amazing-lamport-design-20260429-175319.md`.

## Routes

| Path | Status | Note |
|------|--------|------|
| `/` (Inbox) | ✅ Read-only | 3 sektioner: SLA-brud, Opfølgning, Afventer |
| `/pipeline` | ✅ Read-only | Kanban (drag-drop kommer i Uge 3) |
| `/buy-list` | ⏳ Uge 6 | Stub — afventer tilbudsformlen |
| `/on-market` | ✅ Demo | Læser fra POC-manifest. Migreres til Supabase i Uge 5. |

## Setup

```bash
cd ~/Desktop/crm-v2
cp .env.local.example .env.local
# → udfyld NEXT_PUBLIC_SUPABASE_ANON_KEY fra Supabase dashboard
npm run dev
# → http://localhost:3000
```

## Struktur

```
src/
├── app/                    Pages (Inbox, Pipeline, Buy List, On-market)
└── lib/
    ├── types.ts            Schema-types (Lead, OnMarketCandidate, ...)
    ├── sla.ts              SLA-logik (eksplicit pr. design-doc)
    └── supabase/           Server + browser clients
```

## 8-ugers plan

- [x] **Uge 1-2:** App skelet + Supabase read-only mirror — IN PROGRESS
- [ ] **Uge 3-4:** Write-operationer + email (Resend)
- [ ] **Uge 5:** On-market modul (4700 scrape + AVM)
- [ ] **Uge 6:** Tilbudsberegner + Buy List
- [ ] **Uge 7:** Cut-over rehearsal
- [ ] **Uge 8:** Cut-over

## Week 0 forudsætninger

- [ ] **Tilbudsformlen** (`tilbudsregel.md`) — 30 min med Afkastberegner_v3.xlsx, notér 2-4 tærskler. Buy List blokerer på denne.
- [x] **Migration-spec** (i design-doc)
- [x] **Loveable parity matrix** (i design-doc)
