/**
 * DAWA (Danmarks Adresseregister) integration.
 *
 * Den officielle DAWA (api.dataforsyningen.dk) blev lukket permanent af
 * staten 1. oktober 2026 — alle kald giver nu 410 Gone, uden varsel eller
 * omdirigering. BASE_URL peger derfor på companydata.dk's spejl, som er
 * en byte-for-byte kompatibel erstatning (samme felter, samme URL-stier,
 * samme JSON-form) — verificeret mod /adresser/autocomplete og
 * /adresser/{id} før skiftet. Gratis, ingen nøgle, ingen konto.
 *
 * Virker DEN også engang ned, er fremgangsmåden: find en ny kompatibel
 * udbyder og ret kun BASE_URL herunder — resten af filen er uændret.
 */
import { bbrForAdresse } from '@/lib/bbr-lejlighed';

const BASE_URL = 'https://dawa.companydata.dk';

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

  const url = `${BASE_URL}/adresser/autocomplete?q=${encodeURIComponent(query)}&type=adresse&fuzzy=true`;
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
  const url = `${BASE_URL}/adresser/${addressId}`;
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
  const fullAddress = `${aa.vejstykke.navn} ${aa.husnr}${data.etage ? `, ${data.etage}` : ''}${data.dør ? `. ${data.dør}` : ''}, ${aa.postnummer.nr} ${aa.postnummer.navn}`;

  /**
   * BFE-nummeret. Spejlet leverer det ikke (den officielle DAWA gjorde), så
   * uden den her ville alle leads oprettet efter 1. oktober stå uden BFE —
   * og dermed uden kobling til ejendommen i CRM'et.
   *
   * Vores eget BBR-indeks dækker de ejerforeninger, vi køber i, og det er
   * dem, leads kommer fra. Udenfor dem er BFE fortsat tomt.
   */
  const bfeNumber =
    data.bfe ?? aa.bfe?.nummer ?? bbrForAdresse(fullAddress, aa.postnummer.nr)?.bbr.ejendomBfe ?? null;

  return {
    fullAddress,
    bfeNumber,
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
