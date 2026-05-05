/**
 * Boligsiden API integration — bruges til at hente bolig-detalje
 * (BFE, kvm, byggeår, værelser, energimærke, seneste handelspris)
 * for en given adresse.
 *
 * VIGTIGT: Vi SKAL bruge /addresses/{dawa-uuid}-endpointet, IKKE /search/cases?q=...
 * /search/cases returnerer 50 random adresser baseret på fuzzy scoring og er IKKE
 * deterministisk for adresse-opslag. /addresses/{uuid} returnerer præcis match.
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
  /** BBR-data fra building */
  basementArea: number | null;
  totalArea: number | null;
  buildingName: string | null;
  externalWallMaterial: string | null;
  heatingInstallation: string | null;
  roofingMaterial: string | null;
  bathroomCondition: string | null;
  kitchenCondition: string | null;
  numberOfBathrooms: number | null;
  numberOfToilets: number | null;
  /** Adressetype, fx 'condo' for ejerlejlighed */
  addressType: string | null;
}

interface BoligsidenAddress {
  addressID: string;
  addressType?: string;
  bfeNumbers?: number[];
  livingArea?: number;
  latestValuation?: number;
  isOnMarket?: boolean;
  hasMultipleCases?: boolean;
  registrations?: Array<{ amount: number; date: string; type?: string }>;
  buildings?: Array<{
    basementArea?: number;
    totalArea?: number;
    housingArea?: number;
    yearBuilt?: number;
    numberOfRooms?: number;
    numberOfBathrooms?: number;
    numberOfToilets?: number;
    buildingName?: string;
    externalWallMaterial?: string;
    heatingInstallation?: string;
    roofingMaterial?: string;
    bathroomCondition?: string;
    kitchenCondition?: string;
  }>;
  // Hvis bolig er aktivt til salg er dette feltet tilstede
  caseID?: string;
  caseUrl?: string;
  casePrice?: number;
}

/**
 * Slå bolig-detalje op via DAWA's adresse-UUID.
 * Bruges efter `getAddressDetails(addressId)` har returneret accessAddressId.
 *
 * Returner null hvis Boligsiden ikke har data for adressen.
 */
export async function lookupPropertyByAddressId(
  dawaAddressId: string,
): Promise<PropertyLookupResult | null> {
  try {
    const r = await fetch(`https://api.boligsiden.dk/addresses/${dawaAddressId}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!r.ok) {
      return null;
    }
    const data = (await r.json()) as BoligsidenAddress;

    // Sanity-tjek: addressID skal matche
    if (!data.addressID || data.addressID !== dawaAddressId) {
      return null;
    }

    return parseAddress(data);
  } catch {
    return null;
  }
}

function parseAddress(data: BoligsidenAddress): PropertyLookupResult {
  const building = data.buildings?.[0];
  // Find seneste 'normal' handel (ikke auktion / arv)
  const lastSale = (data.registrations ?? [])
    .filter((r) => r.type === 'normal')
    .sort((a, b) => (b.date > a.date ? 1 : -1))[0];

  return {
    bfeNumber: data.bfeNumbers?.[0] ?? null,
    kvm: data.livingArea ?? building?.housingArea ?? null,
    rooms: building?.numberOfRooms ?? null,
    yearBuilt: building?.yearBuilt ?? null,
    energyClass: null, // ikke i denne payload
    lastSalePrice: lastSale?.amount ?? null,
    lastSaleDate: lastSale?.date ?? null,
    latestValuation: data.latestValuation ?? null,
    isOnMarket: !!data.isOnMarket,
    currentListingPrice: data.isOnMarket ? data.casePrice ?? null : null,
    caseUrl: data.caseUrl ?? null,
    basementArea: building?.basementArea ?? null,
    totalArea: building?.totalArea ?? null,
    buildingName: building?.buildingName ?? null,
    externalWallMaterial: building?.externalWallMaterial ?? null,
    heatingInstallation: building?.heatingInstallation ?? null,
    roofingMaterial: building?.roofingMaterial ?? null,
    bathroomCondition: building?.bathroomCondition ?? null,
    kitchenCondition: building?.kitchenCondition ?? null,
    numberOfBathrooms: building?.numberOfBathrooms ?? null,
    numberOfToilets: building?.numberOfToilets ?? null,
    addressType: data.addressType ?? null,
  };
}

/**
 * @deprecated Brug `lookupPropertyByAddressId(dawaAddressId)` i stedet.
 * Den gamle `q=`-baserede søgning returnerer 50 random adresser, IKKE adresse-match.
 */
export async function lookupPropertyByAddress(
  postalCode: string,
  streetName: string,
  houseNumber: string,
  floor?: string | null,
  door?: string | null,
): Promise<PropertyLookupResult | null> {
  void postalCode;
  void streetName;
  void houseNumber;
  void floor;
  void door;
  return null;
}
