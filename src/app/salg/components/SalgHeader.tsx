'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { useFunnel } from '../FunnelContext';

/**
 * SalgHeader — Variant D cinematic dark mode header.
 * Hvid tekst paa sort. Sticky med subtle blur paa scroll.
 */
export function SalgHeader() {
  const { state } = useFunnel();
  const isLanding = state.step === 1 && !state.fullAddress;

  return (
    <header
      className={`${
        isLanding ? 'absolute' : 'sticky'
      } top-0 inset-x-0 z-30 ${
        isLanding
          ? 'bg-transparent'
          : 'bg-surface-0/80 backdrop-blur-md border-b border-hairline'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <Link
          href="https://365ejendom.dk"
          className="inline-flex items-center min-h-[44px] tracking-tight text-ink font-semibold"
        >
          <span className="text-base">365</span>
          <span className="ml-1.5 text-sm font-medium text-ink-soft">Ejendomme</span>
        </Link>
        <a
          href="tel:+4589876634"
          aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
          className="text-sm text-ink-dim hover:text-ink inline-flex items-center gap-1.5 min-h-[44px] px-4 -mr-3 rounded-full hover:bg-white/5 transition-colors tracking-tight"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span className="hidden sm:inline">+45 89 87 66 34</span>
        </a>
      </div>
    </header>
  );
}
