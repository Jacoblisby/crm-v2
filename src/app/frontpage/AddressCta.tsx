'use client';

/**
 * AddressCta — adressefeltet fra designfilen. To varianter:
 *   "plate": mørk translucent blur-plade m. hvid input-række OG trust-line
 *            inde i pladen (hero — som i Figma-framen "Landingpage")
 *   "bar":   ren hvid input-bar m. turkis knap (mørk slut-CTA-sektion)
 *
 * Designer-note: "Vi redirecter kun til guiden når man har trykket på
 * 'Tjek din pris'". DAWA-søgning + OIS-opslag genbruges fra /salg; valget
 * skrives synkront i localStorage før navigation til /salg-v4.
 */
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFunnelV2, STORAGE_KEY } from '../salg-v2/FunnelV2Context';
import { searchAddressAction, lookupAddressAction } from '../salg/actions';
import type { DawaSuggestion } from '@/lib/services/dawa';

export function AddressCta({ id, variant = 'plate' }: { id?: string; variant?: 'plate' | 'bar' }) {
  const { update } = useFunnelV2();
  const router = useRouter();
  const [query, setQuery] = useState('');
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
      const patch = {
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
      };
      update(patch);
      // Persistér synkront FØR navigation — /salg-v4 mounter sin egen provider,
      // som læser localStorage. Uden dette taber vi adressen i en race med
      // providerens useEffect-persist.
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const cur = raw ? JSON.parse(raw) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...patch }));
      } catch {}
      router.push('/salg-v4');
    });
  }

  const isLoading = pending || lookupPending;
  const canGo = !!query && query.length >= 3;

  const inputRow = (
    <div className="flex items-stretch bg-white rounded-lg overflow-hidden">
      <div className="flex items-center pl-4 pr-1" style={{ color: '#6b7776' }}>
        <MapPinIcon />
      </div>
      <label htmlFor={id ?? 'fp-address'} className="sr-only">Adresse</label>
      <input
        id={id ?? 'fp-address'}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Indtast din adresse"
        autoComplete="street-address"
        className="flex-1 min-w-0 px-2 py-3.5 text-[14.5px] focus:outline-none placeholder:text-[#8b9695]"
        style={{ color: 'var(--fp-ink)' }}
      />
      <button
        type="button"
        disabled={!canGo || isLoading}
        onClick={() => {
          if (results[0]) selectAddress(results[0]);
        }}
        className="shrink-0 m-1 px-4 sm:px-5 rounded-md text-[13.5px] inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
        style={{ background: 'var(--fp-cta)', color: '#123f41', fontWeight: 500 }}
      >
        {isLoading ? (
          <span
            className="inline-block w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(15,71,73,0.25)', borderTopColor: '#123f41' }}
          />
        ) : (
          <>
            Tjek din pris
            <ArrowIcon />
          </>
        )}
      </button>
    </div>
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      {variant === 'plate' ? (
        <div
          className="rounded-xl px-4 sm:px-6 pt-4 sm:pt-5 pb-3.5 space-y-3"
          style={{
            background: 'rgba(73,70,66,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          {inputRow}
          {/* Trust-line — inde i pladen, hvid tekst (som i designet) */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-1 text-[12.5px] text-white/90">
            <span><strong className="text-white" style={{ fontWeight: 600 }}>87+</strong> boligkøb siden 2020</span>
            <span><strong className="text-white" style={{ fontWeight: 600 }}>Bliv boende</strong> som lejer</span>
            <span><strong className="text-white" style={{ fontWeight: 600 }}>Ingen</strong> mæglersalær</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]">{inputRow}</div>
      )}

      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl overflow-hidden z-40 shadow-[0_20px_50px_-12px_rgba(20,45,45,0.28)] border border-[#e3e9e7]">
          {results.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => selectAddress(s)}
                className="w-full text-left px-5 py-3.5 text-[14px] hover:bg-[var(--fp-cream)] flex items-center gap-3 border-b border-[#eef2f0] last:border-0 transition-colors"
                style={{ color: 'var(--fp-ink)' }}
              >
                <span style={{ color: 'var(--fp-green)' }}><MapPinIcon size={14} /></span>
                <span>{s.tekst}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <div className="mt-3 bg-white border border-[#e3e9e7] rounded-xl p-3 text-sm" style={{ color: '#a3452e' }}>
          {error}
        </div>
      )}
    </div>
  );
}

function MapPinIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
