'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Lock, Check } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { searchAddressAction, lookupAddressAction, submitOutOfAreaLeadAction } from '../actions';
import type { DawaSuggestion } from '@/lib/services/dawa';
import { Counter, CounterWithInput } from '../components/Counter';

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
  const [noDawaMatch, setNoDawaMatch] = useState(false);
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
          // Hvis DAWA returnerer 0 resultater og brugeren har indtastet noget
          // substantielt, sa antager vi adressen er problematisk og tilbyder
          // manuel fallback (#9 — graceful degradation).
          setNoDawaMatch(r.results.length === 0 && query.trim().length >= 8);
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
    setNoDawaMatch(false);
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

  function continueIfReady() {
    if (state.fullAddress && state.postalCode && contactValid) {
      next();
    }
  }

  const hasAddress = !!state.fullAddress && !!state.postalCode;
  const showAutoFilled = hasAddress && state.kvm != null;

  // Kontakt-validering (paakraevet for at gaa videre)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);
  const phoneValid = state.phone.replace(/\D/g, '').length >= 8;
  const nameValid = state.fullName.trim().length >= 2;
  const contactValid = emailValid && phoneValid && nameValid;
  const contactHint =
    !nameValid
      ? 'Indtast dit fulde navn'
      : !emailValid
        ? 'Indtast en gyldig email'
        : !phoneValid
          ? 'Indtast et gyldigt telefonnummer (mindst 8 cifre)'
          : null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 id="step1-heading" className="font-bold tracking-tight text-2xl sm:text-[28px] text-slate-900 tracking-tight">
          Hvor ligger din lejlighed?
        </h2>
        <p id="step1-helper" className="text-[15px] text-slate-600 text-pretty leading-relaxed">
          Skriv adressen. Vi henter automatisk størrelse, byggeår og ejendomsdata.
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
          <Lock className="w-3 h-3" strokeWidth={2} />
          Vi sender intet før du klikker &quot;Vis mit estimat&quot; i sidste trin.
        </p>
      </div>

      <div ref={wrapperRef} className="relative">
        <label htmlFor="address-input" className="sr-only">
          Boligens adresse
        </label>
        <input
          id="address-input"
          name="address"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Vejnavn + nr, postnr"
          className="w-full px-5 py-4 text-base border-2 border-slate-200 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          autoComplete="street-address"
          aria-labelledby="step1-heading"
          aria-describedby="step1-helper"
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

      {/* Maegler-filter inspireret af Zillow's first-step agent-filtrering — vi
          luger researching brokers/agents ud INDEN de bruger 3 min af flowet */}
      {!hasAddress && (
        <p className="text-xs text-slate-500">
          Er du mægler eller laver research?{' '}
          <a
            href="mailto:jacob@faurholt.com?subject=Mægler-forespørgsel"
            className="text-slate-700 underline hover:text-slate-900"
          >
            Skriv direkte til Jacob →
          </a>
        </p>
      )}

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

      {noDawaMatch && !outOfArea && !showAutoFilled && (
        <NoDawaMatchForm
          query={query}
          onSubmitted={() => setNoDawaMatch(false)}
        />
      )}

      {showAutoFilled && !outOfArea && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Check className="w-4 h-4" strokeWidth={3} />
            <span>Vi har fundet din lejlighed</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <CounterWithInput
              label="m²"
              value={state.kvm}
              onChange={(v) => update({ kvm: v })}
              min={10}
              max={500}
              step={5}
              suffix="m²"
            />
            <Counter
              label="Værelser"
              value={state.rooms}
              onChange={(v) => update({ rooms: v })}
              min={1}
              max={12}
              step={1}
            />
            <CounterWithInput
              label="Byggeår"
              value={state.yearBuilt}
              onChange={(v) => update({ yearBuilt: v })}
              min={1800}
              max={new Date().getFullYear()}
              step={1}
            />
            <div>
              <div className="text-xs text-slate-500 mb-1.5">BFE-nr</div>
              <div className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg h-10 flex items-center">
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

          {/* Kontaktoplysninger — paakraevet for at gaa videre. Vi flyttede det fra
              et separat slut-trin saa vi har dem fra start (recovery-mail mulig). */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <p className="text-sm font-medium text-slate-900">
              Hvor sender vi dit estimat?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ContactInput
                label="Fulde navn"
                type="text"
                autoComplete="name"
                value={state.fullName}
                onChange={(v) => update({ fullName: v })}
                placeholder="Jens Hansen"
              />
              <ContactInput
                label="Email"
                type="email"
                autoComplete="email"
                value={state.email}
                onChange={(v) => update({ email: v })}
                placeholder="din@email.dk"
              />
              <ContactInput
                label="Telefon"
                type="tel"
                autoComplete="tel"
                value={state.phone}
                onChange={(v) => update({ phone: v })}
                placeholder="20 12 34 56"
              />
            </div>
            <p className="text-xs text-slate-500">
              Du modtager dit foreløbige tilbud på email + SMS. Vi ringer indenfor 24 timer
              for at aftale en gratis besigtigelse.
            </p>
          </div>
        </div>
      )}

      {!outOfArea && (
        <div className="flex flex-col items-stretch sm:items-end gap-2 pt-2">
          {showAutoFilled && contactHint && (
            <span className="text-xs text-slate-600 text-right">{contactHint}</span>
          )}
          <button
            onClick={continueIfReady}
            disabled={!hasAddress || lookupPending || !contactValid}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base transition-colors shadow-sm"
          >
            Fortsæt
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

function ContactInput({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
      />
    </label>
  );
}

function NoDawaMatchForm({
  query,
  onSubmitted,
}: {
  query: string;
  onSubmitted: () => void;
}) {
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
        fullAddress: query, // brug rå tekst da DAWA ikke kunne matche
        postalCode: '',
        city: '',
      });
      if (r.ok) {
        setSubmitted(true);
        onSubmitted();
      } else setError(r.error || 'Noget gik galt');
    });
  }

  if (submitted) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2">
        <div className="flex items-center gap-2 text-base font-semibold text-emerald-700">
          <Check className="w-5 h-5" strokeWidth={3} />
          Tak — vi vender tilbage
        </div>
        <p className="text-sm text-slate-700">
          Vi har modtaget din adresse og kontaktoplysninger. Vi regner manuelt på din sag og
          vender tilbage indenfor 1-2 hverdage.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">
          Vi kunne ikke finde adressen automatisk
        </div>
        <p className="text-sm text-slate-700 mt-1">
          Det er måske en ny adresse eller en stavefejl. Læg dine kontaktoplysninger her, så
          regner vi på sagen manuelt og vender tilbage indenfor 1-2 hverdage.
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
        {pending ? 'Sender…' : 'Send min sag til manuel vurdering'}
      </button>
    </div>
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
