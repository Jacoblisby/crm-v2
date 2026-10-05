/**
 * Sendt booking, aftalt tid og kundens svar for alle leads, uanset stadie.
 * Pipelinen bruger det til selv at flytte leads videre.
 */
import { and, desc, eq, ilike, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leadCommunications, leads } from '@/lib/db/schema';
import { BOOKING_EMNE, tidFraMail } from '@/lib/besigtigelse';
import type { BookingStatus } from '@/lib/pipeline-stages';

export async function bookingStatus(): Promise<Map<string, BookingStatus>> {
  const sendte = await db
    .select({
      leadId: leadCommunications.leadId,
      body: leadCommunications.body,
      createdAt: leadCommunications.createdAt,
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

  // Tiden står ikke nødvendigvis i den seneste mail: «Vi ses i morgen kl 13»
  // kan være fulgt af en mail uden tid. Nyeste tid, der kan læses, gælder.
  // Kundens svar tæller fra den FØRSTE booking-mail, ikke den seneste —
  // ellers tæller et «Ok» fra i går ikke, fordi vi skrev igen bagefter.
  const ud = new Map<string, BookingStatus>();
  const foerste = new Map<string, Date>();
  for (const s of sendte) {
    const b = ud.get(s.leadId);
    if (!b) ud.set(s.leadId, { sendtAt: s.createdAt, tid: tidFraMail(s.body, s.createdAt), svarAt: null });
    else if (!b.tid) b.tid = tidFraMail(s.body, s.createdAt);
    foerste.set(s.leadId, s.createdAt); // listen er nyeste først, så den sidste vinder
  }

  if (ud.size > 0) {
    const svar = await db
      .select({ leadId: leadCommunications.leadId, createdAt: leadCommunications.createdAt })
      .from(leadCommunications)
      .where(and(inArray(leadCommunications.leadId, [...ud.keys()]), eq(leadCommunications.direction, 'in')))
      .orderBy(desc(leadCommunications.createdAt));
    for (const s of svar) {
      const b = ud.get(s.leadId)!;
      const f = foerste.get(s.leadId);
      if (!b.svarAt && f && s.createdAt > f) b.svarAt = s.createdAt;
    }
  }

  // Tider aftalt i telefonen («Aftalt besigtigelse: fredag 17. oktober kl.
  // 11.00.» fra opkaldsfanen). En aftale i telefonen er et ja, så den tæller
  // både som afsendt og som besvaret.
  const telefon = await db
    .select({ leadId: leadCommunications.leadId, body: leadCommunications.body, createdAt: leadCommunications.createdAt })
    .from(leadCommunications)
    .innerJoin(leads, eq(leads.id, leadCommunications.leadId))
    .where(
      and(
        isNull(leads.deletedAt),
        eq(leadCommunications.type, 'phone'),
        ilike(leadCommunications.body, 'Aftalt besigtigelse:%'),
      ),
    )
    .orderBy(desc(leadCommunications.createdAt));
  const sete = new Set<string>();
  for (const t of telefon) {
    if (sete.has(t.leadId)) continue; // nyeste først
    sete.add(t.leadId);
    const tid = tidFraMail(t.body, t.createdAt);
    const b = ud.get(t.leadId);
    if (!b) {
      ud.set(t.leadId, { sendtAt: t.createdAt, tid, svarAt: t.createdAt });
    } else {
      if (tid && (!b.tid || (b.sendtAt && t.createdAt > b.sendtAt))) b.tid = tid;
      b.svarAt ??= t.createdAt;
    }
  }
  return ud;
}
