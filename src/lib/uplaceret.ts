/**
 * Svar, CRM'et ikke kunne placere på et lead.
 *
 * Før blev de smidt væk: modtagelsen svarede «ingen match» til Resend, og
 * mailen fandtes ingen steder. Et kundesvar fra en anden adresse end den,
 * kunden oprettede sig med, forsvandt derfor sporløst, og det kom først for
 * en dag, da kunden selv ringede. Nu ligger de her, til de er placeret.
 *
 * Tabellen oprettes af koden selv, fordi migrationer ikke køres ved deploy.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

let klar: Promise<void> | null = null;
function sikrTabel(): Promise<void> {
  klar ??= (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inbound_uplaceret (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        fra_mail text NOT NULL,
        fra_navn text,
        til text,
        emne text,
        tekst text,
        placeret_paa uuid,
        oprettet timestamptz NOT NULL DEFAULT now()
      )
    `);
  })().catch((e) => {
    klar = null;
    throw e;
  });
  return klar;
}

export async function gemUplaceret(m: { fraMail: string; fraNavn: string; til: string[]; emne: string; tekst: string }) {
  await sikrTabel();
  await db.execute(sql`
    INSERT INTO inbound_uplaceret (fra_mail, fra_navn, til, emne, tekst)
    VALUES (${m.fraMail}, ${m.fraNavn || null}, ${m.til.join(', ') || null}, ${m.emne || null}, ${m.tekst.slice(0, 20000)})
  `);
}

export interface Uplaceret {
  id: string;
  fraMail: string;
  fraNavn: string | null;
  til: string | null;
  emne: string | null;
  tekst: string | null;
  oprettet: Date;
}

export async function listUplacerede(): Promise<Uplaceret[]> {
  await sikrTabel();
  const r = (await db.execute(sql`
    SELECT id, fra_mail, fra_navn, til, emne, tekst, oprettet FROM inbound_uplaceret
    WHERE placeret_paa IS NULL ORDER BY oprettet DESC LIMIT 100
  `)) as unknown as { id: string; fra_mail: string; fra_navn: string | null; til: string | null; emne: string | null; tekst: string | null; oprettet: string }[];
  return r.map((x) => ({ id: x.id, fraMail: x.fra_mail, fraNavn: x.fra_navn, til: x.til, emne: x.emne, tekst: x.tekst, oprettet: new Date(x.oprettet) }));
}

export async function antalUplacerede(): Promise<number> {
  await sikrTabel();
  const r = (await db.execute(sql`SELECT count(*)::int AS n FROM inbound_uplaceret WHERE placeret_paa IS NULL`)) as unknown as { n: number }[];
  return Number(r[0]?.n ?? 0);
}

export async function afvis(id: string) {
  await sikrTabel();
  await db.execute(sql`UPDATE inbound_uplaceret SET placeret_paa = '00000000-0000-0000-0000-000000000000' WHERE id = ${id}::uuid`);
}
