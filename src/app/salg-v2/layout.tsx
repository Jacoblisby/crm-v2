import type { Metadata } from 'next';
import Link from 'next/link';
import { FunnelV2Provider } from './FunnelV2Context';
import { SalgHeader } from './components/SalgHeader';

export const metadata: Metadata = {
  title: 'Sælg din bolig kontant · 365 Ejendomme',
  description:
    'Få et foreløbigt tilbud på din ejerlejlighed på 5 minutter. Vi køber kontant, uden mægler.',
  openGraph: {
    title: 'Sælg din bolig kontant · 365 Ejendomme',
    description: 'Foreløbigt tilbud + booking af gratis besigtigelse. Vi handler kontant.',
    type: 'website',
  },
};

export default function SalgV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <FunnelV2Provider>
      <div className="min-h-screen bg-white">
        <SalgHeader />
        <main>{children}</main>
        <footer className="border-t border-[#E5E2DA] py-8 text-xs text-[#5A6166] salg-footer-v2">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 flex flex-wrap gap-4 justify-between items-center">
            <div className="py-2">© 365 Ejendomme · Boligselskabet Sommerhave ApS · Næstved · CVR 41763736</div>
            <div className="flex gap-1">
              <Link
                href="https://365ejendom.dk/privatlivspolitik"
                className="inline-flex items-center min-h-[44px] px-3 hover:text-[#244949] rounded-full"
              >
                Privatliv
              </Link>
              <Link
                href="https://365ejendom.dk"
                className="inline-flex items-center min-h-[44px] px-3 hover:text-[#244949] rounded-full"
              >
                Tilbage til 365ejendom.dk
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </FunnelV2Provider>
  );
}
