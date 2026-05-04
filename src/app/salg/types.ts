/**
 * Boligberegner — funnel state + types delt mellem alle steps.
 */
import type { StandLevel } from '@/lib/services/price-engine';

export type Step = 1 | 2 | 3 | 4 | 5 | 6;

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

  // Step 3: Ejerudgifter (årlig sum)
  costGrundvaerdi: number;
  costFaellesudgifter: number;
  costRottebekempelse: number;
  costRenovation: number;
  costForsikringer: number;
  costFaelleslaan: number;
  costAndreDrift: number;
  // Hvis kunden har uploadet PDF, gemmer vi reference
  pdfId: string | null;

  // Step 4: Stand
  stand: StandLevel | null;
  standNote: string;

  // Step 5: Kontakt
  fullName: string;
  email: string;
  phone: string;

  // Special forhold
  hasAltan: boolean;
  hasElevator: boolean;
  isRented: boolean;
  hasEjerforeningHaeftelse: boolean;

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
  pdfId: null,
  stand: null,
  standNote: '',
  fullName: '',
  email: '',
  phone: '',
  hasAltan: false,
  hasElevator: false,
  isRented: false,
  hasEjerforeningHaeftelse: false,
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
