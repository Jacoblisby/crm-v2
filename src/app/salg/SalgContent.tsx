'use client';

/**
 * SalgContent — wrapper der toggler mellem 2 layout-modes baseret paa funnel-state.
 *
 * Mode A (Landing): Bruger har ikke valgt adresse endnu.
 *   - Full-bleed teal hero med embedded address-input pill
 *   - Under hero: testimonials, why-us, process, FAQ (Opendoor's marketing-flow)
 *
 * Mode B (Funnel): Bruger har valgt adresse eller er paa step > 1.
 *   - Compact header med back-arrow + progress-dots
 *   - Focused fullscreen step-content (intet markup-stoj)
 *   - Ingen marketing-sektioner
 *
 * Det her er FORSKELLEN fra alle de tidligere "redesigns" — vi laver
 * et nyt LAYOUT-monster, ikke bare nye farver paa samme frame.
 */
import Image from 'next/image';
import { useFunnel } from './FunnelContext';
import { HeroAddressInput } from './components/HeroAddressInput';
import { Funnel } from './Funnel';

export function SalgContent() {
  const { state } = useFunnel();

  // Mode A: ingen adresse valgt endnu — bruger er paa landing
  // Mode B: adresse valgt eller step > 1 — fokuseret funnel
  const isLanding = state.step === 1 && !state.fullAddress;

  if (isLanding) {
    return <LandingMode />;
  }
  return <FunnelMode />;
}

/**
 * MODE A — Marketing-landing med embedded address-input i hero.
 * Folger Opendoor's /sell exact pattern: hero ER formularen, sektioner nedenunder.
 */
function LandingMode() {
  return (
    <>
      {/* Hero med embedded address-input */}
      <HeroSection />

      {/* Marketing-sektioner — varieret rytme i baggrund + layout */}
      <SectionTestimonials />
      <SectionWhyUs />
      <SectionProcess />
      <SectionFAQ />
    </>
  );
}

/**
 * MODE B — Fokuseret funnel-view. Marketing forsvinder, step-content fylder skaermen.
 */
function FunnelMode() {
  return (
    <div className="min-h-screen bg-paper pt-20 sm:pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Funnel />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO + SECTIONS (Mode A only)
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full min-h-[680px] sm:min-h-[760px] bg-brand-800 overflow-hidden flex items-center"
    >
      {/* Brand-gradient baggrund */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, var(--teal-500) 0%, var(--teal-700) 35%, var(--teal-800) 75%, var(--teal-900) 100%)',
        }}
      />
      {/* Warm-tone orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #d4a574 0%, transparent 60%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #e8c89a 0%, transparent 60%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 pb-16 sm:pb-20">
        <div className="max-w-3xl space-y-7 sm:space-y-9">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-brand-100">
            365 Ejendomme · Salg
          </p>
          <h1
            id="hero-title"
            className="text-white text-[44px] sm:text-[68px] lg:text-[84px] font-semibold leading-[0.98] tracking-[-0.035em] text-balance"
          >
            Sælg din bolig.<br />
            <span className="text-white/65">Den nemme måde.</span>
          </h1>
          <p className="text-base sm:text-xl text-white/85 max-w-xl leading-relaxed text-pretty">
            Få et foreløbigt kontant tilbud baseret på sammenlignelige handler i dit
            område. Ingen mægler, ingen lange ventetider — du sparer typisk{' '}
            <span className="text-white font-semibold">70.000 kr i salær</span>.
          </p>

          {/* Address-input INDEN I hero — Opendoor's praecise placement */}
          <div className="pt-2 sm:pt-4">
            <HeroAddressInput />
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTestimonials() {
  const items = [
    {
      quote:
        '"Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og 3 uger senere var handlen lukket."',
      name: 'Mette K.',
      location: 'Solgt i Næstved, 2025',
    },
    {
      quote:
        '"Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede."',
      name: 'Lars P.',
      location: 'Solgt i Roskilde, 2024',
    },
    {
      quote:
        '"Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Mere transparent end nogen mægler vi har snakket med."',
      name: 'Anne & Søren',
      location: 'Solgt i Ringsted, 2024',
    },
  ];

  return (
    <section
      aria-labelledby="testimonials-title"
      className="bg-paper py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        <SectionHeader
          overline="Hvorfor sælgere vælger os"
          titleId="testimonials-title"
          title="87+ boliger købt siden 2024"
          sub="Rigtige sælgere. Rigtige historier. Sådan har vi gjort det enkelt for andre på Sjælland."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {items.map((t) => (
            <figure
              key={t.name}
              className="bg-white rounded-3xl p-7 sm:p-8 flex flex-col gap-5 border border-brand-100/60"
            >
              <div
                aria-hidden="true"
                className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-semibold text-sm tracking-tight"
              >
                {t.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <blockquote className="text-[15px] text-ink leading-relaxed flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="space-y-0.5">
                <div className="text-sm font-semibold text-ink">{t.name}</div>
                <div className="text-xs text-muted">{t.location}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * SectionWhyUs — distinct mørk teal sektion (Opendoor skifter ofte til mørk/lys
 * mellem sektioner for visuel rytme). Hvide feature-cards "popper" på mørk bg.
 */
function SectionWhyUs() {
  const features = [
    {
      label: 'Kontant',
      title: 'Se hvad vi vil betale for din bolig.',
      body: 'Tilbud baseret på sammenlignelige tinglyste handler i dit område + AVM-model.',
      img: '/salg-photos/flow/02-estimat.png',
    },
    {
      label: 'Fleksibel overtagelse',
      title: 'Vælg overtagelsesdato fra 14 dage til 6 måneder.',
      body: 'Du bestemmer takten. Vi tilpasser handlen til din situation.',
      img: '/salg-photos/flow/04-handel.png',
    },
    {
      label: 'Garanti',
      title: '5%-garanti: trækker du dig, koster det ingenting.',
      body: 'Hvis vores endelige tilbud efter besigtigelse afviger mere end 5%, kan du trække dig uden konsekvens.',
      img: '/salg-photos/flow/03-besigtigelse.png',
    },
  ];

  return (
    <section
      aria-labelledby="whyus-title"
      className="bg-brand-800 py-20 sm:py-28 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-14">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-brand-200">
            Start salget med et tilbud i hånden
          </p>
          <h2
            id="whyus-title"
            className="text-3xl sm:text-4xl lg:text-[44px] font-semibold leading-[1.1] tracking-tight text-balance"
          >
            Spring arbejdet over med et kontant tilbud fra 365.
          </h2>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl text-pretty">
            Tre måder vi gør salget nemmere end mæglervejen.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {features.map((f, i) => (
            <article
              key={f.label}
              className="rounded-3xl bg-white text-ink overflow-hidden grid grid-cols-1 md:grid-cols-2"
            >
              <div
                className={`p-7 sm:p-12 flex flex-col gap-5 sm:gap-8 justify-between min-h-[260px] sm:min-h-[340px] ${
                  i % 2 === 1 ? 'md:order-2' : ''
                }`}
              >
                <p className="text-sm font-semibold text-brand-700">{f.label}</p>
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold leading-[1.1] tracking-tight text-balance">
                    {f.title}
                  </h3>
                  <p className="text-base text-muted leading-relaxed max-w-md text-pretty">
                    {f.body}
                  </p>
                </div>
              </div>
              <div
                className={`bg-brand-50 relative min-h-[200px] sm:min-h-[340px] ${
                  i % 2 === 1 ? 'md:order-1' : ''
                }`}
              >
                <Image
                  src={f.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-8 sm:p-12"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionProcess() {
  const steps = [
    {
      img: '/salg-photos/flow/01-beskriv.png',
      title: 'Beskriv din bolig',
      time: '5 minutter',
      body: 'Adresse, fotos og udgifter. Vi henter offentlig data fra OIS automatisk.',
    },
    {
      img: '/salg-photos/flow/02-estimat.png',
      title: 'Få et foreløbigt tilbud',
      time: 'Med det samme',
      body: 'Bygget på sammenlignelige tinglyste handler i din ejerforening og område.',
    },
    {
      img: '/salg-photos/flow/03-besigtigelse.png',
      title: 'Gratis besigtigelse',
      time: 'Indenfor 24 timer',
      body: 'Vi kommer forbi, ser boligen, snakker om dine ønsker og overtagelsesdato.',
    },
    {
      img: '/salg-photos/flow/04-handel.png',
      title: 'Bindende tilbud + handel',
      time: '14 dage – 6 mdr',
      body: 'Du vælger overtagelsesdato. Kontant betaling, ingen mægler, ingen forbehold.',
    },
  ];

  return (
    <section
      aria-labelledby="process-title"
      className="bg-paper py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        <SectionHeader
          overline="Sådan foregår det"
          titleId="process-title"
          title="Fra adresse til handel på fire skridt."
          sub="Vi gør salget enkelt — fra du udfylder formularen til vi underskriver handlen."
        />
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border border-brand-100/60"
            >
              <div className="aspect-square rounded-2xl bg-brand-50/50 overflow-hidden">
                <Image
                  src={s.img}
                  alt=""
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-700 text-white text-[11px] font-semibold tabular-nums"
                  >
                    {i + 1}
                  </span>
                  <p className="text-[11px] uppercase tracking-wider text-brand-700 font-semibold">
                    <span className="sr-only">Trin {i + 1}, </span>
                    {s.time}
                  </p>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug">
                  {s.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed text-pretty">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * SectionFAQ — wraps FAQ component i en ny baggrund sa det visuelt adskiller sig.
 */
function SectionFAQ() {
  return (
    <section className="bg-brand-50/30 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* FAQ-komponentet inde i Funnel naar paa Step 1 — her viser vi en kopi
            til marketing-flow'et. */}
        <MarketingFAQ />
      </div>
    </section>
  );
}

function MarketingFAQ() {
  // Inline letvaegts-version (vi importerer ikke Funnel's FAQ for at undgaa
  // state-koblinger ift. open-idx, og fordi denne FAQ skal kunne vises uden
  // funnel-context).
  return (
    <div className="space-y-8">
      <div className="space-y-3 max-w-2xl">
        <p className="section-overline">Spørgsmål sælgere ofte stiller</p>
        <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-ink leading-[1.1] tracking-tight text-balance">
          Ofte stillede spørgsmål.
        </h2>
      </div>
      <details className="max-w-3xl bg-white rounded-3xl p-6 sm:p-7 border border-brand-100/60 group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base sm:text-lg font-semibold text-ink">
          Er 365 Ejendomme legit?
          <span className="text-brand-500 group-open:rotate-45 transition-transform" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="pt-4 text-[15px] text-muted leading-relaxed space-y-3">
          <p>
            Ja — vi er et registreret dansk ejendomsselskab (Boligselskabet Sommerhave ApS,
            ejet af United Capital ApS) med base i Næstved. Vi har købt over{' '}
            <strong>87 ejerlejligheder siden 2024</strong> og udlejer i dag ~218 lejemål
            i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde.
          </p>
          <p>
            CVR-registreret · Tinglyst i alle handler · Reference fra tidligere sælgere
            tilgængelig på forespørgsel.
          </p>
        </div>
      </details>
      <details className="max-w-3xl bg-white rounded-3xl p-6 sm:p-7 border border-brand-100/60 group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base sm:text-lg font-semibold text-ink">
          Hvorfor sælge til os i stedet for mægler?
          <span className="text-brand-500 group-open:rotate-45 transition-transform" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="pt-4 text-[15px] text-muted leading-relaxed space-y-3">
          <p>
            Mægler-salget tager typisk <strong>4-6 måneder</strong> og koster ~70.000 kr i
            salær plus markedsafslag på 5-10%. Hos os: ingen mæglersalær, ingen
            fremvisninger, kontant betaling, du vælger overtagelse fra 14 dage til 6 måneder.
          </p>
        </div>
      </details>
      <details className="max-w-3xl bg-white rounded-3xl p-6 sm:p-7 border border-brand-100/60 group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-base sm:text-lg font-semibold text-ink">
          Hvad nu hvis jeres tilbud er for lavt?
          <span className="text-brand-500 group-open:rotate-45 transition-transform" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="pt-4 text-[15px] text-muted leading-relaxed space-y-3">
          <p>
            Vores tilbud er ikke det højeste tal du kan få — det er det{' '}
            <strong>sikreste og hurtigste</strong>. Hvis vores foreløbige tilbud ikke giver
            mening, er der ingen forpligtelse. Vi følger ikke op aggressivt.
          </p>
        </div>
      </details>
    </div>
  );
}

function SectionHeader({
  overline,
  titleId,
  title,
  sub,
}: {
  overline: string;
  titleId: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="space-y-3 max-w-2xl">
      <p className="section-overline">{overline}</p>
      <h2
        id={titleId}
        className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-ink leading-[1.1] tracking-tight text-balance"
      >
        {title}
      </h2>
      {sub && (
        <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl text-pretty">
          {sub}
        </p>
      )}
    </div>
  );
}
