/**
 * Comparables-lookup: find sammenlignelige boliger til markedsprisestimat.
 *
 * Datakilder:
 *  1. Historiske tinglyste handler (`historical-transactions.json`) — 145 rows
 *     primær kilde, vægtet efter ejerforening (vejnavn-match)
 *  2. On-market kandidater (Boligsiden listings) — sekundær, sætter loft for marked
 *  3. Properties.lastSalePrice (egne handler) — ekstra signal
 *
 * Algoritme:
 *  - Filter: samme postnr, kvm ±20%, byggeår ±10 år
 *  - Vægt: samme vejnavn 3x, samme husnr 4x, recency boost
 *  - Vægtet median pr m² × subject.kvm = markedsestimat
 *  - Gennemsnitligt afslag = listing pr m² ÷ historisk pr m² − 1
 */
import { and, eq, gte, lte, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates } from '@/lib/db/schema';
import {
  findHistoricalComparables,
  weightedMedianPricePerSqm,
  type WeightedTransaction,
} from './historical-transactions';

export interface Comparable {
  source: 'historical' | 'on-market' | 'own';
  address: string;
  postalCode: string;
  roadName: string | null;
  houseNumber: string | null;
  kvm: number;
  rooms: number | null;
  yearBuilt: number | null;
  price: number;
  pricePerSqm: number;
  date: string | null;
  isCurrentListing: boolean;
  /** Vægt i median-beregningen (1=base, 3=samme EF, 4=samme bygning) */
  weight: number;
}

export interface ComparablesResult {
  /** Vægtet median markedspris pr m² */
  medianPricePerSqm: number;
  /** Markedsestimat = medianPricePerSqm × subject.kvm */
  marketEstimate: number;
  /** Gns afslag (listepris vs solgt-pris) for området */
  averageDiscountPct: number;
  /** Top 8-12 comparables til at vise */
  topComparables: Comparable[];
  /** Antal samples vi har bygget medianen på */
  sampleSize: number;
  /** Hvor mange er i samme ejerforening (samme vejnavn) */
  sameEfCount: number;
}

interface SubjectProperty {
  postalCode: string;
  roadName?: string | null;
  houseNumber?: string | null;
  /** Koordinater — bedre EF-detection end vejnavn alene */
  latitude?: number | null;
  longitude?: number | null;
  kvm: number;
  yearBuilt: number | null;
  rooms?: number | null;
}

export async function findComparables(
  subject: SubjectProperty,
): Promise<ComparablesResult> {
  // 1. HISTORISKE HANDLER (primær — vægtet efter EF)
  const historical = findHistoricalComparables({
    postalCode: subject.postalCode,
    roadName: subject.roadName,
    houseNumber: subject.houseNumber,
    subjectLat: subject.latitude,
    subjectLon: subject.longitude,
    kvm: subject.kvm,
  });

  const sameEfCount = historical.filter((h) => h.weight >= 3.0).length;

  // 2. ON-MARKET LISTINGS (secondary — viser den aktuelle marked-snapshot)
  const kvmMin = Math.floor(subject.kvm * 0.8);
  const kvmMax = Math.ceil(subject.kvm * 1.2);
  const onMarketResult = await db
    .select({
      address: onMarketCandidates.address,
      postalCode: onMarketCandidates.postalCode,
      kvm: onMarketCandidates.kvm,
      rooms: onMarketCandidates.rooms,
      yearBuilt: onMarketCandidates.yearBuilt,
      listPrice: onMarketCandidates.listPrice,
      firstSeenAt: onMarketCandidates.firstSeenAt,
    })
    .from(onMarketCandidates)
    .where(
      and(
        eq(onMarketCandidates.postalCode, subject.postalCode),
        eq(onMarketCandidates.status, 'active'),
        isNotNull(onMarketCandidates.kvm),
        gte(onMarketCandidates.kvm, kvmMin),
        lte(onMarketCandidates.kvm, kvmMax),
      ),
    )
    .limit(15);

  // 3. KOMBINER TIL VISNING
  const allComps: Comparable[] = [];

  for (const h of historical) {
    allComps.push({
      source: 'historical',
      address: h.address,
      postalCode: h.postalCode || '',
      roadName: h.roadName,
      houseNumber: h.houseNumber,
      kvm: h.kvm,
      rooms: null,
      yearBuilt: null,
      price: h.price,
      pricePerSqm: h.pricePerSqm ?? 0,
      date: h.date,
      isCurrentListing: false,
      weight: h.weight,
    });
  }

  for (const r of onMarketResult) {
    if (!r.kvm || !r.listPrice || r.listPrice <= 0) continue;
    allComps.push({
      source: 'on-market',
      address: r.address,
      postalCode: r.postalCode,
      roadName: null,
      houseNumber: null,
      kvm: r.kvm,
      rooms: r.rooms ? Number(r.rooms) : null,
      yearBuilt: r.yearBuilt,
      price: r.listPrice,
      pricePerSqm: Math.round(r.listPrice / r.kvm),
      date: r.firstSeenAt instanceof Date ? r.firstSeenAt.toISOString().slice(0, 10) : (r.firstSeenAt as string | null),
      isCurrentListing: true,
      weight: 0.5, // listings vægter halvt så meget som faktiske handler
    });
  }

  // 4. VÆGTET MEDIAN (kun historiske handler — den bedste signal)
  const medianPricePerSqm = weightedMedianPricePerSqm(historical);
  const marketEstimate = Math.round(medianPricePerSqm * subject.kvm);

  // 5. AVERAGE DISCOUNT — sammenlign listing-pr-m² med historisk-pr-m²
  let averageDiscountPct = 7;
  const listings = allComps.filter((c) => c.isCurrentListing);
  if (listings.length >= 2 && historical.length >= 3) {
    const sortedListings = [...listings.map((l) => l.pricePerSqm)].sort((a, b) => a - b);
    const medListing = sortedListings[Math.floor(sortedListings.length / 2)];
    const medHist = medianPricePerSqm;
    if (medListing > 0 && medHist > 0) {
      averageDiscountPct = Math.max(2, Math.min(15, ((medListing - medHist) / medListing) * 100));
    }
  }

  // 6. TOP 12 — prioritér samme EF + recency
  const topComparables = allComps
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return 0;
    })
    .slice(0, 12);

  return {
    medianPricePerSqm,
    marketEstimate,
    averageDiscountPct,
    topComparables,
    sampleSize: historical.length,
    sameEfCount,
  };
}

// Backwards-compat for existing imports — vil fjernes senere
export type { Comparable as TopComparable };
