/**
 * Adressesøgning (DAWA autocomplete) som almindeligt JSON-API, ikke en
 * server action.
 *
 * Hvorfor: AddressCta kaldte tidligere `searchAddressAction` (en React
 * server action, POST tilbage til siden selv). Den viste sig upålidelig i
 * produktion — de fleste kald blev afbrudt (net::ERR_ABORTED), kun nogle
 * få lykkedes, uden noget mønster der pegede på debounce eller input-måde.
 * En almindelig Route Handler har ingen af de lag (RSC-streaming,
 * React-transitions, action-id-matching mod den route siden blev
 * renderet fra) der kan forklare den flakyness — det er et rent GET der
 * returnerer JSON, identisk med enhver anden API-rute.
 *
 * Kilde: vores egen adressetabel (src/lib/adresser.ts). Statens DAWA blev
 * lukket 1. oktober 2026, og spejlet, vi lå på bagefter, er en tredjepart.
 * Er tabellen tom — fx før første import — bruges spejlet som nødspor, så
 * feltet aldrig står dødt.
 */
import { NextRequest, NextResponse } from 'next/server';
import { searchAddress } from '@/lib/services/dawa';
import { soeg } from '@/lib/adresser';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  if (!query || query.trim().length < 3) return NextResponse.json({ ok: true as const, results: [] });
  try {
    let results = await soeg(query).catch((e) => {
      console.warn('[search-address] egen tabel fejlede:', e);
      return [];
    });
    let kilde = 'db';
    if (results.length === 0) {
      results = await searchAddress(query);
      kilde = 'spejl';
    }
    return NextResponse.json({ ok: true as const, results, kilde });
  } catch (err) {
    return NextResponse.json(
      { ok: false as const, error: err instanceof Error ? err.message : 'Ukendt fejl' },
      { status: 500 },
    );
  }
}
