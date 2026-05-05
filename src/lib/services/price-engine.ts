/**
 * Pris-engine for boligberegner.
 *
 * Flow:
 *   1. Comparables → markedsestimat
 *   2. PDF eller manuel → driftTotal (årlig)
 *   3. Stand-rating → refurbTotal (engangsomkostning)
 *   4. Postnr × m² → estimeret leje/md
 *   5. computeAfkast() med markedsestimat som listePris → bud@20% ROE
 */
import { computeAfkast } from '@/lib/afkast';
import { findComparables } from './comparables';
import { estimateMonthlyRent } from './our-rentals';

// Fallback leje-satser per postnr (kr/m²/md). Bruges KUN når vi ikke har
// faktiske lejedata for området — vores ~218 ejede lejemål overskriver dette.
const LEJE_PR_M2_PR_MD: Record<string, number> = {
  '2630': 120, // Taastrup
  '4000': 115, // Roskilde
  '4100': 90,  // Ringsted
  '4400': 80,  // Kalundborg
  '4700': 90,  // Næstved
};
const DEFAULT_LEJE_RATE = 90;

// Refurbish-estimat per stand-niveau (engangsomkostning, kr per m²)
// Kalibreret 2026-05 efter Jacobs faktiske erfaringer med 4700/4400-renoveringer.
// Kan overrides direkte på lead via Afkast-debug-tab.
const REFURB_PER_M2: Record<string, number> = {
  nyrenoveret: 75,        // småting — pertelje, plet-maling
  god: 300,               // let polish (rengøring, lidt maling)
  middel: 450,            // gulve + maling + småting
  trænger: 700,           // + delvis renovering af bad ELLER køkken
  slidt: 1200,            // fuld renovation (køkken + bad + gulve)
};

export type StandLevel = 'nyrenoveret' | 'god' | 'middel' | 'trænger' | 'slidt';

export interface PriceEngineInput {
  postalCode: string;
  kvm: number;
  yearBuilt: number | null;
  stand: StandLevel;
  /** Driftsomkostninger per år (kr) — sum af alle ejerudgifter */
  driftTotalYearly: number;
  /** Antal værelser, til evt. leje-justering */
  rooms?: number | null;
  /** Vejnavn — bruges til at vægte same-EF comparables højere */
  roadName?: string | null;
  /** Husnr — bruges til same-bygning vægt */
  houseNumber?: string | null;
  /** Hvis kunden har en aktuel listing/listepris fra mægler — bruges som sanity check */
  currentListingPrice?: number | null;
  /** Hæftelse til ejerforening (engangs gæld kunden hæfter for, fra tinglysning) */
  haeftelseEf?: number;
}

export interface PriceEngineResult {
  // Comparables
  marketEstimate: number;
  medianPricePerSqm: number;
  averageDiscountPct: number;
  comparables: Awaited<ReturnType<typeof findComparables>>['topComparables'];
  sampleSize: number;
  sameEfCount: number;
  // Beregning
  estimatedRentMd: number;
  rentSource: 'same-vej' | 'same-postal' | 'no-match' | 'kvm-fallback';
  rentSampleSize: number;
  refurbTotal: number;
  // Endeligt tilbud
  netForkortet: {
    marketEstimate: number;
    minusMarketDiscount: number;     // gns afslag i området
    minusBrokerSavings: number;      // mæglersalær kunden sparer
    minusOwnershipCosts: number;     // ejertids-omkostninger ved selv-salg
    finalOffer: number;              // = bud@20% ROE
    targetRoePct: number;
  };
  /** Fuld afkast-output for dybere insights */
  afkast: ReturnType<typeof computeAfkast>;
}

const SAVED_BROKER_COMMISSION_PCT = 0.025;  // 2.5% af salgspris (typisk Sjælland-mægler)
const SAVED_BROKER_FIXED = 25_000;           // grundgebyr / annoncering

/**
 * Beregn fuldt prissat estimat.
 */
export async function computeEstimate(input: PriceEngineInput): Promise<PriceEngineResult> {
  // 1. Comparables — vægtet efter ejerforening
  const comps = await findComparables({
    postalCode: input.postalCode,
    roadName: input.roadName,
    houseNumber: input.houseNumber,
    kvm: input.kvm,
    yearBuilt: input.yearBuilt,
    rooms: input.rooms,
  });

  // Hvis vi har 0 comparables, fall back til kommune-snit (~28k/m² national avg som hyper-rough)
  let marketEstimate = comps.marketEstimate;
  if (marketEstimate === 0 || comps.sampleSize === 0) {
    marketEstimate = input.kvm * 28_000;
  }

  // Hvis kunden har angivet aktuel listing-pris, brug den som hjælpedata
  // (kan justere markedsestimat hvis det er meget tæt på)
  if (input.currentListingPrice && input.currentListingPrice > 0) {
    // 50/50 blend hvis tæt på, ellers stol på comparables
    const diff = Math.abs(input.currentListingPrice - marketEstimate) / marketEstimate;
    if (diff < 0.15) {
      marketEstimate = Math.round((marketEstimate + input.currentListingPrice) / 2);
    }
  }

  // 2. Estimeret leje — vores faktiske udlejnings-data slår altid en hardcoded rate.
  //    Hvis vi har lejemål på samme vej (proxy for samme EF), bruger vi median-lejen.
  //    Falder ellers tilbage til postnr-rate × m².
  const ourRentMatch = estimateMonthlyRent({
    postalCode: input.postalCode,
    roadName: input.roadName,
  });
  let estimatedRentMd: number;
  let rentSource: PriceEngineResult['rentSource'];
  if (ourRentMatch.source === 'same-vej' && ourRentMatch.monthlyRent > 0) {
    estimatedRentMd = ourRentMatch.monthlyRent;
    rentSource = 'same-vej';
  } else if (ourRentMatch.source === 'same-postal' && ourRentMatch.monthlyRent > 0) {
    estimatedRentMd = ourRentMatch.monthlyRent;
    rentSource = 'same-postal';
  } else {
    const lejeRate = LEJE_PR_M2_PR_MD[input.postalCode] ?? DEFAULT_LEJE_RATE;
    estimatedRentMd = Math.round(input.kvm * lejeRate);
    rentSource = 'kvm-fallback';
  }

  // 3. Refurbish baseret på stand
  const refurbPerM2 = REFURB_PER_M2[input.stand] ?? REFURB_PER_M2.middel;
  const refurbTotal = Math.round(input.kvm * refurbPerM2);

  // 4. Afkast-beregning med markedsestimat som listePris-input
  const afk = computeAfkast({
    rentMd: estimatedRentMd,
    listePris: marketEstimate,
    forhandletPris: null,
    driftTotal: input.driftTotalYearly,
    refurbTotal,
    haeftelseEf: input.haeftelseEf ?? 0,
  });

  // 5. Bud@20% ROE er det maksimale vi vil byde. computeAfkast capper allerede
  // ved 95% af listePris, så vi tager bare resultatet — eller fallback hvis null.
  const finalOffer = afk.budAt20PctRoe ?? Math.round(marketEstimate * 0.85);

  // 6. Breakdown — hvor stor er forskellen mellem markedsestimat og finalOffer?
  const totalDelta = marketEstimate - finalOffer;

  // Fordel deltaen som breakdown:
  //  - marked-afslag (hvad kunden ville opleve på markedet): marketEstimate × averageDiscountPct
  //  - mæglersalær: 2.5% × salgspris + 25k fast
  //  - ejertids-omkostninger: drift × forventet salgs-tid (4-5 mdr typisk)
  const marketDiscount = Math.round(marketEstimate * (comps.averageDiscountPct / 100));
  const brokerSavings = Math.round(marketEstimate * SAVED_BROKER_COMMISSION_PCT) + SAVED_BROKER_FIXED;
  const ownershipMonths = 5;  // typisk salgstid
  const ownershipCosts = Math.round((input.driftTotalYearly * ownershipMonths) / 12);

  // Sanity: hvis breakdown ikke summer op til delta, tilskriv resten til "andre forhold" (men vi viser ikke 5. række)
  // Bare lad finalOffer være sandheden; visningen viser vores "argumentation"

  return {
    marketEstimate,
    medianPricePerSqm: comps.medianPricePerSqm,
    averageDiscountPct: comps.averageDiscountPct,
    comparables: comps.topComparables,
    sampleSize: comps.sampleSize,
    sameEfCount: comps.sameEfCount,
    estimatedRentMd,
    rentSource,
    rentSampleSize: ourRentMatch.sampleSize,
    refurbTotal,
    netForkortet: {
      marketEstimate,
      minusMarketDiscount: marketDiscount,
      minusBrokerSavings: brokerSavings,
      minusOwnershipCosts: ownershipCosts,
      finalOffer,
      targetRoePct: 20,
    },
    afkast: afk,
  };
}
