/**
 * /salg — boligberegner.
 * Public route, ingen auth. Mobile-first funnel.
 *
 * Layout-filosofi: Opendoor-style multi-section storytelling MED 365's brand-palette.
 * Hver section folger samme stencil: overline -> H2 -> sub -> content.
 * Hero er full-bleed med teal-overlay paa lifestyle-foto.
 */
import { Suspense } from 'react';
import Image from 'next/image';
import { FunnelProvider } from './FunnelContext';
import { Funnel } from './Funnel';

export const dynamic = 'force-dynamic';

export default function SalgPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted">Indlæser…</div>}>
      <FunnelProvider>
        <Hero />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24 -mt-20 sm:-mt-32 relative z-20">
          {/* Funnel sidder oppe paa hero som "loftet" Opendoor-pill */}
          <Funnel />

          <Testimonials />

          <WhyUs />

          <ProcessSection />

          <FAQSection />
        </div>
      </FunnelProvider>
    </Suspense>
  );
}

/**
 * Full-bleed hero med teal overlay og lifestyle-foto.
 * Identisk struktur til Opendoor's /sell pa naer at vi bruger 365's brand-teal
 * i stedet for orange/sand.
 */
function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full h-[640px] sm:h-[720px] bg-brand-800 overflow-hidden"
    >
      {/* Brand-gradient som baggrund — virker selv hvis stock-foto fejler at loade */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, var(--teal-500) 0%, var(--teal-700) 35%, var(--teal-800) 75%, var(--teal-900) 100%)',
        }}
      />
      {/* Subtile lyse paletter (cirkler) for warmth */}
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

      {/* Tekst-overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center pt-12 pb-32">
        <div className="max-w-2xl space-y-5 sm:space-y-7">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-brand-100">
            365 Ejendomme · Salg
          </p>
          <h1
            id="hero-title"
            className="text-white text-[44px] sm:text-[72px] lg:text-[88px] font-semibold leading-[0.98] tracking-[-0.035em] text-balance"
          >
            Sælg din bolig.<br />
            <span className="text-white/65">Den nemme måde.</span>
          </h1>
          <p className="text-base sm:text-xl text-white/85 max-w-xl leading-relaxed text-pretty">
            Få et foreløbigt kontant tilbud baseret på sammenlignelige handler i dit
            område. Ingen mægler, ingen lange ventetider — du sparer typisk{' '}
            <span className="text-white font-semibold">70.000 kr i salær</span>.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Testimonials — Opendoor's social-proof-pattern. Overline + H2 + 3 cards
 * med avatar-initialer + italic quote + name/location.
 */
function Testimonials() {
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
    <section aria-labelledby="testimonials-title" className="space-y-8">
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
    </section>
  );
}

/**
 * "Why Us" — Opendoor's "Start your sale with an offer in hand" sektion.
 * 3 store feature-cards med samme stencil: small title top + big sub-headline bottom + image.
 */
function WhyUs() {
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
    <section aria-labelledby="whyus-title" className="space-y-8">
      <SectionHeader
        overline="Start salget med et tilbud i hånden"
        titleId="whyus-title"
        title="Spring arbejdet over med et kontant tilbud fra 365."
        sub="Tre måder vi gør salget nemmere end mæglervejen."
      />
      <div className="space-y-3 sm:space-y-4">
        {features.map((f, i) => (
          <FeatureBlock key={f.label} {...f} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

function FeatureBlock({
  label,
  title,
  body,
  img,
  flip,
}: {
  label: string;
  title: string;
  body: string;
  img: string;
  flip?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl bg-white overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 border border-brand-100/60 ${
        flip ? 'md:[grid-template-columns:1fr_1fr]' : ''
      }`}
    >
      <div
        className={`p-7 sm:p-12 flex flex-col gap-5 sm:gap-8 justify-between min-h-[280px] sm:min-h-[360px] ${
          flip ? 'md:order-2' : ''
        }`}
      >
        <p className="text-sm font-semibold text-brand-700">{label}</p>
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-semibold text-ink leading-[1.1] tracking-tight text-balance">
            {title}
          </h3>
          <p className="text-base text-muted leading-relaxed max-w-md text-pretty">{body}</p>
        </div>
      </div>
      <div
        className={`bg-brand-50/40 relative min-h-[200px] sm:min-h-[360px] ${
          flip ? 'md:order-1' : ''
        }`}
      >
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-8 sm:p-12"
        />
      </div>
    </article>
  );
}

/**
 * Process — 4 trin, kort version. Pegelinjer matcher feature-cards' rytme.
 */
function ProcessSection() {
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
    <section aria-labelledby="process-title" className="space-y-8">
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
            <div className="aspect-square rounded-2xl bg-brand-50/40 overflow-hidden">
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
    </section>
  );
}

/**
 * FAQ-sektionen renderes inde fra Funnel.tsx — denne wrapper er header-only saa
 * den folger samme section-header-stencil. FAQ-listen rendres inde i Funnel.
 * (Vi flytter ikke FAQ ud af Funnel for at undgaa state-leak ift. open-idx.)
 */
function FAQSection() {
  return null; // FAQ rendres inden i Funnel.tsx pa Step 1, korrekt placeret.
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
