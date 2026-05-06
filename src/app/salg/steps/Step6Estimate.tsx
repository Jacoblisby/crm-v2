'use client';

import { useState, useTransition, useEffect } from 'react';
import { useFunnel } from '../FunnelContext';
import { TOTAL_DRIFT } from '../types';
import { submitFunnelAction } from '../submit-action';
import type { computeEstimate } from '@/lib/services/price-engine';

type Estimate = Awaited<ReturnType<typeof computeEstimate>>;

const PHOTO_KEY = 'salg.photos.v1';

export function Step6Estimate() {
  const { state, prev, reset } = useFunnel();
  const [pending, startTransition] = useTransition();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Submit automatisk når step 6 åbnes
  useEffect(() => {
    if (submitted || pending || estimate) return;

    startTransition(async () => {
      // Hent fotos fra sessionStorage
      let photoDataUrls: string[] = [];
      try {
        const raw = sessionStorage.getItem(PHOTO_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, { dataUrl: string }>;
          photoDataUrls = Object.values(parsed).map((p) => p.dataUrl);
        }
      } catch {}

      const r = await submitFunnelAction(state, photoDataUrls);
      if (r.ok && r.estimate) {
        setEstimate(r.estimate);
        setLeadId(r.leadId ?? null);
        setSubmitted(true);
      } else {
        setError(r.error || 'Kunne ikke beregne estimat');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (pending && !estimate) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-4xl">📐</div>
        <h2 className="text-xl font-semibold">Beregner dit estimat…</h2>
        <p className="text-sm text-slate-500">
          Vi finder sammenlignelige handler og kører afkast-modellen
        </p>
        <div className="flex justify-center gap-1 mt-4">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span
            className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
            style={{ animationDelay: '0.2s' }}
          />
          <span
            className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-3xl">😕</div>
        <h2 className="text-lg font-semibold">Noget gik galt</h2>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={prev}
          className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm"
        >
          ← Gå tilbage
        </button>
      </div>
    );
  }

  if (!estimate) return null;

  const { netForkortet, comparables, sampleSize, averageDiscountPct } = estimate;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-wider text-emerald-600 font-medium">
          ✓ Dit foreløbige tilbud
        </p>
        <h2 className="text-lg sm:text-2xl font-semibold leading-tight">
          {(() => {
            // På mobile: drop postnr+by (de er allerede i progress-bar)
            const parts = state.fullAddress.split(',');
            const short = parts.slice(0, 2).join(',').trim();
            return (
              <>
                <span className="sm:hidden">{short || state.fullAddress}</span>
                <span className="hidden sm:inline">{state.fullAddress}</span>
              </>
            );
          })()}
        </h2>
      </div>

      {/* HOVEDTAL */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
        <p className="text-sm text-slate-600">Vores foreløbige tilbud</p>
        <p className="text-5xl sm:text-6xl font-bold text-emerald-700 tracking-tight">
          {netForkortet.finalOffer.toLocaleString('da-DK')} <span className="text-2xl">kr</span>
        </p>
        <p className="text-xs text-slate-500">
          Bindende tilbud gives efter gratis besigtigelse
        </p>
      </div>

      {/* HVAD DU SPARER + ÆKVIVALENT MÆGLER-PRIS */}
      {(() => {
        const equivalentBrokerPrice =
          netForkortet.finalOffer +
          netForkortet.minusBrokerSavings +
          netForkortet.minusMarketDiscount +
          netForkortet.minusOwnershipCosts;
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Hvad du sparer ved at sælge til os
            </h3>
            <ul className="space-y-2.5 text-sm">
              <SaveItem
                label="Mæglersalær"
                value={netForkortet.minusBrokerSavings}
                sub="Vi tager intet salær — du beholder ~70.000 kr."
              />
              <SaveItem
                label="Markedsafslag"
                value={netForkortet.minusMarketDiscount}
                sub="Slutprisen via mægler er typisk 6% under listeprisen."
              />
              <SaveItem
                label="Drift i salgsperioden"
                value={netForkortet.minusOwnershipCosts}
                sub="Du betaler ikke fællesudg., grundskyld m.m. mens boligen står til salg (3 mdr)."
              />
            </ul>
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-blue-900">
                    Vores tilbud svarer til at sælge for
                  </span>
                  <span className="text-lg font-bold text-blue-700 tabular-nums">
                    {equivalentBrokerPrice.toLocaleString('da-DK')} kr
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  …hvis du var gået via mægler. Vores {netForkortet.finalOffer.toLocaleString('da-DK')} kr kontant +
                  de tre poster du sparer ovenfor.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                💚 Vi betaler kontant — ingen ventetid, mæglersalær eller bank-forbehold.
              </p>
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="bg-slate-900 rounded-xl p-5 text-white text-center space-y-3">
        <p className="font-semibold text-lg">Næste skridt</p>
        <p className="text-sm text-slate-300">
          Jacob ringer dig op indenfor 24 timer for at aftale en gratis, uforpligtende
          besigtigelse. Efter besigtigelsen giver vi et endeligt bindende tilbud.
        </p>
        <a
          href="tel:+4561789071"
          className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg px-5 py-2.5 text-sm"
        >
          📞 Ring direkte til Jacob
        </a>
        <p className="text-xs text-slate-400">
          Eller email: <a href="mailto:jacob@faurholt.com" className="underline">jacob@faurholt.com</a>
        </p>
      </div>

      {/* COMPARABLES */}
      {comparables.length > 0 && (
        <details className="bg-white border border-slate-200 rounded-xl p-4" open>
          <summary className="cursor-pointer font-medium text-slate-900 flex items-center justify-between">
            <span>
              📊 Bygger på {sampleSize} tinglyste handler
              {estimate.sameEfCount > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  {estimate.sameEfCount} i samme ejerforening
                </span>
              )}
            </span>
            <span className="text-xs text-slate-500">Klik for at skjule</span>
          </summary>
          <div className="mt-3 space-y-1.5 text-sm">
            {comparables.slice(0, 10).map((c, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 py-1.5 px-2 rounded text-xs sm:text-sm ${
                  c.weight >= 3
                    ? 'bg-emerald-50 border border-emerald-200'
                    : c.isCurrentListing
                      ? 'bg-amber-50/50'
                      : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{c.address}</span>
                  <span className="text-slate-500 ml-2">
                    {c.kvm}m²
                  </span>
                  {c.weight >= 4 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      Samme bygning
                    </span>
                  )}
                  {c.weight === 3 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">
                      Samme EF
                    </span>
                  )}
                  {c.isCurrentListing && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Til salg nu
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium">{c.price.toLocaleString('da-DK')} kr</div>
                  <div className="text-xs text-slate-500">
                    {c.pricePerSqm.toLocaleString('da-DK')}/m²
                    {c.date && <span> · {c.date.slice(0, 7)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="text-xs text-slate-500 text-center bg-slate-50 rounded-lg p-3">
        Tilbuddet er foreløbigt og bygger på offentlig data + dine oplysninger. Endeligt tilbud
        gives efter gratis besigtigelse. Du får en bekræftelse på email på{' '}
        <strong>{state.email}</strong>.
      </div>

      {leadId && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (confirm('Vil du beregne et nyt estimat på en anden bolig?')) {
                reset();
                try {
                  sessionStorage.removeItem(PHOTO_KEY);
                } catch {}
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Beregn et nyt estimat
          </button>
        </div>
      )}
    </div>
  );
}

function SaveItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-emerald-600 text-lg leading-none mt-0.5">✓</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-slate-800">{label}</span>
          <span className="font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
            {value.toLocaleString('da-DK')} kr
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </li>
  );
}

function BreakdownRow({
  label,
  value,
  hint,
  highlight,
  positive,
  total,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean; // grøn — vores tilbud (start)
  positive?: boolean;  // mid-rows: sparelser kunden får
  total?: boolean;     // sum-row: hvad det svarer til på markedet
}) {
  const rowBg = highlight ? 'bg-emerald-50' : total ? 'bg-blue-50' : '';
  const labelCls = highlight
    ? 'font-semibold text-emerald-900'
    : total
      ? 'font-semibold text-blue-900'
      : 'text-slate-700';
  const valueCls = highlight
    ? 'text-emerald-700 text-lg font-bold'
    : total
      ? 'text-blue-700 text-lg font-bold'
      : positive
        ? 'text-emerald-600'
        : value < 0
          ? 'text-red-600'
          : 'text-slate-900';
  return (
    <div className={`px-4 py-3 flex items-baseline justify-between gap-3 ${rowBg}`}>
      <div className="min-w-0">
        <div className={`text-sm ${labelCls}`}>{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
      </div>
      <div className={`shrink-0 font-medium tabular-nums ${valueCls}`}>
        {value < 0 ? '−' : ''}
        {Math.abs(value).toLocaleString('da-DK')} kr
      </div>
    </div>
  );
}
