/**
 * Comparables-lookup: find sammenlignelige boliger til markedsprisestimat.
 *
 * Datakilder:
 * 1. Egne handler (`portfolio_properties` + `properties.lastSalePrice`)
 * 2. On-market kandidater (`on_market_candidates`)
 * 3. Properties-tabellen generelt (alle Lovable-boliger med last_sale_price)
 *
 * Algoritme:
 * - Filter: samme postnr, kvm ±20%, byggeår ±10
 * - Score: vægt nyhed (sale_date) + kvm-similarity
 * - Returner top 8-12, og medianpris pr m² × subject's m² = markedsestimat
 */
import { and, eq, gte, lte, sql, isNotNull, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { properties, onMarketCandidates } from '@/lib/db/schema';

export interface Comparable {
  source: 'own' | 'on-market' | 'historical';
  address: string;
  postalCode: string;
  kvm: number;
  rooms: number | null;
  yearBuilt: number | null;
  /** Salgs- eller listepris afhængigt af kilde */
  price: number;
  pricePerSqm: number;
  /** Dato for salg eller "i salg nu" */
  date: string | null;
  isCurrentListing: boolean;
}

export interface ComparablesResult {
  /** Median markedspris pr m² baseret på de bedste matches */
  medianPricePerSqm: number;
  /** Markedsestimat = medianPricePerSqm × subject.kvm */
  marketEstimate: number;
  /** Gns afslag (listepris vs solgt-pris) for området */
  averageDiscountPct: number;
  /** Top 8-12 comparables til at vise */
  topComparables: Comparable[];
  /** Antal samples vi har bygget medianen på */
  sampleSize: number;
}

interface SubjectProperty {
  postalCode: string;
  kvm: number;
  yearBuilt: number | null;
  rooms?: number | null;
}

export async function findComparables(
  subject: SubjectProperty,
): Promise<ComparablesResult> {
  const kvmMin = Math.floor(subject.kvm * 0.8);
  const kvmMax = Math.ceil(subject.kvm * 1.2);
  const yearMin = subject.yearBuilt ? subject.yearBuilt - 10 : 1900;
  const yearMax = subject.yearBuilt ? subject.yearBuilt + 10 : 2030;

  // Egne historiske handler (properties.last_sale_price)
  const ownHandler = await db
    .select({
      address: properties.address,
      postalCode: properties.postalCode,
      kvm: properties.kvm,
      rooms: properties.rooms,
      yearBuilt: properties.yearBuilt,
      price: properties.lastSalePrice,
      date: properties.lastSaleDate,
    })
    .from(properties)
    .where(
      and(
        eq(properties.postalCode, subject.postalCode),
        isNotNull(properties.lastSalePrice),
        isNotNull(properties.kvm),
        gte(properties.kvm, kvmMin),
        lte(properties.kvm, kvmMax),
        ...(subject.yearBuilt
          ? [gte(properties.yearBuilt, yearMin), lte(properties.yearBuilt, yearMax)]
          : []),
      ),
    )
    .orderBy(desc(properties.lastSaleDate))
    .limit(20);

  // On-market listings (current asking prices) — fra Boligsiden scrape
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
        gte(onMarketCandidates.kvm, kvmMin),
        lte(onMarketCandidates.kvm, kvmMax),
      ),
    )
    .limit(15);

  // Solgte (status=sold) on-market listings — vi kender deres opnåede pris
  // For nu: kun aktive — vi har ingen sold_price tracking endnu

  const comps: Comparable[] = [];
  for (const r of ownHandler) {
    if (!r.kvm || !r.price || r.price <= 0) continue;
    comps.push({
      source: 'historical',
      address: r.address,
      postalCode: r.postalCode,
      kvm: r.kvm,
      rooms: r.rooms ? Number(r.rooms) : null,
      yearBuilt: r.yearBuilt,
      price: r.price,
      pricePerSqm: Math.round(r.price / r.kvm),
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : (r.date as string | null),
      isCurrentListing: false,
    });
  }
  for (const r of onMarketResult) {
    if (!r.kvm || !r.listPrice || r.listPrice <= 0) continue;
    comps.push({
      source: 'on-market',
      address: r.address,
      postalCode: r.postalCode,
      kvm: r.kvm,
      rooms: r.rooms ? Number(r.rooms) : null,
      yearBuilt: r.yearBuilt,
      price: r.listPrice,
      pricePerSqm: Math.round(r.listPrice / r.kvm),
      date: r.firstSeenAt instanceof Date ? r.firstSeenAt.toISOString().slice(0, 10) : (r.firstSeenAt as string | null),
      isCurrentListing: true,
    });
  }

  // Sortér efter relevans: tæt på subject.kvm + nyere
  comps.sort((a, b) => {
    const aDiff = Math.abs(a.kvm - subject.kvm);
    const bDiff = Math.abs(b.kvm - subject.kvm);
    if (aDiff !== bDiff) return aDiff - bDiff;
    if (a.date && b.date) return b.date.localeCompare(a.date);
    return 0;
  });

  const topComparables = comps.slice(0, 12);
  const pricesPerSqm = topComparables.map((c) => c.pricePerSqm).filter((p) => p > 0);
  const medianPricePerSqm = pricesPerSqm.length > 0 ? median(pricesPerSqm) : 0;
  const marketEstimate = Math.round(medianPricePerSqm * subject.kvm);

  // Grov estimat af "gns afslag" — listings sælges typisk 5-8% under listepris
  // Faldback: hvis vi kun har listings, antag 7%. Hvis vi har historiske + listings,
  // sammenlign median listepris vs median sælgepris.
  const listings = topComparables.filter((c) => c.isCurrentListing);
  const sold = topComparables.filter((c) => !c.isCurrentListing);
  let averageDiscountPct = 7; // default
  if (listings.length >= 2 && sold.length >= 2) {
    const medListing = median(listings.map((l) => l.pricePerSqm));
    const medSold = median(sold.map((s) => s.pricePerSqm));
    if (medListing > 0) {
      averageDiscountPct = Math.max(2, Math.min(15, ((medListing - medSold) / medListing) * 100));
    }
  }

  return {
    medianPricePerSqm,
    marketEstimate,
    averageDiscountPct,
    topComparables,
    sampleSize: pricesPerSqm.length,
  };
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
