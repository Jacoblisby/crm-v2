'use client';

/**
 * EstimatV4 — "Dit foreløbige kontanttilbud" (04_Estimat).
 *
 * Designer-struktur:
 *   pris-card (grøn) → "Baseret på lokale handler" + "Se handlerne bag
 *   vurderingen" (expandable) → "Sammenlignet med et klassisk salg" (salær,
 *   markedsafslag, drift, listepris-ved-mægler, estimeret forskel) →
 *   Næste skridt (Ring / Book et virtuelt møde) → disclaimer → reset.
 *
 * SUBMIT ved mount: opretter lead + sender emails via submitFunnelAction, som
 * også returnerer det rigtige estimat fra prismotoren (comparables + ROE).
 * Idempotent via localStorage; estimatet caches til reload.
 */
import { useEffect, useRef, useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { submitFunnelAction } from '../../salg/submit-action';
import type { computeEstimate } from '@/lib/services/price-engine';
import { V4, EASE, SectionKicker } from '../primitives';
import { V4Header } from '../Funnel';

const SUBMIT_KEY = 'salg.v4.submitted';
const ESTIMATE_CACHE_KEY = 'salg.v4.estimate';

type Estimate = Awaited<ReturnType<typeof computeEstimate>>;

type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'error'; error: string }
  | { status: 'already' };

export function EstimatV4() {
  const { state, reset, prevScreen } = useFunnelV2();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });
  const [handlerOpen, setHandlerOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    if (!state.fullName || !state.email || !state.phone) return;
    if (!state.postalCode || !state.kvm) return;

    const idemKey = `${state.fullAddress || state.postalCode}|${state.email}`;
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
              localStorage.setItem(ESTIMATE_CACHE_KEY, JSON.stringify({ key: idemKey, estimate: r.estimate }));
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

  // Rigtigt bud fra prismotoren; kvm-fallback hvis estimatet mangler
  const bud = estimate
    ? estimate.netForkortet.finalOffer
    : state.kvm
      ? Math.round(state.kvm * 14000 * 0.85)
      : 945000;

  const maeglerSalaer = 70000;
  const markedAfslag = estimate ? estimate.netForkortet.minusMarketDiscount : Math.round(bud * 0.07);
  const driftSalg = estimate
    ? estimate.netForkortet.minusOwnershipCosts
    : Math.max(1, Math.round(((state.costFaellesudgifter || 24000) / 12) * 3));
  const listeprisVedMaegler = bud + maeglerSalaer + markedAfslag + driftSalg;
  const forskel = listeprisVedMaegler - bud;

  const comparables = (estimate?.comparables ?? []).filter((c) => {
    const ratio = c.price / listeprisVedMaegler;
    return ratio >= 0.9 && ratio <= 1.1;
  });

  const fmt = (n: number) => n.toLocaleString('da-DK');
  const isCalculating = submit.status === 'sending' && !estimate;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: V4.cream }}>
      <V4Header stage="estimat" />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-8 space-y-6">
          {/* Titel */}
          <div className="text-center space-y-2 pt-4">
            <SectionKicker>Dit foreløbige tilbud</SectionKicker>
            <h1 className="text-[26px] sm:text-[34px] leading-tight" style={{ color: V4.ink }}>
              {state.fullAddress || '—'}
            </h1>
          </div>

          {/* Pris-card */}
          <div className="rounded-2xl py-10 px-6 text-center text-white" style={{ background: V4.green }}>
            <div className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Vores kontanttilbud
            </div>
            <div
              className="text-[48px] sm:text-[72px] leading-none tabular-nums"
              style={{
                fontWeight: 300,
                letterSpacing: '-0.02em',
                filter: isCalculating ? 'blur(8px)' : 'none',
                opacity: isCalculating ? 0.6 : 1,
                transition: `filter 200ms ${EASE}, opacity 200ms ${EASE}`,
              }}
            >
              {fmt(bud)}{' '}
              <span className="text-[22px] sm:text-[30px] align-baseline" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 300 }}>kr</span>
            </div>
            <div className="text-[13px] mt-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {isCalculating
                ? 'Beregner ud fra tinglyste handler i dit område…'
                : 'Bindende tilbud gives efter besigtigelse.'}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Uden mægler, fremvisninger og ventetid.
            </div>
          </div>

          {/* Baseret på lokale handler */}
          <div className="bg-white rounded-2xl border" style={{ borderColor: V4.border }}>
            <div className="px-6 pt-5 pb-1">
              <div className="text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>Baseret på lokale handler</div>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: V4.muted }}>
                Dit foreløbige tilbud er baseret på offentlige boligdata og lokale
                tinglyste handler.
              </p>
            </div>
            {comparables.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setHandlerOpen(!handlerOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-[13.5px] underline hover:no-underline" style={{ color: V4.green, fontWeight: 500 }}>
                    Se handlerne bag vurderingen
                  </span>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={V4.green}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: handlerOpen ? 'rotate(180deg)' : 'none', transition: `transform 220ms ${EASE}` }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div
                  className="grid"
                  style={{ gridTemplateRows: handlerOpen ? '1fr' : '0fr', transition: `grid-template-rows 260ms ${EASE}` }}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 space-y-2 border-t pt-4" style={{ borderColor: V4.border }}>
                      {comparables.slice(0, 6).map((c) => (
                        <div key={c.address} className="flex items-baseline justify-between gap-4 py-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] truncate" style={{ color: V4.ink, fontWeight: 500 }}>
                              {c.address}
                              {c.kvm ? <span className="text-[11px] ml-1.5" style={{ color: V4.soft, fontWeight: 400 }}>{c.kvm}m²</span> : null}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[13.5px] tabular-nums" style={{ color: V4.ink, fontWeight: 600 }}>{fmt(c.price)} kr</div>
                            {c.date && <div className="text-[11px]" style={{ color: V4.soft }}>{c.date.slice(0, 7)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-6 pb-5 text-[12.5px]" style={{ color: V4.soft }}>
                Vi har sammenlignet med tinglyste salg i området.
              </div>
            )}
          </div>

          {/* Sammenlignet med et klassisk salg */}
          <div className="bg-white rounded-2xl border p-6 space-y-4" style={{ borderColor: V4.border }}>
            <div>
              <div className="text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>Sammenlignet med et klassisk salg</div>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: V4.muted }}>
                Her viser vi forskellen på kontant salg til os og et typisk salg via mægler.
              </p>
            </div>

            <div className="text-[11px] tracking-[0.15em] uppercase pt-1" style={{ color: V4.soft, fontWeight: 500 }}>
              Typiske udgifter ved mæglersalg
            </div>
            {[
              ['Mæglersalær', maeglerSalaer, 'Typisk 5–7% af salgsprisen. Det betaler du ikke til 365 Ejendomme.'],
              ['Markedsafslag', markedAfslag, 'Den endelige salgspris ligger ofte 6-8% under listeprisen. Her regner vi med et typisk markedsafslag.'],
              ['Drift i salgsperioden', driftSalg, 'Ca. 3 måneders ejerudgifter, mens boligen står til salg.'],
            ].map(([t, n, sub]) => (
              <div key={t as string} className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0" style={{ borderColor: '#eef2f0' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px]" style={{ color: V4.ink, fontWeight: 500 }}>{t}</div>
                  <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: V4.muted }}>{sub}</div>
                </div>
                <span className="text-[14px] tabular-nums shrink-0" style={{ color: V4.ink, fontWeight: 600 }}>
                  {fmt(n as number)} kr
                </span>
              </div>
            ))}

            <div className="rounded-xl px-5 py-4 space-y-1" style={{ background: V4.cream }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px]" style={{ color: V4.ink, fontWeight: 500 }}>Listepris ved mægler</span>
                <span className="text-[17px] tabular-nums" style={{ color: V4.ink, fontWeight: 600 }}>{fmt(listeprisVedMaegler)} kr</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: V4.muted }}>
                For at ende med samme beløb i hånden, skal listeprisen være cirka dette niveau.
              </p>
            </div>

            <div className="rounded-xl px-5 py-4 text-center" style={{ background: V4.mintSoft }}>
              <div className="text-[16px]" style={{ color: V4.greenDeep, fontWeight: 600 }}>
                {fmt(forskel)} kr. i estimeret forskel
              </div>
              <div className="text-[12px] mt-1" style={{ color: V4.muted }}>
                Uden mæglersalær, lang salgsperiode eller bankforbehold.
              </div>
            </div>
          </div>

          {/* Næste skridt */}
          <div className="rounded-2xl p-7 text-center space-y-4 text-white" style={{ background: V4.greenDeep }}>
            <div className="text-[17px]" style={{ fontWeight: 500 }}>Næste skridt</div>
            <p className="text-[13.5px] max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Vi kan gennemgå tilbuddet og aftale en gratis besigtigelse, hvis du ønsker
              at gå videre. Efter en gratis besigtigelse kan vi give et endeligt tilbud.
            </p>
            {(submit.status === 'sent' || submit.status === 'already') && state.email && (
              <p className="text-[13px] flex items-center justify-center gap-1.5" style={{ color: V4.cta }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Tilbud sendt på {state.email}
              </p>
            )}
            {submit.status === 'sending' && (
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Sender bekræftelse til {state.email}…
              </p>
            )}
            {submit.status === 'error' && (
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Kunne ikke sende mail-bekræftelse — vi har stadig dine oplysninger og ringer alligevel.
              </p>
            )}
            <div className="pt-1 flex flex-wrap gap-3 justify-center">
              <a
                href="tel:+4589876634"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] active:scale-[0.97] transition-transform"
                style={{ background: V4.cta, color: V4.greenDeep, fontWeight: 500 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                </svg>
                Ring +45 89 87 66 34
              </a>
              <a
                href={`mailto:administration@365ejendom.dk?subject=${encodeURIComponent('Book et virtuelt møde — ' + (state.fullAddress || ''))}&body=${encodeURIComponent('Hej,\n\nJeg vil gerne booke et virtuelt møde om mit estimat.\n\nAdresse: ' + (state.fullAddress || '') + '\nTelefon: ' + (state.phone || '') + '\n\nForslag til tidspunkter:\n')}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] border active:scale-[0.97] transition-transform"
                style={{ borderColor: 'rgba(255,255,255,0.35)', color: '#fff', fontWeight: 500 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="m22 8-6 4 6 4z" />
                </svg>
                Book et virtuelt møde
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl px-5 py-4 text-center text-[12.5px] leading-relaxed bg-white border" style={{ borderColor: V4.border, color: V4.muted }}>
            Tilbuddet er foreløbigt.
            {state.email && (
              <> Email-bekræftelse sendes til <strong style={{ color: V4.ink }}>{state.email}</strong>.</>
            )}
          </div>

          {/* Reset / tilbage */}
          <div className="text-center pt-1 pb-8 space-x-6">
            <button
              type="button"
              onClick={() => prevScreen()}
              className="text-[13px] underline hover:no-underline"
              style={{ color: V4.muted }}
            >
              Tilbage
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="text-[13px] underline hover:no-underline"
              style={{ color: V4.muted }}
            >
              Beregn et nyt estimat
            </button>
            <a href="/frontpage" className="text-[13px] underline hover:no-underline" style={{ color: V4.muted }}>
              Tilbage til forside
            </a>
          </div>
        </div>
      </main>

      <footer className="px-6 py-5" style={{ background: '#365a5c' }}>
        <div className="max-w-2xl mx-auto text-center text-[12px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
          © 365ejendom · Boligselskabet Sommerhave ApS · Naestved · CVR 41763736
        </div>
      </footer>
    </div>
  );
}
