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
        .v4-root h1, .v4-root h2, .v4-root h3 {
          font-weight: 300;
          letter-spacing: -0.01em;
        }
      `}</style>
    </FunnelV2Provider>
  );
}
