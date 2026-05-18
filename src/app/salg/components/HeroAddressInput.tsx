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
      <div className="relative flex items-center bg-paper-50 rounded-full border-2 border-brass-400/60 focus-within:border-brass-600 focus-within:bg-white transition-all">
        <Search
          className="absolute left-5 w-5 h-5 text-brass-600 pointer-events-none"
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
          placeholder="Hvor ligger din bolig?"
          className="w-full pl-14 pr-32 sm:pr-40 py-4 sm:py-5 text-base sm:text-[17px] bg-transparent placeholder:text-muted placeholder:font-serif-display-italic focus:outline-none text-ink rounded-full"
          autoComplete="street-address"
          aria-label="Boligens adresse"
          style={{ fontFamily: 'inherit' }}
        />
        <button
          type="button"
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          disabled={results.length === 0 || lookupPending}
          className="absolute right-1.5 sm:right-2 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-ink hover:bg-ink-soft disabled:bg-sage-300 disabled:cursor-not-allowed text-paper-50 rounded-full font-semibold text-sm transition-colors tracking-tight"
        >
          {lookupPending ? 'Henter…' : pending ? 'Søger…' : 'Få tilbud'}
        </button>
      </div>

      <p className="mt-3 text-xs text-muted tracking-wide">
        Ingen forpligtelse · 5 minutter · Vi sender intet før sidste trin
      </p>

      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-[68px] sm:top-[76px] mt-2 bg-paper-50 border border-sage-300/50 rounded-2xl shadow-[0_12px_32px_-8px_rgba(31,38,36,0.15)] overflow-hidden z-40 max-h-80 overflow-y-auto">
          {results.map((s) => (
            <li key={s.adresse.id}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-5 py-3.5 text-[15px] text-ink hover:bg-sage-50 border-b border-sage-100 last:border-b-0 flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-brass-500 shrink-0" strokeWidth={2} />
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
