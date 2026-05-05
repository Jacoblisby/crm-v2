'use server';

import { searchAddress, getAddressDetails } from '@/lib/services/dawa';
import { lookupPropertyByAddressId } from '@/lib/services/boligsiden';
import { computeEstimate, type StandLevel } from '@/lib/services/price-engine';

export async function searchAddressAction(query: string) {
  try {
    const results = await searchAddress(query);
    return { ok: true as const, results };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Ukendt fejl',
    };
  }
}

export async function lookupAddressAction(addressId: string) {
  try {
    const details = await getAddressDetails(addressId);
    if (!details) return { ok: false as const, error: 'Adresse ikke fundet' };

    // Hent præcis bolig-detalje via Boligsiden's /addresses/{dawa-uuid}-endpoint.
    // Det er den ENESTE måde at få korrekt BBR-data på den specifikke lejlighed.
    const property = await lookupPropertyByAddressId(addressId);

    return {
      ok: true as const,
      address: details,
      property,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Ukendt fejl',
    };
  }
}

export interface ComputeEstimateInput {
  postalCode: string;
  kvm: number;
  yearBuilt: number | null;
  rooms: number | null;
  stand: StandLevel;
  driftTotalYearly: number;
  currentListingPrice: number | null;
}

export async function computeEstimateAction(input: ComputeEstimateInput) {
  try {
    const result = await computeEstimate(input);
    return { ok: true as const, result };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Ukendt fejl',
    };
  }
}
