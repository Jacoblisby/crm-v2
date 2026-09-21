/**
 * Oversigten for et lead fra boligberegneren.
 *
 * Venstre: det sælger selv svarede, i samme rækkefølge som beregneren
 * spørger (bolig → stand → udgifter → særlige forhold → situation).
 * Højre: hvad registrene siger om samme lejlighed — BBR, Resights og
 * handlerne i foreningen.
 *
 * Øverst står det, der ikke stemmer eller er værd at vide før første opkald:
 * en udlejet lejlighed, en ejer der er et selskab, en seneste handel der var
 * en familieoverdragelse. De ting stod før ingen steder, eller kun hvis man
 * lagde to felter sammen i hovedet.
 */
import Link from 'next/link';
import type { Lead } from '@/lib/types';
import { STAND_LABEL, type BeregnerSvar, type StandNiveau } from '@/lib/beregner';
import type { BbrLejlighed } from '@/lib/bbr-lejlighed';

export interface Marked {
  medianKrPrKvm: number;
  antal: number;
  maaneder: number;
  kvmFra: number;
  kvmTil: number;
}

type Property = {
  bfeNumber: string | null;
  ownerName: string | null;
  grundskyldKr: number | null;
  energyClass: string | null;
} | null;

const kr = (n: number | null | undefined) =>
  n == null ? '—' : `${Math.round(n).toLocaleString('da-DK')} kr.`;
const tal = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('da-DK'));

const STAND_FARVE: Record<StandNiveau, string> = {
  nyrenoveret: 'bg-emerald-100 text-emerald-800',
  god: 'bg-teal-100 text-teal-800',
  middel: 'bg-slate-100 text-slate-700',
  trænger: 'bg-amber-100 text-amber-800',
  slidt: 'bg-rose-100 text-rose-800',
};

function StandChip({ s }: { s: StandNiveau | null }) {
  if (!s) return <span className="text-slate-400">—</span>;
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${STAND_FARVE[s]}`}>{STAND_LABEL[s]}</span>;
}

function Kort({ titel, kilde, children }: { titel: string; kilde?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-lg">
      <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">{titel}</h3>
        {kilde && <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{kilde}</span>}
      </div>
      <div className="px-4 pb-3">{children}</div>
    </section>
  );
}

function Felter({ rows }: { rows: [string, React.ReactNode][] }) {
  const vis = rows.filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== '—');
  if (vis.length === 0) return <p className="text-sm text-slate-400">Ingen oplysninger.</p>;
  return (
    <dl className="divide-y divide-slate-100">
      {vis.map(([k, v]) => (
        <div key={k} className="grid grid-cols-5 gap-3 py-1.5 text-sm">
          <dt className="col-span-2 text-slate-500">{k}</dt>
          <dd className="col-span-3 font-medium text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BeregnerOversigt({
  lead,
  property,
  svar,
  bbr,
  marked,
  foreningId,
}: {
  lead: Lead;
  property: Property;
  svar: BeregnerSvar;
  bbr: BbrLejlighed | null;
  marked: Marked | null;
  foreningId: string | null;
}) {
  // Sælgers tal. Nye leads har dem i øjebliksbilledet; ældre har kun det
  // sælger bekræftede, som står i lead-kolonnerne.
  const saelgerKvm = svar.saelgerKvm ?? lead.kvm;
  const saelgerVaer = svar.saelgerVaerelser ?? (lead.rooms ? Number(lead.rooms) : null);
  const kvm = bbr?.bbr.kvm ?? saelgerKvm;
  const bud = svar.tilbud.bud ?? lead.bidDkk;
  const budPrKvm = bud && kvm ? Math.round(bud / kvm) : null;
  const budMod = budPrKvm && marked ? Math.round((1000 * (budPrKvm - marked.medianKrPrKvm)) / marked.medianKrPrKvm) / 10 : null;

  // ── Værd at vide ─────────────────────────────────────────────────────
  const noter: { tekst: string; alvor: 'advarsel' | 'info' }[] = [];
  if (bbr?.ejer?.type === 'Selskab')
    noter.push({ tekst: `Ejeren er et selskab ifølge Resights. ${lead.fullName ?? 'Indsenderen'} er måske lejer, administrator eller selskabets ejer — afklar før bud.`, alvor: 'advarsel' });
  if (bbr?.bbr.udlejning === 'Udlejet' && !svar.udlejning)
    noter.push({ tekst: 'BBR siger lejligheden er udlejet, men sælger har ikke angivet et lejeforhold.', alvor: 'advarsel' });
  if (svar.udlejning && bbr?.bbr.udlejning === 'Benyttet af ejeren')
    noter.push({ tekst: 'Sælger angiver et lejeforhold, men BBR siger ejeren selv bor der.', alvor: 'advarsel' });
  if (bbr && saelgerKvm && Math.abs(saelgerKvm - bbr.bbr.kvm) >= 2)
    noter.push({ tekst: `Sælger har ${saelgerKvm} kvm, BBR har ${bbr.bbr.kvm} kvm. Buddet er regnet på sælgers tal.`, alvor: 'advarsel' });
  if (bbr?.bbr.vaerelser && saelgerVaer && Math.round(saelgerVaer) !== bbr.bbr.vaerelser)
    noter.push({ tekst: `Sælger har ${saelgerVaer} værelser, BBR har ${bbr.bbr.vaerelser}.`, alvor: 'info' });
  if (bbr?.handel && !bbr.handel.fri)
    noter.push({ tekst: `Seneste handel (${bbr.handel.dato.slice(0, 4)}) var «${bbr.handel.metode}» — prisen er ikke en markedspris.`, alvor: 'info' });
  if (svar.udgifter.senere)
    noter.push({ tekst: 'Sælger har ikke udfyldt udgifterne — buddet er regnet uden drift. Indhent ved besigtigelse.', alvor: 'advarsel' });
  if (svar.saleLeaseback) noter.push({ tekst: 'Vil blive boende som lejer (sale-leaseback).', alvor: 'info' });
  if (bbr?.ejer?.reklamebeskyttet === 'Ja') noter.push({ tekst: 'Ejeren er reklamebeskyttet.', alvor: 'info' });

  const poster = svar.udgifter.poster.filter((p) => p.kr > 0);

  return (
    <div className="space-y-4">
      {/* ── Tilbuddet ─────────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-lg grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Bud</div>
          <div className="text-xl font-semibold tabular-nums text-slate-900 mt-1">{kr(bud)}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {lead.bidStatus ?? 'afgivet'}{budPrKvm ? ` · ${tal(budPrKvm)} kr/kvm` : ''}
          </div>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Markedsestimat</div>
          <div className="text-xl font-semibold tabular-nums text-slate-900 mt-1">{kr(svar.tilbud.markedsestimat ?? lead.valuationDkk)}</div>
          <div className="text-xs text-slate-500 mt-0.5">beregnerens comps</div>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Mod foreningen</div>
          <div className={`text-xl font-semibold tabular-nums mt-1 ${budMod == null ? 'text-slate-400' : budMod < 0 ? 'text-teal-800' : 'text-amber-800'}`}>
            {budMod == null ? '—' : `${budMod > 0 ? '+' : budMod < 0 ? '−' : ''}${Math.abs(budMod).toLocaleString('da-DK')} %`}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {marked
              ? `median ${tal(marked.medianKrPrKvm)} kr/kvm · ${marked.antal} handler à ${marked.kvmFra}–${marked.kvmTil} kvm, ${marked.maaneder} mdr`
              : 'ingen handler i samme størrelse'}
          </div>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Stand · overtagelse</div>
          <div className="mt-1.5"><StandChip s={svar.stand.samlet} /></div>
          <div className="text-xs text-slate-500 mt-1">{svar.tilbud.overtagelse ?? '—'}</div>
        </div>
      </section>

      {/* ── Værd at vide ─────────────────────────────────────────── */}
      {noter.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-amber-900 mb-1.5">Værd at vide før første opkald</h3>
          <ul className="space-y-1">
            {noter.map((n) => (
              <li key={n.tekst} className={`text-sm flex gap-2 ${n.alvor === 'advarsel' ? 'text-amber-900' : 'text-slate-700'}`}>
                <span aria-hidden>{n.alvor === 'advarsel' ? '⚠︎' : '·'}</span>
                <span>{n.tekst}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* ── Venstre: sælgers svar ─────────────────────────────── */}
        <div className="space-y-4">
          <Kort titel="Kontakt" kilde="Sælger">
            <Felter
              rows={[
                ['Navn', lead.fullName],
                ['Email', lead.email ? <a href={`mailto:${lead.email}`} className="text-teal-800 hover:underline">{lead.email}</a> : null],
                ['Telefon', lead.phone ? <a href={`tel:${lead.phone}`} className="text-teal-800 hover:underline">{lead.phone}</a> : null],
                ['Adresse', lead.address],
              ]}
            />
          </Kort>

          <Kort titel="Boligen" kilde="Sælger">
            <Felter
              rows={[
                ['Boligtype', svar.boligtype ?? lead.propertyType],
                ['Boligareal', saelgerKvm ? `${saelgerKvm} m²` : null],
                ['Værelser', saelgerVaer],
                ['Byggeår', svar.saelgerByggeaar ?? lead.yearBuilt],
                ['Energimærke', svar.energimaerke ?? property?.energyClass ?? null],
              ]}
            />
          </Kort>

          <Kort titel="Stand" kilde="Sælger">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="text-left font-semibold py-1">Rum</th>
                  <th className="text-left font-semibold py-1">Stand</th>
                  <th className="text-right font-semibold py-1">Årgang</th>
                  <th className="text-left font-semibold py-1 pl-3">Mærke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {svar.stand.rum.map((r) => (
                  <tr key={r.navn}>
                    <td className="py-1.5 text-slate-700">{r.navn}</td>
                    <td className="py-1.5"><StandChip s={r.stand} /></td>
                    <td className="py-1.5 text-right tabular-nums text-slate-700">{r.aargang ?? '—'}</td>
                    <td className="py-1.5 pl-3 text-slate-700">{r.maerke ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              <Felter
                rows={[
                  ['Samlet', <StandChip key="s" s={svar.stand.samlet} />],
                  ['Røgfri', svar.stand.roegfri],
                  ['Hvidevarer', svar.stand.hvidevarer.length ? svar.stand.hvidevarer.join(', ') : null],
                  ['Sælgers note', svar.stand.note],
                  ['Økonomiske forhold', svar.stand.oekonomiNote],
                ]}
              />
            </div>
          </Kort>

          <Kort titel="Udgifter pr. år" kilde="Sælger">
            {svar.udgifter.senere && poster.length === 0 ? (
              <p className="text-sm text-amber-800">Sælger udfylder senere — indhent ved besigtigelse.</p>
            ) : (
              <Felter
                rows={[
                  ...poster.map((p): [string, React.ReactNode] => [p.navn, kr(p.kr)]),
                  ['I alt (drift)', svar.udgifter.total ? <strong key="t">{kr(svar.udgifter.total)}</strong> : null],
                  ['Vand', svar.udgifter.vand && svar.udgifter.vand.kr > 0 ? `${kr(svar.udgifter.vand.kr)} (${svar.udgifter.vand.viaEF ? 'aconto via EF' : 'forbrug'})` : null],
                  ['Varme', svar.udgifter.varme && svar.udgifter.varme.kr > 0 ? `${kr(svar.udgifter.varme.kr)} (${svar.udgifter.varme.viaEF ? 'aconto via EF' : 'forbrug'})` : null],
                  ['EF-gæld', svar.udgifter.efGaeld ? `ydelse ${kr(svar.udgifter.efGaeld.ydelse)}/år · restgæld ${kr(svar.udgifter.efGaeld.restgaeld)}${svar.udgifter.efGaeld.kanIndfries ? ` · kan indfries: ${svar.udgifter.efGaeld.kanIndfries}` : ''}` : null],
                  ['Hæftelse EF', svar.udgifter.haeftelse ? kr(svar.udgifter.haeftelse) : null],
                ]}
              />
            )}
          </Kort>

          <Kort titel="Særlige forhold" kilde="Sælger">
            {svar.forhold.length === 0 && !svar.udlejning ? (
              <p className="text-sm text-slate-400">Ingen angivet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {svar.forhold.map((f) => (
                  <li key={f.tekst} className={f.advarsel ? 'text-amber-900' : 'text-slate-800'}>
                    {f.advarsel ? '⚠︎ ' : '✓ '}{f.tekst}
                  </li>
                ))}
                {svar.udlejning && <li className="text-amber-900">⚠︎ Udlejet — {svar.udlejning}</li>}
              </ul>
            )}
          </Kort>

          <Kort titel="Situation" kilde="Sælger">
            <Felter
              rows={[
                ...svar.behov.map((b): [string, React.ReactNode] => [b.label, b.vaerdi]),
                ['Søger lejebolig', svar.soegerLejebolig],
                ['Fotos', svar.media.fotos || null],
                ['Dokumenter', svar.media.dokumenter.length ? svar.media.dokumenter.join(', ') : null],
              ]}
            />
          </Kort>
        </div>

        {/* ── Højre: registrene ─────────────────────────────────── */}
        <div className="space-y-4">
          {bbr ? (
            <>
              <Kort titel="Lejligheden i BBR" kilde="BBR">
                <Felter
                  rows={[
                    ['Boligareal', `${bbr.bbr.kvm} m²`],
                    ['Værelser', bbr.bbr.vaerelser],
                    ['Anvendelse', bbr.bbr.anvendelse],
                    ['Status', bbr.bbr.status],
                    ['Udlejningsforhold', bbr.bbr.udlejning],
                    // BBR-udtrækket er pr. ejendom, og hvor det mangler lejlighedens
                    // eget BFE, står ejendommens i begge felter. Ejerlejlighedens
                    // BFE kommer derfor fra ejendomsregistret (properties).
                    ['BFE (lejlighed)', property?.bfeNumber ?? (bbr.bbr.enhedBfe !== bbr.bbr.ejendomBfe ? String(bbr.bbr.enhedBfe) : null)],
                    ['BFE (ejendom)', String(bbr.bbr.ejendomBfe)],
                  ]}
                />
              </Kort>

              <Kort titel="Ejer" kilde="Resights">
                {bbr.ejer ? (
                  <Felter
                    rows={[
                      ['Navn', property?.ownerName ?? null],
                      ['Ejertype', bbr.ejer.type],
                      ['Alder', bbr.ejer.alder ? `${bbr.ejer.alder} år` : null],
                      ['Bor selv der', bbr.ejer.borDer == null ? null : bbr.ejer.borDer ? 'Ja' : 'Nej'],
                      ['Antal ejere', bbr.ejer.antal],
                      ['Reklamebeskyttet', bbr.ejer.reklamebeskyttet],
                      ['Grundskyld', property?.grundskyldKr ? `${kr(property.grundskyldKr)}/år` : null],
                    ]}
                  />
                ) : (
                  <p className="text-sm text-slate-400">Ikke i Resights-udtrækket.</p>
                )}
              </Kort>

              {bbr.handel && (
                <Kort titel="Seneste handel" kilde="Resights">
                  <Felter
                    rows={[
                      ['Pris', kr(bbr.handel.pris)],
                      ['Dato', bbr.handel.dato],
                      ['Kr/kvm', bbr.handel.krPrKvm ? tal(bbr.handel.krPrKvm) : null],
                      ['Handelstype', bbr.handel.fri ? 'Fri handel' : <span key="m" className="text-amber-800">{bbr.handel.metode}</span>],
                    ]}
                  />
                </Kort>
              )}

              {bbr.forening && (
                <Kort titel="Foreningen" kilde="Handler">
                  <Felter
                    rows={[
                      ['Forening', foreningId ? <Link key="f" href={`/foreninger/${foreningId}`} className="text-teal-800 hover:underline">{bbr.forening}</Link> : bbr.forening],
                      ['Marked i samme størrelse', marked ? `${tal(marked.medianKrPrKvm)} kr/kvm (median)` : 'For få handler'],
                      ['Grundlag', marked ? `${marked.antal} frie handler à ${marked.kvmFra}–${marked.kvmTil} kvm, seneste ${marked.maaneder} mdr` : null],
                      ['Bud pr. kvm', budPrKvm ? `${tal(budPrKvm)} kr/kvm` : null],
                    ]}
                  />
                </Kort>
              )}
            </>
          ) : (
            <Kort titel="Registrene" kilde="BBR · Resights">
              <p className="text-sm text-slate-500 mb-2">
                Adressen ligger uden for de ejerforeninger, vi har målt op i BBR, så der er ingen
                BBR- eller ejerdata pr. lejlighed.
              </p>
              <Felter
                rows={[
                  ['Ejer', property?.ownerName ?? null],
                  ['Grundskyld', property?.grundskyldKr ? `${kr(property.grundskyldKr)}/år` : null],
                  ['BFE', property?.bfeNumber ?? null],
                ]}
              />
            </Kort>
          )}

          <Kort titel="Leadet">
            <Felter
              rows={[
                ['Kilde', lead.source],
                ['Prioritet', '★'.repeat(lead.priority || 0) || null],
                ['Oprettet', fmtTid(lead.createdAt)],
                ['Sidst opdateret', fmtTid(lead.updatedAt)],
                ['Svar læst fra', svar.kilde === 'snapshot' ? 'Struktureret øjebliksbillede' : 'Noteteksten (lead fra før 21.09.2026)'],
              ]}
            />
          </Kort>
        </div>
      </div>
    </div>
  );
}

function fmtTid(d: Date | string) {
  return (d instanceof Date ? d.toISOString() : String(d)).slice(0, 16).replace('T', ' ');
}
