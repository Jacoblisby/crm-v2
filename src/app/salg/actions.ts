'use server';

import { db } from '@/lib/db/client';
import { leads, leadCommunications } from '@/lib/db/schema';
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
  haeftelseEf?: number;
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

export interface OutOfAreaLeadInput {
  fullName: string;
  email: string;
  phone: string;
  fullAddress: string;
  postalCode: string;
  city: string;
  message?: string;
}

/**
 * Opret lead for adresse uden for vores købs-områder.
 * Vi laver ingen prisberegning, men gemmer kontakten så Jacob kan
 * vurdere om sagen alligevel giver mening (eller når vi udvider).
 */
export async function submitOutOfAreaLeadAction(input: OutOfAreaLeadInput) {
  if (!input.fullName || !input.email || !input.phone) {
    return { ok: false as const, error: 'Mangler kontaktoplysninger' };
  }
  try {
    const [lead] = await db
      .insert(leads)
      .values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        address: input.fullAddress,
        postalCode: input.postalCode,
        city: input.city,
        propertyType: 'Ejerlejlighed',
        stageSlug: 'ny-lead',
        stageChangedAt: new Date(),
        priority: 1,
        source: 'boligberegner-out-of-area',
        notes: [
          `🌍 OUT-OF-AREA LEAD`,
          `Postnr ${input.postalCode} er uden for vores hovedområder (2630/4000/4100/4400/4700).`,
          `Kontakt: ${input.fullName} (${input.email}, ${input.phone})`,
          `Adresse: ${input.fullAddress}`,
          input.message ? `\nKundens besked:\n${input.message}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      })
      .returning({ id: leads.id });
    await db.insert(leadCommunications).values({
      leadId: lead.id,
      type: 'note',
      direction: 'in',
      subject: 'Out-of-area lead via boligberegner',
      body: `Indkommet via /salg fra ${input.postalCode}.`,
      createdBy: 'boligberegner',
    });
    return { ok: true as const, leadId: lead.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Ukendt fejl',
    };
  }
}
