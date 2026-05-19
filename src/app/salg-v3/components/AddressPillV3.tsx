'use client';

/**
 * AddressPillV3 — editorial address-pill med mouse-tracking shadow.
 * CSS variables, ingen JS-animation. Skygge follows cursor → liv uden distraktion.
 */
import { useEffect, useRef, useState, useTransition } from 'react';
import { useFunnelV3 } from '../FunnelV3Context';
import { searchAddressAction, lookupAddressAction } from '../../salg/actions';
import type { DawaSuggestion } from '@/lib/services/dawa';

export function AddressPillV3() {
  const { state, update } = useFunnelV3();
  const [query, setQuery] = useState(state.fullAddress);
  const [results, setResults] = useState<DawaSuggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lookupPending, startLookup] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Mouse-tracking spotlight shadow
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    function move(e: PointerEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    }
    el.addEventListener('pointermove', move);
    return () => el.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!query || query.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const r = await searchAddressAction(query);
        if (r.ok) {
          setResults(r.results);
          setShowResults(true);
        }
      });
    }, 250);
  }, [query]);

  function selectAddress(s: DawaSuggestion) {
    justSelectedRef.current = true;
    setQuery(s.tekst);
    setResults([]);
    setShowResults(false);
    setError(null);
    startLookup(async () => {
      const r = await lookupAddressAction(s.adresse.id);
      if (!r.ok) {
        setError(r.error || 'Kunne ikke hente bolig-data');
        return;
      }
      const { address, property } = r;
      update({
        addressId: address.accessAddressId,
        fullAddress: address.fullAddress,
        postalCode: address.postalCode,
        city: address.city,
        streetName: address.streetName,
        houseNumber: address.houseNumber,
        floor: address.floor,
        door: address.door,
        bfeNumber: address.bfeNumber ?? property?.bfeNumber ?? null,
        latitude: address.coordinates?.lat ?? null,
        longitude: address.coordinates?.lon ?? null,
        kvm: property?.kvm ?? null,
        rooms: property?.rooms ?? null,
        yearBuilt: property?.yearBuilt ?? null,
        energyClass: property?.energyClass ?? null,
        currentListingPrice: property?.currentListingPrice ?? null,
        caseUrl: property?.caseUrl ?? null,
        isOnMarket: property?.isOnMarket ?? false,
        screenIdx: 1,
      });
    });
  }

  const isLoading = pending || lookupPending;
  const canGo = !!query && query.length >= 3;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl pt-2">
      <div
        ref={shellRef}
        className="address-shell relative flex items-center bg-paper rounded-full"
        style={{
          // dynamic shadow: tracks cursor for live feel
          boxShadow: 'var(--shadow-soft)',
          background:
            'radial-gradient(180px circle at var(--mx, 50%) var(--my, 50%), oklch(0.99 0.012 80), oklch(0.985 0.008 80))',
          border: '1px solid var(--border)',
          transitionProperty: 'box-shadow, border-color',
          transitionDuration: '220ms',
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <svg className="absolute left-6 w-4 h-4 ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          id="salg-v3-address"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Indtast din adresse"
          autoComplete="street-address"
          aria-label="Boligens adresse"
          className="w-full pl-14 pr-32 sm:pr-40 py-5 text-[16px] font-body ink bg-transparent placeholder:text-[var(--soft)] focus:outline-none rounded-full"
        />
        <button
          type="button"
          disabled={!canGo || isLoading}
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          aria-label="Få tilbud"
          className="absolute right-1.5 px-5 sm:px-6 py-3 rounded-full font-body text-[13.5px] active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)] disabled:cursor-not-allowed touch-manipulation"
          style={{
            background: !canGo || isLoading ? 'oklch(0.91 0.015 80)' : 'var(--ink)',
            color: !canGo || isLoading ? 'oklch(0.62 0.022 80)' : 'var(--cream)',
            fontWeight: 500,
            transitionProperty: 'transform, background-color, color',
            transitionDuration: '200ms',
            transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {isLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin align-middle" style={{ borderColor: 'oklch(0.95 0.012 80 / 0.3)', borderTopColor: 'var(--cream)' }} />
          ) : (
            <>Få tilbud</>
          )}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-2 bg-paper rounded-2xl overflow-hidden z-40 shadow-lift border border-warm"
          style={{
            transformOrigin: 'top',
            animation: 'salg-v3-pop 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
          }}
        >
          {results.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-5 py-3.5 text-[14px] font-body ink hover:bg-cream flex items-center gap-3 border-b border-warm last:border-0 focus:outline-none focus-visible:bg-cream transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0 accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{s.tekst}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-3 bg-paper border border-warm rounded-2xl p-3 text-sm font-body" style={{ color: 'oklch(0.45 0.15 25)' }}>
          {error}
        </div>
      )}

      <p className="font-body text-[12.5px] mt-4 px-1 soft">
        Ingen forpligtelse · Fem minutter · Dine oplysninger forbliver private
      </p>

      <style>{`
        @keyframes salg-v3-pop {
          0%   { opacity: 0; transform: scale(0.97) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes salg-v3-pop {
            0%, 100% { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </div>
  );
}
