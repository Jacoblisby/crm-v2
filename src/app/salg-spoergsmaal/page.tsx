/**
 * /salg-spoergsmaal — analysetabel over alle spørgsmål i 365's funnel
 * vs Opendoor / Offerpad / Zillow.
 *
 * Opdateret maj 2026 efter wireframe-revisionen:
 *   - 12 screens (var 14)
 *   - Antal ejere, Hvor længe boet, Tag-tilstand, Hovedgrund til salg fjernet
 *   - Stue + Sove kombineret til ét "Øvrige rum"-screen
 *   - Gæld til EF + Fælleslån i EF flyttet til Udgifter
 *
 * Inddelt i sektioner pr. stage for læselighed.
 *
 * Download som TSV: /salg-spoergsmaal.tsv (paste i Google Sheets).
 */

export const dynamic = 'force-static';

interface Row {
  q: string;
  od: string;
  op: string;
  zi: string;
  e365: string;
  why: string;
  whereWhy: string;
  flag?: 'ny' | 'fjernet';
}

interface Section {
  stage: string;
  screen: string; // "Screen 2 — Bekraeft" etc
  intro: string;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    stage: 'Adresse',
    screen: 'Screen 1 — Landing + Adresse-pill',
    intro:
      'Hot-start. Laveste friktion. Adresse alene driver 60% af pricing-input via OIS+BBR-opslag og comparable handler.',
    rows: [
      { q: 'Adresse', od: 'Ja', op: 'Ja', zi: 'Ja', e365: 'Ja', why: 'Trigger OIS+BBR-opslag, comparable handler, postnr-baseret leje-rate.', whereWhy: 'MUST. Bruger lander direkte på adresse-input.' },
    ],
  },
  {
    stage: 'Bekraeft',
    screen: 'Screen 2 — Bekraeft boligens detaljer',
    intro:
      'BBR/OIS-data vises og bekræftes. Bruger siger "ja det er min bolig" — peak commit-vilje før vi spørger om kontakt.',
    rows: [
      { q: 'Boligtype', od: 'Auto', op: 'Manuel', zi: 'Nej', e365: 'Auto+editable', why: 'Eksklusionskriterium — vi køber primært ejerlejligheder.', whereWhy: 'Bruger ser BBR-data og bekræfter.' },
      { q: 'Boligareal (kvm)', od: 'Auto', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'MUST for kr/m²-beregning.', whereWhy: 'BBR-værdi vises, kan rettes.' },
      { q: 'Antal værelser', od: 'Manuel', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'Udlejnings-rate (3v vs 2v har 15% premium).', whereWhy: 'BBR-værdi vises.' },
      { q: 'Byggeår', od: 'Auto', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'Standardiseret risiko-faktor — pre-1970 = højere EF-vedligehold.', whereWhy: 'BBR-værdi vises.' },
      { q: 'Etage', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Udlejnings-pris (høje etager + lys = premium), tilgængelighed.', whereWhy: 'BBR-værdi vises.' },
      { q: 'Elevator', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Udlejnings-prestige, kritisk for ældre målgruppe.', whereWhy: 'BBR-værdi vises.' },
      { q: 'Altan eller terrasse', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Premium-faktor (5-10% på køb og leje).', whereWhy: 'BBR-værdi vises.' },
      { q: 'Energimærke (A-G)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Varme-prognose + EF-renoverings-risiko.', whereWhy: 'BBR-værdi vises.' },
    ],
  },
  {
    stage: 'Kontakt',
    screen: 'Screen 3 — Hvor sender vi dit tilbud?',
    intro:
      'Tidlig lead-capture lige efter commit-peak. Strategisk anderledes end Opendoor/Offerpad som gemmer kontakt til slut — vi sikrer lead selv hvis flow afbrydes senere.',
    rows: [
      { q: 'Fulde navn', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig — påkrævet', why: 'Lead-relation, personlig henvendelse.', whereWhy: 'Påkrævet for at fortsætte.' },
      { q: 'Email', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig', why: 'Tilbud-leverance, opfølgning.', whereWhy: 'Email eller telefon — mindst én.' },
      { q: 'Telefon', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig', why: 'Til at aftale besigtigelse.', whereWhy: 'Email eller telefon — mindst én.' },
    ],
  },
  {
    stage: 'Timing',
    screen: 'Screen 4 — Hvornår vil du flytte?',
    intro:
      'Kvalificerer haste-niveau før vi går i detaljer. Påvirker overtagelses-bonus og prisjustering. 6+ md-svaret outer at sælger vil sælge i ro (sale-leaseback target), "Ved ikke endnu"-svaret outer informationsbehov.',
    rows: [
      { q: 'Hvornår vil du flytte', od: 'Slut nogle', op: 'Tidligt-mid', zi: 'Nej', e365: 'Tidlig (5 chips)', why: 'Planlægning + overtagelses-bonus. Påvirker pris ±15.000 kr.', whereWhy: 'Kvalificerer haste-niveau.' },
    ],
  },
  {
    stage: 'Boligen',
    screen: 'Screens 5-7 — Køkken, Bad, Øvrige rum',
    intro:
      'Refurb-cost estimat. Foto-grid med 4 stand-niveauer per rum. Køkken + Bad er dyrest at renovere → egne screens. Stue + Sov + gang collapses til ét "Øvrige rum"-screen (primært maling/gulv-vurdering).',
    rows: [
      { q: 'Køkken: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Foto-grid', why: 'MUST for refurb-cost. Køkken = top-3 dyreste.', whereWhy: 'Screen 5 — visuel + engagement start.' },
      { q: 'Køkken: årgang', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Forfiner refurb-estimat.', whereWhy: 'Screen 5.' },
      { q: 'Bad: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Foto-grid', why: 'MUST. Bad er dyrest + fugt-risiko er largest unknown.', whereWhy: 'Screen 6.' },
      { q: 'Bad: årgang', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Forfiner refurb-estimat.', whereWhy: 'Screen 6.' },
      { q: 'Øvrige rum: stand (4 niveauer)', od: 'Overordnet (per rum)', op: 'Overordnet', zi: 'Nej', e365: 'Chip-grid (kombineret)', why: 'Gulv + maling refurb for stue/sov/gang.', whereWhy: 'Screen 7 — én samlet vurdering. Brydeer 4-rum-i-træk monotonien.', flag: 'ny' },
    ],
  },
  {
    stage: 'Sidste detaljer',
    screen: 'Screen 8 — Sidste detaljer',
    intro:
      'Optional-bucket. Catch-all for hvidevarer, fotos, særlige forhold og udlejnings-status. Alt valgfrit — kan springes over.',
    rows: [
      { q: 'Hvidevarer der følger med (8 chip)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Marginal pris-påvirkning. Mest brugbar for udlejnings-pakke.', whereWhy: 'Optional-bucket.' },
      { q: 'Andre fotos (1 samlet upload)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (op til 10)', why: 'Altan, plantegning, entré eller andet. Fleksibelt.', whereWhy: 'Forenklet fra 4 slots til 1 (maj 2026).' },
      { q: 'Notes (fri tekst)', od: 'Nej', op: 'Sometimes', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Catch-all for ting der ikke passer i felter.', whereWhy: 'Optional.' },
      { q: 'Boligens specielle ting', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Multi-select', why: 'Solceller = energi-værdi. Aktuelt udlejet = kritisk (overtagelses-impact).', whereWhy: 'Multi-select chips.' },
      { q: 'Forhold der kan påvirke prisen', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Multi-select', why: 'Negative pris-justeringer. MUST vi kender før estimat.', whereWhy: 'Multi-select chips.' },
    ],
  },
  {
    stage: 'Sidste detaljer — udlejning (conditional)',
    screen: 'Screen 8 conditional reveal',
    intro:
      'Reveal-block når "Aktuelt udlejet" valgt. Kritisk fordi det bestemmer om vi overhovedet kan disponere over boligen ved overtagelse.',
    rows: [
      { q: 'Månedlig leje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Cash-flow vurdering.', whereWhy: 'Conditional reveal.' },
      { q: 'Depositum', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Lovgivnings-krav check.', whereWhy: 'Conditional reveal.' },
      { q: 'Forudbetalt leje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Cash-flow + opsigelses-friktion.', whereWhy: 'Conditional reveal.' },
      { q: 'Startdato', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Tidsdimension — hvor længe har lejekontrakt eksisteret.', whereWhy: 'Conditional reveal.' },
      { q: 'Uopsigelig fra udlejer (mdr)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja/Nej + mdr', why: 'KRITISK — bestemmer om vi kan disponere over boligen.', whereWhy: 'Conditional reveal.' },
      { q: 'Lejekontrakt upload', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Verificering + fund af specialvilkår.', whereWhy: 'Conditional reveal.' },
    ],
  },
  {
    stage: 'Udgifter',
    screen: 'Screen 9 — Boligens udgifter',
    intro:
      'Money-context. Direkte input til drift-beregning + netto-provenu-fremvisning. Eneste required-felt på dette step er fællesudgifter.',
    rows: [
      { q: 'Fællesudgifter til ejerforeningen', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Påkrævet', why: 'MUST. Direkte input til drift-beregning.', whereWhy: 'Eneste required-felt.' },
      { q: 'Grundskyld', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'MUST. Drift.', whereWhy: 'Kerne-udgifter 2x2-grid.' },
      { q: 'Renovation', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Drift. Ofte inkl. i fællesudg.', whereWhy: 'Kerne-udgifter 2x2-grid.' },
      { q: 'Grundfond', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'EF reserve-bidrag pr. år.', whereWhy: 'Kerne-udgifter 2x2-grid.' },
      { q: 'Vand (acontobeløb? + årlig regning)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja/Nej + beløb', why: 'MUST. Drift.', whereWhy: 'Egen section.' },
      { q: 'Varme (acontobeløb? + årlig regning)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja/Nej + beløb', why: 'MUST. Drift.', whereWhy: 'Egen section.' },
      { q: 'Hæftelse tinglyst (engangsbeløb)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Tinglyst sikkerhed foran realkreditten.', whereWhy: 'Trækkes fra låneprovenuet.' },
      { q: 'Fælleslån i ejerforeningen (din andel)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja/Nej + andel', why: 'Flyttet fra Sidste detaljer (maj 2026). Direkte påvirkning på netto-provenu.', whereWhy: 'Money-context er rette sted.', flag: 'ny' },
      { q: 'Gæld til ejerforening (skyldige bidrag)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja/Nej + beløb', why: 'Nyt felt (maj 2026). Restance trækkes fra dit netto-provenu.', whereWhy: 'Conditional beløb-felt hvis Ja.', flag: 'ny' },
      { q: 'Eksisterende restgæld på realkreditlån', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Påvirker netto-provenu og forventning ("jeg får 800k" vs "1.1m"). Transparens.', whereWhy: 'Egen "Realkreditlån"-section nederst.' },
      { q: 'Øvrige driftudgifter (dynamic list)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (+ knap)', why: 'Fleksibel input. 7 kategorier: forsikring, fælleslån-ydelse, admin, antenne, internet, vedligehold, andet.', whereWhy: 'Tilføj kun det der gælder.' },
      { q: 'Dokumentation upload (PDF/JPG)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Manual-validering af tal. Nice-to-have.', whereWhy: 'Valgfri.' },
    ],
  },
  {
    stage: 'Efter salg',
    screen: 'Screen 10 — Hvad skal du efter salget?',
    intro:
      'MUST. Triggers sale-leaseback vs udflytter-product vs ny-bolig-match. Kerneforretningens kritiske distinction.',
    rows: [
      { q: 'Hvad skal du efter salget (4 valg)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'MUST. Triggers sale-leaseback eller udflytter-product.', whereWhy: 'Flytter / Bliv boende / Lej anden / Ved ikke endnu.' },
    ],
  },
  {
    stage: 'Ny bolig (conditional)',
    screen: 'Screen 11 — Hvad leder du efter?',
    intro:
      'Reveal når "Vil leje en anden bolig" valgt. Cross-sell mod vores 218 lejemål.',
    rows: [
      { q: 'Områder', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Chip', why: 'Match mod vores portefølje.', whereWhy: 'Conditional.' },
      { q: 'Antal værelser + kvm min', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Match-kriterier.', whereWhy: 'Conditional.' },
      { q: 'Max månedlig husleje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Budget-grænse.', whereWhy: 'Conditional.' },
      { q: 'Must-have features (8 chip)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Multi-select', why: 'Match-kriterier.', whereWhy: 'Conditional.' },
      { q: 'Indflytnings-timing', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Logistik mod salgsdato.', whereWhy: 'Conditional.' },
    ],
  },
];

const IMPLEMENTERET = [
  { q: 'Energimærke (A-G)', why: 'Tilføjet til Bekraeft-skærmen som row 8.' },
  { q: 'Øvrige rum (kombineret stue+sov)', why: 'Ét chip-baseret screen erstatter 2 separate foto-screens. Brydeer monotoni.' },
  { q: 'Gæld til ejerforening', why: 'Nyt felt på Udgifter (Ja/Nej + conditional beløb).' },
  { q: 'Fælleslån i EF flyttet', why: 'Flyttet fra Sidste detaljer til Udgifter — money-context er rette sted.' },
  { q: 'Restgæld realkredit', why: 'Tilføjet til Udgifter som egen "Realkreditlån"-section.' },
  { q: 'Estimat sammenligning', why: 'Liste-breakdown af mæglervejens omkostninger m. 90 dages drift-i-salgsperiode.' },
];

const FJERNET = [
  { q: 'Antal ejere (samejer?)', why: 'Var på Kontakt — ligegyldigt for estimat. Tages ved besigtigelse hvis relevant.' },
  { q: 'Hvor længe har du boet der', why: 'Var på Kontakt — ligegyldigt for estimat.' },
  { q: 'Tag-tilstand i bygningen', why: 'Var på Sidste detaljer — for indirekte til at indgå i pricing-model.' },
  { q: 'Hvad er hovedgrunden til at sælge', why: 'Var screen 11 — vi udleder det fra timing + efter-salg svar i stedet.' },
  { q: 'Hvornår vil du overtage (slider)', why: 'Var på Estimat-skærm — overtagelses-detaljer tages ved besigtigelse.' },
  { q: 'Køkken-mærke (HTH/Svane/IKEA)', why: 'Brugte det ikke i pricing-model. Kunne ikke fact-checkes.' },
  { q: '4 separate andre-foto-slots', why: 'Forenklet til ét samlet upload-felt med op til 10 fotos.' },
];

export default function SalgSpoergsmaalPage() {
  const totalRows = SECTIONS.reduce((s, sec) => s + sec.rows.length, 0);
  return (
    <div style={{ background: 'oklch(0.965 0.012 80)', minHeight: '100vh', paddingBottom: 80 }}>
      <article
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 24px',
          fontFamily: 'Geist, system-ui, sans-serif',
          color: 'oklch(0.18 0.015 80)',
          lineHeight: 1.5,
        }}
      >
        <header style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'oklch(0.46 0.02 80)', margin: 0 }}>
            arbejdsdokument · opdateret maj 2026
          </p>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              margin: '12px 0 16px',
              fontWeight: 400,
            }}
          >
            Hvad vi spørger om{' '}
            <em
              style={{
                color: 'oklch(0.35 0.045 200)',
                fontStyle: 'italic',
                fontFamily: 'Fraunces, Georgia, serif',
              }}
            >
              i 365-funnel&apos;en.
            </em>
          </h1>
          <p style={{ fontSize: 15, color: 'oklch(0.32 0.015 80)', maxWidth: 760 }}>
            {totalRows} spørgsmål mappet mod Opendoor, Offerpad og Zillow. Inddelt i {SECTIONS.length} sektioner
            der svarer til de 12 funnel-screens. Hver række forklarer hvorfor vi spørger og hvor i
            flowet det ligger.
          </p>
          <p style={{ fontSize: 13, marginTop: 16 }}>
            <a
              href="/salg-spoergsmaal.tsv"
              download
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'oklch(0.18 0.015 80)',
                color: 'oklch(0.965 0.012 80)',
                textDecoration: 'none',
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              ↓ Download som TSV (paste i Google Sheets)
            </a>
          </p>
        </header>

        <section style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ padding: 20, background: 'oklch(0.97 0.04 150)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'oklch(0.4 0.1 150)', margin: 0, fontWeight: 600 }}>
              ✓ tilføjet/forbedret i flow ({IMPLEMENTERET.length})
            </p>
            <ul style={{ fontSize: 13, marginTop: 12, paddingLeft: 20, lineHeight: 1.6 }}>
              {IMPLEMENTERET.map((r) => (
                <li key={r.q}>
                  <strong>{r.q}</strong> — {r.why}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ padding: 20, background: 'oklch(0.97 0.015 30)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'oklch(0.45 0.12 30)', margin: 0, fontWeight: 600 }}>
              ✗ fjernet fra flow ({FJERNET.length})
            </p>
            <ul style={{ fontSize: 13, marginTop: 12, paddingLeft: 20, lineHeight: 1.6 }}>
              {FJERNET.map((r) => (
                <li key={r.q}>
                  <strong>{r.q}</strong> — {r.why}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <nav style={{ marginBottom: 32, padding: '12px 16px', background: '#fff', borderRadius: 8 }}>
          <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'oklch(0.46 0.02 80)', margin: '0 0 8px', fontWeight: 600 }}>
            spring til
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SECTIONS.map((sec, i) => (
              <a
                key={sec.stage}
                href={`#section-${i}`}
                style={{
                  fontSize: 13,
                  padding: '6px 12px',
                  background: 'oklch(0.95 0.018 80)',
                  color: 'oklch(0.22 0.015 80)',
                  textDecoration: 'none',
                  borderRadius: 999,
                  fontWeight: 500,
                }}
              >
                {sec.stage}
                <span style={{ marginLeft: 6, color: 'oklch(0.46 0.02 80)', fontSize: 11 }}>
                  {sec.rows.length}
                </span>
              </a>
            ))}
          </div>
        </nav>

        {SECTIONS.map((sec, i) => (
          <section key={sec.stage} id={`section-${i}`} style={{ marginBottom: 40 }}>
            <header style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'oklch(0.46 0.02 80)', margin: 0, fontWeight: 600 }}>
                {sec.screen}
              </p>
              <h2
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 28,
                  letterSpacing: '-0.015em',
                  margin: '6px 0 8px',
                  fontWeight: 400,
                }}
              >
                {sec.stage}
              </h2>
              <p style={{ fontSize: 14, color: 'oklch(0.32 0.015 80)', maxWidth: 760, margin: 0 }}>
                {sec.intro}
              </p>
            </header>

            <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead style={{ background: 'oklch(0.94 0.018 80)' }}>
                  <tr>
                    <Th wide>Spørgsmål</Th>
                    <Th>Opendoor</Th>
                    <Th>Offerpad</Th>
                    <Th>Zillow</Th>
                    <Th highlight>365 Ejendomme</Th>
                    <Th wide highlight>Hvorfor 365 spørger</Th>
                    <Th wide>Placering / detalje</Th>
                  </tr>
                </thead>
                <tbody>
                  {sec.rows.map((r) => (
                    <tr
                      key={r.q}
                      style={{
                        borderTop: '1px solid oklch(0.94 0.015 80)',
                      }}
                    >
                      <Td>
                        <strong>{r.q}</strong>
                        {r.flag === 'ny' && <Mark color="amber">NY</Mark>}
                      </Td>
                      <Td soft>{r.od}</Td>
                      <Td soft>{r.op}</Td>
                      <Td soft>{r.zi}</Td>
                      <Td highlight>{r.e365}</Td>
                      <Td>{r.why}</Td>
                      <Td soft>{r.whereWhy}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <footer style={{ marginTop: 40, fontSize: 12, color: 'oklch(0.46 0.02 80)', borderTop: '1px solid oklch(0.92 0.018 80)', paddingTop: 16 }}>
          {totalRows} spørgsmål · {SECTIONS.length} sektioner · {IMPLEMENTERET.length} forbedringer · {FJERNET.length} fjernet · 12 funnel-screens
        </footer>
      </article>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,100..900,30..100;1,9..144,100..900,30..100&family=Geist:wght@300..700&display=swap" rel="stylesheet" />
    </div>
  );
}

function Th({ children, wide, highlight }: { children: React.ReactNode; wide?: boolean; highlight?: boolean }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '11px 12px',
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
        color: highlight ? 'oklch(0.35 0.045 200)' : 'oklch(0.46 0.02 80)',
        minWidth: wide ? 220 : 80,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, soft, highlight }: { children: React.ReactNode; soft?: boolean; highlight?: boolean }) {
  return (
    <td
      style={{
        padding: '11px 12px',
        color: soft ? 'oklch(0.46 0.02 80)' : highlight ? 'oklch(0.18 0.015 80)' : 'oklch(0.22 0.015 80)',
        verticalAlign: 'top',
        fontSize: 12.5,
        lineHeight: 1.5,
        fontWeight: highlight ? 500 : 400,
      }}
    >
      {children}
    </td>
  );
}

function Mark({ children, color }: { children: React.ReactNode; color: 'amber' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: 6,
        padding: '1px 6px',
        fontSize: 9.5,
        fontWeight: 700,
        background: color === 'amber' ? 'oklch(0.92 0.12 80)' : 'oklch(0.92 0.1 30)',
        color: 'oklch(0.35 0.15 70)',
        borderRadius: 3,
        letterSpacing: '0.08em',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </span>
  );
}
