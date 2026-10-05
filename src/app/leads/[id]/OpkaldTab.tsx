/**
 * «Opkald»: manuset til at ringe til et lead, der lige har brugt beregneren.
 * Tilpasset den enkelte kunde, se src/lib/opkaldsmanus.ts.
 */
import type { Lead } from '@/lib/types';
import { beregnerSvar } from '@/lib/beregner';
import { bbrForAdresse } from '@/lib/bbr-lejlighed';
import { handlerFor, voresKoeb } from '@/lib/handler';
import { tidTekst } from '@/lib/besigtigelse';
import { byggManus } from '@/lib/opkaldsmanus';
import type { LeadUdkast } from '@/lib/udkast';
import { OpkaldResultat } from './OpkaldResultat';
import { KopierKnap } from './KopierKnap';

const ALVOR = {
  advarsel: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-slate-50 border-slate-200 text-slate-700',
} as const;

function sidenTekst(d: Date): string {
  const min = Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000));
  if (min < 60) return `for ${min} min. siden`;
  const timer = Math.round(min / 60);
  if (timer < 24) return `for ${timer} ${timer === 1 ? 'time' : 'timer'} siden`;
  const dage = Math.round(timer / 24);
  return `for ${dage} ${dage === 1 ? 'dag' : 'dage'} siden`;
}

export function OpkaldTab({ lead, udkast }: { lead: Lead; udkast: LeadUdkast | null }) {
  const svar = beregnerSvar(lead);
  const bbr = bbrForAdresse(lead.address, lead.postalCode);
  const vores = bbr?.forening ? voresKoeb(handlerFor(bbr.forening)).length : 0;

  // Kun forslag, der faktisk er en ny besigtigelsestid, ikke en tid der allerede er aftalt.
  const tidsforslag = udkast?.udkast?.tid && ['booking', 'opfoelgning1'].includes(udkast.udkast.type) ? tidTekst(udkast.udkast.tid) : null;

  const manus = byggManus({
    lead: {
      fullName: lead.fullName,
      phone: lead.phone,
      address: lead.address,
      kvm: lead.kvm,
      rooms: lead.rooms,
      bidDkk: lead.bidDkk,
      createdAt: lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt),
    },
    svar,
    bbr,
    tidsforslag,
    voresKoeb: vores,
  });

  const oprettet = lead.createdAt instanceof Date ? lead.createdAt : new Date(lead.createdAt);
  const tlf = lead.phone?.replace(/\s+/g, '') ?? null;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* ── Før du ringer ─────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Før du ringer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Brugte beregneren {sidenTekst(oprettet)}. Ring helst samme dag, mens den stadig er frisk for hende.
            </p>
          </div>
          {tlf ? (
            <a
              href={`tel:${tlf}`}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold tabular-nums"
            >
              📞 {lead.phone}
            </a>
          ) : (
            <span className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded px-2 py-1">Ingen telefonnummer på leadet</span>
          )}
        </div>

        <dl className="divide-y divide-slate-100">
          {manus.fakta.map(([k, v]) => (
            <div key={k} className="grid grid-cols-5 gap-3 py-1.5 text-sm">
              <dt className="col-span-2 text-slate-500">{k}</dt>
              <dd className="col-span-3 font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>

        {manus.paapas.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Vær opmærksom på</div>
            {manus.paapas.map((n) => (
              <div key={n.tekst} className={`text-sm rounded border px-2.5 py-1.5 ${ALVOR[n.alvor]}`}>
                {n.tekst}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Samtalen, trin for trin ───────────────────────────────── */}
      <ol className="space-y-3">
        {manus.trin.map((t, i) => (
          <li key={t.titel} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                <span className="text-slate-400 tabular-nums mr-1.5">{i + 1}.</span>
                {t.titel}
              </h3>
              <span className="text-xs text-slate-400 whitespace-nowrap">{t.varighed}</span>
            </div>
            <p className="text-xs text-slate-500">{t.maal}</p>

            {t.sig?.map((s) => (
              <p key={s} className="text-sm text-slate-900 bg-teal-50 border border-teal-100 rounded px-3 py-2 leading-relaxed">
                {s}
              </p>
            ))}

            {t.spoerg && (
              <ul className="space-y-1.5">
                {t.spoerg.map((q) => (
                  <li key={q} className="text-sm text-slate-900 flex gap-2">
                    <span className="text-slate-300 select-none">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}

            {t.husk && (
              <ul className="space-y-1 pt-0.5">
                {t.husk.map((h) => (
                  <li key={h} className="text-xs text-slate-500 flex gap-2">
                    <span className="select-none">→</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {/* ── Indvendinger ──────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Når hun siger…</h3>
        <div className="divide-y divide-slate-100">
          {manus.indvendinger.map((o) => (
            <details key={o.kunden} className="group py-2">
              <summary className="cursor-pointer text-sm text-slate-900 list-none flex items-start gap-2">
                <span className="text-slate-400 group-open:rotate-90 transition-transform select-none">▸</span>
                <span>{o.kunden}</span>
              </summary>
              <p className="mt-2 ml-5 text-sm text-slate-700 leading-relaxed">{o.svar}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Hvis du ikke får fat i hende ──────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Hvis du ikke får fat i hende</h3>
        <p className="text-xs text-slate-500">{manus.ikkeTruffet.regel}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Telefonsvarer</div>
            <KopierKnap tekst={manus.ikkeTruffet.telefonsvarer} />
          </div>
          <p className="text-sm text-slate-800 bg-slate-50 rounded px-3 py-2 leading-relaxed">{manus.ikkeTruffet.telefonsvarer}</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">SMS</div>
            <KopierKnap tekst={manus.ikkeTruffet.sms} />
          </div>
          <p className="text-sm text-slate-800 bg-slate-50 rounded px-3 py-2 leading-relaxed">{manus.ikkeTruffet.sms}</p>
        </div>
      </section>

      <OpkaldResultat leadId={lead.id} />
    </div>
  );
}
