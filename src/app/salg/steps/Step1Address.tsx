'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useFunnel } from '../FunnelContext';
import { searchAddressAction, lookupAddressAction } from '../actions';
import type { DawaSuggestion } from '@/lib/services/dawa';

const SUPPORTED_POSTAL_CODES = ['2630', '4000', '4100', '4400', '4700'];

export function Step1Address() {
  const { state, update, next } = useFunnel();
  const [query, setQuery] = useState(state.fullAddress);
  const [results, setResults] = useState<DawaSuggestion[]>([]);
  const [pending, startTransition] = useTransition();
  const [lookupPending, startLookup] = useTransition();
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfArea, setOutOfArea] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search ved hver tastetryk
  useEffect(() => {
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
    setQuery(s.tekst);
    setShowResults(false);
    setOutOfArea(false);
    setError(null);

    startLookup(async () => {
      const r = await lookupAddressAction(s.adresse.id);
      if (!r.ok) {
        setError(r.error || 'Kunne ikke hente bolig-data');
        return;
      }

      const { address, property } = r;

      // Tjek om postnummer er i vores dæknings-områder
      if (!SUPPORTED_POSTAL_CODES.includes(address.postalCode)) {
        setOutOfArea(true);
        // Vi tillader stadig at gemme adressen (lead landing) men viser besked
      }

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

  function continueIfReady() {
    if (state.fullAddress && state.postalCode) {
      next();
    }
  }

  const hasAddress = !!state.fullAddress && !!state.postalCode;
  const showAutoFilled = hasAddress && state.kvm != null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Hvor ligger din lejlighed?</h2>
        <p className="text-sm text-slate-500">
          Skriv adressen — vi henter automatisk størrelse, byggeår og BFE-nummer.
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Eks. Bogensevej 53, 2. tv, 4700 Næstved"
          className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          autoComplete="off"
        />
        {pending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Søger…
          </div>
        )}

        {showResults && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-10 max-h-72 overflow-y-auto">
            {results.map((s) => (
              <li key={s.adresse.id}>
                <button
                  type="button"
                  onClick={() => selectAddress(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                >
                  {s.tekst}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lookupPending && (
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
          Henter bolig-data fra OIS…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {outOfArea && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <strong>Vi køber ikke i {state.postalCode} endnu</strong> — vores hovedområder er
          Næstved, Ringsted, Kalundborg, Taastrup og Roskilde. Vi vil dog stadig gerne kontakte dig
          og vurdere sagen — fortsæt nedenunder.
        </div>
      )}

      {showAutoFilled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <span>✓</span>
            <span>Vi har fundet din lejlighed</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Field
              label="m²"
              value={state.kvm}
              onChange={(v) => update({ kvm: v })}
              type="number"
            />
            <Field
              label="Værelser"
              value={state.rooms}
              onChange={(v) => update({ rooms: v })}
              type="number"
            />
            <Field
              label="Byggeår"
              value={state.yearBuilt}
              onChange={(v) => update({ yearBuilt: v })}
              type="number"
            />
            <div>
              <div className="text-xs text-slate-500 mb-1">BFE-nr</div>
              <div className="text-sm font-medium text-slate-700">
                {state.bfeNumber ?? '–'}
              </div>
            </div>
          </div>
          {state.isOnMarket && state.currentListingPrice && (
            <div className="text-xs text-emerald-700 border-t border-emerald-200 pt-2">
              💡 Vi har set din bolig til salg lige nu på Boligsiden til{' '}
              <strong>{state.currentListingPrice.toLocaleString('da-DK')} kr</strong>. Vi tager det
              med i beregningen.
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={continueIfReady}
          disabled={!hasAddress || lookupPending}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: number | string | null;
  onChange: (v: number) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded font-medium"
      />
    </label>
  );
}
