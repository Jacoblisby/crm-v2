'use client';

/**
 * AddressPill — hero address input m. DAWA autocomplete.
 * Design-eng fixes:
 *   - Dropdown enter-animation (scale + opacity, transform-origin top)
 *   - active:scale på "Få tilbud" button
 *   - focus-visible ring
 *   - Loading spinner mens DAWA fetcher
 */
import { useEffect, useRef, useState, useTransition } from 'react';
import { useFunnelV2 } from '../FunnelV2Context';
import { searchAddressAction, lookupAddressAction } from '../../salg/actions';
import type { DawaSuggestion } from '@/lib/services/dawa';
import { EASE_OUT } from './primitives';

const ACCENT = '#244949';

export function AddressPill({ onAddressSelected }: { onAddressSelected?: () => void }) {
  const { state, update } = useFunnelV2();
  const [query, setQuery] = useState(state.fullAddress);
  const [results, setResults] = useState<DawaSuggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lookupPending, startLookup] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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
        screenIdx: 1, // → BekraeftAdresse
      });
      onAddressSelected?.();
    });
  }

  const isLoading = pending || lookupPending;
  const canGo = !!query && query.length >= 3;

  return (
    <div ref={wrapperRef} className="relative max-w-xl pt-3">
      <label htmlFor="address-input" className="sr-only">Adresse</label>
      <div
        className="relative flex items-center bg-white border border-stone-200 rounded-full shadow-[0_8px_30px_-8px_rgba(20,24,26,0.18)] focus-within:border-stone-300 focus-within:shadow-[0_12px_40px_-8px_rgba(20,24,26,0.25)]"
        style={{ transition: `box-shadow 200ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}` }}
      >
        <svg className="absolute left-6 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#5A6166" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          id="address-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Indtast din adresse"
          autoComplete="street-address"
          aria-label="Boligens adresse"
          className="w-full pl-14 pr-40 py-5 text-[16px] bg-transparent placeholder:text-stone-400 focus:outline-none rounded-full"
        />
        <button
          type="button"
          disabled={!canGo || isLoading}
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          aria-label="Få tilbud"
          className="absolute right-2 px-6 py-3 rounded-full font-medium text-[14px] text-white disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] touch-manipulation"
          style={{
            background: !canGo || isLoading ? undefined : ACCENT,
            transition: `background-color 200ms ${EASE_OUT}, color 200ms ${EASE_OUT}, transform 150ms ${EASE_OUT}`,
          }}
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin align-middle" />
          ) : (
            <>Få tilbud →</>
          )}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(20,24,26,0.25)] overflow-hidden z-40 border border-stone-100 origin-top"
          style={{
            animation: `salg-pop-in 180ms ${EASE_OUT} both`,
          }}
        >
          {results.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-6 py-4 text-[15px] hover:bg-stone-50 flex items-center gap-4 border-b border-stone-100 last:border-0 active:bg-stone-100 focus:outline-none focus-visible:bg-stone-50 touch-manipulation"
                style={{ transition: `background-color 100ms ${EASE_OUT}` }}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <p className="text-[13px] mt-4 px-2 text-[#5A6166]">
        Ingen forpligtelse · Tager 5 minutter · Dine oplysninger forbliver private
      </p>

      <style>{`
        @keyframes salg-pop-in {
          0%   { opacity: 0; transform: scale(0.97) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes salg-pop-in {
            0%, 100% { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </div>
  );
}
