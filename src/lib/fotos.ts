/**
 * Billeder fra boligberegneren.
 *
 * Kunden vælger billeder på trinnet «Detaljer». Browseren gør dem mindre
 * (højst 1600 px, JPEG) og sender dem ét ad gangen, før beregneren er
 * indsendt. De ligger derfor først uden lead. Når beregneren indsendes,
 * kobles de på det lead, der bliver oprettet.
 *
 * Billederne ligger i Postgres (bytea). Ti billeder à ~300 kB pr. lead er
 * ingenting for databasen, og så er de med i backuppen uden at vi skal
 * holde styr på et filsystem i containeren, som forsvinder ved redeploy.
 *
 * Tabellen oprettes af koden selv (CREATE TABLE IF NOT EXISTS), fordi
 * migrationer ikke køres automatisk ved deploy.
 *
 * Browserens genkodning fjerner EXIF, så GPS-position fra telefonen følger
 * ikke med.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

export const MAKS_FOTOS = 10;
export const MAKS_BYTES = 3 * 1024 * 1024;

let klar: Promise<void> | null = null;

function sikrTabel(): Promise<void> {
  klar ??= (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lead_photos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
        mime text NOT NULL,
        data bytea NOT NULL,
        bytes integer NOT NULL,
        width integer,
        height integer,
        name text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS lead_photos_lead_idx ON lead_photos (lead_id)`);
  })().catch((e) => {
    klar = null;
    throw e;
  });
  return klar;
}

type Rows<T> = T[];
const rows = <T>(r: unknown) => r as Rows<T>;

export async function gemFoto(f: {
  base64: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  name: string | null;
}): Promise<string> {
  await sikrTabel();
  // Billeder, der aldrig blev til et lead (kunden gav op), ryddes efter 7 dage.
  await db.execute(sql`DELETE FROM lead_photos WHERE lead_id IS NULL AND created_at < now() - interval '7 days'`);
  const r = rows<{ id: string }>(
    await db.execute(sql`
      INSERT INTO lead_photos (mime, data, bytes, width, height, name)
      VALUES (${f.mime}, decode(${f.base64}, 'base64'), ${f.bytes}, ${f.width}, ${f.height}, ${f.name})
      RETURNING id
    `),
  );
  return r[0].id;
}

/** Kun billeder, der endnu ikke hører til et lead, kan slettes af kunden. */
export async function sletLoestFoto(id: string): Promise<void> {
  await sikrTabel();
  await db.execute(sql`DELETE FROM lead_photos WHERE id = ${id} AND lead_id IS NULL`);
}

/** Kobler kundens billeder på leadet. Returnerer hvor mange der blev koblet. */
export async function knytFotos(leadId: string, ids: string[]): Promise<number> {
  const gyldige = ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, MAKS_FOTOS);
  if (gyldige.length === 0) return 0;
  await sikrTabel();
  const r = rows<{ id: string }>(
    await db.execute(sql`
      UPDATE lead_photos SET lead_id = ${leadId}
      WHERE lead_id IS NULL AND id IN (${sql.join(gyldige.map((g) => sql`${g}::uuid`), sql`, `)})
      RETURNING id
    `),
  );
  return r.length;
}

export interface FotoInfo {
  id: string;
  width: number | null;
  height: number | null;
  bytes: number;
  name: string | null;
  createdAt: Date;
}

export async function fotosForLead(leadId: string): Promise<FotoInfo[]> {
  await sikrTabel();
  const r = rows<{ id: string; width: number | null; height: number | null; bytes: number; name: string | null; created_at: string | Date }>(
    await db.execute(sql`
      SELECT id, width, height, bytes, name, created_at FROM lead_photos
      WHERE lead_id = ${leadId} ORDER BY created_at
    `),
  );
  return r.map((x) => ({ id: x.id, width: x.width, height: x.height, bytes: x.bytes, name: x.name, createdAt: new Date(x.created_at) }));
}

/** Antal billeder pr. lead, til mærket i pipelinen. */
export async function antalFotos(leadIds: string[]): Promise<Map<string, number>> {
  const ud = new Map<string, number>();
  if (leadIds.length === 0) return ud;
  await sikrTabel();
  const r = rows<{ lead_id: string; n: number | string }>(
    await db.execute(sql`
      SELECT lead_id, count(*) AS n FROM lead_photos
      WHERE lead_id IN (${sql.join(leadIds.map((g) => sql`${g}::uuid`), sql`, `)})
      GROUP BY lead_id
    `),
  );
  for (const x of r) ud.set(x.lead_id, Number(x.n));
  return ud;
}

export async function hentFoto(id: string): Promise<{ mime: string; data: Buffer } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await sikrTabel();
  const r = rows<{ mime: string; b64: string }>(
    await db.execute(sql`SELECT mime, encode(data, 'base64') AS b64 FROM lead_photos WHERE id = ${id}::uuid`),
  );
  if (!r[0]) return null;
  return { mime: r[0].mime, data: Buffer.from(r[0].b64.replace(/\s/g, ''), 'base64') };
}
