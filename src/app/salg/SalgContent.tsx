'use client';

/**
 * SalgContent — "Sommerhave Luxe" implementation (Variant C fra design-shotgun).
 *
 * Layout-filosofi: Premium scandinavian boutique agency. Cream paper + dusty sage +
 * brass + charcoal. Generos negativ-space. Macro texture-fotografi (ikke wide
 * interior shots). DM Serif Display headlines + Inter body. Italic er hovedrolle.
 *
 * Mode A (Landing): hero med embedded address-input + marketing-sektioner
 * Mode B (Funnel): fokuseret single-step view, ingen marketing
 */
import Image from 'next/image';
import { useFunnel } from './FunnelContext';
import { HeroAddressInput } from './components/HeroAddressInput';
import { Funnel } from './Funnel';

export function SalgContent() {
  const { state } = useFunnel();
  const isLanding = state.step === 1 && !state.fullAddress;

  if (isLanding) {
    return <LandingMode />;
  }
  return <FunnelMode />;
}

function LandingMode() {
  return (
    <>
      <HeroSection />
      <PhilosophySection />
      <FeaturesSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}

function FunnelMode() {
  return (
    <div className="min-h-screen bg-paper pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Funnel />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hero — Variant C: 2-column layout med macro texture-foto til hojre.
 * Serif H1 floats over cream paper. Brass-accent CTA. Whisper-quality copy.
 */
function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative bg-paper min-h-[760px] sm:min-h-[820px] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-28 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-[620px]">
          {/* Left: tekst + form */}
          <div className="lg:col-span-7 space-y-7 sm:space-y-10">
            <p className="luxe-overline">365 Ejendomme · Boutique salg</p>

            <h1
              id="hero-title"
              className="font-serif-display text-ink text-[56px] sm:text-[80px] lg:text-[96px] leading-[0.95] tracking-tight"
            >
              Sælg din bolig.
              <br />
              <span className="font-serif-display-italic text-sage-700">
                Den nemme måde.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink-soft max-w-xl leading-relaxed text-pretty">
              Få et foreløbigt kontant tilbud baseret på sammenlignelige handler
              i dit område. Ingen mægler, ingen lange ventetider. Du sparer
              typisk{' '}
              <span className="text-ink font-semibold">70.000 kr i salær</span>.
            </p>

            <div className="pt-2">
              <HeroAddressInput />
            </div>

            <p className="text-xs text-muted tracking-wide">
              Et boutique ejendomsselskab · Næstved · Roskilde · Ringsted ·
              Kalundborg · Taastrup
            </p>
          </div>

          {/* Right: macro texture-foto */}
          <div className="lg:col-span-5 relative h-[360px] sm:h-[460px] lg:h-[620px]">
            <div className="absolute inset-0 rounded-[40px] overflow-hidden">
              <Image
                src="/salg-photos/luxe/monstera-shadow.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * PhilosophySection — boutique-agency "om os" sektion med italic display + serif body.
 * Editorial mood: lots of negative space + macro detail-foto.
 */
function PhilosophySection() {
  return (
    <section className="bg-paper-50 py-24 sm:py-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <div className="lg:col-span-4 lg:col-start-2 relative h-[400px] sm:h-[520px] order-2 lg:order-1">
          <div className="absolute inset-0 rounded-[32px] overflow-hidden">
            <Image
              src="/salg-photos/luxe/coffee-light.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-7 order-1 lg:order-2">
          <p className="luxe-overline">Vores filosofi</p>
          <h2 className="font-serif-display text-ink text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.02] tracking-tight">
            Et salg uden støj.
            <br />
            <span className="font-serif-display-italic text-sage-700">
              Uden hastværk.
            </span>
          </h2>
          <div className="space-y-5 text-[17px] text-ink-soft leading-[1.7] max-w-xl">
            <p>
              Vi er ikke en mægler-platform. Vi er et lille selskab i Næstved
              der køber ejerlejligheder kontant — én sælger ad gangen, til en
              fair pris, uden fremvisninger eller lange ventetider.
            </p>
            <p>
              Hvis vores foreløbige tilbud ikke passer dig, skylder du os
              ingenting. Hvis det passer, kommer Jacob forbi inden for 24 timer
              og snakker med dig.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FeaturesSection — 3 "værdier" som store editorial cards med italic accent.
 */
function FeaturesSection() {
  const features = [
    {
      number: '01',
      title: 'Kontant tilbud',
      italic: 'med det samme',
      body: 'Baseret på sammenlignelige tinglyste handler i dit område plus vores afkast-model. Du får et tal i hånden, ikke en samtale.',
    },
    {
      number: '02',
      title: 'Du vælger overtagelsen',
      italic: '14 dage til 6 måneder',
      body: 'Vi tilpasser os din takt. Skal du flytte hurtigt? Skal du blive boende lidt endnu? Begge dele virker.',
    },
    {
      number: '03',
      title: 'Fem procent garanti',
      italic: 'ingen forpligtelse',
      body: 'Hvis vores endelige tilbud efter besigtigelse afviger mere end 5%, kan du trække dig. Du har intet på spil.',
    },
  ];

  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16 sm:space-y-20">
        <div className="space-y-5 max-w-2xl">
          <p className="luxe-overline">Sådan virker det</p>
          <h2 className="font-serif-display text-ink text-[44px] sm:text-[64px] lg:text-[72px] leading-[0.98] tracking-tight">
            Tre løfter.
            <br />
            <span className="font-serif-display-italic text-sage-700">
              Ingen finprint.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sage-100">
          {features.map((f) => (
            <article
              key={f.number}
              className="bg-paper p-8 sm:p-12 space-y-6 min-h-[400px] flex flex-col"
            >
              <span className="luxe-overline text-brass-600">— {f.number}</span>
              <h3 className="font-serif-display text-ink text-[32px] sm:text-[40px] leading-[1.05] tracking-tight">
                {f.title}
                <br />
                <span className="font-serif-display-italic text-sage-700 text-[24px] sm:text-[28px]">
                  {f.italic}
                </span>
              </h3>
              <p className="text-[15px] text-ink-soft leading-[1.7] mt-auto">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * TestimonialsSection — editorial pull-quote style. Stort italic quote-mark,
 * full-width quote, attribution under.
 */
function TestimonialsSection() {
  const items = [
    {
      quote:
        'Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og tre uger senere var handlen lukket.',
      name: 'Mette K.',
      meta: 'Solgt i Næstved · 2025',
    },
    {
      quote:
        'Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede.',
      name: 'Lars P.',
      meta: 'Solgt i Roskilde · 2024',
    },
    {
      quote:
        'Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Mere transparent end nogen mægler vi har snakket med.',
      name: 'Anne & Søren',
      meta: 'Solgt i Ringsted · 2024',
    },
  ];

  return (
    <section className="bg-sage-50 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16 sm:space-y-20">
        <div className="space-y-5 max-w-2xl">
          <p className="luxe-overline">Hvad sælgere siger</p>
          <h2 className="font-serif-display text-ink text-[44px] sm:text-[64px] lg:text-[72px] leading-[0.98] tracking-tight">
            87+ historier
            <br />
            <span className="font-serif-display-italic text-sage-700">
              siden 2024.
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {items.map((t) => (
            <figure key={t.name} className="space-y-6">
              <span
                aria-hidden="true"
                className="font-serif-display-italic text-brass-500 text-[80px] leading-none block -mb-4"
              >
                &ldquo;
              </span>
              <blockquote className="font-serif-display-italic text-ink text-[22px] sm:text-[24px] leading-[1.35] tracking-tight">
                {t.quote}
              </blockquote>
              <figcaption className="pt-4 border-t border-sage-300/50 space-y-0.5">
                <div className="text-sm font-semibold text-ink tracking-tight">
                  {t.name}
                </div>
                <div className="text-xs text-muted tracking-wide">{t.meta}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * FAQSection — editorial style accordion. Brass detail på open state.
 */
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
    <section className="bg-paper py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
        <div className="space-y-5 max-w-2xl">
          <p className="luxe-overline">Ofte stillede spørgsmål</p>
          <h2 className="font-serif-display text-ink text-[44px] sm:text-[64px] lg:text-[72px] leading-[0.98] tracking-tight">
            Det skal du
            <br />
            <span className="font-serif-display-italic text-sage-700">
              vide først.
            </span>
          </h2>
        </div>

        <div className="max-w-3xl divide-y divide-sage-300/40 border-y border-sage-300/40">
          {items.map((item, idx) => (
            <details key={idx} className="group">
              <summary className="flex items-baseline justify-between gap-6 py-7 cursor-pointer list-none">
                <h3 className="font-serif-display text-ink text-[22px] sm:text-[28px] leading-tight tracking-tight">
                  {item.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="luxe-overline text-brass-500 group-open:text-brass-700 transition-colors shrink-0"
                >
                  <span className="group-open:hidden">Vis</span>
                  <span className="hidden group-open:inline">Skjul</span>
                </span>
              </summary>
              <div className="pb-7 pr-8 -mt-2">
                <p className="text-[16px] text-ink-soft leading-[1.7] max-w-2xl">
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
