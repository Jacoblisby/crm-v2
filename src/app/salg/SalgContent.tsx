'use client';

/**
 * SalgContent — "Levende Reportage" (Variant D fra design-shotgun).
 *
 * Cinematic dark-mode landing der laaner fra Apple, Linear, Vercel:
 *   - Pitch-black baggrund med high-contrast typografi
 *   - Geist Sans throughout
 *   - Kinetic ghost-headline (multiple low-opacity copies bag main H1)
 *   - Massive Geist Mono stat-reveals
 *   - Dark moody fotografi (door, keys, dusk interior)
 *   - Brand teal #2C5C5D som accent — bevidst sparsom brug
 *
 * Mode A: marketing-landing. Mode B: focused funnel-step.
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
      <StatsSection />
      <HowSection />
      <TestimonialsSection />
      <FAQSection />
    </>
  );
}

function FunnelMode() {
  return (
    <div className="min-h-screen bg-surface-0 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Funnel />
      </div>
    </div>
  );
}

/**
 * Hero — full-bleed dark med kinetic ghost-typografi.
 * Layout: H1 venstre + cinematic dark photo hojre.
 */
function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative bg-surface-0 min-h-screen overflow-hidden grain-overlay"
    >
      {/* Subtle gradient lighting bag-grunden — som Linear */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(44,92,93,0.25) 0%, transparent 50%), radial-gradient(circle at 20% 100%, rgba(44,92,93,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-screen">
        {/* Left: tekst + form */}
        <div className="lg:col-span-7 space-y-8 sm:space-y-10">
          <div className="space-y-3">
            <p className="cine-kicker">365 Ejendomme</p>
            <KineticHeadline />
          </div>

          <p className="text-base sm:text-lg text-ink-dim max-w-xl leading-relaxed text-pretty">
            Få et foreløbigt kontant tilbud baseret på sammenlignelige handler i
            dit område. Ingen mægler, ingen lange ventetider. Du sparer typisk{' '}
            <span className="text-ink font-semibold">70.000 kr i salær</span>.
          </p>

          <div className="pt-2">
            <HeroAddressInput />
          </div>

          <p className="text-xs text-muted tracking-widest uppercase font-semibold">
            Næstved · Roskilde · Ringsted · Kalundborg · Taastrup
          </p>
        </div>

        {/* Right: cinematic dark photo */}
        <div className="lg:col-span-5 relative h-[460px] sm:h-[560px] lg:h-[680px]">
          <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-white/10">
            <Image
              src="/salg-photos/cinematic/door-open.png"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
            {/* Subtil teal lys-ovenfra */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 40%, rgba(10,12,13,0.5) 100%)',
              }}
            />
          </div>

          {/* Floating data-card paa fotoet — Apple/Linear style */}
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-[280px] bg-surface-1/80 backdrop-blur-md ring-1 ring-white/10 rounded-xl p-5 space-y-3">
            <p className="cine-kicker">Live nu</p>
            <p className="text-sm text-ink-dim leading-relaxed">
              Vi har købt{' '}
              <span className="mono-num text-brand-300 font-semibold">87+</span>{' '}
              boliger siden 2024 — gennemsnitlig overtagelse på{' '}
              <span className="mono-num text-brand-300 font-semibold">42 dage</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * KineticHeadline — H1 med overlappende ghost-copies i lav opacity teal
 * for at suggest motion. Pure CSS via flere stackede spans.
 */
function KineticHeadline() {
  return (
    <h1
      id="hero-title"
      className="relative text-ink text-[52px] sm:text-[80px] lg:text-[104px] font-semibold leading-[0.92] tracking-[-0.03em] text-balance"
    >
      {/* Ghost copies — placeret bag main H1 i lav opacity teal */}
      <span
        aria-hidden="true"
        className="absolute inset-0 text-brand-500 opacity-30 -translate-x-1 translate-y-0.5"
      >
        Sælg din bolig.
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 text-brand-400 opacity-15 translate-x-1 -translate-y-0.5"
      >
        Sælg din bolig.
      </span>
      <span className="relative">Sælg din bolig.</span>
    </h1>
  );
}

/**
 * StatsSection — massive Geist Mono tabular-nums stat-reveals.
 * Apple-style hard data display.
 */
function StatsSection() {
  const stats = [
    { num: '87+', label: 'Boliger købt siden 2024', meta: 'Vækst 142% YoY' },
    { num: '42d', label: 'Gennemsnitlig overtagelse', meta: 'Fra accept til closing' },
    { num: '2,5M+', label: 'Sparet i mæglersalær', meta: 'Akkumuleret 2024–2025' },
    { num: '5%', label: 'Garanti på tilbud', meta: 'Træk dig hvis vi afviger' },
  ];

  return (
    <section
      aria-label="Tal og data"
      className="relative bg-surface-0 py-24 sm:py-32 border-t border-hairline"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="space-y-3 max-w-2xl mb-16">
          <p className="cine-kicker">Tallene</p>
          <h2 className="text-ink text-[40px] sm:text-[56px] font-semibold leading-[1.02] tracking-[-0.025em] text-balance">
            Hvad vi har leveret.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
          {stats.map((s) => (
            <div
              key={s.num}
              className="bg-surface-0 p-6 sm:p-8 space-y-2 min-h-[180px] sm:min-h-[200px] flex flex-col justify-end"
            >
              <div className="mono-num text-ink text-[44px] sm:text-[64px] lg:text-[80px] font-semibold leading-none">
                {s.num}
              </div>
              <div className="text-sm text-ink-dim font-medium">{s.label}</div>
              <div className="text-[11px] text-muted tracking-wider uppercase font-medium">
                {s.meta}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * HowSection — 4 steps som horizontal "story" cards. Hver card har et lille
 * step-number i mono + title + body. Inspireret af Linear's roadmap-display.
 */
function HowSection() {
  const steps = [
    {
      num: '01',
      title: 'Indtast adresse',
      time: '5 min',
      body: 'Vi henter offentlige data fra OIS automatisk. Du behøver kun beskrive din bolig kort.',
    },
    {
      num: '02',
      title: 'Få et foreløbigt tilbud',
      time: 'Straks',
      body: 'Baseret på sammenlignelige tinglyste handler + vores afkast-model.',
    },
    {
      num: '03',
      title: 'Gratis besigtigelse',
      time: '24t',
      body: 'Jacob kommer forbi, ser boligen og snakker om dine ønsker og overtagelsesdato.',
    },
    {
      num: '04',
      title: 'Bindende tilbud + handel',
      time: '14d – 6 mdr',
      body: 'Du vælger overtagelsesdato. Kontant betaling, ingen forbehold, ingen mægler.',
    },
  ];

  return (
    <section
      aria-labelledby="how-title"
      className="relative bg-surface-1 py-24 sm:py-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
        <div className="space-y-3 max-w-2xl">
          <p className="cine-kicker">Sådan virker det</p>
          <h2
            id="how-title"
            className="text-ink text-[40px] sm:text-[56px] font-semibold leading-[1.02] tracking-[-0.025em] text-balance"
          >
            Fra adresse til handel — fire skridt.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-hairline">
          {steps.map((s) => (
            <article
              key={s.num}
              className="bg-surface-1 p-6 sm:p-8 space-y-5 min-h-[280px] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="mono-num text-brand-300 text-sm font-semibold">
                  {s.num}
                </span>
                <span className="text-[11px] text-muted tracking-widest uppercase font-medium">
                  {s.time}
                </span>
              </div>
              <h3 className="text-ink text-xl font-semibold leading-tight tracking-tight">
                {s.title}
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed mt-auto">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const items = [
    {
      quote:
        'Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og tre uger senere var handlen lukket.',
      name: 'Mette K.',
      meta: 'Næstved · 2025',
    },
    {
      quote:
        'Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede.',
      name: 'Lars P.',
      meta: 'Roskilde · 2024',
    },
    {
      quote:
        'Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Mere transparent end nogen mægler vi har snakket med.',
      name: 'Anne & Søren',
      meta: 'Ringsted · 2024',
    },
  ];

  return (
    <section
      aria-labelledby="testimonials-title"
      className="bg-surface-0 py-24 sm:py-32 border-t border-hairline"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
        <div className="space-y-3 max-w-2xl">
          <p className="cine-kicker">Hvad sælgere siger</p>
          <h2
            id="testimonials-title"
            className="text-ink text-[40px] sm:text-[56px] font-semibold leading-[1.02] tracking-[-0.025em] text-balance"
          >
            87+ historier siden 2024.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((t) => (
            <figure
              key={t.name}
              className="bg-surface-1 rounded-2xl p-7 sm:p-8 ring-1 ring-hairline space-y-6 flex flex-col"
            >
              <span
                aria-hidden="true"
                className="text-brand-300 mono-num text-3xl leading-none opacity-60"
              >
                {'"'}
              </span>
              <blockquote className="text-[15px] sm:text-base text-ink-dim leading-relaxed flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="pt-4 border-t border-hairline">
                <div className="text-sm font-semibold text-ink tracking-tight">
                  {t.name}
                </div>
                <div className="mono-num text-[11px] text-muted tracking-wider uppercase mt-0.5">
                  {t.meta}
                </div>
              </figcaption>
            </figure>
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
    <section className="bg-surface-0 py-24 sm:py-32 border-t border-hairline">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        <div className="space-y-3 max-w-2xl">
          <p className="cine-kicker">Ofte stillede spørgsmål</p>
          <h2 className="text-ink text-[40px] sm:text-[56px] font-semibold leading-[1.02] tracking-[-0.025em] text-balance">
            Det skal du vide først.
          </h2>
        </div>

        <div className="max-w-3xl divide-y divide-hairline border-y border-hairline">
          {items.map((item, idx) => (
            <details key={idx} className="group">
              <summary className="flex items-baseline justify-between gap-6 py-6 cursor-pointer list-none">
                <h3 className="text-ink text-lg sm:text-xl font-semibold tracking-tight">
                  {item.q}
                </h3>
                <span
                  aria-hidden="true"
                  className="cine-kicker shrink-0 transition-opacity"
                >
                  <span className="group-open:hidden">Vis</span>
                  <span className="hidden group-open:inline text-brand-300">Skjul</span>
                </span>
              </summary>
              <div className="pb-6 pr-8 -mt-2">
                <p className="text-[15px] text-ink-soft leading-relaxed max-w-2xl">
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
