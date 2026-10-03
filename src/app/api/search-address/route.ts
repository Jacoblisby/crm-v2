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
 * Kræver ingen DB — ren DAWA-opslag. Se src/lib/services/dawa.ts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { searchAddress } from '@/lib/services/dawa';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';
  try {
    const results = await searchAddress(query);
    return NextResponse.json({ ok: true as const, results });
  } catch (err) {
    return NextResponse.json(
      { ok: false as const, error: err instanceof Error ? err.message : 'Ukendt fejl' },
      { status: 500 },
    );
  }
}
