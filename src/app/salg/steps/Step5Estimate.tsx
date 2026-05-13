'use client';

import { useState, useTransition, useEffect } from 'react';
import { Check, Phone, Video, Sparkles } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { submitFunnelAction } from '../submit-action';
import type { computeEstimate } from '@/lib/services/price-engine';

type Estimate = Awaited<ReturnType<typeof computeEstimate>>;

const PHOTO_KEY = 'salg.photos.v1';

export function Step5Estimate() {
  const { state, prev, reset } = useFunnel();
  const [pending, startTransition] = useTransition();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  // Reveal-gate (inspireret af Casavo): bruger SER blurred tilbud INDEN submit
  // og klikker eksplicit for at afsløre. Skaber commitment + anticipation.
  // Contact-data har vi allerede fra Step1 (lead-recovery), så det er
  // ren UX-magi uden at flytte data-indsamling.
  const [revealClicked, setRevealClicked] = useState(false);

  function triggerReveal() {
    if (revealClicked || submitted || pending || estimate) return;
    setRevealClicked(true);

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
  }

  // Pre-reveal gate: vis blurred tilbud + eksplicit "Afslør" CTA.
  // Inspireret af Casavo's blurred preview-skærm der hooker brugeren.
  if (!revealClicked && !estimate) {
    return (
      <div className="space-y-8 py-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-900">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Klar til at se dit tilbud
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Dit foreløbige tilbud er klart
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Vi har analyseret tinglyste handler i {state.postalCode} {state.city || 'dit område'}
            {' '}og kørt afkast-modellen på dine data
          </p>
        </div>

        <div className="relative max-w-md mx-auto">
          <div className="bg-slate-900 rounded-2xl p-8 text-center shadow-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-medium mb-3">
              365 Ejendomme byder
            </div>
            <div className="text-5xl font-bold text-white blur-md select-none tabular-nums">
              1.857.000 kr
            </div>
            <div className="text-xs text-slate-400 mt-3 blur-sm">
              {state.fullAddress || 'Din adresse'} · {state.kvm ?? '—'} m²
            </div>
            <div className="mt-5 pt-5 border-t border-slate-700 flex items-center justify-center gap-4 text-xs text-slate-400">
              <div>
                <div className="font-semibold text-white blur-sm">12+</div>
                <div className="mt-0.5">Comparables</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <div className="font-semibold text-white blur-sm">3</div>
                <div className="mt-0.5">i samme EF</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <div className="font-semibold text-white blur-sm">22.4k</div>
                <div className="mt-0.5">kr/m²</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={triggerReveal}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-base shadow-lg transition-all hover:scale-[1.02] inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Afslør mit tilbud
          </button>
          <p className="text-xs text-slate-500">
            Bindende tilbud gives først efter en gratis besigtigelse — du er ikke forpligtet
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} /> Ingen mæglersalær
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} /> Kontant betaling
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} /> 5%-garanti
          </span>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={prev}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            ← Tilbage og ret data
          </button>
        </div>
      </div>
    );
  }

  if (pending && !estimate) {
    // Blurred estimat-teaser inspireret af Casavo's contact-gate-reveal —
    // visuel commitment device: brugeren ser at noget kommer, bygger anticipation
    // under den korte ventetid hvor vi kører comparables + ROE-modellen.
    return (
      <div className="space-y-6 py-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Beregner dit estimat</h2>
          <p className="text-sm text-slate-500">
            Vi finder sammenlignelige handler i {state.postalCode} {state.city} og kører
            afkast-modellen
          </p>
        </div>

        {/* Blurred preview card — Casavo-style */}
        <div className="relative max-w-md mx-auto">
          <div className="bg-slate-900 rounded-2xl p-8 text-center shadow-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400 font-medium mb-2">
              Dit foreløbige tilbud
            </div>
            <div className="text-5xl font-bold text-white blur-md select-none tabular-nums">
              1.857.000 kr
            </div>
            <div className="text-xs text-slate-400 mt-3 blur-sm">
              {state.fullAddress || 'Din adresse'}
            </div>
          </div>
          {/* Loading dots overlay */}
          <div className="absolute inset-x-0 -bottom-3 flex justify-center">
            <div className="bg-white border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-md">
              <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse" />
              <span
                className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
              <span className="text-xs text-slate-600 ml-1">Beregner</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-4">
          Bygger på tinglyste handler og vores egne 218 udlejede ejerlejligheder
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Noget gik galt</h2>
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

  const { netForkortet, comparables: allComparables, averageDiscountPct } = estimate;

  // Closing-date adjustment: base case = 3 mdr (matcher OWNERSHIP_MONTHS i engine).
  // 14 dage giver fast-track-bonus, 6 mdr giver lille rabat.
  const adjustment = closingAdjustment(state.chosenOvertagelseMaaneder);
  const adjustedOffer = netForkortet.finalOffer + adjustment;

  // Filter comparables til kun dem der ligger inden for ±8% af vores
  // ækvivalente mægler-pris (= det vores tilbud svarer til på markedet).
  const equivalentBrokerPrice =
    adjustedOffer +
    netForkortet.minusBrokerSavings +
    netForkortet.minusMarketDiscount +
    netForkortet.minusOwnershipCosts;
  const comparables = allComparables.filter((c) => {
    const ratio = c.price / equivalentBrokerPrice;
    return ratio >= 0.92 && ratio <= 1.08; // ±8%
  });
  const sampleSize = comparables.length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
          Dit foreløbige tilbud
        </p>
        <h2 className="text-lg sm:text-2xl font-semibold leading-tight text-slate-900">
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
      <div className="bg-slate-900 rounded-lg p-6 text-center space-y-2">
        <p className="text-sm text-slate-400">Vores foreløbige tilbud</p>
        <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
          {adjustedOffer.toLocaleString('da-DK')} <span className="text-2xl text-slate-300">kr</span>
        </p>
        <p className="text-xs text-slate-400">
          Bindende tilbud gives efter gratis besigtigelse
        </p>
      </div>

      {/* CLOSING-DATE SLIDER (Offerpad-style) */}
      <ClosingDateChips />


      {/* HVAD DU SPARER + ÆKVIVALENT MÆGLER-PRIS */}
      {(() => {
        const equivalentBrokerPrice =
          adjustedOffer +
          netForkortet.minusBrokerSavings +
          netForkortet.minusMarketDiscount +
          netForkortet.minusOwnershipCosts;
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Hvad du sparer ved at sælge til os
            </h3>
            <ul className="space-y-2.5 text-sm">
              <SaveItem
                label="Mæglersalær"
                value={netForkortet.minusBrokerSavings}
                sub="Vi tager intet salær. Du beholder ~70.000 kr."
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
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    Vores tilbud svarer til at sælge for
                  </span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {equivalentBrokerPrice.toLocaleString('da-DK')} kr
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  …hvis du var gået via mægler. Vores {adjustedOffer.toLocaleString('da-DK')} kr kontant
                  plus de tre poster du sparer ovenfor.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Vi betaler kontant. Ingen ventetid, mæglersalær eller bank-forbehold.
              </p>
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="bg-slate-900 rounded-lg p-5 text-white text-center space-y-3">
        <p className="font-semibold text-lg">Næste skridt</p>
        <p className="text-sm text-slate-300">
          Vi ringer dig op indenfor 24 timer for at aftale en gratis, uforpligtende
          besigtigelse. Efter besigtigelsen giver vi et endeligt bindende tilbud.
        </p>
        <a
          href="tel:+4561789071"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg px-5 py-2.5 text-sm"
        >
          <Phone className="w-4 h-4" strokeWidth={2} />
          Ring direkte til os
        </a>
        <p className="text-xs text-slate-400">
          Eller email: <a href="mailto:administration@365ejendom.dk" className="underline">administration@365ejendom.dk</a>
        </p>
      </div>

      {/* VIRTUEL BESIGTIGELSE */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              Vil du møde os virtuelt først?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Book et 20-minutters Google Meet hvor vi gennemgår dit estimat sammen og
              svarer på dine spørgsmål. Du behøver ikke installere noget — du klikker
              bare på linket vi sender på email. Vi kommer derefter forbi til den
              fysiske besigtigelse.
            </p>
          </div>
        </div>
        <a
          href={`mailto:administration@365ejendom.dk?subject=${encodeURIComponent(
            'Booking af virtuelt møde — ' + state.fullAddress,
          )}&body=${encodeURIComponent(
            `Hej,\n\nJeg vil gerne booke et virtuelt møde om mit estimat på ${state.fullAddress}.\n\nForslag til tidspunkter:\n- \n- \n\nVenlig hilsen\n${state.fullName || ''}`,
          )}`}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg px-5 py-2.5 text-sm"
        >
          <Video className="w-4 h-4" strokeWidth={2} />
          Book virtuelt møde
        </a>
      </div>

      {/* EF SOCIAL-PROOF — vis prominent hvis vi har handler i samme bygning/EF */}
      {(() => {
        const sameEfHandler = comparables
          .filter((c) => c.weight >= 3 && !c.isCurrentListing)
          .slice(0, 3);
        if (sameEfHandler.length === 0) return null;
        return (
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-medium">
                Hvad andre i din ejerforening fik
              </p>
              <h3 className="text-sm font-semibold text-slate-900">
                {sameEfHandler.length} {sameEfHandler.length === 1 ? 'tinglyst handel' : 'tinglyste handler'} fra din bygning eller forening
              </h3>
            </div>
            <ul className="space-y-2">
              {sameEfHandler.map((c, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {c.address}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.kvm}m²
                      {c.date && <span> · {c.date.slice(0, 7)}</span>}
                      {c.weight >= 4 && <span className="ml-2 font-medium text-slate-700">samme bygning</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-slate-900 tabular-nums">
                      {c.price.toLocaleString('da-DK')} kr
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {c.pricePerSqm.toLocaleString('da-DK')}/m²
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Anonymiserede tinglyste handler (kilde: Vurderingsstyrelsen). Vi bruger dem
              direkte i vores prisberegning — du betaler ikke salær på toppen.
            </p>
          </div>
        );
      })()}

      {/* COMPARABLES */}
      {comparables.length > 0 && (
        <details className="bg-white border border-slate-200 rounded-lg p-4" open>
          <summary className="cursor-pointer font-medium text-slate-900 flex items-center justify-between">
            <span>
              Bygger på {sampleSize} tinglyste handler
              {estimate.sameEfCount > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
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
                    ? 'bg-slate-50 border border-slate-200'
                    : c.isCurrentListing
                      ? 'bg-slate-50/60'
                      : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{c.address}</span>
                  <span className="text-slate-500 ml-2">
                    {c.kvm}m²
                  </span>
                  {c.weight >= 4 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-white">
                      Samme bygning
                    </span>
                  )}
                  {c.weight === 3 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-white">
                      Samme EF
                    </span>
                  )}
                  {c.isCurrentListing && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
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
        Tilbuddet er foreløbigt og bygger på offentlig data + dine oplysninger. Bindende tilbud
        gives efter gratis besigtigelse. Du modtager en bekræftelse på email på{' '}
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

/**
 * Closing-date adjustment til vores tilbud.
 * Base case = 3 mdr (matcher OWNERSHIP_MONTHS=3 i engine).
 *   14 dage: +15.000 fast-track-bonus (vi prioriterer hurtige sager)
 *   1 mdr:   +0
 *   3 mdr:   +0 (base)
 *   6 mdr:   -10.000 (vi venter laengere paa at faa lejeindtaegt)
 * Justeringen er flat og skifter dyre-tal nemt at kommunikere.
 */
function closingAdjustment(months: 0.5 | 1 | 3 | 6): number {
  if (months === 0.5) return 15_000;
  if (months === 1) return 0;
  if (months === 3) return 0;
  return -10_000;
}

function ClosingDateChips() {
  const { state, update } = useFunnel();
  const options: { value: 0.5 | 1 | 3 | 6; label: string; sub: string }[] = [
    { value: 0.5, label: '14 dage', sub: '+15.000 kr' },
    { value: 1, label: '1 mdr', sub: 'standard' },
    { value: 3, label: '3 mdr', sub: 'standard' },
    { value: 6, label: '6 mdr', sub: '−10.000 kr' },
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Hvornår vil du overtage?
        </h3>
        <span className="text-xs text-slate-500">Du kan altid ændre i besigtigelsen</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => {
          const active = state.chosenOvertagelseMaaneder === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ chosenOvertagelseMaaneder: opt.value })}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-colors ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
              }`}
            >
              <span className="font-semibold text-sm">{opt.label}</span>
              <span
                className={`text-[11px] mt-0.5 ${
                  active ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Hurtigere overtagelse giver dig en bonus. Længere overtagelse gør tilbuddet en smule
        lavere — vi venter længere på at få lejeindtægt.
      </p>
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
      <Check className="w-4 h-4 text-slate-900 mt-1 shrink-0" strokeWidth={3} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-slate-800">{label}</span>
          <span className="font-semibold text-slate-900 tabular-nums whitespace-nowrap">
            {value.toLocaleString('da-DK')} kr
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </li>
  );
}
