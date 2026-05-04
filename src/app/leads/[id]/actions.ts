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
