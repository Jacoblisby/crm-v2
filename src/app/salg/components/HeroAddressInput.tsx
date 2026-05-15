'use client';

/**
 * HeroAddressInput — den Opendoor-style address-pill der sidder INDEN I hero-billedet.
 *
 * Identisk DAWA-autocomplete logik som Step1Address, men styling matcher Opendoor's
 * hero-embedded search: stor pill paa hvid bg paa moerk hero-overlay, blue circle
 * search-icon CTA, dropdown med suggestions.
 *
 * Naar bruger vaelger en adresse, opdaterer FunnelContext og siden re-renderer
 * i Mode B (funnel-mode), hvor marketing-sektioner forsvinder.
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
      // Mode B aktiveres automatisk fordi state.fullAddress nu er sat
    });
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <label htmlFor="hero-address-input" className="sr-only">
        Boligens adresse
      </label>
      <div className="relative flex items-center bg-white rounded-full shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25)] focus-within:ring-4 focus-within:ring-white/30 transition-all">
        <Search
          className="absolute left-6 w-6 h-6 text-brand-500 pointer-events-none"
          strokeWidth={2}
          aria-hidden="true"
        />
        <input
          id="hero-address-input"
          name="address"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Indtast din adresse"
          className="w-full pl-16 pr-32 sm:pr-36 py-5 sm:py-6 text-base sm:text-lg bg-transparent placeholder:text-slate-400 focus:outline-none text-ink rounded-full"
          autoComplete="street-address"
          aria-label="Boligens adresse"
        />
        <button
          type="button"
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          disabled={results.length === 0 || lookupPending}
          className="absolute right-2 sm:right-2.5 px-5 sm:px-7 py-3 sm:py-4 bg-brand-700 hover:bg-brand-800 disabled:bg-brand-300 disabled:cursor-not-allowed text-white rounded-full font-semibold text-sm sm:text-base transition-colors"
        >
          {lookupPending ? 'Henter…' : pending ? 'Søger…' : 'Få tilbud'}
        </button>
      </div>

      {/* Trust line under input */}
      <p className="mt-4 text-sm text-white/85 text-center sm:text-left">
        Ingen forpligtelse. Tager 5 minutter. Vi sender intet før sidste trin.
      </p>

      {/* Autocomplete dropdown */}
      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-3 bg-white border border-brand-100 rounded-2xl shadow-2xl overflow-hidden z-40 max-h-80 overflow-y-auto">
          {results.map((s) => (
            <li key={s.adresse.id}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-6 py-3.5 text-[15px] text-ink hover:bg-brand-50/50 border-b border-brand-50 last:border-b-0 flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-brand-500 shrink-0" strokeWidth={2} />
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
