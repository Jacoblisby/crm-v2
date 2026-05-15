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
    <div className="min-h-screen bg-paper">
      {/* Floating header — hviler oven over hero-foto med subtil glaspanel */}
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="https://365ejendom.dk"
            className="font-bold text-base inline-flex items-center min-h-[44px] tracking-tight text-white"
          >
            365<span className="text-white/70">&nbsp;Ejendomme</span>
          </Link>
          <a
            href="tel:+4589876634"
            aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
            className="text-sm text-white/95 hover:text-white inline-flex items-center gap-1.5 min-h-[44px] px-4 -mr-3 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm bg-white/5 border border-white/15"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">+45 89 87 66 34</span>
          </a>
        </div>
      </header>
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
  );
}
