/**
 * /salg-spoergsmaal — analysetabel over alle spørgsmål i 365's funnel
 * vs Opendoor / Offerpad / Zillow.
 *
 * 53 rækker. Kolonner:
 *   - # (rækkefølge)
 *   - Spørgsmål
 *   - Opendoor / Offerpad / Zillow / 365 Ejendomme
 *   - Hvorfor 365 spørger
 *   - Rækkefølge i 365-flow + Hvorfor placeret der
 *
 * Markerer manglende-anbefalede spørgsmål m. MANGLER + foreslået placering.
 * Markerer overflødige-anbefalede m. FJERN-flag.
 *
 * Download som TSV: /salg-spoergsmaal.tsv (paste i Google Sheets).
 */

export const dynamic = 'force-static';

interface Row {
  n: string;
  q: string;
  od: string;
  op: string;
  zi: string;
  e365: string;
  why: string;
  order: string;
  whereWhy: string;
  flag?: 'mangler' | 'fjern' | 'foreslaaet';
}

const ROWS: Row[] = [
  { n: '1', q: 'Adresse', od: 'Ja', op: 'Ja', zi: 'Ja', e365: 'Ja', why: 'Trigger OIS+BBR-opslag, comparable handler, postnr-baseret leje-rate (kr/m²/md). MUST.', order: '1', whereWhy: 'Hot-start: laveste friktion + maksimal automatik. Adresse alene driver 60% af pricing-input.' },
  { n: '2', q: 'Boligtype', od: 'Auto', op: 'Manuel', zi: 'Nej', e365: 'Auto+editable', why: 'Eksklusionskriterium — vi køber primært ejerlejligheder. Triggers conditional hvis villa/rækkehus.', order: '2', whereWhy: 'Bekraeft: bruger ser OIS-data og siger "ja det er min bolig" — peak commit-vilje.' },
  { n: '3', q: 'Boligareal (kvm)', od: 'Auto', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'MUST for kr/m²-beregning. Direkte input til pricing-model.', order: '2', whereWhy: 'Bekraeft: BBR-værdi vises, bruger kan rette hvis BBR er forkert.' },
  { n: '4', q: 'Antal værelser', od: 'Manuel', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'Udlejnings-rate (3v vs 2v har 15% premium). Comparable-faktor.', order: '2', whereWhy: 'Bekraeft: BBR-værdi vises.' },
  { n: '5', q: 'Antal badeværelser', od: 'Manuel', op: 'Manuel', zi: 'Optional', e365: 'NEJ', why: 'BBR har inkonsistent badeværelse-data. Vi udleder via kvm + grundplan ved besigtigelse.', order: '—', whereWhy: 'Ikke spurgt.' },
  { n: '6', q: 'Byggeår', od: 'Auto', op: 'Manuel', zi: 'Optional', e365: 'Auto+editable', why: 'Standardiseret risiko-faktor — pre-1970 bygninger har højere EF-vedligehold.', order: '2', whereWhy: 'Bekraeft.' },
  { n: '7', q: 'Etage', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Udlejnings-pris (høje etager + lys = premium), tilgængelighed.', order: '2', whereWhy: 'Bekraeft.' },
  { n: '8', q: 'Elevator', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Udlejnings-prestige, kritisk for ældre / mobilitetshæmmede målgruppe.', order: '2', whereWhy: 'Bekraeft.' },
  { n: '9', q: 'Altan eller terrasse', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Auto+editable', why: 'Premium-faktor på køb og leje (5-10% i Næstved-data).', order: '2', whereWhy: 'Bekraeft.' },
  { n: '10', q: 'Energi-mærke (A-G)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Allerede i BBR — bør vises og bekræftes. Påvirker varme-prognose + EF-renoverings-risiko.', order: '(foreslået 2)', whereWhy: 'Bekraeft — sammen med øvrige BBR-felter.', flag: 'mangler' },
  { n: '11', q: 'Kontakt: fulde navn', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig (3)', why: 'Lead-relation, personlig henvendelse.', order: '3', whereWhy: 'Kontakt: efter Bekraeft (commit-peak) for tidlig lead-capture.' },
  { n: '12', q: 'Kontakt: email', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig (3)', why: 'Tilbud-leverance, opfølgning, email-tracking.', order: '3', whereWhy: 'Kontakt.' },
  { n: '13', q: 'Kontakt: telefon', od: 'Slut', op: 'Slut', zi: 'Optional', e365: 'Tidlig (3)', why: 'Jacob ringer indenfor 24 timer. Critical for konvertering.', order: '3', whereWhy: 'Kontakt.' },
  { n: '14', q: 'Antal ejere (samejer?)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Påvirker juridik — ægtefælle-samtykke, samejekontrakt, hvis arv: er der enighed.', order: '(foreslået 3)', whereWhy: 'Kontakt — naturlig kontekst "hvem er involveret".', flag: 'mangler' },
  { n: '15', q: 'Hvor længe har du boet der', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Påvirker ejertid og fortjeneste-skat ved udlejning (<2 år = særlige regler).', order: '(foreslået 3 eller 11)', whereWhy: 'Lidt om dig — emotional investment + skat.', flag: 'mangler' },
  { n: '16', q: 'Hvornår vil du flytte', od: 'Slut nogle', op: 'Tidligt-mid', zi: 'Nej', e365: 'Tidlig (4)', why: 'Planlægning + overtagelses-bonus (14d → 6m). Påvirker pris ±15.000 kr.', order: '4', whereWhy: 'Lige efter Kontakt: kvalificerer haste-niveau før vi går i detaljer.' },
  { n: '17', q: 'Køkken: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Detalje + foto', why: 'MUST for refurb-cost. Køkken er én af de to dyreste renoveringer.', order: '5', whereWhy: 'Boligen-stage: visuel + sjov start. Photo-grid feels som spil, ikke form.' },
  { n: '18', q: 'Køkken: årgang', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Forfiner refurb-estimat — "god stand" + 2022 = ingen afsætninger.', order: '5', whereWhy: 'Sammen med stand-valg.' },
  { n: '19', q: 'Køkken: mærke (HTH, Svane, IKEA)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'FJERN: vi bruger det ikke i pricing-model. Skip-able. Vi kan ikke fact-check brand.', order: '5', whereWhy: '(anbefalet fjernet)', flag: 'fjern' },
  { n: '20', q: 'Bad: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Detalje + foto', why: 'MUST. Bad er dyrest at renovere + fugt-risiko er largest unknown.', order: '6', whereWhy: 'Efter køkken — natural progression af dyreste rum først.' },
  { n: '21', q: 'Bad: årgang', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Forfiner refurb.', order: '6', whereWhy: 'Sammen med stand.' },
  { n: '22', q: 'Stue: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Detalje + foto', why: 'MUST. Gulv + maling refurb.', order: '7', whereWhy: 'Boligen-stage.' },
  { n: '23', q: 'Soveværelse: stand (4 niveauer)', od: 'Overordnet', op: 'Overordnet', zi: 'Nej', e365: 'Detalje + foto', why: 'MUST. Gulv + maling refurb.', order: '8', whereWhy: 'Boligen-stage afslutning — sidste rum-vurdering.' },
  { n: '24', q: 'Hvidevarer der følger med (8 chip)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Marginal pris-påvirkning. Mest brugbar for udlejnings-pakke. Skip-able.', order: '9', whereWhy: 'Sidste detaljer: optional-bucket.' },
  { n: '25', q: 'Andre fotos (altan, plantegning, gang)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (4 slots)', why: 'FORENKLES — 4 separate slots overkill. 1 "samlet billed-upload" virker bedre.', order: '9', whereWhy: '(anbefalet forenklet)', flag: 'fjern' },
  { n: '26', q: 'Notes (fri tekst)', od: 'Nej', op: 'Sommetider', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Catch-all for ting der ikke passer i felter.', order: '9', whereWhy: 'Sidste detaljer.' },
  { n: '27', q: 'Boligens specielle ting (solceller, udlejet)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (multi-select)', why: 'Solceller = energi-værdi. Aktuelt udlejet = KRITISK (kæmpe påvirkning på overtagelse).', order: '9', whereWhy: 'Sidste detaljer.' },
  { n: '28', q: 'Forhold der kan påvirke prisen', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (multi-select)', why: 'Negative pris-justeringer. MUST vi kender før vi giver estimat.', order: '9', whereWhy: 'Sidste detaljer.' },
  { n: '29', q: 'Tag-tilstand i bygningen (EF-niveau)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Proxy for EF fælleslån-risiko — kommende tag-renovering = stor udgift for alle ejere.', order: '(foreslået 9)', whereWhy: 'Sidste detaljer — under "forhold der kan påvirke prisen".', flag: 'mangler' },
  { n: '30', q: '(Cond.) Udlejning: månedlig leje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Cash-flow vurdering hvis udlejet.', order: '9 (cond.)', whereWhy: 'Reveal når "Aktuelt udlejet" valgt.' },
  { n: '31', q: '(Cond.) Udlejning: depositum', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Lovgivnings-krav check.', order: '9 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '32', q: '(Cond.) Udlejning: forudbetalt leje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Cash-flow + opsigelses-friktion.', order: '9 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '33', q: '(Cond.) Udlejning: startdato', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Tidsdimension — hvor længe har lejekontrakt eksisteret.', order: '9 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '34', q: '(Cond.) Udlejning: uopsigelig fra udlejer', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (ja/nej + mdr)', why: 'KRITISK — bestemmer om vi overhovedet kan disponere over boligen.', order: '9 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '35', q: '(Cond.) Udlejning: lejekontrakt upload', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Verificering + fund af specialvilkår.', order: '9 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '36', q: 'Fællesudgifter til ejerforeningen', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (PÅKRÆVET)', why: 'MUST. Direkte input til drift-beregning i afkast.', order: '10', whereWhy: 'Udgifter: money-context. Eneste required-felt på dette step.' },
  { n: '37', q: 'Grundskyld', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'MUST. Drift.', order: '10', whereWhy: 'Udgifter.' },
  { n: '38', q: 'Renovation', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Drift. Ofte inkluderet i fællesudg.', order: '10', whereWhy: 'Udgifter.' },
  { n: '39', q: 'Grundfond', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Drift-bidrag til EF reserve.', order: '10', whereWhy: 'Udgifter.' },
  { n: '40', q: 'Vand (acontobeløb? + årlig regning)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (ja/nej + beløb)', why: 'MUST. Drift.', order: '10', whereWhy: 'Udgifter.' },
  { n: '41', q: 'Varme (acontobeløb? + årlig regning)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (ja/nej + beløb)', why: 'MUST. Drift.', order: '10', whereWhy: 'Udgifter.' },
  { n: '42', q: 'Hæftelse tinglyst (engangsbeløb)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'MUST. Trækkes fra låneprovenuet.', order: '10', whereWhy: 'Udgifter.' },
  { n: '43', q: '(Dynamic) Øvrige driftudgifter (7 kategorier)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (+ knap)', why: 'Fleksibel input til drift. Bruger tilføjer kun det der gælder.', order: '10', whereWhy: 'Udgifter.' },
  { n: '44', q: 'Eksisterende restgæld på realkreditlån', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Påvirker netto-provenu og forventning ("jeg får 800k" vs "1.1m i hånden"). Transparens fra start.', order: '(foreslået 10)', whereWhy: 'Udgifter — money-context.', flag: 'mangler' },
  { n: '45', q: 'Dokumentation upload (PDF/JPG)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (valgfri)', why: 'Manual-validering af tal. Nice-to-have.', order: '10', whereWhy: 'Udgifter.' },
  { n: '46', q: 'Eksisterende mægler-vurdering', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'MANGLER', why: 'Forventnings-set — vis hvor vores tilbud ligger ift. mægler-pris transparent.', order: '(foreslået 11)', whereWhy: 'Lidt om dig — sammen med "hvor er du i processen".', flag: 'mangler' },
  { n: '47', q: 'Hvad er hovedgrunden til at sælge', od: 'Nej', op: 'Sometimes', zi: 'Nej', e365: 'Ja (6 valg)', why: 'Salgs-strategi (hastværk vs ikke), empati, forhandlings-position.', order: '11', whereWhy: 'Lidt om dig: efter money-stage er bruger committed.' },
  { n: '48', q: 'Hvad skal du efter salget (4 valg)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'MUST — triggers sale-leaseback eller udflytter-product. Kerneforretningens kritiske distinction.', order: '12', whereWhy: 'Lidt om dig: efter grund — naturlig "hvorfor + hvad så".' },
  { n: '49', q: '(Cond.) Ny bolig: områder', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja (chip)', why: 'Match mod vores 218 lejemål. Cross-sell opportunity.', order: '13 (cond.)', whereWhy: 'Reveal når "Vil leje anden bolig" valgt.' },
  { n: '50', q: '(Cond.) Ny bolig: rum + kvm min', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Match-kriterier.', order: '13 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '51', q: '(Cond.) Ny bolig: max husleje', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Budget-grænse for match.', order: '13 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '52', q: '(Cond.) Ny bolig: must-have features (8 chip)', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Match-kriterier.', order: '13 (cond.)', whereWhy: 'Conditional reveal.' },
  { n: '53', q: '(Cond.) Ny bolig: indflytnings-timing', od: 'Nej', op: 'Nej', zi: 'Nej', e365: 'Ja', why: 'Logistik mod salgsdato.', order: '13 (cond.)', whereWhy: 'Conditional reveal.' },
];

export default function SalgSpoergsmaalPage() {
  const mangler = ROWS.filter((r) => r.flag === 'mangler');
  const fjern = ROWS.filter((r) => r.flag === 'fjern');

  return (
    <div style={{ background: 'oklch(0.965 0.012 80)', minHeight: '100vh', paddingBottom: 80 }}>
      <article
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '48px 24px',
          fontFamily: 'Geist, system-ui, sans-serif',
          color: 'oklch(0.18 0.015 80)',
          lineHeight: 1.5,
        }}
      >
        <header style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'oklch(0.46 0.02 80)', margin: 0 }}>
            arbejdsdokument · maj 2026
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
          <p style={{ fontSize: 15, color: 'oklch(0.32 0.015 80)', maxWidth: 720 }}>
            53 spørgsmål mappet mod Opendoor, Offerpad og Zillow. Hver række forklarer hvorfor vi spørger, hvor i flowet det ligger, og hvorfor placeret der. Marker:{' '}
            <Mark color="amber">MANGLER</Mark> = anbefalet tilføjet.{' '}
            <Mark color="red">FJERN</Mark> = anbefalet fjernet eller forenklet.
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
          <div style={{ padding: 20, background: 'oklch(0.98 0.025 80)', border: '1px solid oklch(0.86 0.04 70)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'oklch(0.5 0.1 70)', margin: 0, fontWeight: 600 }}>
              mangler — anbefalet tilføjet ({mangler.length})
            </p>
            <ul style={{ fontSize: 13, marginTop: 12, paddingLeft: 20, lineHeight: 1.6 }}>
              {mangler.map((r) => (
                <li key={r.n}>
                  <strong>{r.q}</strong> — {r.why.split('.')[0]}.
                </li>
              ))}
            </ul>
          </div>
          <div style={{ padding: 20, background: 'oklch(0.97 0.015 30)', border: '1px solid oklch(0.85 0.05 30)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'oklch(0.45 0.12 30)', margin: 0, fontWeight: 600 }}>
              fjern eller forenkle ({fjern.length})
            </p>
            <ul style={{ fontSize: 13, marginTop: 12, paddingLeft: 20, lineHeight: 1.6 }}>
              {fjern.map((r) => (
                <li key={r.n}>
                  <strong>{r.q}</strong> — {r.why}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid oklch(0.91 0.015 80)', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Geist, system-ui, sans-serif' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'oklch(0.93 0.018 80)', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid oklch(0.18 0.015 80)' }}>
                <Th>#</Th>
                <Th wide>Spørgsmål</Th>
                <Th>Opendoor</Th>
                <Th>Offerpad</Th>
                <Th>Zillow</Th>
                <Th highlight>365 Ejendomme</Th>
                <Th wide highlight>Hvorfor 365 spørger</Th>
                <Th>Rækkefølge</Th>
                <Th wide>Hvorfor placeret der</Th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr
                  key={r.n}
                  style={{
                    borderBottom: '1px solid oklch(0.93 0.015 80)',
                    background:
                      r.flag === 'mangler' ? 'oklch(0.98 0.03 70 / 0.5)' :
                      r.flag === 'fjern' ? 'oklch(0.97 0.02 30 / 0.4)' : '#fff',
                  }}
                >
                  <Td>{r.n}</Td>
                  <Td>
                    <strong>{r.q}</strong>
                  </Td>
                  <Td soft>{r.od}</Td>
                  <Td soft>{r.op}</Td>
                  <Td soft>{r.zi}</Td>
                  <Td highlight>{r.flag === 'mangler' ? <Mark color="amber">{r.e365}</Mark> : r.flag === 'fjern' ? <Mark color="red">{r.e365}</Mark> : r.e365}</Td>
                  <Td highlight>{r.why}</Td>
                  <Td soft>{r.order}</Td>
                  <Td soft>{r.whereWhy}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer style={{ marginTop: 40, fontSize: 12, color: 'oklch(0.46 0.02 80)' }}>
          53 rækker · 4 mangler-flagged · 2 fjern-flagged · Senest opdateret maj 2026
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
        padding: '12px 10px',
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
        color: highlight ? 'oklch(0.35 0.045 200)' : 'oklch(0.46 0.02 80)',
        minWidth: wide ? 240 : 80,
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
        padding: '10px',
        color: soft ? 'oklch(0.46 0.02 80)' : highlight ? 'oklch(0.18 0.015 80)' : 'oklch(0.22 0.015 80)',
        verticalAlign: 'top',
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      {children}
    </td>
  );
}

function Mark({ children, color }: { children: React.ReactNode; color: 'amber' | 'red' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 10.5,
        fontWeight: 600,
        background: color === 'amber' ? 'oklch(0.92 0.12 80)' : 'oklch(0.92 0.1 30)',
        color: color === 'amber' ? 'oklch(0.35 0.15 70)' : 'oklch(0.35 0.15 30)',
        borderRadius: 3,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  );
}
