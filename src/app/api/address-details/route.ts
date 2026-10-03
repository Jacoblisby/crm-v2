/**
 * Adresse- og boligopslag (DAWA + Boligsiden) som almindeligt JSON-API.
 * Samme begrundelse som search-address/route.ts — se noten dér.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAddressDetails } from '@/lib/services/dawa';
import { lookupPropertyByAddressId } from '@/lib/services/boligsiden';

export async function GET(req: NextRequest) {
  const addressId = req.nextUrl.searchParams.get('id') ?? '';
  if (!addressId) {
    return NextResponse.json({ ok: false as const, error: 'Mangler adresse-id' }, { status: 400 });
  }
  try {
    const details = await getAddressDetails(addressId);
    if (!details) {
      return NextResponse.json({ ok: false as const, error: 'Adresse ikke fundet' }, { status: 404 });
    }
    // Hent præcis bolig-detalje via Boligsiden's /addresses/{dawa-uuid}-endpoint.
    // Det er den ENESTE måde at få korrekt BBR-data på den specifikke lejlighed.
    const property = await lookupPropertyByAddressId(addressId);
    return NextResponse.json({ ok: true as const, address: details, property });
  } catch (err) {
    return NextResponse.json(
      { ok: false as const, error: err instanceof Error ? err.message : 'Ukendt fejl' },
      { status: 500 },
    );
  }
}
