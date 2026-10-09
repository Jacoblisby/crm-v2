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
    <div className={`${montserrat.className} min-h-screen`} style={{ background: '#f5f2f1', color: '#1c2b2b' }}>
      {children}
      <style>{`
        .bs-root h1 { font-weight: 300; letter-spacing: -0.021em; line-height: 1.1; font-optical-sizing: auto; }
        .bs-root h2 { font-weight: 400; letter-spacing: -0.012em; }
        .bs-root button:active { transition-duration: 90ms; }
        .bs-root input:focus-visible, .bs-root button:focus-visible, .bs-root summary:focus-visible, .bs-root a:focus-visible {
          outline: 3px solid #83ebeb; outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) { .bs-root * { transition: none !important; } }
      `}</style>
    </div>
  );
}
