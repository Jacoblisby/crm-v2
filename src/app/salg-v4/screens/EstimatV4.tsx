'use client';

/**
 * EstimatV4 — sidste skærm i sælger-flowet (Figma: 04_Estimat + expanded).
 *
 * Layoutet er designerens, men INDHOLDET af prisboksen er skiftet: sælgeren
 * får ikke længere et auto-beregnet tilbud at se. I stedet står der, at vi
 * ikke kunne beregne et tilbud automatisk, og at en mægler vender tilbage
 * inden for 24 timer. Sammenligningen ("Vores pris vs. ejendomsmægler")
 * bliver derfor et regneeksempel på en bolig til 1.000.000 kr, så
 * konceptet stadig kan forstås — tallene bor i
 * lib/services/offer-example.ts, fordi mailen bruger de samme.
 *
 * Estimatet beregnes STADIG server-side og følger med i admin-mailen og på
 * leadet; det er kun den kundevendte visning, der er fjernet.
 *
 * Ét stort hvidt card på beige:
 *   mint boks (hus-ikon, adresse, besked om manuel vurdering) →
 *   REGNEEKSEMPEL (divider-liste m. minus-fortegn, Tilbage til dig) →
 *   mint "forsvinder undervejs" → mint "Kontanttilbud i eksemplet" → bemærk.
 * Separat card: "Se lokale handler i dit område" (expandable tabel).
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
import {
  OFFER_EXAMPLE,
  OFFER_EXAMPLE_NET,
  OFFER_EXAMPLE_GAIN,
  NO_AUTO_OFFER,
  fmtKr,
} from '@/lib/services/offer-example';

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

  // Sælgeren får IKKE længere et auto-beregnet tal. Estimatet regnes stadig
  // server-side og følger med i admin-mailen og på leadet, så mægleren har
  // modellens bud i hånden — det er kun den kundevendte visning, der er væk.
  const ex = OFFER_EXAMPLE;
  const listepris = ex.listPrice;
  const maeglerSalaer = ex.brokerFee;
  const markedAfslag = ex.marketDiscount;
  const driftSalg = ex.ownershipCosts;

  // Uden et tilbud at spejle i giver det ikke mening at filtrere handlerne
  // omkring en pris — vi viser dem, motoren fandt i området.
  const comparables = (estimate?.comparables ?? []).filter((c) => !c.isCurrentListing);

  const fmt = fmtKr;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: V4.beige }}>
      <V4Header stage="estimat" />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-[720px] mx-auto px-4 sm:px-8 space-y-6">
          {/* Hoved-card */}
          <Card className="p-6 sm:p-10 space-y-7">
            <div className="text-center space-y-2">
              <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
                Din vurdering
              </div>
              <h1 className="text-[24px] sm:text-[30px] leading-tight" style={{ color: V4.ink, fontWeight: 500 }}>
                Vi er i gang med din bolig
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
              <div className="text-[21px] sm:text-[25px] leading-snug text-balance" style={{ color: V4.ink, fontWeight: 500 }}>
                {NO_AUTO_OFFER.heading}
              </div>
              <div className="text-[13.5px] leading-[1.6] max-w-sm mx-auto" style={{ color: V4.muted }}>
                {NO_AUTO_OFFER.body}
              </div>
              <div className="border-t" style={{ borderColor: 'rgba(28,43,43,0.15)' }} />
              <div className="space-y-0.5">
                <div className="text-[13px]" style={{ color: V4.ink, fontWeight: 600 }}>Du hører fra os inden for 24 timer</div>
                <div className="text-[12.5px]" style={{ color: V4.muted }}>
                  Vi har dine oplysninger — du behøver ikke gøre mere.
                </div>
              </div>
            </div>

            {/* Sammenligning */}
            <div className="text-center space-y-2 pt-2">
              <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
                Regneeksempel
              </div>
              <h2 className="text-[20px] sm:text-[23px]" style={{ color: V4.ink, fontWeight: 500 }}>
                Vores pris vs. ejendomsmægler
              </h2>
              <p className="text-[13px]" style={{ color: V4.muted }}>
                Sådan ser forskellen ud på en bolig til {fmt(OFFER_EXAMPLE.listPrice)} kr. Tallene er
                et eksempel og altså ikke et tilbud på din bolig.
              </p>
            </div>

            {/* Side om side. En rigtig <table>, fordi det ER tabeldata — så
                holder kolonnerne linje af sig selv, og skærmlæsere kobler
                tal til den rigtige overskrift.

                Vores kolonne er bevidst det eneste farvede — og den er ROSE,
                ikke mint: skærmen har allerede en mint boks ovenfor, og tre
                grønne flader i træk gør siden ensfarvet. Rose er designerens
                egen sektionsfarve fra forsiden, så den er lige så meget brand.

                Stregerne løber gennem ALLE tre kolonner. De er gennemsigtig
                blæk frem for en fast grå, så den samme streg læses ens på
                hvid og på rose og altså virkelig ser gennemgående ud. */}
            <div>
              <table className="w-full border-collapse">
                <caption className="sr-only">
                  Sammenligning af salg via ejendomsmægler og kontantsalg til 365 Ejendomme
                </caption>
                <thead>
                  <tr>
                    <th className="text-left align-bottom pb-3" />
                    <th className="text-right align-bottom pb-3 px-1.5 sm:px-4">
                      <span
                        className="text-[10px] sm:text-[11px] block leading-tight uppercase"
                        style={{ color: V4.soft, fontWeight: 600, letterSpacing: '0.1em' }}
                      >
                        <span className="sm:hidden">Mægler</span>
                        <span className="hidden sm:inline">Ejendomsmægler</span>
                      </span>
                    </th>
                    {/* Ekstra luft foroven, så mint-panelet begynder over
                        første talrække og virker som en flade, ikke en celle */}
                    <th
                      className="text-right align-bottom pt-4 pb-3 px-2 sm:px-5 rounded-t-[14px]"
                      style={{ background: V4.rose }}
                    >
                      <span
                        className="text-[10px] sm:text-[11px] block leading-tight uppercase"
                        style={{ color: V4.greenDeep, fontWeight: 700, letterSpacing: '0.1em' }}
                      >
                        365 Ejendomme
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Pris på boligen', 'Det beløb, boligen sættes til salg for.', fmt(listepris), fmt(OFFER_EXAMPLE.ourOffer), false],
                    ['Mæglersalær', 'Typisk 5–7 % af salgsprisen.', `− ${fmt(maeglerSalaer)}`, 'Ingen', true],
                    ['Markedsafslag', 'Slutprisen ligger ofte 6–8 % under listeprisen.', `− ${fmt(markedAfslag)}`, 'Ingen', true],
                    ['Drift i salgsperioden', 'Ca. 3 måneders ejerudgifter imens.', `− ${fmt(driftSalg)}`, 'Ingen', true],
                  ].map(([label, sub, maegler, os, erIngen]) => (
                    <tr key={label as string}>
                      <td className="py-4 pr-3 sm:pr-5 border-t align-top" style={{ borderColor: V4.rule }}>
                        <span className="text-[13px] sm:text-[15px] block leading-tight" style={{ color: V4.ink, fontWeight: 600 }}>
                          {label}
                        </span>
                        <span className="hidden sm:block text-[12.5px] mt-1 leading-snug" style={{ color: V4.muted }}>
                          {sub}
                        </span>
                      </td>
                      <td
                        className="py-4 px-1.5 sm:px-4 border-t text-right align-top text-[13px] sm:text-[15.5px] tabular-nums whitespace-nowrap"
                        style={{ borderColor: V4.rule, color: V4.soft, fontWeight: 500 }}
                      >
                        {maegler}<span className="hidden sm:inline"> kr.</span>
                      </td>
                      <td
                        className="py-4 px-2 sm:px-5 border-t text-right align-top text-[13px] sm:text-[15.5px] tabular-nums whitespace-nowrap"
                        style={{
                          background: V4.rose,
                          borderColor: V4.rule,
                          color: erIngen ? V4.greenDeep : V4.ink,
                          fontWeight: erIngen ? 600 : 500,
                        }}
                      >
                        {os}
                        {!erIngen && <span className="hidden sm:inline"> kr.</span>}
                      </td>
                    </tr>
                  ))}
                  {/* Bundlinjen — dét hele handler om */}
                  <tr>
                    <td className="pt-5 pb-6 pr-3 sm:pr-5 border-t-2 align-top" style={{ borderColor: V4.ruleStrong }}>
                      <span className="text-[14px] sm:text-[16px] block leading-tight" style={{ color: V4.ink, fontWeight: 700 }}>
                        Tilbage til dig
                      </span>
                      <span className="hidden sm:block text-[12.5px] mt-1 leading-snug" style={{ color: V4.muted }}>
                        Det du reelt står med bagefter.
                      </span>
                    </td>
                    <td
                      className="pt-5 pb-6 px-1.5 sm:px-4 border-t-2 text-right align-top text-[14px] sm:text-[17px] tabular-nums whitespace-nowrap"
                      style={{ borderColor: V4.ruleStrong, color: V4.soft, fontWeight: 600 }}
                    >
                      {fmt(OFFER_EXAMPLE_NET)}<span className="hidden sm:inline"> kr.</span>
                    </td>
                    <td
                      className="pt-5 pb-6 px-2 sm:px-5 border-t-2 text-right align-top rounded-b-[14px]"
                      style={{ background: V4.rose, borderColor: V4.ruleStrong }}
                    >
                      <span
                        className="block text-[17px] sm:text-[26px] leading-none tabular-nums whitespace-nowrap"
                        style={{ color: V4.greenDeep, fontWeight: 700 }}
                      >
                        {fmt(OFFER_EXAMPLE.ourOffer)}<span className="hidden sm:inline"> kr.</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="sm:hidden text-[11px] pt-2.5 text-right" style={{ color: V4.soft }}>
                Alle beløb i kr.
              </p>
            </div>

            {/* Gevinsten — pointen, som sin egen sætning.
                Grøn, ikke rose: rose er sammenligningens farve (vores kolonne
                i tabellen), mens konklusionen skal stå i brand-grøn. De to
                farver skiftevis giver også skærmen rytme. */}
            <div className="rounded-[14px] px-5 py-6 text-center" style={{ background: V4.mint }}>
              <span className="inline-flex w-9 h-9 rounded-full items-center justify-center mb-3" style={{ background: V4.green }}>
                <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <div className="text-[24px] sm:text-[30px] leading-none tabular-nums" style={{ color: V4.greenDeep, fontWeight: 700 }}>
                + {fmt(OFFER_EXAMPLE_GAIN)} kr.
              </div>
              <div className="text-[14px] sm:text-[15px] mt-2" style={{ color: V4.ink, fontWeight: 600 }}>
                mere til dig i eksemplet
              </div>
              <div className="text-[12.5px] mt-3 leading-relaxed max-w-sm mx-auto text-balance" style={{ color: '#41625f' }}>
                Mæglerens pris er højere på papiret — men efter salær, markedsafslag og
                ventetid står du med mindre. Oveni slipper du for fremvisninger,
                bankforbehold og cirka tre måneders salgsperiode.
              </div>
            </div>

            {/* Submit-status + disclaimer */}
            {(submit.status === 'sent' || submit.status === 'already') && state.email && (
              <p className="text-[13px] text-center flex items-center justify-center gap-1.5" style={{ color: V4.green }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Bekræftelse sendt på {state.email}
              </p>
            )}
            {submit.status === 'error' && (
              <p className="text-[13px] text-center" style={{ color: V4.muted }}>
                Kunne ikke sende mail-bekræftelse — vi har stadig dine oplysninger og ringer alligevel.
              </p>
            )}
            <p className="text-[12.5px]" style={{ color: V4.muted }}>
              <strong style={{ color: V4.ink }}>Bemærk:</strong> Regneeksemplet ovenfor er en illustration af,
              hvordan vi regner — ikke et tilbud på din bolig. Dit estimat kommer fra en mægler inden for 24 timer.
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
                Se lokale handler i dit område
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
              Mægleren tager udgangspunkt i offentlige boligdata og tinglyste handler som disse.
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
              En mægler vender tilbage med et estimat inden for 24 timer. Vil du hellere tale med os med det samme, er du velkommen til at ringe.
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
