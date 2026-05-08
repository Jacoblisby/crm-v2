'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainHeader() {
  const pathname = usePathname();
  // Auto-skjul CRM-nav på public funnel-routes + design-prototyper
  if (pathname?.startsWith('/salg')) return null;
  if (pathname?.startsWith('/design-preview')) return null;
  if (pathname?.startsWith('/design-vote')) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg whitespace-nowrap">
          365 <span className="text-slate-400">Ejendomme</span>
        </Link>
        <nav className="flex gap-1 text-sm overflow-x-auto -mx-2 px-2">
          <Link href="/" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
            Inbox
          </Link>
          <Link href="/pipeline" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
            Pipeline
          </Link>
          <Link href="/buy-list" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
            Buy List
          </Link>
          <Link href="/on-market" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
            On-market
          </Link>
          <Link href="/off-market" className="px-3 py-1.5 rounded hover:bg-slate-100 whitespace-nowrap">
            Off-market
          </Link>
        </nav>
        <div className="ml-auto text-xs text-slate-500 hidden sm:block">v2 · read-only mirror</div>
      </div>
    </header>
  );
}

interface MainProps {
  children: React.ReactNode;
}

export function MainWrapper({ children }: MainProps) {
  const pathname = usePathname();
  if (pathname?.startsWith('/salg')) {
    // Salg har sit eget layout — ingen CRM-wrapper
    return <>{children}</>;
  }
  return <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
