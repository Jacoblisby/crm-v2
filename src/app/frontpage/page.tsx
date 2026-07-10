'use client';

/**
 * Frontpage — 1:1 fra designerens Figma ("365 ejendom design.fig" / Figma Make v48).
 *
 * Sektioner (designerens struktur):
 *   1. Nav (blur, sticky) — 365 EJENDOM · links · turkis tlf-pill
 *   2. Hero (dusty rosa) — "Frigør din friværdi uden nødvendigvis at flytte."
 *   3. Direkte salg — 3 mint kort
 *   4. Bliv måske boende — foto m. floating badges
 *   5. Sådan virker det — 4 trin
 *   6. Erfaringer — 3 quote-kort (mørk/medium/lys teal)
 *   7. Vi køber for at eje — foto + animerede tal
 *   8. FAQ — 6 accordions (ét åbent ad gangen, pil roterer)
 *   9. Slut-CTA (mørk teal) — "Hvad kan din bolig frigøre for dig?"
 *  10. Footer-bar
 *
 * Al tekst er designerens egen copy trukket ud af .fig-filen.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Handshake,
  LockSimple,
  ClockClockwise,
  MapPin,
  ChatCircleText,
  Door,
  FileText,
  Buildings,
  Key,
  Money,
  Phone,
  List,
  X,
  CaretDown,
  CheckCircle,
  HouseLine,
  Coins,
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

/* ─── 1. Nav — blur-bar over hero (designer: blur på menu + sticky nav) ────── */
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute top-0 inset-x-0 z-40 px-3 sm:px-5 pt-3 sm:pt-5">
      <div
        className="max-w-[1400px] mx-auto rounded-lg flex items-center justify-between pl-5 sm:pl-7 pr-2 py-2.5"
        style={{
          background: 'rgba(120,128,126,0.45)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <a href="#" className="flex items-baseline gap-1.5 text-white">
          <span className="text-[26px] leading-none" style={{ fontWeight: 400 }}>365</span>
          <span className="text-[12px] tracking-[0.22em]" style={{ fontWeight: 500 }}>EJENDOM</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8 text-[14px] text-white" style={{ fontWeight: 400 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:opacity-75 transition-opacity">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+4589876634"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-[14px]"
            style={{ background: 'var(--fp-cta)', color: 'var(--fp-green-deep)', fontWeight: 500 }}
          >
            <Phone size={16} weight="regular" />
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

      {/* Mobilmenu (designer-note: blur på mobilmenu) */}
      {open && (
        <div
          className="lg:hidden max-w-[1400px] mx-auto mt-2 rounded-lg overflow-hidden"
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

/* ─── 2. Hero ──────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative grid lg:grid-cols-[8fr_4fr]" style={{ background: 'var(--fp-rose)' }}>
      {/* Venstre: tekst */}
      <div className="px-6 sm:px-12 lg:px-16 pt-32 sm:pt-40 pb-10 sm:pb-14 flex flex-col justify-between min-h-[560px] lg:min-h-[640px]">
        <div className="space-y-6 max-w-2xl">
          <p className="fp-kicker">Sælg på nye vilkår</p>
          <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] leading-[1.08] text-balance" style={{ color: 'var(--fp-ink)' }}>
            Frigør din friværdi<br className="hidden lg:inline" /> uden nødvendigvis<br className="hidden lg:inline" /> at flytte.
          </h1>
          <p className="text-[15px] sm:text-[16px] leading-[1.65] max-w-md" style={{ color: 'var(--fp-muted)' }}>
            365 Ejendomme køber lejligheder kontant på Sjælland.
            <br />
            Du kan sælge direkte til os, undgå fremvisninger og mæglersalær — og i mange
            tilfælde blive boende som lejer, hvis det passer bedre til din hverdag.
          </p>
        </div>

        {/* Adressefelt + trust-line */}
        <div id="hero-adresse" className="mx-auto w-full max-w-xl mt-10 space-y-0 scroll-mt-32">
          <AddressCta id="fp-address" />
          <div
            className="mt-0 rounded-b-xl px-5 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[13px]"
            style={{ color: 'var(--fp-ink)' }}
          >
            <span><strong style={{ fontWeight: 600 }}>87+</strong> boligkøb siden 2020</span>
            <span><strong style={{ fontWeight: 600 }}>Bliv boende</strong> som lejer</span>
            <span><strong style={{ fontWeight: 600 }}>Ingen</strong> mæglersalær</span>
          </div>
        </div>
      </div>

      {/* Højre: foto (ældre par ved bordet — designerens hero-motiv) */}
      <div className="relative min-h-[300px] lg:min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frontpage/couple-planning-table.jpg"
          alt="Par gennemgår boligpapirer ved spisebordet"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </section>
  );
}

/* ─── 3. Direkte salg — 3 mint kort ────────────────────────────────────────── */
function DirekteSalg() {
  const cards = [
    { icon: Handshake, title: 'Direkte køber', body: 'Vi køber boligen direkte af dig.' },
    { icon: LockSimple, title: 'Diskret proces', body: 'Din bolig behøver ikke komme offentligt på markedet.' },
    { icon: ClockClockwise, title: 'Fleksibel overtagelse', body: 'Vi finder en timing, der passer til din situation.' },
  ];
  return (
    <section className="px-6 sm:px-12 py-20 sm:py-28" style={{ background: 'var(--fp-cream)' }}>
      <div className="max-w-[1200px] mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="fp-kicker">Direkte salg</p>
          <h2 className="text-[32px] sm:text-[44px] leading-[1.15]">En mere rolig måde at sælge på</h2>
          <p className="text-[15px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Hos 365 Ejendomme sælger du direkte til os. Du slipper for åbent hus,
            fremvisninger og usikker ventetid — og du får mulighed for at tage næste
            skridt i dit eget tempo.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl px-8 py-12 text-center space-y-4"
              style={{ background: 'var(--fp-mint-card)' }}
            >
              <c.icon size={44} weight="thin" color="var(--fp-green)" className="mx-auto" />
              <h3 className="text-[20px]" style={{ fontWeight: 400, color: 'var(--fp-green-deep)' }}>{c.title}</h3>
              <p className="text-[14px] leading-[1.6]" style={{ color: 'var(--fp-ink)' }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. Bliv måske boende — foto m. floating badges ──────────────────────── */
function BlivBoende() {
  return (
    <section id="bliv-boende" className="px-6 sm:px-12 py-20 sm:py-28 bg-white scroll-mt-24">
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-6">
          <p className="fp-kicker">Bliv måske boende</p>
          <h2 className="text-[32px] sm:text-[44px] leading-[1.15]">
            Bliv i hjemmet, hvis det passer dig bedst
          </h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
            For nogle handler et salg ikke om at flytte med det samme. Det handler om at
            få adgang til friværdien og samtidig bevare hverdagen.
          </p>
          <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--fp-muted)' }}>
            Hvis boligen passer til os, kan du i mange tilfælde sælge og fortsætte som
            lejer. Vi gennemgår både pris, husleje og vilkår med dig, før du beslutter noget.
          </p>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden aspect-[4/5] max-w-md mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frontpage/entre.jpg"
              alt="Lys entré i skandinavisk lejlighed"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Floating badges — designerens UI graphics */}
          <div
            className="absolute top-8 -left-2 sm:left-2 rounded-xl px-4 py-3 shadow-[0_12px_32px_-10px_rgba(20,45,45,0.35)] flex items-center gap-3 bg-white"
          >
            <Coins size={22} weight="thin" color="var(--fp-green)" />
            <div>
              <div className="text-[13px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>Friværdi frigivet</div>
              <div className="text-[12px]" style={{ color: 'var(--fp-muted)' }}>Eksempel: 2.250.000 kr.</div>
            </div>
          </div>
          <div
            className="absolute bottom-24 -right-2 sm:right-0 rounded-xl px-4 py-3 shadow-[0_12px_32px_-10px_rgba(20,45,45,0.35)] flex items-center gap-3 bg-white"
          >
            <HouseLine size={22} weight="thin" color="var(--fp-green)" />
            <div>
              <div className="text-[13px]" style={{ fontWeight: 600, color: 'var(--fp-ink)' }}>Samme adresse</div>
              <div className="text-[12px]" style={{ color: 'var(--fp-muted)' }}>Mulighed for at blive boende</div>
            </div>
          </div>
          <div
            className="absolute -bottom-4 left-6 sm:left-12 rounded-xl px-4 py-3 shadow-[0_12px_32px_-10px_rgba(20,45,45,0.35)] flex items-center gap-3 bg-white"
          >
            <CheckCircle size={22} weight="thin" color="var(--fp-green)" />
            <div className="text-[13px]" style={{ fontWeight: 500, color: 'var(--fp-ink)' }}>
              Pris, husleje og vilkår gennemgås først
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 5. Sådan virker det — 4 trin på mint ─────────────────────────────────── */
function SaadanVirkerDet() {
  const steps = [
    { icon: MapPin, title: 'Start med adressen', body: 'Indtast din adresse, så ser vi på boligen og de offentlige boligdata.' },
    { icon: ChatCircleText, title: 'Vi tager en samtale', body: 'Vi taler om din bolig, din situation og dine ønsker.' },
    { icon: Door, title: 'Gratis besigtigelse', body: 'Vi ser boligen sammen med dig — helt uforpligtende.' },
    { icon: FileText, title: 'Du får et konkret tilbud', body: 'Du vælger selv, om du vil gå videre, vente eller sige nej tak.' },
  ];
  return (
    <section id="saadan-virker-det" className="px-6 sm:px-12 py-20 sm:py-28 scroll-mt-24" style={{ background: 'var(--fp-mint)' }}>
      <div className="max-w-[1200px] mx-auto space-y-14">
        <div className="text-center space-y-4">
          <p className="fp-kicker" style={{ color: 'var(--fp-green)' }}>Sådan virker det</p>
          <h2 className="text-[32px] sm:text-[44px] leading-[1.15]" style={{ color: 'var(--fp-green-deep)' }}>
            Fire enkle trin fra adresse til afklaring
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--fp-green)' }}
                >
                  <s.icon size={26} weight="thin" color="#fff" />
                </div>
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[12px] bg-white"
                  style={{ color: 'var(--fp-green)', fontWeight: 600 }}
                >
                  {i + 1}
                </div>
              </div>
              <h3 className="text-[17px]" style={{ fontWeight: 500, color: 'var(--fp-green-deep)' }}>{s.title}</h3>
              <p className="text-[14px] leading-[1.6] max-w-[240px] mx-auto" style={{ color: 'var(--fp-ink)' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. Erfaringer — 3 quote-kort i teal-gradueringer ─────────────────────── */
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
      bg: 'var(--fp-accent)',
      fg: '#ffffff',
      sub: 'rgba(255,255,255,0.78)',
    },
    {
      q: '“Vi fik forklaret mulighederne tydeligt og kunne tage beslutningen i vores eget tempo.”',
      by: 'Tidligere boligejer',
      bg: 'var(--fp-mint-card)',
      fg: 'var(--fp-green-deep)',
      sub: 'var(--fp-muted)',
    },
  ];
  return (
    <section id="erfaringer" className="px-6 sm:px-12 py-20 sm:py-28 bg-white scroll-mt-24">
      <div className="max-w-[1200px] mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="fp-kicker">Erfaringer fra sælgere</p>
          <h2 className="text-[32px] sm:text-[44px] leading-[1.15]">Andre har stået samme sted</h2>
          <p className="text-[15px] leading-[1.65]" style={{ color: 'var(--fp-muted)' }}>
            Et boligsalg kan være en stor beslutning. Derfor betyder det noget at høre fra
            andre, der har valgt en mere enkel og diskret vej.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {quotes.map((t) => (
            <figure
              key={t.by}
              className="rounded-2xl p-8 flex flex-col justify-between gap-8 min-h-[240px]"
              style={{ background: t.bg }}
            >
              <blockquote className="text-[15px] leading-[1.65]" style={{ color: t.fg, fontWeight: 300 }}>
                {t.q}
              </blockquote>
              <figcaption className="text-[13px]" style={{ color: t.sub }}>
                {t.by}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 7. Vi køber for at eje — foto + animerede tal ────────────────────────── */
function Trovaerdighed() {
  return (
    <section className="px-6 sm:px-12 py-20 sm:py-28" style={{ background: 'var(--fp-cream)' }}>
      <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="rounded-2xl overflow-hidden aspect-[4/5] max-w-md order-last lg:order-first">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frontpage/stairs.jpg"
            alt="Trappeopgang i klassisk dansk etageejendom"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="fp-kicker">Tryghed og erfaring</p>
            <h2 className="text-[32px] sm:text-[44px] leading-[1.15]">Vi køber for at eje</h2>
            <p className="text-[15px] leading-[1.7] max-w-lg" style={{ color: 'var(--fp-muted)' }}>
              365 Ejendomme har siden 2020 købt boliger på Sjælland og driver i dag
              lejemål. Vi køber ikke for at presse et hurtigt videresalg igennem — vi
              køber for at eje, udleje og drive boliger ordentligt.
            </p>
          </div>
          <div className="space-y-6">
            <Counter icon={Buildings} target={87} suffix="+" label="boliger købt siden 2020" />
            <Counter icon={Key} target={218} label="lejemål i drift" />
            <Counter icon={Money} target={2.5} decimals={1} suffix=" mio. kr." label="sparet i mæglersalær" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({
  icon: Icon,
  target,
  suffix = '',
  decimals = 0,
  label,
}: {
  icon: React.ComponentType<{ size?: number; weight?: 'thin'; color?: string }>;
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
          const eased = 1 - Math.pow(1 - p, 4); // ease-out-quart
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
    <div ref={ref} className="flex items-center gap-5 pl-5" style={{ borderLeft: '2px solid var(--fp-accent)' }}>
      <Icon size={30} weight="thin" color="var(--fp-green)" />
      <div>
        <div className="text-[30px] leading-tight tabular-nums" style={{ fontWeight: 300, color: 'var(--fp-green-deep)' }}>
          {shown}{suffix}
        </div>
        <div className="text-[13px]" style={{ color: 'var(--fp-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

/* ─── 8. FAQ — 6 accordions, ét åbent ad gangen ────────────────────────────── */
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
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 sm:px-12 py-20 sm:py-28 bg-white scroll-mt-24">
      <div className="max-w-[840px] mx-auto space-y-12">
        <div className="text-center space-y-4">
          <p className="fp-kicker">Spørgsmål og svar</p>
          <h2 className="text-[32px] sm:text-[44px] leading-[1.15]">Det spørger andre om</h2>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <div
                key={item.q}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--fp-cream)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left"
                >
                  <span className="text-[16px]" style={{ fontWeight: 500, color: 'var(--fp-ink)' }}>{item.q}</span>
                  <CaretDown
                    size={18}
                    color="var(--fp-green)"
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
                      className="px-6 pb-5 text-[14.5px] leading-[1.7]"
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
        </div>
      </div>
    </section>
  );
}

/* ─── 9. Final CTA — mørk teal ─────────────────────────────────────────────── */
function FinalCta() {
  return (
    <section className="px-6 sm:px-12 py-24 sm:py-32" style={{ background: 'var(--fp-green)' }}>
      <div className="max-w-[840px] mx-auto text-center space-y-8">
        <h2 className="text-[34px] sm:text-[48px] leading-[1.12] text-white">
          Hvad kan din bolig frigøre for dig?
        </h2>
        <p className="text-[15px] leading-[1.65] max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Start med din adresse og få et første indblik i dine muligheder. Det er gratis,
          diskret og helt uforpligtende.
        </p>
        <div className="max-w-xl mx-auto">
          <AddressCta id="fp-address-bottom" dark />
        </div>
      </div>
    </section>
  );
}

/* ─── 10. Footer-bar ───────────────────────────────────────────────────────── */
function FooterBar() {
  return (
    <footer className="px-6 sm:px-12 py-6" style={{ background: 'var(--fp-footer)' }}>
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
        <div>© 365 Ejendomme · Boligselskabet Sommerhave ApS · Naestved · CVR 41763736</div>
        <div className="flex gap-6">
          <a href="https://365ejendom.dk/privatlivspolitik" className="hover:text-white transition-colors">Privatliv</a>
          <a href="https://365ejendom.dk" className="hover:text-white transition-colors">365ejendom.dk</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Sticky CTA — designer-note: "Tjek din pris knap bliver sticky ved
       scroll. Ved klik linker den op til adressefeltet i hero." ───────────── */
function StickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 620);
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
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[14px] shadow-[0_16px_40px_-10px_rgba(15,71,73,0.5)]"
      style={{
        background: 'var(--fp-cta)',
        color: 'var(--fp-green-deep)',
        fontWeight: 500,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 250ms cubic-bezier(0.23,1,0.32,1), transform 250ms cubic-bezier(0.23,1,0.32,1)',
      }}
    >
      Tjek din pris
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </a>
  );
}
