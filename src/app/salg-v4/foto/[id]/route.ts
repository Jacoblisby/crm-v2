/**
 * Viser ét billede fra beregneren. Id'et er en tilfældig UUID, så kun den,
 * der har fået adressen (kunden selv og CRM'et), kan se billedet.
 */
import { hentFoto } from '@/lib/fotos';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await hentFoto(id);
  if (!f) return new Response('Findes ikke', { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: {
      'Content-Type': f.mime,
      'Cache-Control': 'private, max-age=86400, immutable',
      'X-Robots-Tag': 'noindex',
    },
  });
}
