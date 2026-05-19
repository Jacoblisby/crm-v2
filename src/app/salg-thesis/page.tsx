/**
 * /salg-thesis — strategisk argumentation for hvorfor 365 v3 funnel-design
 * er differentieret mod Opendoor, Offerpad og Zillow.
 *
 * Editorial layout — Fraunces display + Geist body. Renderes som artikel,
 * ikke som marketing-side. Beregnet til at deles m. stakeholders/investorer.
 */

export const dynamic = 'force-static';

export default function SalgThesisPage() {
  return (
    <div style={{ background: 'oklch(0.965 0.012 80)', minHeight: '100vh', paddingBottom: 80 }}>
      <article
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '64px 24px',
          fontFamily: 'Geist, system-ui, sans-serif',
          color: 'oklch(0.18 0.015 80)',
          lineHeight: 1.6,
        }}
      >
        <header style={{ marginBottom: 64 }}>
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'oklch(0.46 0.02 80)',
              margin: 0,
            }}
          >
            Strategisk dokument · maj 2026
          </p>
          <h1
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 'clamp(40px, 6vw, 64px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              margin: '16px 0',
              fontWeight: 400,
            }}
          >
            Hvorfor 365-funnel&apos;en ikke ligner{' '}
            <em
              style={{
                color: 'oklch(0.35 0.045 200)',
                fontStyle: 'italic',
                fontFamily: 'Fraunces, Georgia, serif',
              }}
            >
              Opendoor, Offerpad eller Zillow.
            </em>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'oklch(0.32 0.015 80)',
              lineHeight: 1.55,
              maxWidth: 560,
            }}
          >
            Hver af de tre amerikanske iBuyer-platforme blev bygget til volume og hurtighed.
            365 er bygget til det modsatte: lokal, langsom, personlig. Det dikterer hver
            beslutning i hvordan funnel&apos;en spørger, hvad den viser, og hvad den udelader.
          </p>
        </header>

        <Section title="Konteksten — ikke alle markeder er ens" kicker="udgangspunkt">
          <P>
            <Em>Opendoor</Em> købte 39.000 amerikanske huse i 2021 til en omsætning på 8 mia
            USD. Forretningsmodellen er flip: køb, lille renovering, gensalg inden for 90
            dage. Service-fee er 5 procent, tilbuddet ligger typisk 7 til 12 procent under
            markedsværdi for at dække risiko og afkast.
          </P>
          <P>
            <Em>Offerpad</Em> opererer i 28 amerikanske markeder med samme model — lidt
            mere fleksibel overtagelse (op til 90 dage) og en &ldquo;list with us&rdquo;-
            optionside af cash offer.
          </P>
          <P>
            <Em>Zillow</Em> lukkede deres Zillow Offers ned i november 2021 efter at have
            tabt 881 mio USD på iBuying. De er ikke længere en køber af boliger, men en
            inforamtionsside. Zestimate forbliver det bredeste prisestimat-værktøj i USA,
            men det er ikke en hjælp når du faktisk skal sælge.
          </P>
          <P>
            365 er ikke en flipper. Vi er en udlejer. Vi købte 87 boliger mellem januar 2024
            og maj 2026 til en portefølje på 218 lejemål — alle stadig i besiddelse, alle
            udlejet til reelle danske familier. Det forskel i forretningsmodel ændrer
            alting nedstrøms.
          </P>
        </Section>

        <Section title="Hvad 365-funnel&apos;en gør anderledes" kicker="signatur-træk">
          <H3>1. Vi sælger ikke teknologi. Vi sælger Jacob.</H3>
          <P>
            Opendoor giver dig et &ldquo;instant offer&rdquo; på 60 sekunder. Det er
            algoritmen der taler. 365-funnel&apos;en spørger&nbsp;14 spørgsmål før et tal
            vises, og hvert tal er forklaret med konkret data fra OIS og BBR.
          </P>
          <P>
            Vores målgruppe er 50 til 65 år gamle ejerlejlighedsejere på Sjælland i en
            livskrise — dødsbo, skilsmisse, plejehjem. De er ikke imponerede af et tal der
            blev beregnet på et halvt sekund. De har brug for at føle <Em>set</Em>. 14
            spørgsmål er ikke friktion. Det er en samtale.
          </P>

          <H3>2. Kontakt før kalkulation</H3>
          <P>
            Opendoor og Offerpad spørger om navn/telefon <Em>efter</Em> de har vist
            tilbuddet — fordi de skal låse dig in. Vi spørger på trin&nbsp;3 af 14, lige
            efter du har bekræftet at det er din bolig.
          </P>
          <P>
            Det er en bevidst inversion. Hvis kunden ikke er villig til at give email
            eller telefon for at få et estimat, er det ikke en kunde vi er klar til at
            servicere endnu. De bliver i toppen af tragten. Vi mister hverken tid eller
            håb.
          </P>

          <H3>3. Sale-leaseback som førsteklasses option</H3>
          <P>
            På trin&nbsp;12 viser vi fire scenarier efter salget. Et af dem er
            &ldquo;<Em>Vil blive boende som lejer</Em>&rdquo; — markeret som det populære
            valg. Det er sale-leaseback: vi køber boligen, du bliver boende mod husleje.
          </P>
          <P>
            Opendoor og Offerpad tilbyder dette produkt ikke. For dem er det meningsløst —
            de skal flippe boligen, ikke holde den. For os er det <Em>kerneforretningen</Em>:
            vi vil have lejere, ikke salg. Hvis sælgeren bliver boende, har vi en
            stabilitets-fordel som ingen iBuyer kan matche.
          </P>
          <P>
            For en 75-årig enke der ikke kan magte mæglervisninger men heller ikke vil
            flytte væk fra sin nabo Hanna, er sale-leaseback hele forretningen i én linje.
            Vores funnel gør den synlig. De andres skjuler den eller har den slet ikke.
          </P>

          <H3>4. Dansk ejerforening-viden er bagt ind</H3>
          <P>
            På trin&nbsp;10 spørger vi om Grundfond, Fælleslån, Hæftelse til
            ejerforening, Vedligeholdelseskonto — termer der ikke eksisterer i USA. Opendoor
            kan ikke kode et flow der spørger om disse felter fordi de er specifikke for
            danske ejerforeninger.
          </P>
          <P>
            Hver gang en bruger ser en kategori-dropdown med &ldquo;Ydelse på fælleslån&rdquo;
            som forvalgt kategori, signaler det at vi forstår hvad de står overfor. Det er
            tillidsskabelse uden eksplicit kommunikation.
          </P>

          <H3>5. Drag-to-explore i stedet for fixed quote</H3>
          <P>
            På Estimat-skærmen kan du trække en slider mellem 14&nbsp;dage og 6&nbsp;måneder
            for overtagelse. Prisen ændrer sig live. Du kan se konkret hvor meget hurtighed
            koster eller giver.
          </P>
          <P>
            Opendoor giver dig ét tilbud med én lukke-dato. Hvis du vil have en anden, må
            du tage en samtale med deres team. Vi vendte forholdet om: brugeren leger med
            tilbuddet, og samtalen med os er kun for at bekræfte detaljer.
          </P>

          <H3>6. Editorial typografi vs SaaS sans</H3>
          <P>
            Opendoor, Offerpad og Zillow bruger alle Inter eller Helvetica. Det er det
            generiske &ldquo;tech-tool&rdquo;-udtryk. Vi bruger Fraunces — en variabel
            serif med italic-evne og optisk størrelsesoptimering.
          </P>
          <P>
            Det signalerer noget specifikt: dette er ikke en app. Det er et dokument. Det
            er noget der har vægt, som du tager seriøst. Ord som <Em>kontant</Em> og
            <Em>din bolig</Em> får italic-emphasis — den slags typografisk markering du ser
            i Monocle eller Weekendavisen, ikke i en SaaS-platform.
          </P>
        </Section>

        <Section title="Sammenligning, tabel-form" kicker="hvor vi adskiller os">
          <ComparisonTable />
        </Section>

        <Section title="Hvad vi ikke kan vinde på" kicker="ærlig vurdering">
          <P>
            Vi vinder ikke på <Em>brand recognition</Em>. Opendoor har 1,3 mia USD årlig
            marketing-budget. Vi har 0 kr. Når en bolig sælger i Nordsjælland og folk
            googler &ldquo;iBuyer Danmark&rdquo;, ved de ikke at 365 eksisterer.
          </P>
          <P>
            Vi vinder ikke på <Em>kapital-pool</Em>. Opendoor har 1,4 mia USD likvider og
            kan tilbyde umiddelbar cash close på 300 boliger samtidig. Vores cash-pool er
            betydeligt mindre. Vi kan kun absorbere et antal boliger per måned.
          </P>
          <P>
            Vi vinder ikke på <Em>geografisk dækning</Em>. Opendoor er i 50 amerikanske
            markeder. Vi er på Sjælland — Næstved, Ringsted, Roskilde, Kalundborg,
            Taastrup. En bolig i Aarhus eller på Bornholm kan vi ikke købe.
          </P>
          <P>
            Det er fint. Vi konkurrerer ikke om volume. Vi konkurrerer om <Em>match</Em> —
            den specifikke 67-årige enkemand i Næstved der har boet i sin lejlighed siden
            1985 og nu skal vurdere om han kan blive i nabolaget. Opendoor kan ikke
            servicere ham. Vi kan.
          </P>
        </Section>

        <Section title="Hvad funnel-designet ENCODER" kicker="opsummering">
          <P>
            Hver beslutning i 365 v3-funnel&apos;en kan oversættes til en strategisk pointe:
          </P>
          <Bullets>
            <li>
              <Em>14 spørgsmål</Em> = vi er ikke en flipper, vi tager tid.
            </li>
            <li>
              <Em>Kontakt på trin&nbsp;3</Em> = vi vil have lead-relation, ikke transaktion.
            </li>
            <li>
              <Em>Drag-slider på Estimat</Em> = transparens om hvordan tid påvirker pris.
            </li>
            <li>
              <Em>Sale-leaseback som populært valg</Em> = vi vil have lejere, ikke flips.
            </li>
            <li>
              <Em>Editorial Fraunces</Em> = vi er ikke en app, vi er et tilbud.
            </li>
            <li>
              <Em>Lokale tal</Em> (130 handler, 218 lejemål, Næstved-postnumre) = vi er din nabo,
              ikke en algoritme i Phoenix.
            </li>
            <li>
              <Em>Jacob&apos;s navn i flowet</Em> = en konkret menneskelig modpart,
              ikke &ldquo;our team&rdquo;.
            </li>
            <li>
              <Em>Drift-felter for Grundfond &amp; Fælleslån</Em> = vi forstår dansk
              ejendomsret.
            </li>
            <li>
              <Em>5%-tilbageleverings-garanti</Em> = nul-risiko-tilbud, ikke
              gradvis-justering-efter-besigtigelse.
            </li>
          </Bullets>
          <P>
            En 14-trins funnel er kun for lang hvis trinnene er irrelevante. Hver af vores
            14 trin spørger om noget hverken Opendoor, Offerpad eller Zillow tør spørge om,
            fordi de bygger til hastighed. Vi bygger til <Em>tillid</Em>. De er forskellige
            spil.
          </P>
        </Section>

        <footer
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: '1px solid oklch(0.91 0.015 80)',
            fontSize: 12,
            color: 'oklch(0.46 0.02 80)',
          }}
        >
          <p style={{ margin: 0 }}>
            365 Ejendomme · Boligselskabet Sommerhave ApS · Næstved · maj 2026
          </p>
          <p style={{ margin: '8px 0 0' }}>
            Funnel-design tilgængeligt på{' '}
            <a href="/salg-v3" style={{ color: 'oklch(0.35 0.045 200)', textDecoration: 'underline' }}>
              /salg-v3
            </a>{' '}
            ·{' '}
            <a href="/salg-wire" style={{ color: 'oklch(0.35 0.045 200)', textDecoration: 'underline' }}>
              wireframe på /salg-wire
            </a>
          </p>
        </footer>
      </article>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,100..900,30..100;1,9..144,100..900,30..100&family=Geist:wght@300..700&display=swap" rel="stylesheet" />
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────

function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <p
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'oklch(0.46 0.02 80)',
          margin: 0,
        }}
      >
        {kicker}
      </p>
      <h2
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 'clamp(28px, 4vw, 38px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '10px 0 24px',
          fontWeight: 400,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 20,
        lineHeight: 1.3,
        letterSpacing: '-0.015em',
        margin: '32px 0 12px',
        fontWeight: 500,
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 16,
        lineHeight: 1.65,
        color: 'oklch(0.22 0.015 80)',
        margin: '0 0 16px',
        maxWidth: '65ch',
      }}
    >
      {children}
    </p>
  );
}

function Em({ children }: { children: React.ReactNode }) {
  return (
    <em
      style={{
        color: 'oklch(0.35 0.045 200)',
        fontStyle: 'italic',
        fontFamily: 'Fraunces, Georgia, serif',
        fontWeight: 500,
      }}
    >
      {children}
    </em>
  );
}

function Bullets({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: 'oklch(0.22 0.015 80)',
        paddingLeft: 24,
        margin: '0 0 16px',
      }}
    >
      {children}
    </ul>
  );
}

function ComparisonTable() {
  const rows: Array<[string, string, string, string, string]> = [
    ['Forretningsmodel', 'Flip', 'Flip', 'Eksisterer ikke længere', 'Buy-to-let'],
    ['Marked', '50 amerikanske byer', '28 amerikanske byer', 'USA — kun estimat', 'Sjælland (5 byer)'],
    ['Antal trin i flow', '4-5', '6-8', '1-2', '14'],
    ['Tilbud-tid', '60 sekunder', '24 timer', '< 1 sek (Zestimate)', '5 min + 24t opfølgning'],
    ['Mæglerfee', '5%', '5-7%', '—', '0 kr'],
    ['Sale-leaseback', 'Nej', 'Nej', '—', 'Ja (kerneprodukt)'],
    ['Personlig kontakt', 'Nej', 'Email/chat', '—', 'Jacob ringer'],
    ['Tilbud kan reduceres efter inspect', 'Ja, ofte', 'Ja', '—', '5% guarantee'],
    ['Dansk EF-data', 'Nej', 'Nej', 'Nej', 'Ja (Grundfond, fælleslån, hæftelse)'],
    ['Overtagelse-fleksibilitet', '14 dage standard', '7-90 dage', '—', '14 dage til 6 mdr (drag-slider)'],
  ];
  return (
    <div style={{ overflowX: 'auto', marginTop: 16 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Geist, system-ui, sans-serif' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid oklch(0.18 0.015 80)' }}>
            <th style={{ textAlign: 'left', padding: '12px 8px 12px 0', fontWeight: 500, color: 'oklch(0.46 0.02 80)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              dimension
            </th>
            {['Opendoor', 'Offerpad', 'Zillow', '365 Ejendomme'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 500, color: h === '365 Ejendomme' ? 'oklch(0.35 0.045 200)' : 'oklch(0.46 0.02 80)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([dim, a, b, c, d], i) => (
            <tr key={i} style={{ borderBottom: '1px solid oklch(0.91 0.015 80)' }}>
              <td style={{ padding: '10px 8px 10px 0', fontWeight: 500, color: 'oklch(0.22 0.015 80)' }}>{dim}</td>
              <td style={{ padding: '10px 8px', color: 'oklch(0.32 0.015 80)' }}>{a}</td>
              <td style={{ padding: '10px 8px', color: 'oklch(0.32 0.015 80)' }}>{b}</td>
              <td style={{ padding: '10px 8px', color: 'oklch(0.32 0.015 80)' }}>{c}</td>
              <td style={{ padding: '10px 8px', color: 'oklch(0.18 0.015 80)', fontWeight: 500, background: 'oklch(0.95 0.025 200)' }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
