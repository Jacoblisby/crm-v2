'use client';

/**
 * EstimatV4 — "Dit foreløbige kontanttilbud" (Figma: 04_Estimat + expanded).
 *
 * Ét stort hvidt card på beige:
 *   mint prisboks (hus-ikon, adresse, STORT mørkt tal, "Efter en gratis
 *   besigtigelse…", "Baseret på lokale handler") → SAMMENLIGNING (divider-
 *   liste m. minus-fortegn, Listepris ved mægler) → mint "estimeret forskel"
 *   → mint "Vores kontanttilbud" → disclaimer.
 * Separat card: "Se handlerne bag vurderingen" (expandable tabel).
 * Mørkt card: "Næste skridt" m. turkis Ring-knap + Send e-mail / Book møde.
 *
 * SUBMIT ved mount: submitFunnelAction opretter lead + sender emails og
 * returnerer det rigtige estimat fra prismotoren. Idempotent + cached.
 */
import { useEffect, useRef, useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { submitFunnelAction } from '../../salg/submit-action';
import type { computeEstimate } from '@/lib/services/price-engine';
import { V4, EASE, Card } from '../primitives';
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
  const listepris = bud + maeglerSalaer + markedAfslag + driftSalg;
  const forskel = listepris - bud;

  const comparables = (estimate?.comparables ?? []).filter((c) => {
    const ratio = c.price / listepris;
    return ratio >= 0.9 && ratio <= 1.1;
  });

  const fmt = (n: number) => n.toLocaleString('da-DK');
  const isCalculating = submit.status === 'sending' && !estimate;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: V4.beige }}>
      <V4Header stage="estimat" />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 space-y-6">
          {/* Hoved-card */}
          <Card className="p-6 sm:p-10 space-y-7">
            <div className="text-center space-y-2">
              <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
                Dit foreløbige tilbud
              </div>
              <h1 className="text-[24px] sm:text-[30px] leading-tight" style={{ color: V4.ink, fontWeight: 500 }}>
                Dit foreløbige kontanttilbud
              </h1>
            </div>

            {/* Mint prisboks */}
            <div className="rounded-[10px] px-6 py-7 text-center space-y-4" style={{ background: V4.mint }}>
              <div className="space-y-2.5">
                <span className="inline-flex w-10 h-10 rounded-full items-center justify-center" style={{ background: V4.green }}>
                  <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
                  </svg>
                </span>
                <div className="text-[13.5px]" style={{ color: V4.ink }}>{state.fullAddress || '—'}</div>
              </div>
              <div className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }} />
              <div
                className="text-[42px] sm:text-[56px] leading-none tabular-nums"
                style={{
                  color: V4.ink,
                  fontWeight: 400,
                  filter: isCalculating ? 'blur(8px)' : 'none',
                  opacity: isCalculating ? 0.6 : 1,
                  transition: `filter 200ms ${EASE}, opacity 200ms ${EASE}`,
                }}
              >
                {fmt(bud)} kr.
              </div>
              <div className="text-[13px]" style={{ color: V4.muted }}>
                {isCalculating
                  ? 'Beregner ud fra tinglyste handler i dit område…'
                  : 'Efter en gratis besigtigelse kan vi give et endeligt tilbud.'}
              </div>
              <div className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }} />
              <div className="space-y-0.5">
                <div className="text-[13px]" style={{ color: V4.ink, fontWeight: 600 }}>Baseret på lokale handler</div>
                <div className="text-[12.5px]" style={{ color: V4.muted }}>
                  Vi har sammenlignet med tinglyste salg i området.
                </div>
              </div>
            </div>

            {/* Sammenligning */}
            <div className="text-center space-y-2 pt-2">
              <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
                Sammenligning
              </div>
              <h2 className="text-[20px] sm:text-[23px]" style={{ color: V4.ink, fontWeight: 500 }}>
                Sammenlignet med et klassisk salg
              </h2>
              <p className="text-[13px]" style={{ color: V4.muted }}>
                Her viser vi forskellen på kontant salg til os og et typisk salg via mægler.
              </p>
            </div>

            <div>
              <div className="text-[11px] tracking-[0.14em] uppercase pb-3" style={{ color: V4.soft, fontWeight: 500 }}>
                Typiske udgifter ved mæglersalg
              </div>
              {[
                ['Mæglersalær', `-${fmt(maeglerSalaer)} kr.`, 'Typisk 5–7% af salgsprisen. Det betaler du ikke til 365 Ejendomme.'],
                ['Markedsafslag', `− ${fmt(markedAfslag)} kr.`, 'Den endelige salgspris ligger ofte 6-8% under listeprisen. Her regner vi med et typisk markedsafslag.'],
                ['Drift i salgsperioden', `− ${fmt(driftSalg)} kr.`, 'Ca. 3 måneders ejerudgifter, mens boligen står til salg.'],
              ].map(([t, n, sub]) => (
                <div key={t} className="py-3.5 border-t" style={{ borderColor: V4.border }}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[14.5px]" style={{ color: V4.ink, fontWeight: 600 }}>{t}</span>
                    <span className="text-[14.5px] tabular-nums shrink-0" style={{ color: V4.ink, fontWeight: 500 }}>{n}</span>
                  </div>
                  <div className="text-[12.5px] mt-1 leading-relaxed pr-16" style={{ color: V4.muted }}>{sub}</div>
                </div>
              ))}
              <div className="py-4 border-t-2" style={{ borderColor: '#c9cfcc' }}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px]" style={{ color: V4.ink, fontWeight: 600 }}>Listepris ved mægler</span>
                  <span className="text-[15px] tabular-nums shrink-0" style={{ color: V4.ink, fontWeight: 600 }}>{fmt(listepris)} kr.</span>
                </div>
                <div className="text-[12.5px] mt-1" style={{ color: V4.muted }}>
                  For at ende med samme beløb i hånden, skal listeprisen være cirka dette niveau.
                </div>
              </div>
            </div>

            {/* Forskel */}
            <div className="rounded-[10px] px-5 py-4" style={{ background: V4.mint }}>
              <div className="text-[14px]" style={{ color: V4.ink, fontWeight: 600 }}>
                {fmt(forskel)} kr. i estimeret forskel
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: V4.muted }}>
                Uden mæglersalær, lang salgsperiode eller bankforbehold.
              </div>
            </div>

            {/* Vores kontanttilbud */}
            <div className="rounded-[10px] px-5 py-4 flex items-center justify-between gap-4" style={{ background: V4.mint }}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: V4.green }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-[14px]" style={{ color: V4.ink, fontWeight: 600 }}>Vores kontanttilbud</div>
                  <div className="text-[12.5px]" style={{ color: V4.muted }}>Uden mægler, fremvisninger og ventetid.</div>
                </div>
              </div>
              <div className="text-[20px] sm:text-[24px] tabular-nums shrink-0" style={{ color: V4.ink, fontWeight: 500 }}>
                {fmt(bud)} kr.
              </div>
            </div>

            {/* Submit-status + disclaimer */}
            {(submit.status === 'sent' || submit.status === 'already') && state.email && (
              <p className="text-[13px] text-center flex items-center justify-center gap-1.5" style={{ color: V4.green }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Tilbud sendt på {state.email}
              </p>
            )}
            {submit.status === 'error' && (
              <p className="text-[13px] text-center" style={{ color: V4.muted }}>
                Kunne ikke sende mail-bekræftelse — vi har stadig dine oplysninger og ringer alligevel.
              </p>
            )}
            <p className="text-[12.5px]" style={{ color: V4.muted }}>
              <strong style={{ color: V4.ink }}>Disclaimer:</strong> Tilbuddet er foreløbigt. Email-bekræftelse sendes.
            </p>
          </Card>

          {/* Se handlerne bag vurderingen */}
          <Card className="px-6 py-5">
            <button
              type="button"
              onClick={() => setHandlerOpen(!handlerOpen)}
              className="w-full flex items-center gap-2 text-left"
              disabled={comparables.length === 0}
            >
              <span className="text-[14.5px]" style={{ color: comparables.length ? V4.greenDeep : V4.soft, fontWeight: 600 }}>
                Se handlerne bag vurderingen
              </span>
              {comparables.length > 0 && (
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={V4.greenDeep}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: handlerOpen ? 'rotate(180deg)' : 'none', transition: `transform 220ms ${EASE}` }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </button>
            <p className="text-[13px] mt-1.5" style={{ color: V4.muted }}>
              Dit foreløbige tilbud er baseret på offentlige boligdata og lokale tinglyste handler.
            </p>
            <div
              className="grid"
              style={{ gridTemplateRows: handlerOpen ? '1fr' : '0fr', transition: `grid-template-rows 260ms ${EASE}` }}
            >
              <div className="overflow-hidden">
                <div className="pt-4 mt-3 border-t" style={{ borderColor: V4.border }}>
                  {comparables.slice(0, 6).map((c) => (
                    <div key={c.address} className="flex items-baseline justify-between gap-4 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] truncate" style={{ color: V4.ink, fontWeight: 500 }}>
                          {c.address}
                          {c.kvm ? <span className="text-[11px] ml-1.5" style={{ color: V4.soft, fontWeight: 400 }}>{c.kvm} m²</span> : null}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[13.5px] tabular-nums" style={{ color: V4.ink, fontWeight: 600 }}>{fmt(c.price)} kr.</span>
                        {c.date && <span className="text-[11px] ml-2" style={{ color: V4.soft }}>{c.date.slice(0, 7)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Næste skridt */}
          <div className="rounded-[10px] px-6 sm:px-10 py-8 text-center space-y-4" style={{ background: '#2d5f60' }}>
            <div className="text-[19px] text-white" style={{ fontWeight: 500 }}>Næste skridt</div>
            <p className="text-[13.5px] max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Vi kan gennemgå tilbuddet og aftale en gratis besigtigelse, hvis du ønsker at gå videre.
            </p>
            <div className="max-w-md mx-auto space-y-2.5 pt-1">
              <a
                href="tel:+4589876634"
                className="flex items-center justify-center gap-2.5 w-full py-3 rounded-md text-[14px] active:scale-[0.99] transition-transform"
                style={{ background: '#b5f0ee', color: V4.greenDeep, fontWeight: 500 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
                </svg>
                Ring +45 89 87 66 34
              </a>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`mailto:administration@365ejendom.dk?subject=${encodeURIComponent('Mit kontanttilbud — ' + (state.fullAddress || ''))}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-md text-[13.5px] border active:scale-[0.99] transition-transform"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', fontWeight: 500 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 5L2 7" />
                  </svg>
                  Send e-mail
                </a>
                <a
                  href={`mailto:administration@365ejendom.dk?subject=${encodeURIComponent('Book et virtuelt møde — ' + (state.fullAddress || ''))}&body=${encodeURIComponent('Hej,\n\nJeg vil gerne booke et virtuelt møde om mit estimat.\n\nAdresse: ' + (state.fullAddress || '') + '\nTelefon: ' + (state.phone || '') + '\n\nForslag til tidspunkter:\n')}`}
                  className="flex items-center justify-center gap-2 py-3 rounded-md text-[13.5px] border active:scale-[0.99] transition-transform"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', fontWeight: 500 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="14" height="12" rx="2" />
                    <path d="m22 8-6 4 6 4z" />
                  </svg>
                  Book et virtuelt møde
                </a>
              </div>
            </div>
          </div>

          {/* Reset / tilbage */}
          <div className="text-center pt-2 pb-10 space-y-2.5">
            <button
              type="button"
              onClick={() => reset()}
              className="block mx-auto text-[14.5px] hover:opacity-70"
              style={{ color: V4.greenDeep, fontWeight: 600 }}
            >
              Beregn et nyt estimat
            </button>
            <div className="space-x-6">
              <button
                type="button"
                onClick={() => prevScreen()}
                className="text-[12.5px] hover:underline"
                style={{ color: V4.muted }}
              >
                Tilbage
              </button>
              <a href="/frontpage" className="text-[12.5px] hover:underline" style={{ color: V4.muted }}>
                Tilbage til forside
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-5" style={{ background: V4.green }}>
        <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[12px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
          <div>© 365ejendom · Boligselskabet Sommerhave ApS · Naestved · CVR 41763736</div>
          <div className="flex gap-8">
            <a href="https://365ejendom.dk/privatlivspolitik" className="hover:text-white transition-colors">Privatliv</a>
            <a href="https://365ejendom.dk" className="hover:text-white transition-colors">365ejendom.dk</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
