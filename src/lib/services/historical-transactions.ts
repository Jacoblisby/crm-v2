/**
 * Historiske transaktioner — 145 tinglyste handler i Næstved/Kalundborg-området.
 * Bruges som primær comparables-data i pris-engine.
 *
 * VÆGTNING (#7 forbedret 2026-05):
 *   Samme bygning (afstand <= 50m): 4.0 — meget høj sandsynlighed for samme EF
 *   Samme vejnavn + samme husnr: 4.0 — fallback hvis koordinater mangler
 *   Samme vejnavn + afstand 50-200m: 2.0 — samme vej men sandsynligvis anden EF
 *   Samme vejnavn uden koordinater: 3.0 — gammel proxy-vægt
 *   Samme postnr: 1.0
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
  /** Subject's koordinater — bruges til afstands-baseret EF-detection */
  subjectLat?: number | null;
  subjectLon?: number | null;
  /** Subject's m², bruges til at filtrere lignende størrelse */
  kvm: number;
  /** ±20% kvm-tolerance som default */
  kvmTolerancePct?: number;
}

/**
 * Haversine-distance i meter mellem to lat/lon-punkter.
 * Bruges til same-building/same-EF detection.
 */
function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Jordens radius i meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    const sameRoad = !!(opts.roadName && t.roadName === opts.roadName);
    const sameHusnr = !!(opts.houseNumber && t.houseNumber === opts.houseNumber);

    // Coordinate-baseret EF-detection: hvis vi har koordinater pa baade subject
    // og handel, bruger vi afstand som primaer signal. Det reducerer
    // false-positives hvor to ejerforeninger deler samme vej.
    const hasCoords =
      opts.subjectLat != null &&
      opts.subjectLon != null &&
      t.coordinates &&
      typeof t.coordinates.lat === 'number' &&
      typeof t.coordinates.lon === 'number';

    if (hasCoords) {
      const d = distanceMeters(
        opts.subjectLat as number,
        opts.subjectLon as number,
        t.coordinates!.lat,
        t.coordinates!.lon,
      );
      if (d <= 50) {
        weight = 4.0; // samme bygning
      } else if (d <= 200 && sameRoad) {
        weight = 2.0; // samme vej, sandsynligvis anden EF
      } else if (sameRoad && sameHusnr) {
        weight = 4.0; // samme husnr trods afstand (data-uoverensstemmelse)
      } else if (sameRoad) {
        weight = 1.5; // samme vej, langt vaek
      }
      // ellers: weight forbliver 1.0 (kun samme postnr)
    } else if (sameRoad) {
      // Fallback uden koordinater: brug vejnavn som proxy (gammel logik)
      weight = sameHusnr ? 4.0 : 3.0;
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
