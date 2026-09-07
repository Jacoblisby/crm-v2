'use client';

/**
 * Frontpage — matchet mod BÅDE desktop- og mobil-framen i designfilen
 * (Figma NXq53grC6JZj0AeCK657Yw: desktop 7254:6750, mobil 7254:7256,
 * mobilmenu 7254:7450).
 *
 * Mobil afviger bevidst fra desktop flere steder — det er designerens valg:
 *   - Nav: kun logo + burger; menuen er et stort blur-panel med X
 *   - Hero: tekst → foto i fuld bredde → adresse-pladen ligger HEN OVER fotoet
 *   - Direkte salg og Erfaringer: swipe-karruseller med prik-indikator
 *   - Bliv boende: ingen badges (de ville dække motivet på 390 px)
 *   - Sådan virker det: runde ikoner, trin FØR foto
 *   - Footer: centreret og stablet
 *
 * Bevægelse: rolige reveals ved scroll (se Motion.tsx) — designeren beder om
 * at effekter bruges "selektivt og med omtanke", så intet svæver eller hopper.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Handshake,
  LockSimple,
  ClockClockwise,
  House,
  ChatsCircle,
  Door,
  FileText,
  Phone,
  List,
  X,
  CaretDown,
  MapPin,
  Coins,
  HouseLine,
} from '@phosphor-icons/react';
import { AddressCta } from './AddressCta';
import { Reveal, useScrolled, MobileCarousel, useParallaxGroup, RevealBackstop } from './Motion';

export const dynamic = 'force-dynamic';

/**
 * Glas-effekten. Designeren landede på ÉN fælles værdi efter seks forsøg
 * (Make-fil v39→v44) og skriver det eksplicit:
 *   "Headeren bruger nu præcis samme effekt som søgefeltet og de flydende
 *    chips — blur(20px) med rgba(0,0,0,0.30) baggrund."
 * Derfor deler nav, adresse-plade og badges nøjagtig samme flade.
 */
export const FP_GLASS = {
  background: 'rgba(0,0,0,0.30)',
  blur: 'blur(20px)',
} as const;

const NAV_LINKS = [
  { label: 'Bliv boende', href: '#bliv-boende' },
  { label: 'Sådan virker det', href: '#saadan-virker-det' },
  { label: 'Erfaringer', href: '#erfaringer' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Tjek din pris', href: '#hero-adresse' },
];

/**
 * Adressefeltet findes TO gange i DOM'en — én mobil-variant og én desktop —
 * og den ene er altid skjult med `lg:hidden` / `hidden lg:block`.
 *
 * getElementById returnerer den skjulte lige så villigt som den synlige, så
 * `getElementById('hero-adresse') ?? getElementById('hero-adresse-desktop')`
 * ramte ALTID mobil-varianten. På desktop betød det scrollIntoView() og
 * focus() på et display:none-element — altså ingenting. Det var derfor
 * "Tjek din pris" ikke gjorde noget på store skærme.
 *
 * getClientRects().length er den pålidelige test: den er 0 for både
 * display:none og for elementer med en skjult forfader.
 */
function firstVisible(...ids: string[]): HTMLElement | null {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.getClientRects().length > 0) return el;
  }
  return null;
}

/** Scroll til adressefeltet og sæt markøren i det — uanset skærmstørrelse. */
function goToAddressField() {
  firstVisible('hero-adresse', 'hero-adresse-desktop')?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
  setTimeout(() => {
    (firstVisible('fp-address', 'fp-address-desktop') as HTMLInputElement | null)?.focus();
  }, 600);
}

export default function Frontpage() {
  return (
    <div>
      <Nav />
      <Hero />
      <DirekteSalg />
      <BlivBoende />
      <SaadanVirkerDet />
      <Erfaringer />
      <Trovaerdighed />
      <Faq />
      <FinalCta />
      <FooterBar />
      <StickyCta />
      <RevealBackstop />
    </div>
  );
}

/* ─── 1. Nav — sticky (designer: "Logo med baggrund er sticky ved scroll") ─── */
function Nav() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(40);

  // Lås baggrunds-scroll når mobilmenuen er åben
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 sm:px-5 pt-3 sm:pt-4">
        <div
          className="max-w-[1380px] mx-auto rounded-lg flex items-center justify-between pl-5 sm:pl-7 pr-2 py-2"
          style={{
            // Designerens endelige spec (Make-fil, version 44, efter 6 forsøg):
            // "Headeren bruger nu præcis samme effekt som søgefeltet og de
            //  flydende chips — blur(20px) med rgba(0,0,0,0.30) baggrund."
            background: FP_GLASS.background,
            backdropFilter: FP_GLASS.blur,
            WebkitBackdropFilter: FP_GLASS.blur,
            boxShadow: scrolled ? '0 8px 28px -16px rgba(20,45,45,0.45)' : 'none',
            transition: 'box-shadow 320ms ease',
          }}
        >
          <a href="#" className="flex items-baseline gap-1.5 text-white">
            <span className="text-[24px] leading-none" style={{ fontWeight: 400 }}>365</span>
            <span className="text-[11px] tracking-[0.2em]" style={{ fontWeight: 500 }}>EJENDOM</span>
          </a>

          <nav className="hidden lg:flex items-center gap-9 text-[13.5px] text-white" style={{ fontWeight: 400 }}>
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={
                  l.href === '#hero-adresse'
                    ? (e) => {
                        e.preventDefault();
                        goToAddressField();
                      }
                    : undefined
                }
                className="hover:opacity-75 transition-opacity"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Telefon-pill: skjult på mobil (som i mobil-framen) */}
            <a
              href="tel:+4589876634"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13.5px]"
              style={{ background: 'var(--fp-cta)', color: '#123f41', fontWeight: 500 }}
            >
              <Phone size={15} weight="regular" />
              +45 89 87 66 34
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Åbn menu"
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-white active:scale-95 transition-transform"
            >
              <List size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobilmenu — stort blur-panel med centrerede links og X (Figma 7254:7450) */}
      <div
        className="lg:hidden fixed inset-0 z-50 px-3 pt-3"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          opacity: open ? 1 : 0,
          transition: 'opacity 260ms cubic-bezier(0.23,1,0.32,1)',
        }}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0"
          onClick={() => setOpen(false)}
          style={{ background: 'rgba(20,30,29,0.25)' }}
        />
        <div
          className="relative rounded-xl px-6 pt-5 pb-12"
          style={{
            // Lidt tættere end den fælles flade — panelet dækker hele skærmen
            // og skal bære læsbar hvid tekst (jf. mobilmenu-framen)
            background: 'rgba(0,0,0,0.42)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.98)',
            transition: 'transform 300ms cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Luk menu"
              className="w-11 h-11 inline-flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <X size={26} />
            </button>
          </div>
          <nav className="flex flex-col items-center gap-7 pt-4 pb-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => {
                  setOpen(false);
                  if (l.href === '#hero-adresse') {
                    e.preventDefault();
                    // Menuen skal være lukket, før vi scroller — ellers
                    // ligger overlayet stadig over adressefeltet.
                    setTimeout(goToAddressField, 60);
                  }
                }}
                className="text-[19px] text-white"
                style={{ fontWeight: 400 }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="tel:+4589876634"
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px]"
              style={{ background: 'var(--fp-cta)', color: '#123f41', fontWeight: 500 }}
            >
              <Phone size={17} weight="regular" />
              +45 89 87 66 34
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}

/* ─── 2. Hero ──────────────────────────────────────────────────────────────
   Desktop: rosa venstre + foto højre, adresse-plade centreret nederst.
   Mobil:   rosa tekstblok → foto i fuld bredde → plade hen over fotoet.      */
function Hero() {
  return (
    <section className="relative -mt-[68px] sm:-mt-[76px]" style={{ background: 'var(--fp-rose)' }}>
      {/* Desktop-foto: højre halvdel, helt til kanten */}
      <div className="hidden lg:block absolute top-0 right-0 bottom-0" style={{ width: '49%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frontpage/couple-planning-table.jpg"
          alt="Par gennemgår boligpapirer ved spisebordet"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-[1380px] mx-auto lg:px-10 pt-28 sm:pt-32 lg:pb-12 lg:min-h-[850px] flex flex-col">
        {/* Tekst */}
        <div className="px-6 sm:px-10 lg:px-6 max-w-[560px] space-y-5">
          <p className="fp-kicker">Sælg på nye vilkår</p>
          <h1 className="text-[36px] sm:text-[46px] lg:text-[52px] leading-[1.15]" style={{ color: 'var(--fp-ink)' }}>
            Frigør din friværdi<br className="hidden lg:inline" /> uden nødvendigvis<br className="hidden lg:inline" /> at flytte.
          </h1>
          <p className="text-[14.5px] leading-[1.7] max-w-[430px]" style={{ color: 'var(--fp-muted)' }}>
            365 Ejendomme køber lejligheder kontant på Sjælland.
            <br />
            Du kan sælge direkte til os, undgå fremvisninger og mæglersalær — og i mange
            tilfælde blive boende som lejer, hvis det passer bedre til din hverdag.
          </p>
        </div>

        {/* Mobil: foto i fuld bredde, plade hen over (som i mobil-framen) */}
        <div className="lg:hidden mt-9">
          <div className="fp-photo overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/couple-planning-table.jpg"
              alt="Par gennemgår boligpapirer ved spisebordet"
              className="w-full h-[330px] sm:h-[420px] object-cover"
            />
          </div>
          <div id="hero-adresse" className="px-4 sm:px-8 -mt-[132px] relative z-10 pb-8 scroll-mt-28">
            <AddressCta id="fp-address" variant="plate" />
          </div>
        </div>

        {/* Desktop: plade centreret i bunden */}
        <div id="hero-adresse-desktop" className="hidden lg:block w-full max-w-[720px] mx-auto mt-auto scroll-mt-28">
          <AddressCta id="fp-address-desktop" variant="plate" />
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Direkte salg — karrusel på mobil, grid på desktop ─────────────────── */
function DirekteSalg() {
  const cards = [
    { icon: Handshake, title: 'Direkte køber', body: 'Vi køber boligen direkte af dig.' },
    { icon: LockSimple, title: 'Diskret proces', body: 'Din bolig behøver ikke komme offentligt på markedet.' },
    { icon: ClockClockwise, title: 'Fleksibel overtagelse', body: 'Vi finder en timing, der passer til din situation.' },
  ];
  return (
    <section className="px-6 sm:px-10 py-16 sm:py-24" style={{ background: 'var(--fp-cream)' }}>
      <div className="max-w-[1240px] mx-auto space-y-10">
        <Reveal className="text-left sm:text-center space-y-4 max-w-2xl sm:mx-auto">
          <p className="fp-kicker">Direkte salg</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.2] text-balance">En mere rolig måde at sælge på</h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Hos 365 Ejendomme sælger du direkte til os. Du slipper for åbent hus,
            fremvisninger og usikker ventetid — og du får mulighed for at tage næste
            skridt i dit eget tempo.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <MobileCarousel count={cards.length} className="max-w-[1100px] mx-auto">
            {cards.map((c) => (
              <div
                key={c.title}
                className="fp-lift shrink-0 w-[82%] sm:w-auto rounded-xl px-7 py-8 text-center space-y-2.5"
                style={{ background: 'var(--fp-mint-card)' }}
              >
                <c.icon size={26} weight="thin" color="var(--fp-green)" className="mx-auto" />
                <h3 className="text-[16px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>{c.title}</h3>
                <p className="text-[13.5px] leading-[1.55]" style={{ color: 'var(--fp-ink)' }}>{c.body}</p>
              </div>
            ))}
          </MobileCarousel>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 4. Bliv måske boende — badges kun på desktop ─────────────────────────── */
function BlivBoende() {
  return (
    <section id="bliv-boende" className="scroll-mt-20" style={{ background: 'var(--fp-rose)' }}>
      <div className="grid lg:grid-cols-2 items-center">
        {/* Foto — bleeder til venstre kant på desktop, fuld bredde på mobil */}
        <div className="order-last lg:order-first pb-12 lg:py-20 lg:pr-0">
          <DoorPhotoWithBadges />
        </div>

        <Reveal className="px-6 sm:px-10 lg:px-16 pt-16 pb-10 lg:py-20 max-w-[560px]">
          <div className="space-y-5">
            <p className="fp-kicker">Bliv måske boende</p>
            <h2 className="text-[30px] sm:text-[40px] leading-[1.2]">
              Bliv i hjemmet, hvis det passer dig bedst
            </h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
              For nogle handler et salg ikke om at flytte med det samme. Det handler om at
              få adgang til friværdien og samtidig bevare hverdagen.
            </p>
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
              Hvis boligen passer til os, kan du i mange tilfælde sælge og fortsætte som
              lejer. Vi gennemgår både pris, husleje og vilkår med dig, før du beslutter noget.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Fotoet med de tre flydende badges.
 *
 * To ting gør dem levende uden at blive urolige:
 *   1. Parallax — hver badge får sin egen drift-faktor, så de glider i
 *      forskellige tempi mens fotoet passerer. Det er dét, der får dem til at
 *      "svæve" frem for at sidde limet på billedet.
 *   2. En ganske lille vippen (max ±1,2°) koblet til samme scroll-progress.
 *   3. Et vedvarende svæv — hver badge vugger langsomt op og ned, også når
 *      siden står stille. Det er dét, prototypen gør, og det er grunden til
 *      at boksene føles som om de ligger FORAN billedet.
 *
 * De tre bevægelser kan ikke dele samme element: parallax skriver transform
 * hver frame, svævet er en uendelig keyframe, og entréen skalerer. Derfor ét
 * lag hver — .fp-badge (parallax) > .fp-badge-float (svæv) > .fp-badge-box
 * (entré + highlight). Alle tre er ren translate/rotate/scale → compositor.
 *
 * Badges har FAST bredde og højde, så de tre bokse er identiske uanset
 * tekstlængde.
 *
 * Svæve-tallene er IKKE gættet — de er hentet direkte fra designerens
 * Make-prototype (App.tsx, DifferentieringSection):
 *
 *   animate={{ y: [0, -10, 0] }}
 *   transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity,
 *                 delay: 0 | 0.6 | 1.2 }}
 *
 * Altså: alle tre har SAMME tempo (3,5 s) og samme udslag (10 px opad fra
 * hvilepositionen — ikke ±5 omkring den). Forskellen ligger kun i en
 * trappet forsinkelse på 0 / 0,6 / 1,2 s. framer-motions "easeInOut" er
 * cubic-bezier(0.42, 0, 0.58, 1), hvilket er præcis CSS' ease-in-out.
 */
const DOOR_BADGES = [
  // Mobil: alle tre i venstre side — højre hjørne skal holdes frit til den
  // sticky "Tjek din pris"-knap, ellers lægger de sig oven i hinanden.
  { icon: Coins, title: 'Friværdi frigivet', sub: 'Eksempel: 2.250.000 kr.', pos: 'top-[16%] left-[3%] lg:top-[33%] lg:left-[13%]', drift: 34, tilt: -1.2, amp: 10, dur: 3.5, phase: 0 },
  { icon: HouseLine, title: 'Samme adresse', sub: 'Mulighed for at blive boende', pos: 'top-[40%] left-[11%] lg:top-[53%] lg:left-[35%]', drift: 14, tilt: 0.9, amp: 10, dur: 3.5, phase: 0.6 },
  { icon: FileText, title: 'Klar aftale', sub: 'Pris, husleje og vilkår gennemgås først', pos: 'top-[64%] left-[6%] lg:top-[70%] lg:left-[9%]', drift: 26, tilt: -0.7, amp: 10, dur: 3.5, phase: 1.2 },
] as const;

function DoorPhotoWithBadges() {
  const ref = useParallaxGroup<HTMLDivElement>();

  return (
    <Reveal className="fp-photo relative">
      <div ref={ref} className="relative lg:max-w-[620px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frontpage/entre.jpg"
          alt="Lys entré i skandinavisk lejlighed"
          className="w-full aspect-[4/5] object-cover"
        />
        {DOOR_BADGES.map((b, i) => (
          <div
            key={b.title}
            className={`fp-badge absolute ${b.pos}`}
            data-drift={b.drift}
            data-tilt={b.tilt}
            style={{ transitionDelay: `${i * 130}ms` }}
          >
            <div
              className="fp-badge-float"
              style={
                {
                  '--fp-float-amp': `${b.amp}px`,
                  '--fp-float-dur': `${b.dur}s`,
                  '--fp-float-delay': `${b.phase}s`,
                } as React.CSSProperties
              }
            >
              <div
                /* Fast bredde OG højde — ellers bliver boksene forskellige,
                   fordi kun nogle af underteksterne ombrydes til to linjer */
                className="fp-badge-box rounded-lg px-3 sm:px-3.5 flex items-center gap-2.5 sm:gap-3 w-[200px] sm:w-[238px] h-[68px] sm:h-[72px]"
                style={{
                  // Samme glas-flade som nav og adressefelt (designerens fælles spec)
                  background: FP_GLASS.background,
                  backdropFilter: FP_GLASS.blur,
                  WebkitBackdropFilter: FP_GLASS.blur,
                }}
              >
                <span
                  className="fp-badge-icon w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--fp-mint-card)' }}
                >
                  <b.icon size={16} weight="regular" color="var(--fp-green)" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] sm:text-[12.5px] text-white" style={{ fontWeight: 600 }}>
                    {b.title}
                  </span>
                  <span className="block text-[11px] sm:text-[11.5px] leading-snug text-white/80">
                    {b.sub}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ─── 5. Sådan virker det — trin FØR foto på mobil, runde ikoner ───────────── */
function SaadanVirkerDet() {
  const steps = [
    { icon: House, title: '1. Start med adressen', body: 'Indtast din adresse, så ser vi på boligen og de offentlige boligdata.' },
    { icon: ChatsCircle, title: '2. Vi tager en samtale', body: 'Vi taler om din bolig, din situation og dine ønsker.' },
    { icon: Door, title: '3. Gratis besigtigelse', body: 'Vi ser boligen sammen med dig — helt uforpligtende.' },
    { icon: FileText, title: '4. Du får et konkret tilbud', body: 'Du vælger selv, om du vil gå videre, vente eller sige nej tak.' },
  ];
  return (
    <section id="saadan-virker-det" className="px-6 sm:px-10 py-16 sm:py-24 scroll-mt-20" style={{ background: 'var(--fp-mint)' }}>
      <div className="max-w-[1240px] mx-auto space-y-10">
        <Reveal className="space-y-4 max-w-lg">
          <p className="fp-kicker">Sådan virker det</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.25]">
            Fire enkle trin fra adresse til afklaring
          </h2>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          {/* Foto: sidst på mobil, først på desktop */}
          <Reveal className="fp-photo order-last lg:order-first max-w-[490px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/curtain.jpg"
              alt="Gardin med naturligt lysindfald og grøn plante"
              className="w-full aspect-[3/4] object-cover"
            />
          </Reveal>

          <div className="space-y-8 max-w-[460px]">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 90}>
                {/* Selve hover-fladen ligger INDE i Reveal — reveal'en ejer
                    transform på sit eget element, så trinnet ville ellers
                    slås med entré-animationen om samme property. */}
                <div className="fp-step space-y-2.5">
                  <div className="fp-pop fp-step-icon w-11 h-11 rounded-full lg:rounded-lg flex items-center justify-center">
                    <s.icon size={20} weight="thin" color="#fff" />
                  </div>
                  <h3 className="fp-step-title text-[17px]">{s.title}</h3>
                  <p className="fp-step-body text-[13.5px] leading-[1.6]">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Erfaringer — karrusel på mobil ────────────────────────────────────── */
function Erfaringer() {
  const quotes = [
    {
      q: '“Vi ville gerne sælge, men var ikke klar til at flytte med det samme. Hos 365 fandt vi en løsning, hvor vi kunne blive boende som lejere.”',
      by: 'Tidligere boligejer, Sjælland',
      bg: 'var(--fp-green)',
      fg: '#ffffff',
      sub: 'rgba(255,255,255,0.75)',
    },
    {
      q: '“Det gav ro, at vi ikke skulle have boligen på markedet med fremvisninger og åbent hus. Processen var enkel og ordentlig.”',
      by: 'Sælger af ejerlejlighed',
      bg: 'var(--fp-teal-mid)',
      fg: '#ffffff',
      sub: 'rgba(255,255,255,0.78)',
    },
    {
      q: '“Vi fik forklaret mulighederne tydeligt og kunne tage beslutningen i vores eget tempo.”',
      by: 'Tidligere boligejer',
      bg: 'var(--fp-mint-card)',
      fg: 'var(--fp-ink)',
      sub: 'var(--fp-muted)',
    },
  ];
  return (
    <section id="erfaringer" className="px-6 sm:px-10 py-16 sm:py-24 scroll-mt-20" style={{ background: 'var(--fp-cream)' }}>
      <div className="max-w-[1240px] mx-auto space-y-10">
        <Reveal className="text-left sm:text-center space-y-4 max-w-xl sm:mx-auto">
          <p className="fp-kicker">Erfaringer fra sælgere</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.2]">Andre har stået samme sted</h2>
          <p className="text-[13.5px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Et boligsalg kan være en stor beslutning. Derfor betyder det noget at høre fra
            andre, der har valgt en mere enkel og diskret vej.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <MobileCarousel count={quotes.length} className="max-w-[1100px] mx-auto">
            {quotes.map((t) => (
              <figure
                key={t.by}
                className="fp-lift shrink-0 w-[82%] sm:w-auto rounded-lg p-6 flex flex-col justify-between gap-6 min-h-[230px]"
                style={{ background: t.bg }}
              >
                <blockquote className="text-[15px] leading-[1.55]" style={{ color: t.fg, fontWeight: 400 }}>
                  {t.q}
                </blockquote>
                <figcaption className="text-[12px]" style={{ color: t.sub }}>
                  {t.by}
                </figcaption>
              </figure>
            ))}
          </MobileCarousel>
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 7. Vi køber for at eje — tekst+tal før foto på mobil ─────────────────── */
function Trovaerdighed() {
  return (
    <section className="scroll-mt-20" style={{ background: 'var(--fp-rose)' }}>
      <div className="grid lg:grid-cols-2 items-center">
        <Reveal className="fp-photo order-last lg:order-first pb-12 lg:py-20">
          <div className="lg:max-w-[620px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/stairs.jpg"
              alt="Trappeopgang i klassisk dansk etageejendom"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        </Reveal>

        <div className="px-6 sm:px-10 lg:px-16 pt-16 pb-10 lg:py-20 max-w-[560px] space-y-8">
          <Reveal className="space-y-4">
            <p className="fp-kicker">Tryghed og erfaring</p>
            <h2 className="text-[30px] sm:text-[40px] leading-[1.2]">Vi køber for at eje</h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
              365 Ejendomme har siden 2020 købt boliger på Sjælland og driver i dag
              lejemål. Vi køber ikke for at presse et hurtigt videresalg igennem — vi
              køber for at eje, udleje og drive boliger ordentligt.
            </p>
          </Reveal>
          <div className="space-y-7">
            <Counter target={87} suffix="+" label="boliger købt siden 2020" delay={0} />
            <Counter target={218} label="lejemål i drift" delay={110} />
            <Counter target={2.5} decimals={1} suffix=" mio. kr." label="sparet i mæglersalær" delay={220} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({
  target,
  suffix = '',
  decimals = 0,
  label,
  delay = 0,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const t0 = performance.now() + delay;
        const dur = 1400;
        function tick(now: number) {
          if (now < t0) {
            requestAnimationFrame(tick);
            return;
          }
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          setValue(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, delay]);

  const shown = decimals > 0
    ? value.toLocaleString('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(value).toString();

  return (
    <Reveal delay={delay}>
      <div ref={ref} className="relative pl-4">
        {/* Stregen vokser op fra bunden når blokken afsløres */}
        <span
          className="fp-bar absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
          style={{ background: 'var(--fp-accent-bar)' }}
        />
        <div className="text-[32px] leading-tight tabular-nums" style={{ fontWeight: 400, color: 'var(--fp-ink)' }}>
          {shown}{suffix}
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--fp-muted)' }}>{label}</div>
      </div>
    </Reveal>
  );
}

/* ─── 8. FAQ ───────────────────────────────────────────────────────────────── */
function Faq() {
  const items = [
    {
      q: 'Kan jeg blive boende efter salget?',
      a: 'Ja, i mange tilfælde kan du sælge boligen til 365 Ejendomme og fortsætte som lejer. Det kaldes ofte sale-leaseback. Vi gennemgår mulighederne sammen med dig, så du kender både salgspris, husleje og vilkår, før du beslutter dig.',
    },
    {
      q: 'Er det uforpligtende at starte?',
      a: 'Ja. Du kan indtaste din adresse, få et foreløbigt tilbud og takke nej — helt uden omkostninger eller forpligtelser.',
    },
    {
      q: 'Hvordan adskiller I jer fra en mægler?',
      a: 'En mægler finder en køber. Vi er køberen. Det gør processen mere direkte og forudsigelig.',
    },
    {
      q: 'Skal min bolig på markedet?',
      a: 'Nej. Du sælger direkte til os, så din bolig behøver aldrig komme offentligt på markedet — ingen åbent hus og ingen fremvisninger.',
    },
    {
      q: 'Betaler jeg mæglersalær?',
      a: 'Nej. Der er ingen mægler involveret i handlen, så du betaler 0 kr. i salær.',
    },
    {
      q: 'Køber I alle boliger?',
      a: 'Vi fokuserer på ejerlejligheder på Sjælland uden for Københavnsområdet. Indtast din adresse, så melder vi hurtigt tilbage, om din bolig passer til os.',
    },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 sm:px-10 py-16 sm:py-24 scroll-mt-20" style={{ background: 'var(--fp-faq)' }}>
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-8 lg:gap-10">
        <Reveal className="lg:col-span-5 space-y-4">
          <p className="fp-kicker">Spørgsmål og svar</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.25] max-w-[340px]">Det spørger andre om</h2>
        </Reveal>
        <Reveal delay={80} className="lg:col-span-7 lg:max-w-[560px]">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q} className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="fp-row w-full flex items-center justify-between gap-4 text-left"
                  style={{ paddingTop: 18, paddingBottom: 18 }}
                >
                  <span className="text-[14.5px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>{item.q}</span>
                  <CaretDown
                    size={17}
                    color="var(--fp-ink)"
                    style={{
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 250ms cubic-bezier(0.23, 1, 0.32, 1)',
                      flexShrink: 0,
                    }}
                  />
                </button>
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: open ? '1fr' : '0fr',
                    transition: 'grid-template-rows 280ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="pb-5 pr-8 text-[13.5px] leading-[1.7]"
                      style={{
                        color: 'var(--fp-muted)',
                        opacity: open ? 1 : 0,
                        transition: 'opacity 220ms ease',
                      }}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }} />
        </Reveal>
      </div>
    </section>
  );
}

/* ─── 9. Kom i gang ────────────────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="px-6 sm:px-10 py-20 sm:py-28" style={{ background: 'var(--fp-green)' }}>
      <Reveal className="max-w-[880px] mx-auto text-center space-y-5">
        <p className="fp-kicker" style={{ color: 'rgba(255,255,255,0.65)' }}>Kom i gang</p>
        <h2 className="text-[30px] sm:text-[40px] leading-[1.2] text-white text-balance">
          Hvad kan din bolig frigøre for dig?
        </h2>
        <p className="text-[13.5px] leading-[1.7] max-w-[420px] mx-auto" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Start med din adresse og få et første indblik i dine muligheder. Det er gratis,
          diskret og helt uforpligtende.
        </p>
        <div className="max-w-[440px] mx-auto pt-2">
          <AddressCta id="fp-address-bottom" variant="bar" />
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-y-1.5 gap-x-10 pt-4 text-[12.5px] text-white/85">
          <span><strong className="text-white" style={{ fontWeight: 600 }}>87+</strong> boligkøb siden 2020</span>
          <span><strong className="text-white" style={{ fontWeight: 600 }}>Bliv boende</strong> som lejer</span>
          <span><strong className="text-white" style={{ fontWeight: 600 }}>Ingen</strong> mæglersalær</span>
        </div>
      </Reveal>
    </section>
  );
}

/* ─── 10. Footer — centreret og stablet på mobil ───────────────────────────── */
function FooterBar() {
  return (
    <footer className="px-6 sm:px-10 py-6 border-t" style={{ background: 'var(--fp-green)', borderColor: 'rgba(255,255,255,0.15)' }}>
      <div
        className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-[12px] text-center sm:text-left"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        <div className="leading-relaxed">
          © 365ejendom <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          Boligselskabet Sommerhave ApS <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          Naestved <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          CVR 41763736
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-8">
          <a href="https://365ejendom.dk/privatlivspolitik" className="hover:text-white transition-colors">Privatliv</a>
          <a href="https://365ejendom.dk" className="hover:text-white transition-colors">365ejendom.dk</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Sticky CTA (designer-note: "Tjek din pris knap bliver sticky ved
       scroll. Ved klik linker den op til adressefeltet i hero.") ──────────── */
function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Skjul igen ved bunden, hvor adressefeltet allerede er synligt
        const nearBottom =
          window.innerHeight + window.scrollY > document.body.scrollHeight - 900;
        setVisible(window.scrollY > 700 && !nearBottom);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <a
      href="#hero-adresse"
      onClick={(e) => {
        e.preventDefault();
        goToAddressField();
      }}
      className="fixed bottom-5 right-4 sm:bottom-auto sm:top-24 sm:right-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[13.5px] shadow-[0_12px_30px_-8px_rgba(15,71,73,0.55)]"
      style={{
        background: 'var(--fp-cta)',
        color: '#123f41',
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 280ms cubic-bezier(0.23,1,0.32,1), transform 280ms cubic-bezier(0.23,1,0.32,1)',
      }}
    >
      <MapPin size={16} weight="regular" />
      Tjek din pris
    </a>
  );
}
