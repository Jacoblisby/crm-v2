/**
 * Anonymt dataudtræk til funnel-regnearket (scripts/funnel/bygfunnel.py).
 *
 * Én række pr. lead, uden navn, mail, telefon eller adressetekst. Adressen
 * erstattes af en kort hash af den normaliserede adresse, så regnearket kan
 * koble breve til leads uden at indeholde en eneste adresse.
 *
 * Hvad der tælles som tidspunkt for hvert trin:
 *   · booking sendt   første udgående mail med booking-frasen i emnet
 *   · kundens svar    første indgående mail
 *   · opkald          første logget telefonsamtale
 *   · aftalt          første skift til «Besigtigelse aftalt», eller en aftale
 *                     skrevet i telefonen («Aftalt besigtigelse: …»)
 *   · afholdt, bud, købt …   første skift til det trin i stage-historikken
 *
 * Gamle leads fra før pipelinen blev omlagt har kun deres nuværende trin og
 * dets tidspunkt. De kommer med, men uden mellemtrin.
 */
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leadCommunications, leadStageHistory, leads } from '@/lib/db/schema';
import { beregnerSvar } from '@/lib/beregner';
import { bbrForAdresse } from '@/lib/bbr-lejlighed';
import { BOOKING_EMNE } from '@/lib/besigtigelse';

export const dynamic = 'force-dynamic';

const norm = (s: string) => s.toLowerCase().replace(/[\s.]+/g, ' ').trim();

/** Samme nøgle som i brevlisten: «vej nr, etage dør|postnr», normaliseret. */
function adresseNoegle(adresse: string | null, postnr: string | null): string | null {
  if (!adresse) return null;
  const dele = adresse.split(',').map((d) => d.trim());
  const pn = postnr || adresse.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/)?.[1];
  if (!pn) return null;
  const vejOgEtage = dele.filter((d) => !/^\d{4}\b/.test(d)).slice(0, 2).join(', ');
  return `${norm(vejOgEtage)}|${pn}`;
}

const hash = (s: string) => createHash('sha256').update(`365-funnel|${s}`).digest('hex').slice(0, 16);

const erTest = (l: { email: string | null; fullName: string | null }) =>
  (l.email ?? '').toLowerCase() === 'jacob@faurholt.com' || /\b(test|jacob lisby)\b/i.test(l.fullName ?? '');

export async function GET() {
  const [alle, historik, komm] = await Promise.all([
    db.select().from(leads).where(isNull(leads.deletedAt)),
    db.select({ leadId: leadStageHistory.leadId, trin: leadStageHistory.toStage, tid: leadStageHistory.changedAt }).from(leadStageHistory),
    db
      .select({
        leadId: leadCommunications.leadId,
        type: leadCommunications.type,
        retning: leadCommunications.direction,
        emne: leadCommunications.subject,
        tekst: leadCommunications.body,
        tid: leadCommunications.createdAt,
      })
      .from(leadCommunications),
  ]);

  const trinPrLead = new Map<string, Map<string, Date>>();
  for (const h of historik) {
    const m = trinPrLead.get(h.leadId) ?? new Map<string, Date>();
    const nu = m.get(h.trin);
    if (!nu || h.tid < nu) m.set(h.trin, h.tid);
    trinPrLead.set(h.leadId, m);
  }
  const kommPrLead = new Map<string, typeof komm>();
  for (const k of komm) {
    const l = kommPrLead.get(k.leadId);
    if (l) l.push(k);
    else kommPrLead.set(k.leadId, [k]);
  }
  const foerste = <T extends { tid: Date }>(liste: T[]) =>
    liste.length ? new Date(Math.min(...liste.map((x) => x.tid.getTime()))) : null;
  const iso = (d: Date | null) => (d ? d.toISOString() : null);

  const raekker = alle.map((l) => {
    const k = kommPrLead.get(l.id) ?? [];
    const trin = trinPrLead.get(l.id) ?? new Map<string, Date>();
    const svar = beregnerSvar(l);
    const bbr = bbrForAdresse(l.address, l.postalCode);
    const noegle = adresseNoegle(l.address, l.postalCode);

    const booking = foerste(k.filter((x) => x.type === 'email' && x.retning === 'out' && (x.emne ?? '').toLowerCase().includes(BOOKING_EMNE)));
    const svarMail = foerste(k.filter((x) => x.type === 'email' && x.retning === 'in'));
    const opkald = foerste(k.filter((x) => x.type === 'phone'));
    const telefonAftale = foerste(k.filter((x) => x.type === 'phone' && (x.tekst ?? '').startsWith('Aftalt besigtigelse')));

    // Til gamle leads uden historik: nuværende trin er det eneste, vi ved.
    const nu = l.stageChangedAt;
    const trinTid = (slug: string, ...gamle: string[]) => {
      const kandidater = [slug, ...gamle].map((s) => trin.get(s)).filter((d): d is Date => !!d);
      if (kandidater.length) return new Date(Math.min(...kandidater.map((d) => d.getTime())));
      return [slug, ...gamle].includes(l.stageSlug) ? nu : null;
    };
    const aftalt = (() => {
      const a = trinTid('besigtigelse-aftalt', 'fremvisning');
      return a && telefonAftale ? (a < telefonAftale ? a : telefonAftale) : (a ?? telefonAftale);
    })();

    const behov = (q: string) => svar?.behov.find((b) => b.label === q)?.vaerdi ?? null;

    return {
      id: l.id.slice(0, 8),
      oprettet: iso(l.createdAt),
      kilde: l.source,
      postnr: l.postalCode,
      by: l.city,
      kvm: l.kvm,
      forening: bbr?.forening ?? null,
      nogle: noegle ? hash(noegle) : null,
      test: erTest(l) ? 1 : 0,
      flow: svar?.flow ?? null,
      tidshorisont: behov('Hvornår vil du flytte?'),
      efterSalget: behov('Hvad skal du efter salget?'),
      standSamlet: svar?.stand.samlet ?? null,
      udgifterUdfyldt: svar ? (svar.udgifter.senere ? 0 : 1) : null,
      billeder: svar?.media.fotos ? 1 : 0,
      bud: l.bidDkk,
      estimat: l.valuationDkk,
      trinNu: l.stageSlug,
      trinNuTid: iso(nu),
      tBooking: iso(booking),
      tSvar: iso(svarMail),
      tOpkald: iso(opkald),
      tAftalt: iso(aftalt),
      tAfholdt: iso(trinTid('besigtigelse-afholdt')),
      tBud: iso(trinTid('bud-afgivet', 'aktivt-bud')),
      tIkkeEnige: iso(trinTid('ikke-enige-om-pris')),
      tVilIkkeNu: iso(trinTid('vil-ikke-saelge-nu')),
      tKoebt: iso(trinTid('koebt', 'lukket')),
      tArkiv: iso(trinTid('arkiveret', 'tabt')),
    };
  });

  return NextResponse.json(
    { genereret: new Date().toISOString(), antal: raekker.length, leads: raekker },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
