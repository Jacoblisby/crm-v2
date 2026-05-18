'use client';

/**
 * SalgContent — Opendoor 1:1 layout copy med 365 teal palette.
 *
 * Eksakt struktur fra opendoor.com/sell:
 *   1. Hero: full-bleed lifestyle photo + dark left-overlay + white H1 + pill input
 *   2. Testimonials section paa cream: "X+ homeowners served" + 3 avatar-cards
 *   3. Feature blocks: 3 STORE cards, hver er sin egen story-blok (title + big sub + img)
 *   4. FAQ accordion
 */
import Image from 'next/image';
import { useFunnel } from './FunnelContext';
import { HeroAddressInput } from './components/HeroAddressInput';
import { Funnel } from './Funnel';

export function SalgContent() {
  const { state } = useFunnel();
  const isLanding = state.step === 1 && !state.fullAddress;
  if (isLanding) return <LandingMode />;
  return <FunnelMode />;
}

function LandingMode() {
  return (
    <>
      <HeroSection />
      <TestimonialsSection />
      <FeatureBlocksSection />
      <FAQSection />
    </>
  );
}

function FunnelMode() {
  return (
    <div className="min-h-screen bg-cream pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Funnel />
      </div>
    </div>
  );
}

/**
 * Hero — Opendoor's eksakte pattern:
 * Full-bleed lifestyle photo, dark gradient overlay paa venstre 50%,
 * hvid H1 + sub + pill-input + small trust line under
 */
function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full h-[680px] sm:h-[760px] overflow-hidden"
    >
      <Image
        src="/salg-photos/hero/danish-apartment-1.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Opendoor's eksakte gradient: moerk venstre -> transparent hojre */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(20,24,26,0.75) 0%, rgba(20,24,26,0.55) 35%, rgba(20,24,26,0.2) 70%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center pt-20">
        <div className="max-w-xl space-y-6">
          <h1
            id="hero-title"
            className="text-white text-[44px] sm:text-[58px] lg:text-[64px] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
          >
            Sælg din bolig kontant.
          </h1>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed max-w-md">
            Få et foreløbigt tilbud og se hvordan vi hjælper dig med at sælge
            din ejerlejlighed.
          </p>
          <div className="pt-2">
            <HeroAddressInput />
          </div>
          <p className="text-xs text-white/70 tracking-tight">
            Ingen forpligtelse. Tager 5 minutter. Vi sender intet før sidste trin.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Testimonials — Opendoor's "301,457 homeowners served" pattern.
 * Cream baggrund, lille blue kicker, stor H2, 3 cards med rund avatar +
 * italic quote + name + city.
 */
function TestimonialsSection() {
  const items = [
    {
      initials: 'MK',
      quote:
        '"Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og 3 uger senere var handlen lukket."',
      name: 'Mette K.',
      city: 'Solgt i Næstved',
    },
    {
      initials: 'LP',
      quote:
        '"Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede."',
      name: 'Lars P.',
      city: 'Solgt i Roskilde',
    },
    {
      initials: 'AS',
      quote:
        '"Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Mere transparent end nogen mægler vi har snakket med."',
      name: 'Anne & Søren',
      city: 'Solgt i Ringsted',
    },
  ];

  return (
    <section
      aria-labelledby="testimonials-title"
      className="bg-white py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="space-y-3 max-w-3xl">
          <p className="text-sm font-medium text-brand-700">
            Hvorfor sælgere vælger 365
          </p>
          <h2
            id="testimonials-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink leading-[1.1] tracking-tight"
          >
            87+ boliger købt siden 2024.
          </h2>
          <p className="text-base text-muted max-w-xl pt-1">
            Rigtige sælgere. Rigtige historier. Sådan har vi gjort det enkelt
            for andre på Sjælland.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {items.map((t) => (
            <figure
              key={t.name}
              className="bg-cream rounded-3xl p-7 sm:p-8 flex flex-col gap-5"
            >
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-semibold text-sm tracking-tight"
              >
                {t.initials}
              </div>
              <blockquote className="text-[15px] sm:text-base text-ink leading-relaxed flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="pt-2">
                <div className="text-sm font-semibold text-ink">{t.name}</div>
                <div className="text-xs text-muted mt-0.5">{t.city}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * FeatureBlocksSection — Opendoor's "Start your sale with an offer in hand".
 * 3 STORE feature cards stacked. Hver card:
 *   - Cream baggrund
 *   - Small label top-left
 *   - BIG sub-headline bottom-left
 *   - Image right side
 *   - Generos padding (min-h 360-440px)
 */
function FeatureBlocksSection() {
  const blocks = [
    {
      label: 'Kontant tilbud',
      title: 'Se hvor meget vi vil betale for din bolig.',
      body: 'Vi baserer tilbuddet på sammenlignelige tinglyste handler i dit område plus vores afkast-model. Ingen ventetid.',
      img: '/salg-photos/flow/02-estimat.png',
    },
    {
      label: 'Fleksibel overtagelse',
      title: 'Du vælger overtagelsesdato. Fra 14 dage til 6 måneder.',
      body: 'Vi tilpasser handlen til din takt. Skal du flytte hurtigt? Skal du blive boende lidt endnu? Begge dele virker.',
      img: '/salg-photos/flow/04-handel.png',
    },
    {
      label: 'Inspections-garanti',
      title: '5%-garanti: trækker du dig, koster det ingenting.',
      body: 'Hvis vores endelige tilbud efter besigtigelse afviger mere end 5%, kan du trække dig uden konsekvens.',
      img: '/salg-photos/flow/03-besigtigelse.png',
    },
  ];

  return (
    <section
      aria-labelledby="features-title"
      className="bg-white py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="space-y-3 max-w-3xl">
          <p className="text-sm font-medium text-brand-700">
            Start salget med et tilbud i hånden
          </p>
          <h2
            id="features-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink leading-[1.1] tracking-tight"
          >
            Spring arbejdet over med et kontant tilbud fra 365.
          </h2>
          <p className="text-base text-muted max-w-xl pt-1">
            Tre måder vi gør salget nemmere end mæglervejen.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {blocks.map((b) => (
            <article
              key={b.label}
              className="bg-cream rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[360px] sm:min-h-[440px]"
            >
              <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between gap-8">
                <p className="text-sm font-medium text-ink/70">{b.label}</p>
                <div className="space-y-4">
                  <h3 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold text-ink leading-[1.05] tracking-tight text-balance">
                    {b.title}
                  </h3>
                  <p className="text-base text-muted leading-relaxed max-w-md">
                    {b.body}
                  </p>
                </div>
              </div>
              <div className="relative min-h-[240px] md:min-h-full bg-cream-dark/40">
                <Image
                  src={b.img}
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

function FAQSection() {
  const items = [
    {
      q: 'Er 365 Ejendomme legit?',
      a: 'Ja. Vi er et registreret dansk ejendomsselskab (Boligselskabet Sommerhave ApS, ejet af United Capital ApS) med base i Næstved. Vi har købt over 87 ejerlejligheder siden 2024 og udlejer i dag ~218 lejemål i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde.',
    },
    {
      q: 'Hvorfor sælge til os i stedet for mægler?',
      a: 'Mægler-salget tager typisk 4-6 måneder og koster ~70.000 kr i salær plus markedsafslag på 5-10%. Hos os: ingen mæglersalær, ingen fremvisninger, kontant betaling, du vælger overtagelse fra 14 dage til 6 måneder.',
    },
    {
      q: 'Hvad nu hvis jeres tilbud er for lavt?',
      a: 'Vores tilbud er ikke det højeste tal du kan få — det er det sikreste og hurtigste. Hvis vores foreløbige tilbud ikke giver mening, er der ingen forpligtelse. Vi følger ikke op aggressivt.',
    },
    {
      q: 'Hvordan får jeg et kontant tilbud?',
      a: 'Udfyld formularen øverst på siden. Vi henter offentlige data fra OIS automatisk, beregner et foreløbigt tilbud, og Jacob kommer forbi inden for 24 timer til en gratis besigtigelse. Hele processen tager normalt 1-2 uger.',
    },
  ];

  return (
    <section aria-labelledby="faq-title" className="bg-white pb-20 sm:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="space-y-3 max-w-3xl">
          <p className="text-sm font-medium text-brand-700">
            Ofte stillede spørgsmål
          </p>
          <h2
            id="faq-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink leading-[1.1] tracking-tight"
          >
            Det skal du vide først.
          </h2>
        </div>

        <div className="max-w-3xl divide-y divide-stone-200 border-y border-stone-200">
          {items.map((item, idx) => (
            <details key={idx} className="group">
              <summary className="flex items-center justify-between gap-6 py-6 cursor-pointer list-none">
                <h3 className="text-base sm:text-lg font-semibold text-ink">
                  {item.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-stone-400 transition-transform group-open:rotate-45"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 4v12M4 10h12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <div className="pb-6 pr-10 -mt-1">
                <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
