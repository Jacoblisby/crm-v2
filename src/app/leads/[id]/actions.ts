'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadCommunications, leadStageHistory, pipelineStages } from '@/lib/db/schema';

interface MoveStageInput {
  leadId: string;
  toStage: string;
  note?: string;
}

export async function moveLeadStageAction(input: MoveStageInput) {
  // Validate stage exists
  const [stage] = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.slug, input.toStage))
    .limit(1);
  if (!stage) return { ok: false, error: `Ukendt stage: ${input.toStage}` };

  const [lead] = await db
    .select({ id: leads.id, stageSlug: leads.stageSlug })
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);
  if (!lead) return { ok: false, error: 'Lead ikke fundet' };

  if (lead.stageSlug === input.toStage) {
    return { ok: false, error: 'Lead er allerede i denne stage' };
  }

  const now = new Date();
  await db
    .update(leads)
    .set({ stageSlug: input.toStage, stageChangedAt: now, updatedAt: now })
    .where(eq(leads.id, input.leadId));

  await db.insert(leadStageHistory).values({
    leadId: input.leadId,
    fromStage: lead.stageSlug,
    toStage: input.toStage,
    changedBy: 'jacob@faurholt.com',
  });

  // If a note was provided, log it as a communication too
  if (input.note?.trim()) {
    await db.insert(leadCommunications).values({
      leadId: input.leadId,
      type: 'note',
      direction: 'out',
      body: `Stage flyttet: ${lead.stageSlug} → ${input.toStage}\n${input.note.trim()}`,
      createdBy: 'jacob@faurholt.com',
    });
  }

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath('/');
  revalidatePath('/pipeline');
  return { ok: true };
}

interface LogCommInput {
  leadId: string;
  type: 'phone' | 'note' | 'email' | 'sms' | 'letter';
  direction: 'in' | 'out';
  subject?: string;
  body: string;
}

export async function logCommunicationAction(input: LogCommInput) {
  if (!input.body?.trim()) return { ok: false, error: 'Besked må ikke være tom' };

  const [lead] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);
  if (!lead) return { ok: false, error: 'Lead ikke fundet' };

  await db.insert(leadCommunications).values({
    leadId: input.leadId,
    type: input.type,
    direction: input.direction,
    subject: input.subject?.trim() || null,
    body: input.body.trim(),
    createdBy: 'jacob@faurholt.com',
  });

  revalidatePath(`/leads/${input.leadId}`);
  revalidatePath('/');
  return { ok: true };
}

// ─── Resultat af et opkald ───────────────────────────────────────────────

export type OpkaldUdfald =
  | 'ikke-truffet'
  | 'lagde-besked'
  | 'aftalt'
  | 'ring-igen'
  | 'ikke-nu'
  | 'vil-ikke-kontaktes';

interface OpkaldInput {
  leadId: string;
  udfald: OpkaldUdfald;
  /** «2026-10-17T11:00» fra et datetime-local-felt. Kræves ved «aftalt». */
  tid?: string;
  note?: string;
}

/**
 * Logger et opkald og flytter leadet, hvis udfaldet kræver det.
 *
 * «Aftalt» skriver tiden ind i teksten i et fast format
 * («Aftalt besigtigelse: fredag 17. oktober kl. 11.00»), som pipelinen læser
 * tilbage: så står tiden på kortet, kalenderlinket virker, og bekræftelsen
 * ligger som udkast.
 */
export async function opkaldResultatAction(input: OpkaldInput): Promise<{ ok: boolean; error?: string }> {
  const { tidTekst, kbhFraLokal } = await import('@/lib/besigtigelse');
  const note = input.note?.trim();
  let tekst: string;
  let flytTil: string | null = null;

  switch (input.udfald) {
    case 'ikke-truffet':
      tekst = 'Ringede, ikke truffet.';
      break;
    case 'lagde-besked':
      tekst = 'Ringede, lagde besked på telefonsvareren.';
      break;
    case 'aftalt': {
      const tid = kbhFraLokal(input.tid ?? '');
      if (!tid) return { ok: false, error: 'Vælg dag og tid for besigtigelsen.' };
      tekst = `Aftalt besigtigelse: ${tidTekst(tid)}.`;
      flytTil = 'besigtigelse-aftalt';
      break;
    }
    case 'ring-igen': {
      const tid = input.tid ? kbhFraLokal(input.tid) : null;
      tekst = tid ? `Snakkede med kunden. Ringer igen ${tidTekst(tid)}.` : 'Snakkede med kunden. Ringer igen.';
      break;
    }
    case 'ikke-nu':
      tekst = 'Snakkede med kunden. Salg er ikke aktuelt lige nu.';
      flytTil = 'vil-ikke-saelge-nu';
      break;
    case 'vil-ikke-kontaktes':
      tekst = 'Kunden vil ikke kontaktes igen. Skriv ikke til dem.';
      flytTil = 'arkiveret';
      break;
    default:
      return { ok: false, error: 'Ukendt udfald.' };
  }

  const r = await logCommunicationAction({
    leadId: input.leadId,
    type: 'phone',
    direction: 'out',
    body: note ? `${tekst}\n\n${note}` : tekst,
  });
  if (!r.ok) return { ok: false, error: r.error };

  if (flytTil) {
    const m = await moveLeadStageAction({ leadId: input.leadId, toStage: flytTil });
    // «Allerede i denne stage» er ikke en fejl her.
    if (!m.ok && !String(m.error).includes('allerede')) return { ok: false, error: m.error };
  }
  revalidatePath('/pipeline');
  revalidatePath(`/leads/${input.leadId}`);
  return { ok: true };
}
