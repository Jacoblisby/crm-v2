/**
 * Historiske transaktioner — 145 tinglyste handler i Næstved/Kalundborg-området.
 * Bruges som primær comparables-data i pris-engine.
 *
 * VÆGTNING:
 *   Samme vejnavn (proxy for ejerforening): 3.0
 *   Samme postnr: 1.0
 *   Samme husnr (samme bygning): 4.0 (sjældent men sker)
 *
 * Data hentet fra Vurderingsstyrelsens transaktions-eksport, april 2026.
 */
import historicalData from '@/lib/data/historical-transactions.json';

export interface HistoricalTransaction {
  address: string;
  roadName: string | null;
  houseNumber: string | null;
  floor: string | null;
  door: string | null;
  postalCode: string | null;
  kvm: number;
  price: number;
  pricePerSqm: number | null;
  date: string | null;
  coordinates: { lon: number; lat: number } | null;
}

export const HISTORICAL_TRANSACTIONS: HistoricalTransaction[] =
  historicalData as HistoricalTransaction[];

interface FindOpts {
  postalCode: string;
  /** Samme vejnavn (proxy for ejerforening) — vægtes 3x */
  roadName?: string | null;
  /** Samme husnr (samme bygning) — vægtes 4x */
  houseNumber?: string | null;
  /** Subject's m², bruges til at filtrere lignende størrelse */
  kvm: number;
  /** ±20% kvm-tolerance som default */
  kvmTolerancePct?: number;
}

export interface WeightedTransaction extends HistoricalTransaction {
  weight: number;
}

/**
 * Find sammenlignelige historiske handler med vægt baseret på relevans.
 * Returnerer sorteret liste (nyeste/mest relevante først).
 */
export function findHistoricalComparables(opts: FindOpts): WeightedTransaction[] {
  const tolerance = opts.kvmTolerancePct ?? 0.2;
  const kvmMin = opts.kvm * (1 - tolerance);
  const kvmMax = opts.kvm * (1 + tolerance);

  const matches: WeightedTransaction[] = [];
  for (const t of HISTORICAL_TRANSACTIONS) {
    if (!t.kvm || t.kvm < kvmMin || t.kvm > kvmMax) continue;
    if (t.postalCode !== opts.postalCode) continue;
    if (!t.pricePerSqm || t.pricePerSqm <= 0) continue;

    let weight = 1.0; // base: same postnr
    if (opts.roadName && t.roadName === opts.roadName) {
      weight = 3.0; // same street/EF
      if (opts.houseNumber && t.houseNumber === opts.houseNumber) {
        weight = 4.0; // same building
      }
    }

    // Recency boost: handel <12 mdr × 1.2, <6 mdr × 1.5
    if (t.date) {
      const ageMonths = (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths < 6) weight *= 1.5;
      else if (ageMonths < 12) weight *= 1.2;
    }

    matches.push({ ...t, weight });
  }

  // Sort by weight desc, then recency desc
  matches.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return 0;
  });

  return matches;
}

/**
 * Vægtet median (kr/m²) baseret på relevans-vægte.
 * Eksempel: 1 handel med vægt 3 tæller som 3 handler i medianen.
 */
export function weightedMedianPricePerSqm(comps: WeightedTransaction[]): number {
  if (comps.length === 0) return 0;
  const expanded: number[] = [];
  for (const c of comps) {
    if (!c.pricePerSqm) continue;
    const count = Math.round(c.weight);
    for (let i = 0; i < count; i++) expanded.push(c.pricePerSqm);
  }
  if (expanded.length === 0) return 0;
  expanded.sort((a, b) => a - b);
  const mid = Math.floor(expanded.length / 2);
  return expanded.length % 2 === 0
    ? Math.round((expanded[mid - 1] + expanded[mid]) / 2)
    : expanded[mid];
}
