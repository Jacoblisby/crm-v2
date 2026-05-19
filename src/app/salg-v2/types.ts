/**
 * /salg-v2 — funnel state + types for redesigned 13-screen flow.
 *
 * Extends the existing /salg FunnelState (so we can reuse submit-action,
 * actions, price-engine wiring) plus new fields specific to the v2 design:
 *   - bekraeftBoligtype (mapped to property type)
 *   - moveTimeframeRaw (display string from HvornaarFlytter)
 *   - sellReasonRaw (display string from GrundForSalg)
 *   - afterSaleRaw (display string from EfterSalg)
 *   - ny_* (new-home wishlist fields from NyBolig)
 */
import type { FunnelState as V1State } from '../salg/types';
import { initialState as V1Initial } from '../salg/types';

export type V2Stage = 'adresse' | 'boligen' | 'udgifter' | 'lidtomdig' | 'estimat';

// ─── Driftudgifter (dynamic add-line på Udgifter screen) ───────────────────
export type DriftCategory =
  | 'Ejendomsforsikring'
  | 'Grundfond'
  | 'Ydelse på fælleslån'
  | 'Administration'
  | 'Antenne'
  | 'Internet'
  | 'Renovation'
  | 'Andet';

export interface AdditionalDriftItem {
  id: string;
  category: DriftCategory;
  customLabel?: string; // kun for 'Andet'
  amount: number; // kr/år
}

export const DRIFT_CATEGORIES: DriftCategory[] = [
  'Ejendomsforsikring',
  'Grundfond',
  'Ydelse på fælleslån',
  'Administration',
  'Antenne',
  'Internet',
  'Renovation',
  'Andet',
];

/**
 * Map fra dynamisk-item kategori → v1 cost-felt navn så submit-action
 * (uændret) får data ind på det rigtige felt.
 *
 * Mappede kategorier:
 *   Ejendomsforsikring   → costForsikringer
 *   Ydelse på fælleslån  → costFaelleslaan
 *   Renovation           → costRenovation
 *   Resten (Grundfond/Administration/Antenne/Internet/Andet) → costAndreDrift (sum)
 */
export const DRIFT_CATEGORY_TO_FIELD: Record<DriftCategory, keyof V1State | null> = {
  'Ejendomsforsikring': 'costForsikringer',
  'Grundfond': null, // → costAndreDrift sum
  'Ydelse på fælleslån': 'costFaelleslaan',
  'Administration': null, // → costAndreDrift sum
  'Antenne': null, // → costAndreDrift sum
  'Internet': null, // → costAndreDrift sum
  'Renovation': 'costRenovation',
  'Andet': null, // → costAndreDrift sum
};

export interface FunnelStateV2 extends V1State {
  screenIdx: number; // 0..N-1, flad screen-array

  // Bekraeft extras
  bekraeftBoligtype: 'Ejerlejlighed' | 'Andelsbolig' | 'Rækkehus' | 'Villa';

  // Display-form strings (parallel til v1 slug-felter — synces ved write)
  // Vi gemmer dem som strings for nem rendering uden mapping per screen.
  moveTimeframeRaw: string;
  sellReasonRaw: string;
  afterSaleRaw: string;

  // Ny bolig wishlist (only when afterSaleRaw === 'Vil leje en anden bolig')
  nyOmraade: string[];
  nyRoomsMin: string;
  nySqmMin: string;
  nyHuslejeMax: string;
  nyMustHave: string[];
  nyIndflytning: string;

  // Sidste detaljer extras
  priceImpactFlags: string[]; // 'Fælleslån i ejerforeningen' etc.
  notes: string;

  // Dynamisk drift-liste (erstatter de gamle individuelle cost-felter i UI'en
  // men syncer stadig til dem så submit-action virker)
  additionalDrift: AdditionalDriftItem[];
}

export const initialStateV2: FunnelStateV2 = {
  ...V1Initial,
  screenIdx: 0,
  bekraeftBoligtype: 'Ejerlejlighed',
  moveTimeframeRaw: '',
  sellReasonRaw: '',
  afterSaleRaw: '',
  nyOmraade: [],
  nyRoomsMin: '2',
  nySqmMin: '',
  nyHuslejeMax: '',
  nyMustHave: [],
  nyIndflytning: '',
  priceImpactFlags: [],
  notes: '',
  additionalDrift: [],
};

// 13-screen array — pure function, recomputed when state changes for conditional
export interface ScreenDef {
  id: string;
  stage: V2Stage;
  kicker: string;
  icon: string;
  title: string;
  sub: string;
  counter?: string;
  kind?: 'room';
  roomId?: 'kokken' | 'bad' | 'stue' | 'sove';
}

export function getScreens(state: FunnelStateV2): ScreenDef[] {
  const screens: ScreenDef[] = [
    {
      id: 'bekraeft',
      stage: 'adresse',
      kicker: 'Adresse bekræftet',
      icon: 'details',
      title: 'Bekræft boligens detaljer',
      sub: 'Disse oplysninger er offentligt tilgængelige fra OIS og BBR. Tjek dem og ret hvis noget er ændret.',
    },
    {
      id: 'hvornaar',
      stage: 'adresse',
      kicker: 'Tidsplan',
      icon: 'bolt',
      title: 'Hvornår vil du flytte?',
      sub: 'Det her påvirker ikke dit tilbud — men hjælper os med at planlægge handlen og din overtagelse.',
    },
    {
      id: 'kokken',
      stage: 'boligen',
      kicker: 'Boligens stand',
      icon: 'kitchen',
      title: 'Køkken',
      sub: 'Vælg det niveau der bedst beskriver køkkenet.',
      counter: 'Køkken (1/5)',
      kind: 'room',
      roomId: 'kokken',
    },
    {
      id: 'bad',
      stage: 'boligen',
      kicker: 'Boligens stand',
      icon: 'bath',
      title: 'Badeværelse',
      sub: 'Vælg det niveau der bedst beskriver badeværelset.',
      counter: 'Badeværelse (2/5)',
      kind: 'room',
      roomId: 'bad',
    },
    {
      id: 'stue',
      stage: 'boligen',
      kicker: 'Boligens stand',
      icon: 'sofa',
      title: 'Stue',
      sub: 'Vælg det niveau der bedst beskriver stuen.',
      counter: 'Stue (3/5)',
      kind: 'room',
      roomId: 'stue',
    },
    {
      id: 'sove',
      stage: 'boligen',
      kicker: 'Boligens stand',
      icon: 'bed',
      title: 'Soveværelse',
      sub: 'Vælg det niveau der bedst beskriver soveværelset.',
      counter: 'Soveværelse (4/5)',
      kind: 'room',
      roomId: 'sove',
    },
    {
      id: 'detaljer',
      stage: 'boligen',
      kicker: 'Detaljer om boligen',
      icon: 'details',
      title: 'Sidste detaljer',
      sub: 'Hvidevarer, særlige forhold og evt. udlejning. Alt er valgfrit — du kan også springe videre.',
      counter: 'Resten (5/5)',
    },
    {
      id: 'udgifter',
      stage: 'udgifter',
      kicker: 'Faste udgifter',
      icon: 'coin',
      title: 'Boligens udgifter',
      sub: 'Alle beløb er årlige (kr/år). Vi bruger dem til at beregne afkastet — jo præcisere data, jo bedre tilbud.',
    },
    {
      id: 'grund',
      stage: 'lidtomdig',
      kicker: 'Din situation',
      icon: 'user',
      title: 'Hvad er hovedgrunden til at sælge?',
      sub: 'Vi bruger det her til at finde en løsning der passer dig.',
    },
    {
      id: 'efter_salg',
      stage: 'lidtomdig',
      kicker: 'Din situation',
      icon: 'home',
      title: 'Hvad skal du efter salget?',
      sub: 'Vi tilbyder også sale-leaseback og kan tilbyde lejebolig fra vores portefølje.',
    },
  ];

  if (state.afterSaleRaw === 'Vil leje en anden bolig') {
    screens.push({
      id: 'ny_bolig',
      stage: 'lidtomdig',
      kicker: 'Din nye bolig',
      icon: 'home',
      title: 'Hvad leder du efter?',
      sub: 'Vi har 18+ lejemål på Sjælland. Fortæl os hvad du leder efter, så finder vi den bedste match.',
    });
  }
  return screens;
}

export const STAGE_LABELS: Record<V2Stage, string> = {
  adresse: 'Adresse',
  boligen: 'Boligen',
  udgifter: 'Udgifter',
  lidtomdig: 'Lidt om dig',
  estimat: 'Estimat',
};

export const STAGE_ORDER: V2Stage[] = [
  'adresse',
  'boligen',
  'udgifter',
  'lidtomdig',
  'estimat',
];

// Map handoff display strings → v1 slug-enums for backend compat
export const TIMEFRAME_DISPLAY_TO_SLUG: Record<string, NonNullable<V1State['sellTimeframe']>> = {
  'Hurtigst muligt': 'under1',
  '1–3 måneder': '1to3',
  '3–6 måneder': '3to6',
  '6+ måneder': '6plus',
  'Ved ikke endnu': 'unsure',
};

export const REASON_DISPLAY_TO_SLUG: Record<string, NonNullable<V1State['sellReason']>> = {
  'Flytter': 'flytter',
  'Arv / dødsbo': 'arv',
  'Skilsmisse': 'skilsmisse',
  'Økonomi': 'okonomi',
  'Investering': 'investering',
  'Andet': 'andet',
};

export const AFTER_SALE_DISPLAY_TO_SLUG: Record<string, NonNullable<V1State['afterSale']>> = {
  'Flytter ud helt': 'flytter_ud',
  'Vil blive boende som lejer': 'blive_boende_lejer',
  'Vil leje en anden bolig': 'lejer_andet',
  'Ved ikke endnu': 'ved_ikke',
};
