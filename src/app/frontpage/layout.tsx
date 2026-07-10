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
          --fp-green:      #145d5f; /* primær petroleum */
          --fp-green-deep: #0f4749;
          --fp-footer:     #365a5c;
          --fp-accent:     #429798; /* accent teal */
          --fp-mint:       #cce0dc; /* mint sektion */
          --fp-mint-card:  #b9d8d3; /* mint kort */
          --fp-cream:      #f4f6f3; /* lys baggrund */
          --fp-rose:       #eae1dd; /* hero dusty rosa */
          --fp-cta:        #7ce0da; /* turkis CTA */
          --fp-ink:        #1c2b2b;
          --fp-muted:      #5c6b6a;
          background: #ffffff;
          color: var(--fp-ink);
          font-weight: 400;
        }
        .fp-root h1, .fp-root h2, .fp-root h3 {
          font-weight: 300; /* designer: lettere vægtning end nuværende site */
          letter-spacing: -0.01em;
        }
        .fp-root .fp-kicker {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--fp-accent);
        }
      `}</style>
    </FunnelV2Provider>
  );
}
