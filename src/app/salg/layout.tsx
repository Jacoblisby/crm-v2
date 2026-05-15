import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link
            href="https://365ejendom.dk"
            className="font-bold text-base inline-flex items-center min-h-[44px]"
          >
            365 <span className="text-slate-400">&nbsp;Ejendomme</span>
          </Link>
          <a
            href="tel:+4589876634"
            aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 min-h-[44px] px-2 -mr-2"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">+45 89 87 66 34</span>
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">{children}</main>
      <footer className="border-t border-slate-100 mt-12 py-4 text-xs text-slate-500">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 justify-between items-center">
          <div className="py-2">© 365 Ejendomme · CVR 42 80 04 22</div>
          <div className="flex gap-1">
            <Link
              href="https://365ejendom.dk/privatlivspolitik"
              className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-900"
            >
              Privatliv
            </Link>
            <Link
              href="https://365ejendom.dk"
              className="inline-flex items-center min-h-[44px] px-2 hover:text-slate-900"
            >
              Tilbage til 365ejendom.dk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
