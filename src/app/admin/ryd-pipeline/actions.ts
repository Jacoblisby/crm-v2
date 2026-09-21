'use server';

/**
 * Engangs-oprydning af pipelinen, 21.09.2026.
 *
 * Arkiverer PRÆCIS de leads, der står i data.json — ikke «alt der ikke er
 * de seks». Listen blev låst, da Jacob besluttede oprydningen, så et lead
 * der kommer ind bagefter aldrig kan blive fejet med.
 *
 * Arkivering, ikke sletning: leadet forsvinder fra pipelinen, men mails,
 * noter og historik er intakte, og det kan flyttes tilbage. Hver flytning
 * logges i stage-historikken som enhver anden.
 */
import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadStageHistory } from '@/lib/db/schema';
import data from './data.json';

const AF = 'oprydning 21.09.2026';

export async function rydPipelineAction(): Promise<{ arkiveret: number; tilNyLead: number }> {
  const now = new Date();
  const ids = data.arkiver.map((a) => a.id).filter((id) => !data.behold.includes(id));

  // Kun dem der stadig er aktive — og aldrig et købt lead.
  const aktive = await db
    .select({ id: leads.id, stageSlug: leads.stageSlug })
    .from(leads)
    .where(and(inArray(leads.id, ids), isNull(leads.deletedAt), notInArray(leads.stageSlug, ['arkiveret', 'koebt'])));

  if (aktive.length) {
    await db
      .update(leads)
      .set({ stageSlug: 'arkiveret', stageChangedAt: now, updatedAt: now })
      .where(inArray(leads.id, aktive.map((a) => a.id)));
    await db.insert(leadStageHistory).values(
      aktive.map((a) => ({ leadId: a.id, fromStage: a.stageSlug, toStage: 'arkiveret', changedBy: AF })),
    );
  }

  let tilNyLead = 0;
  for (const id of data.tilNyLead) {
    const [l] = await db
      .select({ stageSlug: leads.stageSlug })
      .from(leads)
      .where(and(eq(leads.id, id), isNull(leads.deletedAt)))
      .limit(1);
    if (l && l.stageSlug !== 'ny-lead') {
      await db.update(leads).set({ stageSlug: 'ny-lead', stageChangedAt: now, updatedAt: now }).where(eq(leads.id, id));
      await db.insert(leadStageHistory).values({ leadId: id, fromStage: l.stageSlug, toStage: 'ny-lead', changedBy: AF });
      tilNyLead++;
    }
  }

  revalidatePath('/');
  revalidatePath('/pipeline');
  revalidatePath('/admin/ryd-pipeline');
  return { arkiveret: aktive.length, tilNyLead };
}
