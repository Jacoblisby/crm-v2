'use client';

/**
 * HeroAddressInput — 1:1 Opendoor pill input pattern.
 * Hvid pill + magnifier-glass icon button til hojre (i 365 teal).
 */
import { useState, useTransition, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { searchAddressAction, lookupAddressAction } from '../actions';
import type { DawaSuggestion } from '@/lib/services/dawa';

export function HeroAddressInput() {
  const { state, update } = useFunnel();
  const [query, setQuery] = useState(state.fullAddress);
  const [results, setResults] = useState<DawaSuggestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [lookupPending, startLookup] = useTransition();
  const [showResults, setShowResults] = useState(false);
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
      });
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <label htmlFor="hero-address-input" className="sr-only">
        Boligens adresse
      </label>
      <div className="relative flex items-center bg-white rounded-full shadow-[0_4px_16px_-2px_rgba(0,0,0,0.15)]">
        <input
          id="hero-address-input"
          name="address"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Indtast din adresse"
          className="w-full pl-6 pr-16 py-3.5 sm:py-4 text-base text-ink placeholder:text-stone-400 focus:outline-none rounded-full bg-transparent"
          autoComplete="street-address"
          aria-label="Boligens adresse"
        />
        <button
          type="button"
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          disabled={results.length === 0 || lookupPending}
          aria-label="Få tilbud"
          className="absolute right-1.5 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-brand-700 hover:bg-brand-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-full transition-colors"
        >
          {pending || lookupPending ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      </div>

      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] overflow-hidden z-40 max-h-80 overflow-y-auto">
          {results.map((s) => (
            <li key={s.adresse.id}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-5 py-3 text-[15px] text-ink hover:bg-stone-50 border-b border-stone-100 last:border-b-0 flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-brand-700 shrink-0" strokeWidth={2} />
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
    </div>
  );
}
