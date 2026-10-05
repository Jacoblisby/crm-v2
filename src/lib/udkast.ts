/**
 * Næste udkast pr. lead.
 *
 * Pipelinen siger, hvor leadet står; den her fil siger, hvad der skal
 * skrives derfra. Ét udkast ad gangen — det næste, der giver mening — så
 * Jacob kan gå ned gennem tavlen og trykke send.
 *
 * Intet gemmes. Udkastet regnes ud, hver gang en side vises, og forsvinder
 * af sig selv, så snart mailen er sendt eller kunden har svaret.
 */
import { and, desc, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leadCommunications, leads } from '@/lib/db/schema';
import { beregnerSvar } from '@/lib/beregner';
import { planlaeg, postnrFra, tidFraMail, type Laast } from '@/lib/besigtigelse';
import * as M from '@/lib/mails';

const DAG = 24 * 60 * 60_000;
const TIME = 60 * 60_000;

export interface LeadUdkast {
  udkast: (M.Mail & { tid: Date | null }) | null;
  sendt: { tid: Date | null; sendtAt: Date } | null;
  svar: { at: Date; subject: string | null; body: string | null } | null;
}

type Komm = {
  leadId: string;
  direction: string;
  type: string;
  subject: string | null;
  body: string | null;
  createdAt: Date;
};

/** Leads vi aldrig skriver til af os selv. */
const LUKKEDE = ['tabt', 'arkiveret'];

export async function udkastOversigt(nu = new Date()): Promise<Map<string, LeadUdkast>> {
  const raekker = await db
    .select()
    .from(leads)
    .where(and(isNull(leads.deletedAt), notInArray(leads.stageSlug, LUKKEDE)));
  const ids = raekker.map((l) => l.id);
  if (ids.length === 0) return new Map();

  const komm = (await db
    .select({
      leadId: leadCommunications.leadId,
      direction: leadCommunications.direction,
      type: leadCommunications.type,
      subject: leadCommunications.subject,
      body: leadCommunications.body,
      createdAt: leadCommunications.createdAt,
    })
    .from(leadCommunications)
    .where(and(inArray(leadCommunications.leadId, ids), eq(leadCommunications.type, 'email')))
    .orderBy(desc(leadCommunications.createdAt))) as Komm[];

  const prLead = new Map<string, Komm[]>();
  for (const k of komm) {
    const l = prLead.get(k.leadId);
    if (l) l.push(k);
    else prLead.set(k.leadId, [k]);
  }

  // Tider, der allerede er lovet væk, så to kunder ikke får samme tidspunkt.
  const laaste: Laast[] = [];
  for (const l of raekker) {
    const b = bookingMail(prLead.get(l.id) ?? []);
    const tid = b ? nyesteTid(prLead.get(l.id) ?? []) : null;
    if (tid) laaste.push({ id: l.id, postnr: postnrFra(l.postalCode, l.address), start: tid });
  }
  const venter = raekker.filter(
    (l) => l.email && l.stageSlug === 'ny-lead' && !bookingMail(prLead.get(l.id) ?? []),
  );
  const plan = planlaeg(
    venter.map((l) => ({ id: l.id, postnr: postnrFra(l.postalCode, l.address), oprettet: l.createdAt })),
    laaste,
    nu,
  );

  const ud = new Map<string, LeadUdkast>();
  for (const l of raekker) {
    const k = prLead.get(l.id) ?? [];
    const b = bookingMail(k);
    const tid = nyesteTid(k);
    const svar = senesteInd(k);
    ud.set(l.id, {
      udkast: l.email ? naeste(l, k, tid, plan.get(l.id) ?? null, nu) : null,
      sendt: b ? { tid, sendtAt: b.createdAt } : null,
      svar:
        svar && b && svar.createdAt > b.createdAt
          ? { at: svar.createdAt, subject: svar.subject, body: svar.body }
          : null,
    });
  }
  return ud;
}

export async function udkastForLead(leadId: string, nu = new Date()): Promise<LeadUdkast | null> {
  return (await udkastOversigt(nu)).get(leadId) ?? null;
}

// ─── Hjælpere over kommunikationen ───────────────────────────────────────

const erBooking = (k: Komm) => (k.subject ?? '').toLowerCase().includes(M.BOOKING_EMNE);
const bookingMail = (k: Komm[]) => k.find((x) => x.direction === 'out' && erBooking(x));
const senesteUd = (k: Komm[]) => k.find((x) => x.direction === 'out');
const senesteInd = (k: Komm[]) => k.find((x) => x.direction === 'in');

/** Nyeste tid, der kan læses i en af vores egne mails i booking-tråden. */
function nyesteTid(k: Komm[]): Date | null {
  for (const x of k) {
    if (x.direction !== 'out' || !erBooking(x)) continue;
    const t = tidFraMail(x.body, x.createdAt);
    if (t) return t;
  }
  return null;
}

/** Vores mails sendt efter booking-mailen — én pr. opfølgning. */
function antalOpfoelgninger(k: Komm[]): number {
  const b = bookingMail(k);
  if (!b) return 0;
  return k.filter((x) => x.direction === 'out' && erBooking(x) && x.createdAt > b.createdAt).length;
}

const dageSiden = (d: Date, nu: Date) => (nu.getTime() - d.getTime()) / DAG;

// ─── Reglerne ────────────────────────────────────────────────────────────

type Lead = typeof leads.$inferSelect;

function naeste(
  lead: Lead,
  k: Komm[],
  tid: Date | null,
  foreslaaetTid: Date | null,
  nu: Date,
): (M.Mail & { tid: Date | null }) | null {
  const m = (mail: M.Mail | null, t: Date | null = null) => (mail ? { ...mail, tid: t } : null);
  const ud = senesteUd(k);
  const ind = senesteInd(k);
  const svarEfterSidsteMail = !!(ind && ud && ind.createdAt > ud.createdAt);

  switch (lead.stageSlug) {
    case 'ny-lead': {
      if (bookingMail(k)) return null; // er allerede sendt — pipelinen flytter leadet
      return m(M.booking(lead, beregnerSvar(lead), foreslaaetTid), foreslaaetTid);
    }

    case 'besigtigelse-foreslaaet': {
      // Har kunden skrevet, skal Jacob læse svaret og aftale tid — ikke
      // rykke for et svar, der allerede er kommet.
      if (svarEfterSidsteMail) return tid ? m(M.bekraeftelse(lead, tid), tid) : null;
      const b = bookingMail(k);
      if (!ud || !b) return null;
      const n = antalOpfoelgninger(k);
      if (n >= M.OPFOELGNINGER.length) return null; // parkeres af automatikken
      // Opfølgningerne hænger på booking-mailens dato: dag 3, 8 og 15.
      if (dageSiden(b.createdAt, nu) < M.OPFOELGNINGER[n]) return null;
      if (n === 0) return m(M.opfoelgning1(lead, foreslaaetTid), foreslaaetTid);
      if (n === 1) return m(M.opfoelgning2(lead));
      return m(M.opfoelgning3(lead));
    }

    case 'besigtigelse-aftalt': {
      if (!tid) return null;
      // Bekræftelsen først: er vores seneste mail ældre end kundens ja.
      if (svarEfterSidsteMail) return m(M.bekraeftelse(lead, tid), tid);
      const timerTil = (tid.getTime() - nu.getTime()) / TIME;
      const timerSidenMail = ud ? (nu.getTime() - ud.createdAt.getTime()) / TIME : 999;
      if (timerTil > 0 && timerTil <= 30 && timerSidenMail > 18) return m(M.paamindelse(lead, tid), tid);
      return null;
    }

    case 'besigtigelse-afholdt': {
      if (ud && tid && ud.createdAt > tid) return null; // taken allerede sendt
      return m(M.takForBesoeget(lead));
    }

    case 'bud-afgivet': {
      const budSendt = k.find((x) => x.direction === 'out' && (x.subject ?? '').startsWith('Kontantbud'));
      if (!budSendt) {
        if (!lead.bidDkk) return null;
        return m(M.budMail(lead, lead.bidDkk, new Date(nu.getTime() + M.BUD_GYLDIGHED_DAGE * DAG)));
      }
      if (svarEfterSidsteMail) return null; // kunden har svaret — læs den først
      if (dageSiden(budSendt.createdAt, nu) >= 3 && budSendt === ud) return m(M.budOpfoelgning(lead));
      return null;
    }

    case 'ikke-enige-om-pris':
      if (ud && dageSiden(ud.createdAt, nu) < 30) return null;
      return m(M.maanedlig(lead, null));

    case 'vil-ikke-saelge-nu':
      if (ud && dageSiden(ud.createdAt, nu) < 90) return null;
      return m(M.kvartal(lead));

    case 'koebt': {
      const sendt = k.some((x) => x.direction === 'out' && (x.subject ?? '').includes(M.HANDLEN_EMNE));
      return sendt ? null : m(M.handlen(lead));
    }

    default:
      return null;
  }
}

/**
 * Leads, hvor tredje opfølgning er sendt og kunden stadig tier. De parkeres
 * i «Vil ikke sælge nu» og dukker op igen om tre måneder.
 */
export async function skalParkeres(nu = new Date()): Promise<string[]> {
  const raekker = await db
    .select({ id: leads.id, stageSlug: leads.stageSlug })
    .from(leads)
    .where(and(isNull(leads.deletedAt), eq(leads.stageSlug, 'besigtigelse-foreslaaet')));
  if (raekker.length === 0) return [];

  const komm = (await db
    .select({
      leadId: leadCommunications.leadId,
      direction: leadCommunications.direction,
      type: leadCommunications.type,
      subject: leadCommunications.subject,
      body: leadCommunications.body,
      createdAt: leadCommunications.createdAt,
    })
    .from(leadCommunications)
    .where(
      and(
        inArray(
          leadCommunications.leadId,
          raekker.map((r) => r.id),
        ),
        eq(leadCommunications.type, 'email'),
      ),
    )
    .orderBy(desc(leadCommunications.createdAt))) as Komm[];

  const prLead = new Map<string, Komm[]>();
  for (const k of komm) {
    const l = prLead.get(k.leadId);
    if (l) l.push(k);
    else prLead.set(k.leadId, [k]);
  }

  return raekker
    .filter((r) => {
      const k = prLead.get(r.id) ?? [];
      const ud = senesteUd(k);
      const ind = senesteInd(k);
      if (!ud || (ind && ind.createdAt > ud.createdAt)) return false;
      return antalOpfoelgninger(k) >= M.OPFOELGNINGER.length && dageSiden(ud.createdAt, nu) >= 7;
    })
    .map((r) => r.id);
}
