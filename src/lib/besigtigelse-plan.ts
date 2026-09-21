/**
 * Booking-status for beregner-leads — hvem venter på et udkast, hvem har fået
 * en booking-mail, og hvem har svaret. Bruges af lead-kortet og pipelinen.
 *
 * Intet gemmes: udkastet regnes ud, hver gang siden vises. Først når mailen
 * sendes, bliver den en del af historikken — og dens tid låst for de næste.
 */
import { and, desc, eq, ilike, inArray, isNull, like, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leadCommunications, leads } from '@/lib/db/schema';
import { beregnerSvar } from '@/lib/beregner';
import { BOOKING_EMNE, bookingUdkast, planlaeg, postnrFra, tidFraMail, type Laast } from '@/lib/besigtigelse';

export interface Booking {
  /** Udkast klar til at blive sendt. */
  udkast: { subject: string; body: string; tid: Date | null } | null;
  /** Booking-mail er sendt; tiden læst ud af mailen (null hvis rettet til noget andet). */
  sendt: { tid: Date | null; sendtAt: Date } | null;
  /** Kunden har skrevet efter booking-mailen. */
  svar: { at: Date; subject: string | null; body: string | null } | null;
}

export async function bookingOversigt(): Promise<Map<string, Booking>> {
  const kandidater = await db
    .select()
    .from(leads)
    .where(
      and(
        isNull(leads.deletedAt),
        eq(leads.stageSlug, 'ny-lead'),
        or(like(leads.source, 'boligberegner%')),
      ),
    );
  const ids = kandidater.map((l) => l.id);

  // Alle sendte booking-mails — også til leads, der er flyttet videre, så
  // deres tider stadig er låst.
  const sendte = await db
    .select({
      leadId: leadCommunications.leadId,
      body: leadCommunications.body,
      createdAt: leadCommunications.createdAt,
      postalCode: leads.postalCode,
      address: leads.address,
    })
    .from(leadCommunications)
    .innerJoin(leads, eq(leads.id, leadCommunications.leadId))
    .where(
      and(
        isNull(leads.deletedAt),
        eq(leadCommunications.direction, 'out'),
        eq(leadCommunications.type, 'email'),
        ilike(leadCommunications.subject, `%${BOOKING_EMNE}%`),
      ),
    )
    .orderBy(desc(leadCommunications.createdAt));

  const senestSendt = new Map<string, (typeof sendte)[number]>();
  for (const s of sendte) if (!senestSendt.has(s.leadId)) senestSendt.set(s.leadId, s);

  const laaste: Laast[] = [];
  for (const [id, s] of senestSendt) {
    const tid = tidFraMail(s.body, s.createdAt);
    if (tid) laaste.push({ id, postnr: postnrFra(s.postalCode, s.address), start: tid });
  }

  const ventende = kandidater.filter((l) => l.email && !senestSendt.has(l.id));
  const plan = planlaeg(
    ventende.map((l) => ({ id: l.id, postnr: postnrFra(l.postalCode, l.address), oprettet: l.createdAt })),
    laaste,
  );

  const indgaaende = ids.length
    ? await db
        .select({
          leadId: leadCommunications.leadId,
          subject: leadCommunications.subject,
          body: leadCommunications.body,
          createdAt: leadCommunications.createdAt,
        })
        .from(leadCommunications)
        .where(and(inArray(leadCommunications.leadId, ids), eq(leadCommunications.direction, 'in')))
        .orderBy(desc(leadCommunications.createdAt))
    : [];

  const ud = new Map<string, Booking>();
  for (const l of kandidater) {
    const s = senestSendt.get(l.id);
    const svar = s ? indgaaende.find((i) => i.leadId === l.id && i.createdAt > s.createdAt) : undefined;
    const tid = plan.get(l.id) ?? null;
    ud.set(l.id, {
      udkast: !s && l.email ? { ...bookingUdkast(l, beregnerSvar(l), tid), tid } : null,
      sendt: s ? { tid: tidFraMail(s.body, s.createdAt), sendtAt: s.createdAt } : null,
      svar: svar ? { at: svar.createdAt, subject: svar.subject, body: svar.body } : null,
    });
  }
  return ud;
}

/** Booking-status for ét lead — også når det ikke længere står i Ny lead. */
export async function bookingForLead(leadId: string): Promise<Booking | null> {
  const alle = await bookingOversigt();
  if (alle.has(leadId)) return alle.get(leadId)!;

  const [s] = await db
    .select({ body: leadCommunications.body, createdAt: leadCommunications.createdAt })
    .from(leadCommunications)
    .where(
      and(
        eq(leadCommunications.leadId, leadId),
        eq(leadCommunications.direction, 'out'),
        ilike(leadCommunications.subject, `%${BOOKING_EMNE}%`),
      ),
    )
    .orderBy(desc(leadCommunications.createdAt))
    .limit(1);
  if (!s) return null;
  const [svar] = await db
    .select({ subject: leadCommunications.subject, body: leadCommunications.body, createdAt: leadCommunications.createdAt })
    .from(leadCommunications)
    .where(and(eq(leadCommunications.leadId, leadId), eq(leadCommunications.direction, 'in')))
    .orderBy(desc(leadCommunications.createdAt))
    .limit(1);
  return {
    udkast: null,
    sendt: { tid: tidFraMail(s.body, s.createdAt), sendtAt: s.createdAt },
    svar: svar && svar.createdAt > s.createdAt ? { at: svar.createdAt, subject: svar.subject, body: svar.body } : null,
  };
}
