'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { useFunnel } from '../FunnelContext';

/**
 * SalgHeader — Opendoor-style transparent over hero, mørk tekst på lys bg på øvrige sider.
 */
export function SalgHeader() {
  const { state } = useFunnel();
  const isLanding = state.step === 1 && !state.fullAddress;

  if (isLanding) {
    return (
      <header className="absolute top-0 inset-x-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
          <Link
            href="https://365ejendom.dk"
            className="inline-flex items-center min-h-[44px] tracking-tight text-white font-semibold"
          >
            <span className="text-base">365</span>
            <span className="ml-1.5 text-sm font-medium text-white/80">
              Ejendomme
            </span>
          </Link>
          <a
            href="tel:+4589876634"
            aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
            className="text-sm text-white inline-flex items-center gap-1.5 min-h-[44px] px-4 -mr-3 rounded-full hover:bg-white/10 transition-colors tracking-tight font-medium"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">+45 89 87 66 34</span>
          </a>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 inset-x-0 z-30 bg-white/85 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
        <Link
          href="https://365ejendom.dk"
          className="inline-flex items-center min-h-[44px] tracking-tight text-ink font-semibold"
        >
          <span className="text-base">365</span>
          <span className="ml-1.5 text-sm font-medium text-muted">Ejendomme</span>
        </Link>
        <a
          href="tel:+4589876634"
          aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
          className="text-sm text-muted hover:text-ink inline-flex items-center gap-1.5 min-h-[44px] px-3 -mr-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span className="hidden sm:inline">+45 89 87 66 34</span>
        </a>
      </div>
    </header>
  );
}
