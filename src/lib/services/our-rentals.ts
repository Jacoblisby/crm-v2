/**
 * Vores faktiske udlejnings-data fra budgetlister (~218 lejemål, opdateret 2026-05).
 * Bruges til at give præcise leje-estimater i boligberegneren ved match på samme
 * vejnavn (proxy for ejerforening) eller samme by, i stedet for at falde tilbage
 * til en hardcoded postnr-rate.
 */
import rentals from '@/lib/data/our-rentals.json';

export interface OurRental {
  address: string;
  postal: string;
  city: string;
  monthlyRent: number;
  vandAconto: number;
  varmeAconto: number;
  ejendom: string | null;
  lobenr: string | null;
}

const DATA = rentals as OurRental[];

function normalizeStreet(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Estimer månedlig leje for en adresse baseret på vores faktiske data.
 * Returnerer både tallet og hvor sikkert vi er på det.
 */
export interface RentEstimateResult {
  monthlyRent: number;
  source: 'same-vej' | 'same-postal' | 'no-match';
  sampleSize: number;
  // Aconto vand/varme — gennemsnit fra vores data, til kunden som reference
  avgVandAconto: number;
  avgVarmeAconto: number;
}

export function estimateMonthlyRent(input: {
  postalCode: string;
  roadName?: string | null;
}): RentEstimateResult {
  const { postalCode, roadName } = input;
  const samePostal = DATA.filter((r) => r.postal === postalCode && r.monthlyRent > 0);

  // Same-vej match (proxy for samme ejerforening / bygning)
  if (roadName) {
    const target = normalizeStreet(roadName);
    const sameVej = samePostal.filter((r) => normalizeStreet(r.address).startsWith(target));
    if (sameVej.length > 0) {
      return {
        monthlyRent: median(sameVej.map((r) => r.monthlyRent)),
        source: 'same-vej',
        sampleSize: sameVej.length,
        avgVandAconto: median(sameVej.map((r) => r.vandAconto).filter((v) => v > 0)),
        avgVarmeAconto: median(sameVej.map((r) => r.varmeAconto).filter((v) => v > 0)),
      };
    }
  }

  if (samePostal.length > 0) {
    return {
      monthlyRent: median(samePostal.map((r) => r.monthlyRent)),
      source: 'same-postal',
      sampleSize: samePostal.length,
      avgVandAconto: median(samePostal.map((r) => r.vandAconto).filter((v) => v > 0)),
      avgVarmeAconto: median(samePostal.map((r) => r.varmeAconto).filter((v) => v > 0)),
    };
  }

  return {
    monthlyRent: 0,
    source: 'no-match',
    sampleSize: 0,
    avgVandAconto: 0,
    avgVarmeAconto: 0,
  };
}

function median(values: number[]): number {
  const sorted = [...values].filter((v) => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}
