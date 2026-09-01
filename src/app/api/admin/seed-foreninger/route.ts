/**
 * POST /api/admin/seed-foreninger
 *
 * Flytter opkøbs-tragten fra regnearket "Ejerforeninger breve Status" ind i
 * databasen. Kilden er src/lib/data/ejerforeninger-seed.json, som er bygget
 * af arket plus Resights' portefølje-eksport.
 *
 * HVORFOR DET HER FINDES: i regnearket blev "vi ejer" vedligeholdt i hånden.
 * Tallet stod til 42; det reelle var 69. Ingen kunne se, at det var forældet,
 * fordi der ikke stod hvornår det sidst var talt. Her genberegnes både
 * unitCount og ownedCount ved hver kørsel, og dataUpdatedAt viser alderen.
 *
 * Idempotent: kører på foreningens navn og opdaterer frem for at oprette
 * dubletter. Kan køres igen efter hver ny Resights-eksport.
 *
 * Auth: Bearer ${CRON_SECRET}
 * Body (valgfrit): { "dryRun": true } → returnér hvad der ville ske
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { housingAssociations } from '@/lib/db/schema';
import seed from '@/lib/data/ejerforeninger-seed.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface SeedForening {
  by: string;
  adresse: string;
  navn: string;
  enheder: number | null;
  kvmFrom: number | null;
  kvmTo: number | null;
  status: string;
  hvorfor: string;
  nextStep: string;
  letterRounds: number;
  bfe: number[];
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { dryRun?: boolean } = {};
  try {
    const t = await req.text();
    if (t) body = JSON.parse(t);
  } catch {}

  const ejedeBfe = new Set((seed.ejede as { bfe: number }[]).map((e) => e.bfe));
  const now = new Date();
  const rapport: {
    navn: string; by: string; enheder: number; bfe: number; ejet: number; andel: number;
    handling: 'oprettet' | 'opdateret' | 'dry-run';
  }[] = [];

  for (const f of seed.foreninger as SeedForening[]) {
    // Navnet er unikt i tabellen. Flere foreninger hedder "Ukendt" i arket,
    // så dem gør vi entydige med adressen — ellers ville de overskrive hinanden.
    const navn = f.navn && f.navn !== 'Ukendt' ? f.navn : `${f.navn || 'Ukendt'} · ${f.adresse}`;
    const ejet = f.bfe.filter((b) => ejedeBfe.has(b)).length;
    const enheder = f.bfe.length || f.enheder || 0;

    const vaerdier = {
      name: navn,
      streetName: f.adresse || null,
      city: f.by || null,
      notes: [f.hvorfor, f.nextStep].filter(Boolean).join(' · ') || null,
      unitCount: enheder,
      kvmFrom: f.kvmFrom,
      kvmTo: f.kvmTo,
      status: f.status,
      statusReason: f.hvorfor || null,
      letterRounds: f.letterRounds,
      ownedCount: ejet,
      dataUpdatedAt: now,
      updatedAt: now,
    };

    const andel = enheder ? Math.round((1000 * ejet) / enheder) / 10 : 0;

    if (body.dryRun) {
      rapport.push({ navn, by: f.by, enheder, bfe: f.bfe.length, ejet, andel, handling: 'dry-run' });
      continue;
    }

    const [eksisterende] = await db
      .select({ id: housingAssociations.id })
      .from(housingAssociations)
      .where(eq(housingAssociations.name, navn))
      .limit(1);

    if (eksisterende) {
      await db.update(housingAssociations).set(vaerdier).where(eq(housingAssociations.id, eksisterende.id));
      rapport.push({ navn, by: f.by, enheder, bfe: f.bfe.length, ejet, andel, handling: 'opdateret' });
    } else {
      await db.insert(housingAssociations).values(vaerdier);
      rapport.push({ navn, by: f.by, enheder, bfe: f.bfe.length, ejet, andel, handling: 'oprettet' });
    }
  }

  rapport.sort((a, b) => b.andel - a.andel);

  return NextResponse.json({
    ok: true,
    kilde: seed.kilde,
    dryRun: !!body.dryRun,
    foreninger: rapport.length,
    enhederIAlt: rapport.reduce((s, r) => s + r.enheder, 0),
    ejetIAlt: rapport.reduce((s, r) => s + r.ejet, 0),
    rapport,
  });
}
