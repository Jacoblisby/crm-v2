'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Menupunkterne ét sted. Tilføjes en side uden at komme herind, findes den
 * kun af den der kender adressen — sådan gik det for /foreninger.
 */
const NAV = [
  { href: '/', label: 'Inbox' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/foreninger', label: 'Foreninger' },
  { href: '/buy-list', label: 'Buy List' },
  { href: '/on-market', label: 'On-market' },
  { href: '/off-market', label: 'Off-market' },
] as const;

export function MainHeader() {
  const pathname = usePathname();
  // Auto-skjul CRM-nav på public funnel-routes + design-prototyper
  if (pathname?.startsWith('/salg')) return null;
  if (pathname?.startsWith('/frontpage')) return null;
  if (pathname?.startsWith('/design-preview')) return null;
  if (pathname?.startsWith('/design-vote')) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg whitespace-nowrap">
          365 <span className="text-slate-400">Ejendomme</span>
        </Link>
        <nav className="flex gap-1 text-sm overflow-x-auto -mx-2 px-2">
          {NAV.map((n) => {
            // Præcis match for forsiden, præfiks for resten — ellers ville "/"
            // stå aktiv på alle sider.
            const aktiv = n.href === '/' ? pathname === '/' : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={aktiv ? 'page' : undefined}
                className={
                  'px-3 py-1.5 rounded whitespace-nowrap transition-colors ' +
                  (aktiv
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                }
              >
                {n.label}
              </Link>
            );
          })}
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
  if (pathname?.startsWith('/salg') || pathname?.startsWith('/frontpage')) {
    // Salg + frontpage har eget layout — ingen CRM-wrapper
    return <>{children}</>;
  }
  return <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>;
}
