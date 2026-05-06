import type { Metadata } from 'next';
import Link from 'next/link';

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
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="https://365ejendom.dk" className="font-bold text-base">
            365 <span className="text-slate-400">Ejendomme</span>
          </Link>
          <a
            href="tel:+4589876634"
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <span aria-hidden>📞</span>
            <span className="hidden sm:inline">+45 89 87 66 34</span>
          </a>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">{children}</main>
      <footer className="border-t border-slate-100 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-4 justify-between">
          <div>© 365 Ejendomme · CVR 42 80 04 22</div>
          <div className="flex gap-4">
            <Link href="https://365ejendom.dk/privatlivspolitik">Privatliv</Link>
            <Link href="https://365ejendom.dk">Tilbage til 365ejendom.dk</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
