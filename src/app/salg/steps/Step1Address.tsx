'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Lock, Check } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { searchAddressAction, lookupAddressAction, submitOutOfAreaLeadAction } from '../actions';
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
  const justSelectedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Sync input-state med funnel-state når lokalstorage loader (fx ved reload)
  useEffect(() => {
    if (state.fullAddress && !query) setQuery(state.fullAddress);
  }, [state.fullAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click-outside lukker dropdown — så bruger ikke ser den hænge over OOA-form
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search ved hver tastetryk
  useEffect(() => {
    // Skip search hvis brugeren lige har valgt — query == s.tekst men det er
    // ikke en ny søgning de vil have
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
    justSelectedRef.current = true; // forhindrer useEffect i at re-åbne dropdown
    setQuery(s.tekst);
    setResults([]);
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
        <h2 className="text-xl font-semibold text-slate-900">Hvor ligger din lejlighed?</h2>
        <p className="text-sm text-slate-500">
          Skriv adressen. Vi henter automatisk størrelse, byggeår og ejendomsdata.
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Vi sender intet før du klikker &quot;Vis mit estimat&quot; i sidste trin.
        </p>
      </div>

      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Eks. Bogensevej 53, 2. tv, 4700 Næstved"
          className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          autoComplete="off"
        />
        {pending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            Søger…
          </div>
        )}

        {showResults && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-30 max-h-72 overflow-y-auto">
            {results.map((s) => (
              <li key={s.adresse.id}>
                <button
                  type="button"
                  onClick={() => selectAddress(s)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
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

      {outOfArea && <OutOfAreaForm />}

      {showAutoFilled && !outOfArea && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Check className="w-4 h-4" strokeWidth={3} />
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
            <div className="text-xs text-slate-700 border-t border-slate-200 pt-2">
              Vi har set din bolig til salg lige nu på Boligsiden til{' '}
              <strong>{state.currentListingPrice.toLocaleString('da-DK')} kr</strong>. Vi tager det
              med i beregningen.
            </div>
          )}
        </div>
      )}

      {!outOfArea && (
        <div className="flex justify-end">
          <button
            onClick={continueIfReady}
            disabled={!hasAddress || lookupPending}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
          >
            Fortsæt →
          </button>
        </div>
      )}
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

function OutOfAreaForm() {
  const { state, update } = useFunnel();
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!state.fullName || !state.email || !state.phone) {
      setError('Udfyld navn, email og telefon');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await submitOutOfAreaLeadAction({
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        fullAddress: state.fullAddress,
        postalCode: state.postalCode,
        city: state.city,
      });
      if (r.ok) setSubmitted(true);
      else setError(r.error || 'Noget gik galt');
    });
  }

  if (submitted) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2">
        <div className="flex items-center gap-2 text-base font-semibold text-emerald-700">
          <Check className="w-5 h-5" strokeWidth={3} />
          Vi har modtaget din henvendelse
        </div>
        <p className="text-sm text-slate-700">
          Tak. Vi gemmer din kontakt og vender tilbage hvis vi kan tilbyde noget. Eller når vi
          udvider til {state.postalCode}. I mellemtiden er du velkommen til at ringe direkte
          på <a href="tel:+4561789071" className="font-semibold underline">+45 61 78 90 71</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">
          Vi køber ikke i {state.postalCode} endnu
        </div>
        <p className="text-sm text-slate-700 mt-1">
          Vores hovedområder er Næstved, Ringsted, Kalundborg, Taastrup og Roskilde. Læg dine
          kontaktoplysninger her, så vurderer vi din sag manuelt og vender tilbage indenfor 1-2
          hverdage.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Fulde navn"
          value={state.fullName}
          onChange={(e) => update({ fullName: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        />
        <input
          type="email"
          placeholder="Email"
          value={state.email}
          onChange={(e) => update({ email: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        />
        <input
          type="tel"
          placeholder="Telefon"
          value={state.phone}
          onChange={(e) => update({ phone: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
        />
      </div>
      {error && <div className="text-sm text-red-700">{error}</div>}
      <button
        onClick={submit}
        disabled={pending}
        className="w-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
      >
        {pending ? 'Sender…' : 'Send min sag til vurdering'}
      </button>
    </div>
  );
}
