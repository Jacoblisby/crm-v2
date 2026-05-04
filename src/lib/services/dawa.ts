/**
 * DAWA (Danmarks Adresseregister) integration.
 * Gratis API, ingen auth.
 *
 * https://dawadocs.dataforsyningen.dk/
 */

export interface DawaSuggestion {
  /** Display-tekst (fx "Bogensevej 53, 2. tv, 4700 Næstved") */
  tekst: string;
  /** Adresse-objekt med detaljer */
  adresse: {
    /** UUID for adgangsadressen — bruges til BFE-opslag */
    id: string;
    href: string;
    vejnavn: string;
    husnr: string;
    etage: string | null;
    dør: string | null;
    postnr: string;
    postnrnavn: string;
  };
}

/**
 * Auto-complete adresse-søgning.
 * Returner liste af forslag baseret på partial input.
 */
export async function searchAddress(query: string): Promise<DawaSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const url = `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&type=adresse&fuzzy=true`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data = (await res.json()) as DawaSuggestion[];
  return data.slice(0, 10);
}

export interface AddressDetails {
  /** Den fulde DAWA-adresse */
  fullAddress: string;
  /** BFE-nummer fra OIS (Bygnings- og Boligregistret) */
  bfeNumber: number | null;
  /** Postnummer */
  postalCode: string;
  /** Bynavn */
  city: string;
  /** Vejnavn (fx "Bogensevej") */
  streetName: string;
  /** Husnummer (fx "53") */
  houseNumber: string;
  /** Etage (fx "2", "st", "kl") eller null */
  floor: string | null;
  /** Dør (fx "tv", "th", "1") eller null */
  door: string | null;
  /** Kommune-kode + navn */
  municipalityCode: string | null;
  municipalityName: string | null;
  /** Koordinater (long, lat) til kort-visning */
  coordinates: { lat: number; lon: number } | null;
  /** Adgangsadresse-UUID (intern DAWA-id) */
  accessAddressId: string;
}

/**
 * Opslag af fuld adresse-detalje fra DAWA via address-id.
 * Returnerer BFE-nummer, koordinater, kommune.
 */
export async function getAddressDetails(addressId: string): Promise<AddressDetails | null> {
  const url = `https://api.dataforsyningen.dk/adresser/${addressId}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    adgangsadresse: {
      id: string;
      vejstykke: { navn: string };
      husnr: string;
      etage: string | null;
      dør: string | null;
      postnummer: { nr: string; navn: string };
      kommune: { kode: string; navn: string };
      adgangspunkt: { koordinater: [number, number] };
      bfe?: { nummer: number };
      esrejendomsnr?: string;
    };
    etage: string | null;
    dør: string | null;
    bfe?: number;
  };

  const aa = data.adgangsadresse;
  return {
    fullAddress: `${aa.vejstykke.navn} ${aa.husnr}${data.etage ? `, ${data.etage}` : ''}${data.dør ? `. ${data.dør}` : ''}, ${aa.postnummer.nr} ${aa.postnummer.navn}`,
    bfeNumber: data.bfe ?? aa.bfe?.nummer ?? null,
    postalCode: aa.postnummer.nr,
    city: aa.postnummer.navn,
    streetName: aa.vejstykke.navn,
    houseNumber: aa.husnr,
    floor: data.etage ?? aa.etage,
    door: data.dør ?? aa.dør,
    municipalityCode: aa.kommune.kode,
    municipalityName: aa.kommune.navn,
    coordinates: aa.adgangspunkt
      ? { lon: aa.adgangspunkt.koordinater[0], lat: aa.adgangspunkt.koordinater[1] }
      : null,
    accessAddressId: aa.id,
  };
}
