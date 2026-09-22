'use server';

/**
 * Upload af ét billede fra beregneren. Browseren har allerede gjort det
 * mindre og lavet det om til JPEG; her tjekkes kun, at det er et billede
 * og ikke for stort.
 */
import { gemFoto, sletLoestFoto, MAKS_BYTES } from '@/lib/fotos';

export async function uploadFotoAction(input: {
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input.dataUrl ?? '');
  if (!m) return { ok: false, error: 'Filen er ikke et billede.' };
  const [, mime, base64] = m;
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAKS_BYTES) return { ok: false, error: 'Billedet er for stort.' };

  // Første bytes skal passe med typen — ellers er det ikke et billede.
  const hoved = Buffer.from(base64.slice(0, 16), 'base64');
  const erJpeg = hoved[0] === 0xff && hoved[1] === 0xd8;
  const erPng = hoved[0] === 0x89 && hoved[1] === 0x50;
  const erWebp = hoved.slice(8, 12).toString() === 'WEBP' || hoved.slice(0, 4).toString() === 'RIFF';
  if (!(erJpeg || erPng || erWebp)) return { ok: false, error: 'Filen er ikke et billede.' };

  try {
    const id = await gemFoto({
      base64,
      mime,
      bytes,
      width: Number.isFinite(input.width) ? Math.round(input.width) : null,
      height: Number.isFinite(input.height) ? Math.round(input.height) : null,
      name: (input.name ?? '').slice(0, 120) || null,
    });
    return { ok: true, id };
  } catch (e) {
    console.error('[foto] upload fejlede', e);
    return { ok: false, error: 'Billedet kunne ikke gemmes. Prøv igen.' };
  }
}

export async function sletFotoAction(id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await sletLoestFoto(id);
}
