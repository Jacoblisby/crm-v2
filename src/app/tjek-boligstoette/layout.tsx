import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';

/**
 * /tjek-boligstoette — pensionisters boligstøtte som lejer, sat op mod det,
 * de betaler for at eje i dag. Samme skrifttype og farver som boligberegneren.
 */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tjek din boligstøtte · 365 Ejendomme',
  description:
    'Se, hvad du får i boligstøtte som lejer, og hvad det koster dig pr. måned at eje i dag. Til dig, der modtager folkepension.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.className} bs-root min-h-screen`}>
      {children}
      <style>{`
        /* Samme tokens og typografi som forsiden (frontpage/layout.tsx), så siderne læses som én. */
        .bs-root {
          --fp-green:      #145d5f;
          --fp-green-deep: #0f4749;
          --fp-mint:       #c8dfdd;
          --fp-mint-card:  #b4d4d1;
          --fp-faq:        #deeceb;
          --fp-cream:      #f5f2f1;
          --fp-rose:       #e8dfde;
          --fp-cta:        #83ebeb;
          --fp-ink:        #1c2b2b;
          --fp-muted:      #4d5a59;
          --fp-out:        cubic-bezier(0.23, 1, 0.32, 1);
          --fp-press:      90ms cubic-bezier(0.4, 0, 0.6, 1);
          background: #ffffff;
          color: var(--fp-ink);
          font-weight: 400;
        }
        .bs-root h1 { font-weight: 400; letter-spacing: -0.022em; line-height: 1.08; font-optical-sizing: auto; }
        .bs-root h2 { font-weight: 400; letter-spacing: -0.016em; line-height: 1.15; }
        .bs-root h3 { font-weight: 400; letter-spacing: -0.008em; }
        .bs-root .fp-kicker { font-size: 12px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #3a4746; }
        .bs-root .fp-press { transition: scale var(--fp-press), opacity 200ms var(--fp-out); }
        .bs-root .fp-press:active { scale: 0.97; }
        .bs-root input:focus-visible, .bs-root button:focus-visible, .bs-root summary:focus-visible, .bs-root a:focus-visible {
          outline: 3px solid var(--fp-cta); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { .bs-root * { transition: none !important; } }
      `}</style>
    </div>
  );
}
