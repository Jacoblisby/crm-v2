# Boligberegner v1 — Status (5. maj 2026)

Built overnight while you were sleeping. Live på https://crm.365ejendom.dk/salg

## Hvad der blev bygget

### Backend services
- **`src/lib/services/dawa.ts`** — DAWA address autocomplete + adressedetalje (BFE, postnr, koordinater)
- **`src/lib/services/boligsiden.ts`** — slå bolig op via Boligsiden API (kvm, byggeår, værelser, lastSale)
- **`src/lib/services/comparables.ts`** — find sammenlignelige boliger fra:
  - Egne handler (`properties.last_sale_price`)
  - On-market scrape (`on_market_candidates`)
  - Median pr m² + estimer gns afslag på markedet
- **`src/lib/services/price-engine.ts`** — kombinerer alt:
  1. Comparables → markedsestimat
  2. Postnr × m² → leje-estimat (90-120 kr/m²/md)
  3. Stand → refurbish-estimat (0-12k pr m²)
  4. `computeAfkast({...})` → bud@20% ROE = vores tilbud

### Funnel UI (6 steps på `/salg`)

**Step 1 — Adresse**
- DAWA autocomplete (debounced 250ms)
- Auto-lookup på Boligsiden API → kvm/værelser/byggeår/BFE/energimærke
- Validerer postnr mod 5 dækningsområder (warning hvis udenfor)
- Bruger kan rette auto-felter

**Step 2 — Fotos**
- 8 navngivne slots (Stue/Køkken/Bad/Soveværelse/Altan/Plantegning/Gang/Andet)
- Min 1 påkrævet, opfordrer til 4+
- Capture=environment for mobile-kamera
- Lokalt preview via dataURL

**Step 3 — Ejerudgifter**
- 7 felter (fællesudg, grundskyld, fælleslån, renovation, forsikring, rotte, andre)
- Live total/år vist
- Hints på hvert felt
- (PDF-upload + auto-parse kommer i fase 2)

**Step 4 — Stand**
- 5 store knapper (Nyrenoveret/God/Middel/Trænger/Slidt)
- Note-felt til kunde
- 4 toggles (altan, elevator, udlejet, hæftelse)

**Step 5 — Kontakt**
- Navn, email, telefon med validering
- GDPR-tekst

**Step 6 — Estimat**
- Stort tilbud-tal (5xl font)
- 4-tal breakdown:
  - Markedsværdi
  - − gns afslag på markedet
  - − mæglersalær sparet (2.5% + 25k)
  - − ejertids-omkostninger (drift × 5 mdr)
  - = Vores tilbud
- Comparables-liste (op til 8) med adresse, kvm, byggeår, pris/m²
- "Endeligt efter besigtigelse" disclaimer
- CTA: ring direkte til Jacob

### Submit & integration

Når kunde klikker "Vis mit estimat":
1. **Beregner** estimat via comparables + computeAfkast
2. **Opretter property** hvis BFE er ny (med data fra OIS)
3. **Smart routing** baseret på data-mængde:
   - ≥3 fotos + drift > 0 → `interesse`
   - ≥1 foto eller drift → `ny-lead` (men højere prio)
4. **Logger estimat-detaljer** som `lead_communication`
5. **Email til Jacob** (admin) instant — alle data + CRM-link
6. **Email til kunde** med tilbud + dit nummer

### UTM tracking
URL-params (`?utm_source=brev2024&utm_medium=qr&utm_campaign=naestved-vinter`) gemmes på lead.

### State persistence
Funnel-state i `localStorage`, fotos i `sessionStorage`. Bruger kan komme tilbage uden at miste data.

---

## Hvad der IKKE er bygget endnu (fase 2)

- ❌ AI-vision på fotos (Gemini Flash analyse → stand pr rum + refurb-estimat)
- ❌ PDF upload + auto-parse (vi har worker'en — bare ikke koblet ind endnu)
- ❌ Cal.com booking integration (du sagde kalender kommer senere)
- ❌ SMS-bekræftelse (kun email i lite)
- ❌ A/B-test framework
- ❌ Analytics-dashboard for funnel-conversion
- ❌ Cloudflare R2 til foto-storage (fotos er i memory + lokal lagring lige nu — virker for ≤8 fotos pr lead, men skalerer ikke)
- ❌ DNS-setup for `salg.365ejendom.dk` (du gør det når du vågner)

---

## Test-tjek

1. **Åbn** https://crm.365ejendom.dk/salg på din mobil eller PC
2. **Step 1**: Søg fx "Bogensevej 53, 4700" → vælg fra dropdown → se auto-udfyldte felter
3. **Step 2**: Upload 1-4 fotos
4. **Step 3**: Skriv 12.000 i Fællesudgifter, 4500 i Grundskyld → se total live
5. **Step 4**: Vælg en stand
6. **Step 5**: Skriv navn/email/telefon
7. **Step 6**: Se estimat med breakdown + comparables

Du burde modtage email på jacob@faurholt.com med alle data + estimat.

---

## ✅ E2E test PASSED (kørt af mig kl 20:10)

Test-adresse: **Bogensevej 53, 2. th, 4700 Næstved**

Resultater:
- ✅ DAWA autocomplete: 6 forslag for "Bogensevej 53, 4700"
- ✅ Auto-lookup: kvm=116, værelser=4, byggeår=1987, BFE=319149
- ✅ Comparables: 5 sammenlignelige boliger fundet
- ✅ Markedsestimat: 1.986.384 kr (17.124 kr/m²)
- ✅ Lead oprettet i CRM (stage = "Interesse" pga. smart routing)
- ✅ Comm logget med estimat-detaljer
- ✅ Inbox viser leadet i "Igangværende samtaler"

Test-leadet kan slettes (eller bare ignoreres — det forsvinder når du flytter til "Tabt" eller arkiverer).

## ⚠️ Kendt UX-issue: Breakdown summer ikke til finalOffer

**Hvad jeg så på estimat-siden for Bogensevej 53:**
```
Vurderet markedsværdi:        1.986.384 kr
- Gns afslag (~7%):            -139.047 kr
- Mæglersalær sparet:           -74.660 kr
- Ejertids-omk:                 -15.508 kr
                              ────────────
Vores tilbud:                   971.000 kr   ← skulle være ~1.757k baseret på linjerne over
```

Forskellen (786k) skyldes at afkast-modellen siger ved 20% ROE, given drift + leje-rate, kan vi maks afford 971k. Det er **matematisk korrekt** men kunden vil tænke "wait, dine 3 træk-linjer giver kun 229k afslag, ikke 1.015k".

**3 mulige fix når du vågner — du beslutter:**
1. **Cap offer ved 85% af marked** — `finalOffer = max(afkast.budAt20PctRoe, marketPrice × 0.85)`. Du afgiver maks 15% rabat. Sikker for kunde, men du tager mere risiko.
2. **Tilføj 5. linje "Afkast-justering"** der fanger restdelen — fuld transparens men kunde forstår måske ikke hvad det er.
3. **Erstat breakdown med simpel** "Markedsværdi → Vores tilbud (51% under marked)" + kort forklaring nedenunder.

Min anbefaling: **#1** for fase 1 (sikrer at tilbud aldrig virker urealistisk lavt). Du har stadig kontrol — du kan altid sænke endeligt tilbud efter besigtigelse.

## ⚠️ Andre kendte begrænsninger

- **Boligsiden API**: hvis adressen ikke er i de 5 postnumre vi har data om, kan auto-lookup fejle. Vi har graceful fallback (estimat baseret på 28k/m² national avg).
- **DAWA fuzzy search**: nogle gange foreslår den ikke det perfekte match — bruger må skrive mere af adressen.
- **Foto-upload**: dataURL'er kan overskride localStorage quota ved >5MB pr foto. Hvis det sker, fortsætter funnel'en bare uden persistence.
- **Få comparables**: kun 5 sammenlignelige boliger på Bogensevej 53 (ud af 1900 i DB). Boligsiden-scrape giver løbende flere.

---

## Næste skridt for dig (når du vågner)

1. **Test funnel** end-to-end med en rigtig adresse (helst en du allerede ejer for at validere comparables)
2. **Tjek email-bekræftelser** lander korrekt
3. **Beslut**: skal jeg bygge Cal.com-booking, AI vision, eller PDF-upload først som fase 2?
4. **DNS**: `salg.365ejendom.dk` CNAME → server-IP, når du vil have det på det rigtige domæne
5. **Sluk gammel form**: WordPress redirect `/salg/` → ny URL

---

## Links
- **Live**: https://crm.365ejendom.dk/salg
- **CRM (lead lander her)**: https://crm.365ejendom.dk
- **GitHub commit**: `99def0e — boligberegner v1: 6-steps funnel på /salg`

God fornøjelse 🚀
