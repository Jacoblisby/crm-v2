'use client';

/**
 * Estimat — final offer screen (designer-handoff 1:1).
 *
 * Sektioner (handoff-rækkefølge):
 *   stage-progress → titel → pris-card (sort) → overtagelse-selector →
 *   hvad du sparer → næste skridt (sort) → virtuelt møde → comparables →
 *   disclaimer → reset
 *
 * SUBMIT ved mount: submitFunnelAction opretter lead i CRM, sender email til
 * Jacob + bekræftelse til kunden, og returnerer det RIGTIGE estimat fra
 * prismotoren (comparables + ROE-model). Idempotent via localStorage-nøgle,
 * og estimatet caches så reload viser samme tal uden re-submit.
 */
import { useState, useEffect, useRef } from 'react';
import { useFunnelV2 } from '../FunnelV2Context';
import { submitFunnelAction } from '../../salg/submit-action';
import type { computeEstimate } from '@/lib/services/price-engine';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';
const SUBMIT_KEY = 'salg.v2.submitted';
const ESTIMATE_CACHE_KEY = 'salg.v2.estimate';

type Estimate = Awaited<ReturnType<typeof computeEstimate>>;

type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'error'; error: string }
  | { status: 'already' };

export function Estimat() {
  const { state, update, reset } = useFunnelV2();
  const [comparablesOpen, setComparablesOpen] = useState(true);
  const [priceBlur, setPriceBlur] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const lastBudRef = useRef<number>(0);
  const submittedRef = useRef(false);

  const overtagelse = state.chosenOvertagelseMaaneder ?? 3;

  const overtagelseOptions: Array<{ value: 0.5 | 1 | 3 | 6; t: string; sub: string; delta: number }> = [
    { value: 0.5, t: '14 dage', sub: '+15.000 kr', delta: 15000 },
    { value: 1, t: '1 mdr', sub: 'standard', delta: 0 },
    { value: 3, t: '3 mdr', sub: 'standard', delta: 0 },
    { value: 6, t: '6 mdr', sub: '−10.000 kr', delta: -10000 },
  ];

  // Submit ved mount — opretter lead + henter rigtigt estimat fra prismotoren
  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (!state.fullName || !state.email || !state.phone) return;
    if (!state.postalCode || !state.kvm) return;

    const idemKey = `${state.fullAddress || state.postalCode}|${state.email}`;

    // Allerede submittet? Genindlæs cached estimat i stedet for at re-submitte.
    try {
      const prev = localStorage.getItem(SUBMIT_KEY);
      if (prev === idemKey) {
        const rawCache = localStorage.getItem(ESTIMATE_CACHE_KEY);
        if (rawCache) {
          const cache = JSON.parse(rawCache) as { key: string; estimate: Estimate };
          if (cache.key === idemKey) setEstimate(cache.estimate);
        }
        setSubmit({ status: 'already' });
        return;
      }
    } catch {}

    setSubmit({ status: 'sending' });
    (async () => {
      try {
        const r = await submitFunnelAction(state, []);
        if (r.ok) {
          if (r.estimate) {
            setEstimate(r.estimate);
            try {
              localStorage.setItem(
                ESTIMATE_CACHE_KEY,
                JSON.stringify({ key: idemKey, estimate: r.estimate }),
              );
            } catch {}
          }
          try {
            localStorage.setItem(SUBMIT_KEY, idemKey);
          } catch {}
          setSubmit({ status: 'sent' });
        } else {
          setSubmit({ status: 'error', error: r.error || 'Ukendt fejl' });
        }
      } catch (err) {
        setSubmit({ status: 'error', error: err instanceof Error ? err.message : String(err) });
      }
    })();
  }, [state]);

  // Rigtigt bud fra prismotoren; kvm-baseret fallback hvis submit fejlede
  const baseBud = estimate
    ? estimate.netForkortet.finalOffer
    : state.kvm
      ? Math.round((state.kvm ?? 60) * (state.postalCode === '2630' ? 18000 : 14000) * 0.85)
      : 945000;
  const selected = overtagelseOptions.find((o) => o.value === overtagelse) ?? overtagelseOptions[2];
  const bud = baseBud + selected.delta;

  const maeglerSalaer = 70000;
  const markedAfslag = estimate
    ? estimate.netForkortet.minusMarketDiscount
    : Math.round(bud * 0.07);
  const driftSalg = estimate
    ? estimate.netForkortet.minusOwnershipCosts
    : Math.max(1, Math.round(((state.costFaellesudgifter || 24000) / 12) * 3 - 6000));
  const maeglerEkvivalent = bud + maeglerSalaer + markedAfslag + driftSalg;

  // Comparables: kun handler inden for ±8% af ækvivalent mægler-pris
  const comparables = (estimate?.comparables ?? []).filter((c) => {
    const ratio = c.price / maeglerEkvivalent;
    return ratio >= 0.92 && ratio <= 1.08;
  });
  const sameEfCount = estimate?.sameEfCount ?? 0;

  const fmt = (n: number) => n.toLocaleString('da-DK');

  // Trigger blur når bud ændres
  useEffect(() => {
    if (lastBudRef.current && lastBudRef.current !== bud) {
      setPriceBlur(true);
      const t = setTimeout(() => setPriceBlur(false), 180);
      return () => clearTimeout(t);
    }
    lastBudRef.current = bud;
  }, [bud]);

  const isCalculating = submit.status === 'sending' && !estimate;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE6]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E5E2DA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-10 py-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-baseline gap-1.5 hover:opacity-70 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md px-1"
            style={{ transition: `opacity 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
          >
            <span className="text-[20px] font-semibold tracking-tight text-[#14181A]">365</span>
            <span className="text-[13px] font-medium text-[#5A6166]">ejendomme</span>
          </button>
          <a
            href="tel:+4589876634"
            className="flex items-center gap-2 text-[14px] font-medium hover:opacity-70 text-[#14181A]"
            style={{ transition: `opacity 150ms ${EASE_OUT}` }}
          >
            <PhoneIcon className="w-4 h-4" stroke={ACCENT} />
            +45 89 87 66 34
          </a>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="bg-white rounded-[28px] sm:rounded-[36px] shadow-[0_8px_40px_-12px_rgba(20,24,26,0.15)] p-6 sm:p-12 space-y-8">
            {/* Stage progress — all done */}
            <div className="grid grid-cols-5 gap-3">
              {['Adresse', 'Boligen', 'Udgifter', 'Lidt om dig', 'Estimat'].map((s, i) => {
                const active = i === 4;
                return (
                  <div key={s} className="space-y-2">
                    <div className="h-[3px] rounded-full" style={{ background: ACCENT }} />
                    <div
                      className="text-[11px] sm:text-[13px] tracking-tight"
                      style={{
                        color: active ? ACCENT : '#14181A',
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      {s}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Title */}
            <div className="text-center space-y-2 pt-4">
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
                Dit foreløbige tilbud
              </div>
              <h1 className="text-[28px] sm:text-[36px] font-medium tracking-[-0.02em] leading-tight text-[#14181A]">
                {state.fullAddress || '—'}
              </h1>
            </div>

            {/* Bud — m. blur-crossfade ved skift */}
            <div className="rounded-2xl py-10 text-center text-white bg-[#0F1A1A]">
              <div className="text-[14px] mb-3 text-white/70">Vores foreløbige tilbud</div>
              <div
                className="text-[52px] sm:text-[88px] font-medium tracking-[-0.04em] leading-none"
                style={{
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  filter: priceBlur || isCalculating ? 'blur(6px)' : 'none',
                  opacity: priceBlur || isCalculating ? 0.6 : 1,
                  transition: `filter 180ms ${EASE_OUT}, opacity 180ms ${EASE_OUT}`,
                }}
              >
                {fmt(bud)}{' '}
                <span className="text-[24px] sm:text-[36px] font-normal align-baseline text-white/70">kr</span>
              </div>
              <div className="text-[13px] mt-3 text-white/55">
                {isCalculating
                  ? 'Beregner ud fra tinglyste handler i dit område…'
                  : 'Bindende tilbud gives efter gratis besigtigelse'}
              </div>
            </div>

            {/* Overtagelse selector */}
            <div className="rounded-2xl border bg-white p-6 space-y-4 border-[#E5E2DA]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[15px] font-medium text-[#14181A]">Hvornår vil du overtage?</span>
                <span className="text-[12px] text-[#9C988C]">Du kan altid ændre i besigtigelsen</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {overtagelseOptions.map((o) => {
                  const sel = overtagelse === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => update({ chosenOvertagelseMaaneder: o.value })}
                      className="px-3 py-3 rounded-xl border-2 text-center active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                      style={{
                        borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                        background: sel ? '#0F1A1A' : '#fff',
                        color: sel ? '#fff' : '#14181A',
                        transition: `transform 150ms ${EASE_OUT}, background-color 200ms ${EASE_OUT}, color 200ms ${EASE_OUT}, border-color 200ms ${EASE_OUT}`,
                      }}
                    >
                      <div className="text-[15px] font-semibold">{o.t}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: sel ? 'rgba(255,255,255,0.7)' : '#9C988C' }}>
                        {o.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] leading-relaxed text-[#5A6166]">
                Hurtigere overtagelse giver dig en bonus. Længere overtagelse gør tilbuddet en smule lavere — vi venter længere på at få lejeindtægt.
              </p>
            </div>

            {/* Hvad du sparer */}
            <div className="rounded-2xl border bg-white p-6 space-y-3 border-[#E5E2DA]">
              <div className="text-[15px] font-medium mb-2 text-[#14181A]">
                Hvad du sparer ved at sælge til os
              </div>
              {[
                ['Mæglersalær', maeglerSalaer, 'Vi tager intet salær. Du beholder ~70.000 kr.'],
                ['Markedsafslag', markedAfslag, 'Slutprisen via mægler er typisk 6% under listeprisen.'],
                ['Drift i salgsperioden', driftSalg, 'Du betaler ikke fællesudg., grundskyld m.m. mens boligen står til salg (3 mdr).'],
              ].map(([t, n, sub]) => (
                <div key={t as string} className="flex items-start gap-3 py-2">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[14px] font-medium text-[#14181A]">{t}</span>
                      <span className="text-[14px] font-semibold tabular-nums text-[#14181A]">
                        {fmt(n as number)} kr
                      </span>
                    </div>
                    <div className="text-[12px] mt-0.5 text-[#5A6166]">{sub}</div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl px-5 py-4 flex items-center justify-between mt-2 bg-[#F5EFE6]">
                <div className="flex-1">
                  <div className="text-[13px] font-medium text-[#14181A]">
                    Vores tilbud svarer til at sælge for
                  </div>
                  <div className="text-[11px] mt-0.5 text-[#5A6166]">
                    ...hvis du var gået via mægler. Vores {fmt(bud)} kr kontant plus de tre poster du sparer.
                  </div>
                </div>
                <div
                  className="text-[20px] sm:text-[24px] font-semibold shrink-0 ml-3 text-[#14181A]"
                  style={{
                    fontVariantNumeric: 'tabular-nums lining-nums',
                    filter: priceBlur || isCalculating ? 'blur(3px)' : 'none',
                    opacity: priceBlur || isCalculating ? 0.6 : 1,
                    transition: `filter 180ms ${EASE_OUT}, opacity 180ms ${EASE_OUT}`,
                  }}
                >
                  {fmt(maeglerEkvivalent)} kr
                </div>
              </div>
              <p className="text-[12px] pt-1 text-[#5A6166]">
                Vi betaler kontant. Ingen ventetid, mæglersalær eller bank-forbehold.
              </p>
            </div>

            {/* Næste skridt */}
            <div className="rounded-2xl p-7 text-center space-y-4 text-white bg-[#0F1A1A]">
              <div className="text-[18px] font-semibold">Næste skridt</div>
              <p className="text-[14px] max-w-md mx-auto leading-relaxed text-white/70">
                Vi ringer dig op indenfor 24 timer for at aftale en gratis, uforpligtende besigtigelse. Efter besigtigelsen giver vi et endeligt bindende tilbud.
              </p>
              {(submit.status === 'sent' || submit.status === 'already') && state.email && (
                <p className="text-[13px] flex items-center justify-center gap-1.5" style={{ color: '#8FD4C1' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Tilbud sendt på {state.email}
                </p>
              )}
              {submit.status === 'sending' && (
                <p className="text-[13px] text-white/55">Sender bekræftelse til {state.email}…</p>
              )}
              {submit.status === 'error' && (
                <p className="text-[13px] text-white/70">
                  Kunne ikke sende mail-bekræftelse — vi har stadig dine oplysninger og ringer alligevel.
                </p>
              )}
              <div className="pt-2">
                <a
                  href="tel:+4589876634"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[14px] font-medium text-[#0F1A1A] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-white"
                  style={{ transition: `transform 150ms ${EASE_OUT}` }}
                >
                  <PhoneIcon className="w-4 h-4" stroke="currentColor" />
                  Ring direkte til os
                </a>
              </div>
              <p className="text-[12px] text-white/55">
                Eller email:{' '}
                <a href="mailto:administration@365ejendom.dk" className="underline hover:no-underline">
                  administration@365ejendom.dk
                </a>
              </p>
            </div>

            {/* Virtuelt møde */}
            <div className="rounded-2xl border p-6 flex items-start gap-4 border-[#E5E2DA]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F5EFE6]">
                <VideoIcon className="w-5 h-5" stroke={ACCENT} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-[15px] font-semibold text-[#14181A]">Vil du møde os virtuelt først?</div>
                <p className="text-[13px] leading-relaxed text-[#5A6166]">
                  Book et 20-minutters Google Meet hvor vi gennemgår dit estimat sammen og svarer på dine spørgsmål. Du behøver ikke installere noget — du klikker bare på linket vi sender på email. Vi kommer derefter forbi til den fysiske besigtigelse.
                </p>
                <a
                  href={`mailto:administration@365ejendom.dk?subject=${encodeURIComponent('Book virtuelt møde — ' + (state.fullAddress || ''))}&body=${encodeURIComponent('Hej,\n\nJeg vil gerne booke et virtuelt møde om mit estimat.\n\nAdresse: ' + (state.fullAddress || '') + '\nTelefon: ' + (state.phone || '') + '\n\nForslag til tidspunkter:\n')}`}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white bg-[#0F1A1A] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                  style={{ transition: `transform 150ms ${EASE_OUT}` }}
                >
                  <VideoIcon className="w-3.5 h-3.5" stroke="currentColor" />
                  Book virtuelt møde
                </a>
              </div>
            </div>

            {/* Comparables — kun når prismotoren fandt relevante handler */}
            {comparables.length > 0 && (
              <div className="rounded-2xl border border-[#E5E2DA]">
                <button
                  type="button"
                  onClick={() => setComparablesOpen(!comparablesOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-2xl"
                  style={{ transition: `transform 150ms ${EASE_OUT}` }}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[15px] font-medium text-[#14181A] text-left">
                      Bygger på {comparables.length} tinglyste handler
                    </span>
                    {sameEfCount > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-[#F5EFE6]"
                        style={{ color: ACCENT }}
                      >
                        {sameEfCount} i samme ejerforening
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#5A6166] shrink-0">
                    {comparablesOpen ? 'Skjul' : 'Se'}
                  </span>
                </button>
                <div
                  className="grid"
                  style={{
                    gridTemplateRows: comparablesOpen ? '1fr' : '0fr',
                    transition: `grid-template-rows 250ms ${EASE_OUT}`,
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 space-y-3 border-t border-[#E5E2DA] pt-4">
                      {comparables.slice(0, 8).map((c) => (
                        <div key={c.address} className="flex items-baseline justify-between gap-4 py-2 border-b last:border-0 border-[#F2F0EB]">
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium truncate text-[#14181A]">
                              {c.address}{' '}
                              {c.kvm ? (
                                <span className="text-[11px] font-normal ml-1 text-[#9C988C]">{c.kvm}m²</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[14px] font-semibold tabular-nums text-[#14181A]">
                              {fmt(c.price)} kr
                            </div>
                            <div className="text-[11px] text-[#9C988C]">
                              {c.pricePerSqm ? `${fmt(c.pricePerSqm)}/m²` : ''}
                              {c.date ? ` · ${c.date.slice(0, 7)}` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl px-5 py-4 text-center text-[13px] leading-relaxed bg-[#F5EFE6] text-[#14181A]">
              Tilbuddet er foreløbigt og bygger på offentlig data + dine oplysninger. Bindende tilbud gives efter gratis besigtigelse.
              {state.email && (
                <> Du modtager en bekræftelse på email på <strong>{state.email}</strong>.</>
              )}
            </div>

            {/* Reset */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => reset()}
                className="text-[13px] underline hover:no-underline text-[#5A6166] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md px-1"
              >
                Beregn et nyt estimat
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PhoneIcon({ className, stroke }: { className?: string; stroke: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function VideoIcon({ className, stroke }: { className?: string; stroke: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m22 8-6 4 6 4z" />
    </svg>
  );
}
