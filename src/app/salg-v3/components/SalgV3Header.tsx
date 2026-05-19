'use client';

import { useFunnelV3 } from '../FunnelV3Context';
import { useEffect, useState } from 'react';

/**
 * v3 header — editorial wordmark + diskret tel.
 * Skifter style baseret paa scroll position (sticky bg appear ved 80px down).
 */
export function SalgV3Header() {
  const { state, reset } = useFunnelV3();
  const isLanding = state.screenIdx === 0 && !state.fullAddress;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-[3] transition-all"
      style={{
        background: scrolled
          ? 'oklch(0.965 0.012 80 / 0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(8px) saturate(140%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transitionProperty: 'background-color, backdrop-filter, border-color',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="flex items-baseline gap-2 hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] rounded-md px-1"
        >
          <span className="text-[20px] font-display ink" style={{ fontWeight: 600 }}>365</span>
          <span className="text-[13px] font-body muted">ejendomme</span>
        </button>

        {!isLanding && state.fullAddress && (
          <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 px-6">
            <span className="text-[12px] uppercase tracking-[0.18em] soft font-body">adresse</span>
            <span className="text-[14px] font-body ink truncate" style={{ fontWeight: 500 }}>
              {state.fullAddress}
            </span>
          </div>
        )}

        <div className="flex items-center gap-5 shrink-0">
          <a
            href="tel:+4589876634"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-body muted hover:ink transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
            </svg>
            +45 89 87 66 34
          </a>
        </div>
      </div>
    </header>
  );
}
