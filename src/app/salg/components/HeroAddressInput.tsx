'use client';

/**
 * HeroAddressInput — dark-mode cinematic pill med teal CTA.
 * Variant D: glas-paneliseret med blur-back + ring + teal inner-glow paa focus.
 */
import { useState, useTransition, useEffect, useRef } from 'react';
import { Search, ArrowRight } from 'lucide-react';
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
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <label htmlFor="hero-address-input" className="sr-only">
        Boligens adresse
      </label>
      <div className="relative flex items-center bg-surface-3/60 backdrop-blur-sm rounded-2xl ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-brand-400 focus-within:bg-surface-3/80 transition-all">
        <Search
          className="absolute left-5 w-5 h-5 text-ink-soft pointer-events-none"
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
          className="w-full pl-14 pr-36 sm:pr-44 py-4 sm:py-5 text-base sm:text-[17px] bg-transparent text-ink focus:outline-none rounded-2xl tracking-tight"
          autoComplete="street-address"
          aria-label="Boligens adresse"
        />
        <button
          type="button"
          onClick={() => {
            if (results[0]) selectAddress(results[0]);
          }}
          disabled={results.length === 0 || lookupPending}
          className="absolute right-1.5 sm:right-2 inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 bg-brand-500 hover:bg-brand-400 disabled:bg-surface-3 disabled:text-ink-soft disabled:cursor-not-allowed text-ink rounded-xl font-semibold text-sm transition-colors tracking-tight"
        >
          {lookupPending ? 'Henter…' : pending ? 'Søger…' : (
            <>
              Få tilbud
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-xs text-muted tracking-widest uppercase font-medium">
        Ingen forpligtelse · 5 minutter · Vi sender intet før sidste trin
      </p>

      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-surface-2 backdrop-blur-md ring-1 ring-white/10 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.6)] overflow-hidden z-40 max-h-80 overflow-y-auto">
          {results.map((s) => (
            <li key={s.adresse.id}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-5 py-3.5 text-[15px] text-ink-dim hover:text-ink hover:bg-white/5 border-b border-hairline last:border-b-0 flex items-center gap-3 transition-colors"
              >
                <Search className="w-4 h-4 text-brand-300 shrink-0" strokeWidth={2} />
                <span>{s.tekst}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-3 bg-red-950/40 border border-red-900/50 rounded-2xl p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
