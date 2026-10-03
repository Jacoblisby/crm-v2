/**
 * Vores egne adresser.
 *
 * Adressevælgeren på saelg.365ejendom.dk er det første felt i tragten. Den
 * hang før på statens DAWA, som blev lukket 1. oktober 2026, og derefter på
 * et spejl drevet af en tredjepart. Begge dele er uden for vores kontrol, og
 * et felt, kunder møder som det allerførste, må ikke kunne forsvinde.
 *
 * Derfor ligger adresserne nu i vores egen database: ét opslag lokalt i
 * stedet for et kald over internettet. Spejlet bruges kun til at fylde
 * tabellen — og som nødspor, hvis tabellen er tom.
 *
 * Når Datafordeleren-servicebrugeren er oprettet, skiftes kilden i
 * «hentSide» til DAR's filudtræk. Resten af filen er uændret.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

const KILDE = 'https://dawa.companydata.dk';
const PR_SIDE = 10_000;

/**
 * Kommunerne vi henter. Sjælland uden for vores købsområde er med, fordi
 * kunder også taster adresser, vi ikke køber i — de skal kunne finde deres
 * bolig og få et nej, ikke et felt der ikke virker.
 */
export const KOMMUNER: { kode: string; navn: string }[] = [
  { kode: '0253', navn: 'Greve' },
  { kode: '0259', navn: 'Køge' },
  { kode: '0265', navn: 'Roskilde' },
  { kode: '0269', navn: 'Solrød' },
  { kode: '0306', navn: 'Odsherred' },
  { kode: '0316', navn: 'Holbæk' },
  { kode: '0320', navn: 'Faxe' },
  { kode: '0326', navn: 'Kalundborg' },
  { kode: '0329', navn: 'Ringsted' },
  { kode: '0330', navn: 'Slagelse' },
  { kode: '0336', navn: 'Stevns' },
  { kode: '0340', navn: 'Sorø' },
  { kode: '0350', navn: 'Lejre' },
  { kode: '0360', navn: 'Lolland' },
  { kode: '0370', navn: 'Næstved' },
  { kode: '0376', navn: 'Guldborgsund' },
  { kode: '0390', navn: 'Vordingborg' },
  { kode: '0169', navn: 'Høje-Taastrup' },
  { kode: '0183', navn: 'Ishøj' },
  { kode: '0187', navn: 'Vallensbæk' },
];

let klar: Promise<void> | null = null;

/** Tabellen oprettes af koden — migrationer køres ikke ved deploy. */
export function sikrTabel(): Promise<void> {
  klar ??= (async () => {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS adresser (
        id uuid PRIMARY KEY,
        betegnelse text NOT NULL,
        vejnavn text NOT NULL,
        husnr text NOT NULL,
        etage text,
        doer text,
        postnr text NOT NULL,
        postnrnavn text NOT NULL,
        kommunekode text NOT NULL,
        adgangsadresseid uuid,
        lat double precision,
        lon double precision,
        bfe integer,
        sog text NOT NULL,
        opdateret timestamptz NOT NULL DEFAULT now()
      )
    `);
    // Præfiks-opslag: «bogensevej 5» rammer indekset direkte.
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS adresser_sog_idx ON adresser (sog text_pattern_ops)
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS adresser_postnr_idx ON adresser (postnr)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS adresser_kommune_idx ON adresser (kommunekode)`);
  })().catch((e) => {
    klar = null;
    throw e;
  });
  return klar;
}

/**
 * Søgetekst. Æøå bliver til ae/oe/aa, så «nørregade» også findes, når
 * kunden skriver «noerregade» — og omvendt, fordi søgningen normaliseres
 * på samme måde.
 */
export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface RaaAdresse {
  id: string;
  betegnelse: string;
  vejnavn: string;
  husnr: string;
  etage: string | null;
  dør: string | null;
  postnr: string;
  postnrnavn: string;
  kommunekode: string;
  adgangsadresseid?: string | null;
  x?: number | null;
  y?: number | null;
  status?: number;
}

async function hentSide(kommunekode: string, side: number): Promise<RaaAdresse[]> {
  const url = `${KILDE}/adresser?kommunekode=${kommunekode}&struktur=mini&side=${side}&per_side=${PR_SIDE}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${kommunekode} side ${side}: HTTP ${res.status}`);
  return (await res.json()) as RaaAdresse[];
}

/**
 * Henter én kommunes adresser og skriver dem ind. Kører i sider à 10.000 og
 * opdaterer rækker, der findes i forvejen, så den kan køres igen uden at
 * tømme tabellen først.
 */
export async function importerKommune(kommunekode: string): Promise<number> {
  await sikrTabel();
  let side = 1;
  let skrevet = 0;

  for (;;) {
    const raekker = await hentSide(kommunekode, side);
    if (raekker.length === 0) break;

    // Kun gyldige adresser (status 1). Historiske og nedlagte vil vi ikke
    // foreslå kunder.
    const gyldige = raekker.filter((r) => r.status === undefined || r.status === 1);

    for (let i = 0; i < gyldige.length; i += 500) {
      const klump = gyldige.slice(i, i + 500);
      const vaerdier = klump.map(
        (r) => sql`(
          ${r.id}::uuid, ${r.betegnelse}, ${r.vejnavn}, ${r.husnr}, ${r.etage}, ${r.dør},
          ${r.postnr}, ${r.postnrnavn}, ${r.kommunekode},
          ${r.adgangsadresseid ?? null}, ${r.y ?? null}, ${r.x ?? null},
          ${normaliser(r.betegnelse)}
        )`,
      );
      await db.execute(sql`
        INSERT INTO adresser (id, betegnelse, vejnavn, husnr, etage, doer, postnr, postnrnavn, kommunekode, adgangsadresseid, lat, lon, sog)
        VALUES ${sql.join(vaerdier, sql`, `)}
        ON CONFLICT (id) DO UPDATE SET
          betegnelse = EXCLUDED.betegnelse,
          vejnavn = EXCLUDED.vejnavn,
          husnr = EXCLUDED.husnr,
          etage = EXCLUDED.etage,
          doer = EXCLUDED.doer,
          postnr = EXCLUDED.postnr,
          postnrnavn = EXCLUDED.postnrnavn,
          kommunekode = EXCLUDED.kommunekode,
          adgangsadresseid = EXCLUDED.adgangsadresseid,
          lat = EXCLUDED.lat,
          lon = EXCLUDED.lon,
          sog = EXCLUDED.sog,
          opdateret = now()
      `);
      skrevet += klump.length;
    }

    if (raekker.length < PR_SIDE) break;
    side++;
  }
  return skrevet;
}

export interface Status {
  ialt: number;
  prKommune: { kommunekode: string; antal: number; opdateret: Date | null }[];
}

export async function status(): Promise<Status> {
  await sikrTabel();
  const r = (await db.execute(sql`
    SELECT kommunekode, count(*)::int AS antal, max(opdateret) AS opdateret
    FROM adresser GROUP BY kommunekode ORDER BY kommunekode
  `)) as unknown as { kommunekode: string; antal: number; opdateret: string | null }[];
  return {
    ialt: r.reduce((n, x) => n + Number(x.antal), 0),
    prKommune: r.map((x) => ({
      kommunekode: x.kommunekode,
      antal: Number(x.antal),
      opdateret: x.opdateret ? new Date(x.opdateret) : null,
    })),
  };
}

/** Samme form som DAWA's autocomplete, så frontenden er uændret. */
export interface Forslag {
  tekst: string;
  adresse: {
    id: string;
    href: string;
    vejnavn: string;
    husnr: string;
    etage: string | null;
    dør: string | null;
    postnr: string;
    postnrnavn: string;
  };
}

/**
 * Søgning. Hvert ord skal findes i adressen, og et ord må gerne være
 * begyndelsen på et andet — «bogen 53 næs» finder «Bogensevej 53, 4700
 * Næstved». Det første ord bruger præfiks-indekset.
 */
export async function soeg(query: string, graense = 10): Promise<Forslag[]> {
  const ord = normaliser(query).split(' ').filter(Boolean);
  if (ord.length === 0) return [];
  await sikrTabel();

  const betingelser = ord.map(
    (o) => sql`(sog LIKE ${o + '%'} OR sog LIKE ${'% ' + o + '%'})`,
  );
  const r = (await db.execute(sql`
    SELECT id, betegnelse, vejnavn, husnr, etage, doer, postnr, postnrnavn
    FROM adresser
    WHERE ${sql.join(betingelser, sql` AND `)}
    ORDER BY length(betegnelse), betegnelse
    LIMIT ${graense}
  `)) as unknown as {
    id: string;
    betegnelse: string;
    vejnavn: string;
    husnr: string;
    etage: string | null;
    doer: string | null;
    postnr: string;
    postnrnavn: string;
  }[];

  return r.map((x) => ({
    tekst: x.betegnelse,
    adresse: {
      id: x.id,
      href: `https://saelg.365ejendom.dk/api/address-details?id=${x.id}`,
      vejnavn: x.vejnavn,
      husnr: x.husnr,
      etage: x.etage,
      dør: x.doer,
      postnr: x.postnr,
      postnrnavn: x.postnrnavn,
    },
  }));
}
