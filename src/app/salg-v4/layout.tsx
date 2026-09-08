import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { FunnelV2Provider } from '../salg-v2/FunnelV2Context';

/**
 * /salg-v4 — designerens endelige flow-design (Montserrat + petroleum-grøn).
 * Deler FunnelV2-state (localStorage) med /frontpage, så adressen følger med.
 */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tjek din pris · 365 Ejendomme',
  description:
    'Få et foreløbigt kontanttilbud på din ejerlejlighed. Uden mægler, fremvisninger og ventetid.',
};

export default function SalgV4Layout({ children }: { children: React.ReactNode }) {
  return (
    <FunnelV2Provider>
      <div className={`${montserrat.className} v4-root min-h-screen bg-white`} style={{ color: '#1c2b2b' }}>
        {children}
      </div>
      <style>{`
        /* Tracking skal følge størrelsen. Ét tal for alt fra en 42 px
           overskrift til en mellemrubrik er nødvendigvis forkert et sted. */
        .v4-root h1 {
          font-weight: 300;
          letter-spacing: -0.021em;
          line-height: 1.1;
          font-optical-sizing: auto;
        }
        .v4-root h2 { font-weight: 300; letter-spacing: -0.015em; }
        .v4-root h3 { font-weight: 300; letter-spacing: -0.008em; }

        /* Trykket skal kunne mærkes med det samme — 90 ms, ikke de 150-180 ms
           som farveovergangene bruger. */
        .v4-root button, .v4-root [role='button'] { -webkit-tap-highlight-color: transparent; }
        .v4-root button:active { transition-duration: 90ms; }

        @media (prefers-reduced-motion: reduce) {
          /* Reduceret bevægelse betyder blidere feedback, ikke ingen:
             lysstyrke i stedet for bevægelse i rummet. */
          .v4-root button:active, .v4-root [role='button']:active {
            scale: 1 !important;
            opacity: 0.72;
          }
        }
      `}</style>
    </FunnelV2Provider>
  );
}
