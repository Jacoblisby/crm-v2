'use client';

/**
 * SalgHeader — mode-aware header der skifter farve mellem Mode A (hero) og Mode B (funnel).
 *
 * Mode A: hvid tekst pa moerk hero-overlay
 * Mode B: moerk tekst pa lys paper-bg, lille tilbage-pil + skift-adresse-link
 */
import Link from 'next/link';
import { Phone, ArrowLeft } from 'lucide-react';
import { useFunnel } from '../FunnelContext';

export function SalgHeader() {
  const { state } = useFunnel();
  const isLanding = state.step === 1 && !state.fullAddress;

  if (isLanding) {
    return (
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
    );
  }

  // Mode B: kompakt funnel-header med tilbage-pil til landing
  return (
    <header className="sticky top-0 inset-x-0 z-30 bg-paper/85 backdrop-blur-md border-b border-brand-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link
          href="https://365ejendom.dk"
          className="font-bold text-base inline-flex items-center min-h-[44px] tracking-tight text-ink"
        >
          365<span className="text-muted">&nbsp;Ejendomme</span>
        </Link>
        <a
          href="tel:+4589876634"
          aria-label="Ring til 365 Ejendomme på +45 89 87 66 34"
          className="text-sm text-muted hover:text-ink inline-flex items-center gap-1.5 min-h-[44px] px-3 -mr-2 rounded-full hover:bg-brand-50/60 transition-colors"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          <span className="hidden sm:inline">+45 89 87 66 34</span>
        </a>
      </div>
    </header>
  );
}
