/**
 * Pipelinens stadier — og automatikken, der flytter leads mellem dem.
 *
 * Kolonnerne hed før det, der var sket (Kontaktet, Mail sendt, Interesse), og
 * fire af otte stod tomme, fordi ingen af dem sagde, hvad man skulle gøre.
 * Nu er hvert stadie én næste handling, i den rækkefølge en handel kører:
 *
 *   Ny lead → Besigtigelse foreslået → aftalt → afholdt → Bud afgivet → Købt
 *
 * To sidespor til dem, der ikke er klar: «Ikke enige om pris» og «Vil ikke
 * sælge nu». Begge følges op en gang om måneden.
 *
 * Opfølgning er ikke et stadie for sig. Et lead, der har ventet for længe,
 * bliver stående og får et mærke på kortet — ellers skulle man flytte kort
 * for at huske noget, systemet selv kan regne ud.
 *
 * Tabellen skrives af koden (INSERT … ON CONFLICT), fordi migrationer ikke
 * køres ved deploy. De gamle stadier slettes ikke — de sættes som terminale,
 * så de forsvinder fra tavlen, men historikken stadig kan læses.
 */
import { and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadStageHistory } from '@/lib/db/schema';

export interface StadieDef {
  slug: string;
  name: string;
  slaDays: number | null;
  isTerminal: boolean;
  isBidReady: boolean;
  /** Hvad der skal ske, mens leadet står her — vises under kolonnen. */
  handling: string;
}

export const STADIER: StadieDef[] = [
  { slug: 'ny-lead', name: 'Ny lead', slaDays: 1, isTerminal: false, isBidReady: false, handling: 'Send booking-udkast' },
  { slug: 'besigtigelse-foreslaaet', name: 'Besigtigelse foreslået', slaDays: 3, isTerminal: false, isBidReady: false, handling: 'Venter på svar · følg op efter 3 dage' },
  { slug: 'besigtigelse-aftalt', name: 'Besigtigelse aftalt', slaDays: null, isTerminal: false, isBidReady: false, handling: 'Tid i kalenderen — kør derud' },
  { slug: 'besigtigelse-afholdt', name: 'Besigtigelse afholdt', slaDays: 1, isTerminal: false, isBidReady: true, handling: 'Giv bud' },
  { slug: 'bud-afgivet', name: 'Bud afgivet', slaDays: 5, isTerminal: false, isBidReady: true, handling: 'Venter på svar på buddet' },
  { slug: 'ikke-enige-om-pris', name: 'Ikke enige om pris', slaDays: 30, isTerminal: false, isBidReady: true, handling: 'Månedlig opfølgning' },
  { slug: 'vil-ikke-saelge-nu', name: 'Vil ikke sælge nu', slaDays: 30, isTerminal: false, isBidReady: false, handling: 'Månedlig opfølgning' },
  { slug: 'koebt', name: 'Købt', slaDays: null, isTerminal: true, isBidReady: false, handling: '' },
  { slug: 'tabt', name: 'Tabt', slaDays: null, isTerminal: true, isBidReady: false, handling: '' },
  { slug: 'arkiveret', name: 'Arkiveret', slaDays: null, isTerminal: true, isBidReady: false, handling: '' },
];

export const HANDLING: Record<string, string> = Object.fromEntries(STADIER.map((s) => [s.slug, s.handling]));

/** Rækkefølgen i handlen. Automatikken flytter kun fremad. */
const ORDEN = ['ny-lead', 'besigtigelse-foreslaaet', 'besigtigelse-aftalt', 'besigtigelse-afholdt', 'bud-afgivet'];
export const orden = (slug: string) => ORDEN.indexOf(slug);

/** Stadier automatikken aldrig rører: Jacob har selv sat dem. */
export const FREDEDE = ['ikke-enige-om-pris', 'vil-ikke-saelge-nu', 'koebt', 'tabt', 'arkiveret'];

/** De gamle stadier, og hvor et lead ender, hvis der ikke er sendt booking. */
const GAMLE: Record<string, string> = {
  kontaktet: 'ny-lead',
  'mail-sendt': 'ny-lead',
  interesse: 'ny-lead',
  'afventer-lejer': 'ny-lead',
  fremvisning: 'besigtigelse-aftalt',
  'aktivt-bud': 'bud-afgivet',
  lukket: 'koebt',
};

let seedet: Promise<void> | null = null;

/** Skriver stadierne og skjuler de gamle. Kører én gang pr. proces. */
export function sikrStadier(): Promise<void> {
  seedet ??= (async () => {
    for (const [i, s] of STADIER.entries()) {
      await db.execute(sql`
        INSERT INTO pipeline_stages (slug, name, sla_days, is_terminal, is_bid_ready, sort_order)
        VALUES (${s.slug}, ${s.name}, ${s.slaDays}, ${s.isTerminal}, ${s.isBidReady}, ${i + 1})
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          sla_days = EXCLUDED.sla_days,
          is_terminal = EXCLUDED.is_terminal,
          is_bid_ready = EXCLUDED.is_bid_ready,
          sort_order = EXCLUDED.sort_order
      `);
    }
    // Gamle kolonner: bliver stående i databasen for historikkens skyld,
    // men markeres terminale, så de ikke vises på tavlen.
    await db.execute(sql`
      UPDATE pipeline_stages SET is_terminal = true, sort_order = 90 + sort_order
      WHERE slug NOT IN (${sql.join(STADIER.map((s) => sql`${s.slug}`), sql`, `)})
    `);
  })().catch((e) => {
    seedet = null;
    throw e;
  });
  return seedet;
}

export interface BookingStatus {
  sendtAt: Date | null;
  tid: Date | null;
  svarAt: Date | null;
}

/**
 * Flytter leads derhen, hvor de reelt er: booking-mail sendt, kunden har
 * bekræftet en tid, tiden er passeret. Kun fremad, og aldrig et lead Jacob
 * selv har parkeret.
 */
export async function flytEfterBooking(booking: Map<string, BookingStatus>, nu = new Date()): Promise<number> {
  await sikrStadier();

  const aktive = await db
    .select({ id: leads.id, stageSlug: leads.stageSlug })
    .from(leads)
    .where(and(isNull(leads.deletedAt), notInArray(leads.stageSlug, FREDEDE)));

  let flyttet = 0;
  for (const l of aktive) {
    const maal = maalstadie(l.stageSlug, booking.get(l.id), nu);
    if (!maal || maal === l.stageSlug) continue;
    await flyt(l.id, l.stageSlug, maal, 'automatik');
    flyttet++;
  }
  return flyttet;
}

/** Hvor hører leadet hjemme? null = lad det stå. */
function maalstadie(nu_stadie: string, b: BookingStatus | undefined, nu: Date): string | null {
  const fraGammel = GAMLE[nu_stadie];
  const start = fraGammel ?? nu_stadie;

  let maal = start;
  if (b?.sendtAt) {
    maal = 'besigtigelse-foreslaaet';
    if (b.tid && b.svarAt) {
      // Kunden har svaret på en mail med et tidspunkt — aftalen står.
      maal = b.tid.getTime() + 60 * 60_000 < nu.getTime() ? 'besigtigelse-afholdt' : 'besigtigelse-aftalt';
    }
  }

  // Aldrig baglæns: et lead, der er flyttet videre i hånden, bliver stående.
  if (orden(maal) >= 0 && orden(start) >= 0 && orden(maal) < orden(start)) maal = start;
  return maal === nu_stadie ? null : maal;
}

export async function flyt(leadId: string, fra: string, til: string, af: string): Promise<void> {
  const nu = new Date();
  await db.update(leads).set({ stageSlug: til, stageChangedAt: nu, updatedAt: nu }).where(eq(leads.id, leadId));
  await db.insert(leadStageHistory).values({ leadId, fromStage: fra, toStage: til, changedBy: af });
}

/** Hvor mange gange leadet har været i «Bud afgivet» — bud 1, bud 2, … */
export async function budRunder(leadIds: string[]): Promise<Map<string, number>> {
  const ud = new Map<string, number>();
  if (leadIds.length === 0) return ud;
  const r = await db
    .select({ leadId: leadStageHistory.leadId, toStage: leadStageHistory.toStage })
    .from(leadStageHistory)
    .where(and(inArray(leadStageHistory.leadId, leadIds), eq(leadStageHistory.toStage, 'bud-afgivet')));
  for (const x of r) ud.set(x.leadId, (ud.get(x.leadId) ?? 0) + 1);
  return ud;
}
