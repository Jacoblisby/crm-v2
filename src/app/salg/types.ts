/**
 * Boligberegner — funnel state + types delt mellem alle steps.
 */
import type { StandLevel } from '@/lib/services/price-engine';

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SellTimeframe = 'under1' | '1to3' | '3to6' | '6plus' | 'unsure';
export type SellReason =
  | 'flytter'
  | 'arv'
  | 'skilsmisse'
  | 'okonomi'
  | 'investering'
  | 'andet';
export type OwnerCount = '1' | '2' | '3plus';
export type LivedHere = 'under1' | '1to3' | '3to10' | '10plus';
export type AfterSale =
  | 'flytter_ud'
  | 'lejer_andet'
  | 'blive_boende_lejer'
  | 'ved_ikke';
export type YesNoUnsure = 'ja' | 'nej' | 'usikker';

export interface FunnelState {
  step: Step;

  // Step 1: Adresse + auto-lookup
  addressId: string | null;
  fullAddress: string;
  postalCode: string;
  city: string;
  streetName: string;
  houseNumber: string;
  floor: string | null;
  door: string | null;
  bfeNumber: number | null;
  // Auto-udfyldte felter (kan rettes af bruger)
  kvm: number | null;
  rooms: number | null;
  yearBuilt: number | null;
  energyClass: string | null;
  // Hvis bolig allerede er på markedet — vi viser det som hjælpedata
  currentListingPrice: number | null;
  caseUrl: string | null;
  isOnMarket: boolean;

  // Step 2: Fotos
  photoIds: string[]; // server-assigned UUIDs efter upload
  photoUrls: string[]; // til preview

  // Step 3: Ejerudgifter (alle pr år)
  costGrundvaerdi: number;
  costFaellesudgifter: number;
  costRottebekempelse: number;
  costRenovation: number;
  costForsikringer: number;
  costFaelleslaan: number;
  costAndreDrift: number;
  // Vand
  waterPaidViaAssoc: boolean;          // Betales acontobeløb for vand til ejerforeningen?
  waterAcontoYearly: number;            // Acontobeløb (kr/år) hvis ja
  waterUsageLastYearKr: number;         // Faktisk forbrug sidste år (kr) hvis nej
  // Varme
  heatPaidViaAssoc: boolean;
  heatAcontoYearly: number;
  heatUsageLastYearKr: number;
  // Hæftelse til ejerforening (engangs gæld kunden hæfter for) =
  // ens andel af foreningsrestgælden hvis der er fælleslån
  ejerforeningHaeftelseKr: number;
  // Kan fælleslånet indfries før tid? — kun relevant hvis costFaelleslaan > 0
  faelleslaanCanPrepay: 'ja' | 'nej' | 'vedikke' | null;
  // Relaterede dokumenter (valgfri)
  documents: { name: string; size: number; kind: string }[];

  // Step 4: Stand
  stand: StandLevel | null;
  standNote: string;
  // Køkken
  kitchenYear: number | null;
  kitchenBrand: string;
  // Badeværelse
  bathroomYear: number | null;
  // Hvidevare-tilbehør (følger med i salget)
  applVaskemaskine: boolean;
  applTorretumbler: boolean;
  applOpvaskemaskine: boolean;
  applKoeleFryseskab: boolean;
  applOvn: boolean;
  applKomfur: boolean;
  applMikroovn: boolean;
  applEmhaette: boolean;
  // Udlejning-detaljer (kun hvis isRented=true)
  rentalMonthlyRent: number;
  rentalDeposit: number;
  rentalPrepaidRent: number;
  rentalStartDate: string;              // YYYY-MM-DD
  rentalUopsigelig: boolean;
  rentalUopsigeligMaaneder: number;
  rentalContract: { name: string; size: number } | null;

  // Step 5: Lidt om dig (behovsafdaekning, alt valgfrit)
  sellTimeframe: SellTimeframe | null;
  sellReason: SellReason | null;
  ownerCount: OwnerCount | null;
  livedHere: LivedHere | null;
  afterSale: AfterSale | null;
  // Conditional kun hvis afterSale === 'lejer_andet' eller 'blive_boende_lejer'
  isOver65: YesNoUnsure | null;        // "Vil ikke svare" mappes til 'usikker'
  receivesBoligstotte: YesNoUnsure | null;

  // Step 6: Kontakt
  fullName: string;
  email: string;
  phone: string;

  // Special forhold
  hasAltan: boolean;
  hasElevator: boolean;
  isRented: boolean;
  // Gaeld i ejerforening (toggle styrer om felter vises i Step 3)
  hasEjerforeningGaeld: boolean;
  ejerforeningGaeldRestgaeld: number; // engang — andel af restgaeld, traekkes fra laaneprovenu

  // UTM tracking
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

export const initialState: FunnelState = {
  step: 1,
  addressId: null,
  fullAddress: '',
  postalCode: '',
  city: '',
  streetName: '',
  houseNumber: '',
  floor: null,
  door: null,
  bfeNumber: null,
  kvm: null,
  rooms: null,
  yearBuilt: null,
  energyClass: null,
  currentListingPrice: null,
  caseUrl: null,
  isOnMarket: false,
  photoIds: [],
  photoUrls: [],
  costGrundvaerdi: 0,
  costFaellesudgifter: 0,
  costRottebekempelse: 0,
  costRenovation: 0,
  costForsikringer: 0,
  costFaelleslaan: 0,
  costAndreDrift: 0,
  waterPaidViaAssoc: false,
  waterAcontoYearly: 0,
  waterUsageLastYearKr: 0,
  heatPaidViaAssoc: false,
  heatAcontoYearly: 0,
  heatUsageLastYearKr: 0,
  ejerforeningHaeftelseKr: 0,
  faelleslaanCanPrepay: null,
  documents: [],
  stand: null,
  standNote: '',
  kitchenYear: null,
  kitchenBrand: '',
  bathroomYear: null,
  applVaskemaskine: false,
  applTorretumbler: false,
  applOpvaskemaskine: false,
  applKoeleFryseskab: false,
  applOvn: false,
  applKomfur: false,
  applMikroovn: false,
  applEmhaette: false,
  rentalMonthlyRent: 0,
  rentalDeposit: 0,
  rentalPrepaidRent: 0,
  rentalStartDate: '',
  rentalUopsigelig: false,
  rentalUopsigeligMaaneder: 0,
  rentalContract: null,
  sellTimeframe: null,
  sellReason: null,
  ownerCount: null,
  livedHere: null,
  afterSale: null,
  isOver65: null,
  receivesBoligstotte: null,
  fullName: '',
  email: '',
  phone: '',
  hasAltan: false,
  hasElevator: false,
  isRented: false,
  hasEjerforeningGaeld: false,
  ejerforeningGaeldRestgaeld: 0,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
};

export const TOTAL_DRIFT = (s: FunnelState) =>
  s.costGrundvaerdi +
  s.costFaellesudgifter +
  s.costRottebekempelse +
  s.costRenovation +
  s.costForsikringer +
  s.costFaelleslaan +
  s.costAndreDrift;
