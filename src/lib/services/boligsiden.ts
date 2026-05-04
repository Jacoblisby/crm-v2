/**
 * Boligsiden API integration — bruges til at hente bolig-detalje
 * (kvm, byggeår, værelser, energimærke, seneste handelspris) for en given adresse.
 *
 * Vi bruger samme API som scraperen — den er undokumenteret men virker.
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export interface PropertyLookupResult {
  bfeNumber: number | null;
  kvm: number | null;
  rooms: number | null;
  yearBuilt: number | null;
  energyClass: string | null;
  /** Seneste registrerede handelspris fra OIS (offentlig) */
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  /** Boligsiden's egen latest valuation (AVM) hvis tilgængelig */
  latestValuation: number | null;
  /** Hvis bolig er på markedet lige nu */
  isOnMarket: boolean;
  currentListingPrice: number | null;
  caseUrl: string | null;
}

/**
 * Slå op på Boligsiden via address-string.
 * Returner null hvis ingen match.
 */
export async function lookupPropertyByAddress(
  postalCode: string,
  streetName: string,
  houseNumber: string,
  floor?: string | null,
  door?: string | null,
): Promise<PropertyLookupResult | null> {
  // Prøv først at slå adresse op via Boligsiden's address-search
  // De har en addresses-endpoint der kan finde BFE direkte
  try {
    const slugBase = `${streetName}-${houseNumber}`.toLowerCase().replace(/\s+/g, '-');
    const slugFull = floor || door
      ? `${slugBase}-${[floor, door].filter(Boolean).join('-')}-${postalCode}-${slugifyPostalCity(postalCode)}`
      : `${slugBase}-${postalCode}-${slugifyPostalCity(postalCode)}`;

    // Forsøg 1: hent fra Boligsiden via slug-construct
    const r = await fetch(
      `https://api.boligsiden.dk/search/cases?addressTypes=condo&q=${encodeURIComponent(`${streetName} ${houseNumber} ${postalCode}`)}&perPage=5`,
      { headers: { 'User-Agent': UA }, next: { revalidate: 86400 } },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as { cases: BoligsidenCase[] };

    if (!data.cases || data.cases.length === 0) {
      // Prøv også address-search uden adressetype
      const r2 = await fetch(
        `https://api.boligsiden.dk/search/cases?q=${encodeURIComponent(`${streetName} ${houseNumber} ${postalCode}`)}&perPage=5`,
        { headers: { 'User-Agent': UA }, next: { revalidate: 86400 } },
      );
      if (!r2.ok) return null;
      const d2 = (await r2.json()) as { cases: BoligsidenCase[] };
      if (!d2.cases || d2.cases.length === 0) return null;
      return parseCase(d2.cases[0]);
    }

    // Find bedste match: samme husnr + (samme etage hvis givet)
    const best =
      data.cases.find((c) => {
        if (!c.address) return false;
        const numMatch = c.address.houseNumber === houseNumber;
        const floorMatch = !floor || c.address.floor === floor;
        return numMatch && floorMatch;
      }) ?? data.cases[0];

    return parseCase(best);
  } catch {
    return null;
  }
}

interface BoligsidenCase {
  caseID?: string;
  caseUrl?: string;
  isOnMarket?: boolean;
  casePrice?: number;
  livingArea?: number;
  latestValuation?: number;
  registrations?: Array<{ amount: number; date: string; type?: string }>;
  address?: {
    bfeNumbers?: number[];
    floor?: string;
    door?: string;
    houseNumber?: string;
    buildings?: Array<{
      housingArea?: number;
      numberOfRooms?: number;
      yearBuilt?: number;
    }>;
  };
}

function parseCase(c: BoligsidenCase): PropertyLookupResult {
  const building = c.address?.buildings?.[0];
  const lastSale = c.registrations
    ?.filter((r) => r.type === 'normal')
    ?.sort((a, b) => (b.date > a.date ? 1 : -1))?.[0];

  return {
    bfeNumber: c.address?.bfeNumbers?.[0] ?? null,
    kvm: c.livingArea ?? building?.housingArea ?? null,
    rooms: building?.numberOfRooms ?? null,
    yearBuilt: building?.yearBuilt ?? null,
    energyClass: null, // ikke i denne payload — kan tilføjes senere
    lastSalePrice: lastSale?.amount ?? null,
    lastSaleDate: lastSale?.date ?? null,
    latestValuation: c.latestValuation ?? null,
    isOnMarket: !!c.isOnMarket,
    currentListingPrice: c.isOnMarket ? c.casePrice ?? null : null,
    caseUrl: c.caseUrl ?? null,
  };
}

function slugifyPostalCity(postalCode: string): string {
  // Heuristic: vi ved kun postnummer, ikke bynavn — Boligsiden vil typisk
  // affinde sig med bare postnummer i søge-query
  return postalCode;
}
