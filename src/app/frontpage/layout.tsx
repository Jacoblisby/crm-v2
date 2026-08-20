import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { FunnelV2Provider } from '../salg-v2/FunnelV2Context';

/**
 * Frontpage — designerens (Figma) design 1:1.
 *
 * Design-sprog fra "365 ejendom design.fig":
 *   - Montserrat i lettere vægtning (300/400/500/600) — roligt, luftigt, eksklusivt
 *   - Brand-grøn petroleum + soft mint + cream + turkis CTA
 *   - Blur-effekt på nav og adressefelt (designer-note: menu, søgefelt, sticky nav)
 *   - Skandinavisk billedstil: ældre par, naturligt dagslys, beige/træ/grønt
 *
 * FunnelV2Provider giver adressefeltet adgang til samme state som flowet,
 * så "Tjek din pris" hopper direkte ind i /salg-v4 med adressen udfyldt.
 */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '365 Ejendomme · Frigør din friværdi uden nødvendigvis at flytte',
  description:
    '365 Ejendomme køber lejligheder kontant på Sjælland. Sælg direkte til os, undgå fremvisninger og mæglersalær — og bliv i mange tilfælde boende som lejer.',
  openGraph: {
    title: '365 Ejendomme · Frigør din friværdi uden nødvendigvis at flytte',
    description:
      'Sælg direkte til os, undgå fremvisninger og mæglersalær — og bliv i mange tilfælde boende som lejer.',
    type: 'website',
  },
};

export default function FrontpageLayout({ children }: { children: React.ReactNode }) {
  return (
    <FunnelV2Provider>
      <div className={`${montserrat.className} fp-root min-h-screen`}>
        {children}
      </div>
      <style>{`
        .fp-root {
          /* Eksakte farver samplet fra designfilen (NXq53grC6JZj0AeCK657Yw) */
          --fp-green:      #145d5f; /* primær petroleum (ikoner, quote-kort, CTA-sektion, footer) */
          --fp-green-deep: #0f4749;
          --fp-teal-mid:   #007f80; /* midterste quote-kort */
          --fp-accent-bar: #009fa3; /* accent-streg ved stats */
          --fp-mint:       #c8dfdd; /* "Sådan virker det"-sektion */
          --fp-mint-card:  #b4d4d1; /* mint kort + lyst quote-kort */
          --fp-faq:        #deeceb; /* FAQ-sektion */
          --fp-cream:      #f5f2f1; /* lyse sektioner */
          --fp-rose:       #e8dfde; /* hero + foto-sektioner */
          --fp-cta:        #83ebeb; /* turkis CTA-knap */
          --fp-ink:        #1c2b2b;
          --fp-muted:      #4d5a59;
          background: #ffffff;
          color: var(--fp-ink);
          font-weight: 400;
        }
        .fp-root h1, .fp-root h2, .fp-root h3 {
          font-weight: 400;
          letter-spacing: -0.005em;
        }
        .fp-root .fp-kicker {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #3a4746;
        }

        /* ── Scroll-reveal ────────────────────────────────────────────────
           Rolig fade + lille løft. Kun opacity/transform, så det kører på
           GPU'en og aldrig trigger layout. One-shot: .is-in fjernes aldrig. */
        .fp-root .fp-reveal {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 700ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 700ms cubic-bezier(0.23, 1, 0.32, 1);
          will-change: opacity, transform;
        }
        .fp-root .fp-reveal.is-in {
          opacity: 1;
          transform: none;
          will-change: auto;
        }

        /* Skjul scrollbar på mobil-karrusellerne (snap-scroll) */
        .fp-root .fp-scroller {
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .fp-root .fp-scroller::-webkit-scrollbar { display: none; }
        .fp-root .fp-scroller > * { scroll-snap-align: start; }
        @media (min-width: 640px) {
          .fp-root .fp-scroller { scroll-snap-type: none; }
        }

        /* Blødt zoom-ind på sektionsfotos når de kommer i syne */
        .fp-root .fp-photo img {
          transform: scale(1.06);
          transition: transform 1200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .fp-root .fp-photo.is-in img { transform: scale(1); }

        /* ── Dør-badges ───────────────────────────────────────────────────
           Parallax-hooken ejer transform på .fp-badge og skriver den hver
           frame — derfor må entréen KUN røre opacity her. Selve "poppet"
           lægges på den indre glasboks, som hooken ikke rører. */
        .fp-root .fp-badge {
          opacity: 0;
          transition: opacity 620ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .fp-root .fp-photo.is-in .fp-badge { opacity: 1; }

        .fp-root .fp-badge-box {
          transform: scale(0.92);
          transition:
            transform 620ms cubic-bezier(0.34, 1.45, 0.5, 1),
            box-shadow 240ms cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
        }
        .fp-root .fp-photo.is-in .fp-badge-box { transform: scale(1); }

        /* Det vedvarende svæv. Eget lag, så det aldrig kolliderer med
           parallaxens transform ovenover eller entré-scale nedenunder.
           Kurven er 1:1 med prototypens y: [0, -10, 0] — boksen letter fra
           sin hvileposition og lander igen, den svinger IKKE symmetrisk
           omkring den. Amplitude/tempo/fase sættes pr. badge. */
        @keyframes fp-float {
          from { transform: translate3d(0, 0, 0); }
          50%  { transform: translate3d(0, calc(var(--fp-float-amp) * -1), 0); }
          to   { transform: translate3d(0, 0, 0); }
        }
        .fp-root .fp-badge-float {
          animation: fp-float var(--fp-float-dur, 6s) ease-in-out infinite;
          animation-delay: var(--fp-float-delay, 0s);
          will-change: transform;
        }

        /* Highlight på badge ved hover: glasset lysner, og der tændes en
           tynd hvid kant. Overlay frem for at ændre background, fordi
           glas-fladen sættes inline fra den fælles FP_GLASS-spec. */
        .fp-root .fp-badge-box::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(255, 255, 255, 0.11);
          opacity: 0;
          transition: opacity 240ms cubic-bezier(0.23, 1, 0.32, 1);
          pointer-events: none;
        }
        .fp-root .fp-badge-icon {
          transition: transform 300ms cubic-bezier(0.34, 1.4, 0.5, 1);
        }
        @media (hover: hover) {
          .fp-root .fp-badge-box:hover::after { opacity: 1; }
          .fp-root .fp-badge-box:hover {
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.3),
              0 20px 40px -20px rgba(0, 0, 0, 0.6);
          }
          .fp-root .fp-badge-box:hover .fp-badge-icon { transform: scale(1.1); }
        }

        /* ── Trin i "Sådan virker det" ────────────────────────────────────
           Hele trinnet er hover-flade: baggrunden lysner mod hvid oven på
           den mint-grønne sektion, ikonet bliver mørkere og løfter sig, og
           overskriften skifter til brand-grøn. Negativ margin, så tinten
           får luft uden at flytte teksten i det almindelige flow. */
        .fp-root .fp-step {
          margin-inline: -16px;
          padding: 14px 16px;
          border-radius: 12px;
          transition:
            background-color 260ms cubic-bezier(0.23, 1, 0.32, 1),
            box-shadow 260ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .fp-root .fp-step-icon { background: var(--fp-green); }
        .fp-root .fp-step-title { font-weight: 600; color: var(--fp-ink); }
        .fp-root .fp-step-body { color: var(--fp-muted); }
        .fp-root .fp-step-title { transition: color 240ms ease; }
        /* Ikonet er OGSÅ .fp-pop, som ejer transform til entréen længere nede
           i filen. Derfor højere specificitet her (0,3,0), og hover-skaleringen
           lægges på den selvstændige scale-property i stedet for transform —
           så de to kan have hver sit tempo uden at overskrive hinanden.
           Entréen må gerne tage 560 ms; hover skal svare på 260. */
        .fp-root .fp-step .fp-step-icon {
          transition:
            transform 560ms cubic-bezier(0.34, 1.4, 0.5, 1),
            scale 260ms cubic-bezier(0.34, 1.4, 0.5, 1),
            background-color 240ms ease,
            box-shadow 300ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) {
          .fp-root .fp-step:hover {
            background: rgba(255, 255, 255, 0.52);
            box-shadow: 0 14px 34px -22px rgba(20, 45, 45, 0.45);
          }
          .fp-root .fp-step:hover .fp-step-title { color: var(--fp-green); }
          .fp-root .fp-step:hover .fp-step-icon {
            background: var(--fp-green-deep);
            box-shadow: 0 10px 22px -10px rgba(15, 71, 73, 0.6);
            scale: 1.08;
          }
        }

        /* ── Highlight ved berøring/hover ─────────────────────────────────
           Løfter kortet en anelse og strammer skyggen. Kun transform +
           box-shadow, og kun hvor der faktisk ER en mus. */
        @media (hover: hover) {
          .fp-root .fp-lift {
            transition:
              transform 260ms cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 260ms cubic-bezier(0.23, 1, 0.32, 1);
          }
          .fp-root .fp-lift:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 38px -18px rgba(20, 45, 45, 0.42);
          }
          .fp-root .fp-row:hover {
            background: rgba(255, 255, 255, 0.45);
          }
        }
        .fp-root .fp-row {
          transition: background-color 220ms ease;
          margin-inline: -12px;
          padding-inline: 12px;
          border-radius: 8px;
        }
        .fp-root .fp-lift:active { transform: translateY(-1px) scale(0.995); }

        /* Accent-stregen ved tallene vokser op, når blokken kommer i syne */
        .fp-root .fp-bar {
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform 760ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .fp-root .fp-reveal.is-in .fp-bar { transform: scaleY(1); }

        /* Trin-ikonet popper ganske let, når trinnet afsløres */
        .fp-root .fp-pop {
          transform: scale(0.86);
          transition: transform 560ms cubic-bezier(0.34, 1.4, 0.5, 1);
        }
        .fp-root .fp-reveal.is-in .fp-pop { transform: scale(1); }

        @media (prefers-reduced-motion: reduce) {
          .fp-root .fp-reveal,
          .fp-root .fp-photo img,
          .fp-root .fp-badge,
          .fp-root .fp-badge-float,
          .fp-root .fp-badge-box,
          .fp-root .fp-badge-icon,
          .fp-root .fp-bar,
          .fp-root .fp-pop,
          .fp-root .fp-step,
          .fp-root .fp-step .fp-step-icon,
          .fp-root .fp-lift {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          /* Svævet er en uendelig keyframe — den skal slukkes, ikke bare
             fryses, ellers kører den videre bag transform: none. */
          .fp-root .fp-badge-float { animation: none !important; }
          /* Hover-highlight må gerne blive — det er farve, ikke bevægelse —
             men skaleringen af ikonet ryger. */
          .fp-root .fp-step:hover .fp-step-icon { scale: 1 !important; }
        }
      `}</style>
      {/* Uden JavaScript skal alt indhold være synligt fra start */}
      <noscript>
        <style>{`
          .fp-root .fp-reveal { opacity: 1 !important; transform: none !important; }
          .fp-root .fp-photo img { transform: none !important; }
        `}</style>
      </noscript>
    </FunnelV2Provider>
  );
}
