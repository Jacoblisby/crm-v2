import type { Metadata } from 'next';
import Link from 'next/link';
import { SalgHeader } from './components/SalgHeader';
import { FunnelProvider } from './FunnelContext';

export const metadata: Metadata = {
  title: 'Få et tilbud på din ejerlejlighed på 5 minutter · 365 Ejendomme',
  description:
    'Få et foreløbigt tilbud på din ejerlejlighed på 5 minutter. Vi køber kontant, uden mægler, du sparer typisk 70.000 kr i salær.',
  openGraph: {
    title: 'Få et tilbud på din ejerlejlighed på 5 minutter',
    description:
      'Foreløbigt tilbud + booking af gratis besigtigelse. Vi handler kontant, uden mægler.',
    type: 'website',
  },
};

export default function SalgLayout({ children }: { children: React.ReactNode }) {
  return (
    <FunnelProvider>
      <div className="min-h-screen bg-paper">
        <SalgHeader />
        <main className="pb-16">{children}</main>
        <footer className="border-t border-brand-200/60 mt-8 py-4 text-xs text-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="py-2">© 365 Ejendomme · CVR 42 80 04 22</div>
            <div className="flex gap-1">
              <Link
                href="https://365ejendom.dk/privatlivspolitik"
                className="inline-flex items-center min-h-[44px] px-3 hover:text-brand-700 rounded-full transition-colors"
              >
                Privatliv
              </Link>
              <Link
                href="https://365ejendom.dk"
                className="inline-flex items-center min-h-[44px] px-3 hover:text-brand-700 rounded-full transition-colors"
              >
                Tilbage til 365ejendom.dk
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </FunnelProvider>
  );
}
