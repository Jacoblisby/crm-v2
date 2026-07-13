'use client';

/**
 * Frontpage — pixel-matchet mod designfilen (Figma NXq53grC6JZj0AeCK657Yw,
 * frame "Landingpage" 7254:6750, 1440x6369). Farver samplet fra framen.
 *
 * Sektioner (nøjagtig rækkefølge og layout fra designet):
 *   1. Nav — mørk blur-bar m. logo, links, turkis tlf-pill
 *   2. Hero — rosa venstre + foto højre; mørk blur-plade m. adressefelt og
 *      trust-line HENOVER overgangen
 *   3. Direkte salg — cream, 3 flade mint-kort
 *   4. Bliv måske boende — rosa, foto VENSTRE (full-bleed) m. 3 mørke badges
 *   5. Sådan virker det — mint, overskrift venstre; foto + 4 lodrette trin
 *   6. Erfaringer — cream, 3 quote-kort (#145d5f / #007f80 / #b4d4d1)
 *   7. Vi køber for at eje — rosa, foto VENSTRE, stats m. teal streg (ingen ikoner)
 *   8. FAQ — #deeceb, 2 kolonner, divider-liste (ingen kort)
 *   9. Kom i gang — #145d5f, hvid adresse-bar
 *  10. Footer — #145d5f m. hvid divider
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

export const dynamic = 'force-dynamic';

const NAV_LINKS = [
  { label: 'Bliv boende', href: '#bliv-boende' },
  { label: 'Sådan virker det', href: '#saadan-virker-det' },
  { label: 'Erfaringer', href: '#erfaringer' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Tjek din pris', href: '#hero-adresse' },
];

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
    </div>
  );
}

/* ─── 1. Nav ───────────────────────────────────────────────────────────────── */
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute top-0 inset-x-0 z-40 px-3 sm:px-5 pt-3 sm:pt-4">
      <div
        className="max-w-[1380px] mx-auto rounded-lg flex items-center justify-between pl-5 sm:pl-7 pr-2 py-2"
        style={{
          background: 'rgba(105,110,108,0.5)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <a href="#" className="flex items-baseline gap-1.5 text-white">
          <span className="text-[24px] leading-none" style={{ fontWeight: 400 }}>365</span>
          <span className="text-[11px] tracking-[0.2em]" style={{ fontWeight: 500 }}>EJENDOM</span>
        </a>

        <nav className="hidden lg:flex items-center gap-9 text-[13.5px] text-white" style={{ fontWeight: 400 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:opacity-75 transition-opacity">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+4589876634"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-[13.5px]"
            style={{ background: 'var(--fp-cta)', color: '#123f41', fontWeight: 500 }}
          >
            <Phone size={15} weight="regular" />
            <span className="hidden sm:inline">+45 89 87 66 34</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Luk menu' : 'Åbn menu'}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white"
          >
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="lg:hidden max-w-[1380px] mx-auto mt-2 rounded-lg overflow-hidden"
          style={{
            background: 'rgba(60,70,68,0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-6 py-4 text-[15px] text-white border-b border-white/10 last:border-0"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ─── 2. Hero — rosa venstre, foto højre, mørk adresse-plade henover ───────── */
function Hero() {
  return (
    <section className="relative" style={{ background: 'var(--fp-rose)' }}>
      {/* Foto — højre halvdel, full-bleed til kant og top (nav ligger ovenpå) */}
      <div className="hidden lg:block absolute top-0 right-0 bottom-0" style={{ width: '49%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frontpage/couple-planning-table.jpg"
          alt="Par gennemgår boligpapirer ved spisebordet"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-[1380px] mx-auto px-6 sm:px-10 pt-28 sm:pt-32 pb-12 lg:min-h-[850px] flex flex-col">
        {/* Tekst — venstre kolonne */}
        <div className="max-w-[560px] space-y-5">
          <p className="fp-kicker">Sælg på nye vilkår</p>
          <h1 className="text-[38px] sm:text-[48px] lg:text-[52px] leading-[1.15]" style={{ color: 'var(--fp-ink)' }}>
            Frigør din friværdi<br className="hidden sm:inline" /> uden nødvendigvis<br className="hidden sm:inline" /> at flytte.
          </h1>
          <p className="text-[14.5px] leading-[1.7] max-w-[430px]" style={{ color: 'var(--fp-muted)' }}>
            365 Ejendomme køber lejligheder kontant på Sjælland.
            <br />
            Du kan sælge direkte til os, undgå fremvisninger og mæglersalær — og i mange
            tilfælde blive boende som lejer, hvis det passer bedre til din hverdag.
          </p>
        </div>

        {/* Mobil-foto */}
        <div className="lg:hidden mt-8 -mx-6 sm:-mx-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frontpage/couple-planning-table.jpg"
            alt="Par gennemgår boligpapirer ved spisebordet"
            className="w-full h-[300px] object-cover"
          />
        </div>

        {/* Adresse-plade — centreret henover foto-overgangen (som i designet) */}
        <div id="hero-adresse" className="w-full max-w-[720px] mx-auto mt-10 lg:mt-auto scroll-mt-28">
          <AddressCta id="fp-address" variant="plate" />
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Direkte salg — 3 flade mint-kort ──────────────────────────────────── */
function DirekteSalg() {
  const cards = [
    { icon: Handshake, title: 'Direkte køber', body: 'Vi køber boligen direkte af dig.' },
    { icon: LockSimple, title: 'Diskret proces', body: 'Din bolig behøver ikke komme offentligt på markedet.' },
    { icon: ClockClockwise, title: 'Fleksibel overtagelse', body: 'Vi finder en timing, der passer til din situation.' },
  ];
  return (
    <section className="px-6 sm:px-10 py-16 sm:py-24" style={{ background: 'var(--fp-cream)' }}>
      <div className="max-w-[1240px] mx-auto space-y-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="fp-kicker">Direkte salg</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.2] text-balance">En mere rolig måde at sælge på</h2>
          <p className="text-[14px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Hos 365 Ejendomme sælger du direkte til os. Du slipper for åbent hus,
            fremvisninger og usikker ventetid — og du får mulighed for at tage næste
            skridt i dit eget tempo.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-xl px-7 py-8 text-center space-y-2.5"
              style={{ background: 'var(--fp-mint-card)' }}
            >
              <c.icon size={26} weight="thin" color="var(--fp-green)" className="mx-auto" />
              <h3 className="text-[16px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>{c.title}</h3>
              <p className="text-[13.5px] leading-[1.55]" style={{ color: 'var(--fp-ink)' }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. Bliv måske boende — rosa, foto venstre full-bleed, mørke badges ───── */
function BlivBoende() {
  return (
    <section id="bliv-boende" className="scroll-mt-20" style={{ background: 'var(--fp-rose)' }}>
      <div className="grid lg:grid-cols-2 items-center">
        {/* Foto — bleeder til venstre kant */}
        <div className="relative order-last lg:order-first py-14 lg:py-20 pl-0 pr-6 lg:pr-0">
          <div className="relative lg:max-w-[620px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/entre.jpg"
              alt="Lys entré i skandinavisk lejlighed"
              className="w-full aspect-[4/5] object-cover"
            />
            {/* Placering 1:1 fra Figma-framen: diagonalt forskudt, alle inde på fotoet */}
            <DarkBadge icon={Coins} title="Friværdi frigivet" sub="Eksempel: 2.250.000 kr." className="top-[33%] left-[13%]" />
            <DarkBadge icon={HouseLine} title="Samme adresse" sub="Mulighed for at blive boende" className="top-[53%] left-[35%]" />
            <DarkBadge icon={FileText} title="Klar aftale" sub="Pris, husleje og vilkår gennemgås først" className="top-[70%] left-[9%]" />
          </div>
        </div>

        {/* Tekst — højre */}
        <div className="px-6 sm:px-10 lg:px-16 py-14 lg:py-20 max-w-[560px]">
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
        </div>
      </div>
    </section>
  );
}

function DarkBadge({
  icon: Icon,
  title,
  sub,
  className,
}: {
  icon: React.ComponentType<{ size?: number; weight?: 'thin' | 'regular'; color?: string }>;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute rounded-lg px-3.5 py-2.5 flex items-center gap-3 max-w-[240px] ${className ?? ''}`}
      style={{
        background: 'rgba(48,45,41,0.62)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--fp-mint-card)' }}
      >
        <Icon size={16} weight="regular" color="var(--fp-green)" />
      </span>
      <span>
        <span className="block text-[12.5px] text-white" style={{ fontWeight: 600 }}>{title}</span>
        <span className="block text-[11.5px] leading-snug text-white/80">{sub}</span>
      </span>
    </div>
  );
}

/* ─── 5. Sådan virker det — mint, foto + lodrette nummererede trin ─────────── */
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
        <div className="space-y-4 max-w-lg">
          <p className="fp-kicker">Sådan virker det</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.25]">
            Fire enkle trin fra adresse til afklaring
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Foto — gardin m. lysindfald (designerens billedstil) */}
          <div className="max-w-[490px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/curtain.jpg"
              alt="Gardin med naturligt lysindfald og grøn plante"
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          {/* Trin — lodret liste */}
          <div className="space-y-8 max-w-[460px]">
            {steps.map((s) => (
              <div key={s.title} className="space-y-2.5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--fp-green)' }}
                >
                  <s.icon size={19} weight="thin" color="#fff" />
                </div>
                <h3 className="text-[17px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>{s.title}</h3>
                <p className="text-[13.5px] leading-[1.6]" style={{ color: 'var(--fp-muted)' }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Erfaringer — 3 quote-kort i eksakte teal-toner ────────────────────── */
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
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <p className="fp-kicker">Erfaringer fra sælgere</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.2]">Andre har stået samme sted</h2>
          <p className="text-[13.5px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Et boligsalg kan være en stor beslutning.
            <br />
            Derfor betyder det noget at høre fra andre, der har valgt en mere enkel og
            diskret vej.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
          {quotes.map((t) => (
            <figure
              key={t.by}
              className="rounded-lg p-6 flex flex-col justify-between gap-6"
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
        </div>
      </div>
    </section>
  );
}

/* ─── 7. Vi køber for at eje — rosa, foto venstre, stats m. teal streg ─────── */
function Trovaerdighed() {
  return (
    <section className="scroll-mt-20" style={{ background: 'var(--fp-rose)' }}>
      <div className="grid lg:grid-cols-2 items-center">
        <div className="order-last lg:order-first py-14 lg:py-20 pr-6 lg:pr-0">
          <div className="lg:max-w-[620px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/stairs.jpg"
              alt="Trappeopgang i klassisk dansk etageejendom"
              className="w-full aspect-[4/5] object-cover"
            />
          </div>
        </div>

        <div className="px-6 sm:px-10 lg:px-16 py-14 lg:py-20 max-w-[560px] space-y-8">
          <div className="space-y-4">
            <p className="fp-kicker">Tryghed og erfaring</p>
            <h2 className="text-[30px] sm:text-[40px] leading-[1.2]">Vi køber for at eje</h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
              365 Ejendomme har siden 2020 købt boliger på Sjælland og driver i dag
              lejemål. Vi køber ikke for at presse et hurtigt videresalg igennem — vi
              køber for at eje, udleje og drive boliger ordentligt.
            </p>
          </div>
          <div className="space-y-7">
            <Counter target={87} suffix="+" label="boliger købt siden 2020" />
            <Counter target={218} label="lejemål i drift" />
            <Counter target={2.5} decimals={1} suffix=" mio. kr." label="sparet i mæglersalær" />
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
}: {
  target: number;
  suffix?: string;
  decimals?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const t0 = performance.now();
        const dur = 1400;
        function tick(now: number) {
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
  }, [target]);

  const shown = decimals > 0
    ? value.toLocaleString('da-DK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(value).toString();

  return (
    <div ref={ref} className="pl-4" style={{ borderLeft: '3px solid var(--fp-accent-bar)' }}>
      <div className="text-[32px] leading-tight tabular-nums" style={{ fontWeight: 400, color: 'var(--fp-ink)' }}>
        {shown}{suffix}
      </div>
      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--fp-muted)' }}>{label}</div>
    </div>
  );
}

/* ─── 8. FAQ — 2 kolonner, divider-liste (ingen kort) ──────────────────────── */
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
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-4">
          <p className="fp-kicker">Spørgsmål og svar</p>
          <h2 className="text-[30px] sm:text-[40px] leading-[1.25] max-w-[340px]">Det spørger andre om</h2>
        </div>
        <div className="lg:col-span-7 lg:max-w-[560px]">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q} className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full py-4.5 flex items-center justify-between gap-4 text-left"
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
        </div>
      </div>
    </section>
  );
}

/* ─── 9. Kom i gang — mørk petroleum m. hvid adresse-bar ───────────────────── */
function FinalCta() {
  return (
    <section className="px-6 sm:px-10 py-20 sm:py-28" style={{ background: 'var(--fp-green)' }}>
      <div className="max-w-[880px] mx-auto text-center space-y-5">
        <p className="fp-kicker" style={{ color: 'rgba(255,255,255,0.65)' }}>Kom i gang</p>
        <h2 className="text-[30px] sm:text-[40px] leading-[1.2] text-white text-balance">
          Hvad kan din bolig frigøre for dig?
        </h2>
        <p className="text-[13.5px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Start med din adresse og få et første indblik i dine muligheder.
          <br />
          Det er gratis, diskret og helt uforpligtende.
        </p>
        <div className="max-w-[440px] mx-auto pt-2">
          <AddressCta id="fp-address-bottom" variant="bar" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-1 pt-4 text-[12.5px] text-white/85">
          <span><strong className="text-white" style={{ fontWeight: 600 }}>87+</strong> boligkøb siden 2020</span>
          <span><strong className="text-white" style={{ fontWeight: 600 }}>Bliv boende</strong> som lejer</span>
          <span><strong className="text-white" style={{ fontWeight: 600 }}>Ingen</strong> mæglersalær</span>
        </div>
      </div>
    </section>
  );
}

/* ─── 10. Footer ───────────────────────────────────────────────────────────── */
function FooterBar() {
  return (
    <footer className="px-6 sm:px-10 py-5 border-t" style={{ background: 'var(--fp-green)', borderColor: 'rgba(255,255,255,0.15)' }}>
      <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
        <div>© 365ejendom · Boligselskabet Sommerhave ApS · Naestved · CVR 41763736</div>
        <div className="flex gap-8">
          <a href="https://365ejendom.dk/privatlivspolitik" className="hover:text-white transition-colors">Privatliv</a>
          <a href="https://365ejendom.dk" className="hover:text-white transition-colors">365ejendom.dk</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Sticky CTA — turkis m. map-pin, øverst til højre ved scroll ──────────── */
function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href="#hero-adresse"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('hero-adresse')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => document.getElementById('fp-address')?.focus(), 600);
      }}
      className="fixed top-4 right-4 sm:right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] shadow-[0_10px_28px_-8px_rgba(15,71,73,0.45)]"
      style={{
        background: 'var(--fp-cta)',
        color: '#123f41',
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-10px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 250ms cubic-bezier(0.23,1,0.32,1), transform 250ms cubic-bezier(0.23,1,0.32,1)',
      }}
    >
      <MapPin size={16} weight="regular" />
      Tjek din pris
    </a>
  );
}
