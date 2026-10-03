'use server';

/**
 * Henter adresserne ind i vores egen tabel. Kører i produktionen, hvor
 * databasen er — derfor en knap og ikke et script på Jacobs Mac.
 */
import { revalidatePath } from 'next/cache';
import { importerKommune, KOMMUNER } from '@/lib/adresser';

export async function importerAction(kommunekode?: string): Promise<{ ok: boolean; skrevet?: number; fejl?: string }> {
  const koder = kommunekode ? [kommunekode] : KOMMUNER.map((k) => k.kode);
  let skrevet = 0;
  try {
    for (const k of koder) skrevet += await importerKommune(k);
    revalidatePath('/admin/adresser');
    return { ok: true, skrevet };
  } catch (e) {
    return { ok: false, fejl: e instanceof Error ? e.message : String(e), skrevet };
  }
}
