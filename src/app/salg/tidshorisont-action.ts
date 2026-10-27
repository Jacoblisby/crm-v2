'use server';

import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';

/**
 * Tidshorisont, svaret EFTER tilbudsskærmen.
 *
 * «Hvornår vil du flytte?» er taget ud af selve flowet (mødet 23.10.2026), men
 * svaret bruges stadig til at sortere leads: dem, der vil sælge snart, får
 * direkte salg, resten får top of mind. Her kan sælger give det valgfrit, når
 * leadet allerede er oprettet.
 *
 * Skriver i samme felt som flowet gjorde før (`afkastInputs.beregner.behov`,
 * label «Hvornår vil du flytte?»), så CRM og funnel-regnearket læser det som
 * før. Kun leads under 6 timer gamle kan ændres, og kun med leadets id, som
 * kun sælger har fået.
 */
const VALG = ['Hurtigst muligt', '1–3 måneder', '3–6 måneder', '6+ måneder', 'Ved ikke endnu'] as const;
const LABEL = 'Hvornår vil du flytte?';
const SEKS_TIMER = 6 * 3_600_000;

export async function gemTidshorisont(leadId: string, valg: string): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return { ok: false };
  if (!(VALG as readonly string[]).includes(valg)) return { ok: false };

  const [lead] = await db
    .select({ afkastInputs: leads.afkastInputs, notes: leads.notes })
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt), gt(leads.createdAt, new Date(Date.now() - SEKS_TIMER))))
    .limit(1);
  if (!lead) return { ok: false };

  const inputs = (lead.afkastInputs ?? {}) as NonNullable<typeof lead.afkastInputs>;
  if (inputs.beregner) {
    const behov = inputs.beregner.behov.filter((b) => b.label !== LABEL && b.label !== 'Tidshorisont');
    inputs.beregner = { ...inputs.beregner, behov: [{ label: LABEL, vaerdi: valg }, ...behov] };
  }

  await db
    .update(leads)
    .set({
      afkastInputs: inputs,
      notes: `${lead.notes ?? ''}\n· Tidshorisont (svaret efter tilbudsskærmen): ${valg}`.trim(),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));
  return { ok: true };
}
