/**
 * Mailtråde: kundens svar og vores svar tilbage skal ligge i samme tråd
 * hos kunden.
 *
 * Det kræver to ting: at vi gemmer Message-ID fra kundens mail, og at vores
 * svar sender den med som In-Reply-To/References, med «Re: <emne>».
 *
 * Kolonnerne oprettes af koden selv (ADD COLUMN IF NOT EXISTS), fordi
 * migrationer ikke køres ved deploy. De står derfor ikke i Drizzle-skemaet
 * og læses med rå SQL — så et deploy før kolonnen findes, kan ikke vælte
 * de almindelige opslag på lead_communications.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

let klar: Promise<void> | null = null;
function sikrKolonner(): Promise<void> {
  klar ??= (async () => {
    await db.execute(sql`ALTER TABLE lead_communications ADD COLUMN IF NOT EXISTS message_id text`);
    await db.execute(sql`ALTER TABLE lead_communications ADD COLUMN IF NOT EXISTS references_hdr text`);
  })().catch((e) => {
    klar = null;
    throw e;
  });
  return klar;
}

export async function gemMailHeaders(commId: string, messageId: string | null, references: string | null) {
  if (!messageId && !references) return;
  await sikrKolonner();
  await db.execute(sql`
    UPDATE lead_communications SET message_id = ${messageId}, references_hdr = ${references}
    WHERE id = ${commId}::uuid
  `);
}

export interface Traad {
  subject: string;
  inReplyTo: string | null;
  references: string | null;
}

/** Hvad et svar på denne mail skal have med for at lande i samme tråd. */
export async function traadFor(commId: string, leadId: string): Promise<Traad | null> {
  if (!/^[0-9a-f-]{36}$/i.test(commId)) return null;
  await sikrKolonner();
  const r = (await db.execute(sql`
    SELECT subject, message_id, references_hdr FROM lead_communications
    WHERE id = ${commId}::uuid AND lead_id = ${leadId}::uuid AND direction = 'in'
  `)) as unknown as { subject: string | null; message_id: string | null; references_hdr: string | null }[];
  const x = r[0];
  if (!x) return null;
  const refs = [x.references_hdr, x.message_id].filter(Boolean).join(' ').trim();
  return { subject: reEmne(x.subject ?? ''), inReplyTo: x.message_id, references: refs || null };
}

/** «Re: <emne>» uden at stable Re:/SV:/Fwd: ovenpå hinanden. */
export function reEmne(emne: string): string {
  const ren = emne.replace(/^\s*((re|sv|aw|fw|fwd|vs|wg)\s*:\s*)+/i, '').trim();
  return `Re: ${ren || 'din bolig'}`;
}
