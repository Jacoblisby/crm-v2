/**
 * Pris-engine for boligberegner.
 *
 * Flow:
 *   1. Comparables → markedsestimat
 *   2. PDF eller manuel → driftTotal (årlig)
 *   3. Stand-rating → refurbTotal (engangsomkostning)
 *   4. Postnr × m² → estimeret leje/md
 *   5. computeAfkast() med markedsestimat som pris → bud@20% ROE
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
  // Endeligt tilbud — alle 4 fradrag + ourMargin summerer til (marketEstimate - finalOffer)
  netForkortet: {
    marketEstimate: number;
    minusMarketDiscount: number;     // gns afslag i området
    minusBrokerSavings: number;      // mæglersalær kunden sparer
    minusOwnershipCosts: number;     // ejertids-omkostninger ved selv-salg
    minusOurMargin: number;           // vores afkast-margin (det vi tjener på handlen)
    finalOffer: number;              // = bud@20% ROE (cappet ved 95% af list)
    targetRoePct: number;
  };
  /** Fuld afkast-output for dybere insights */
  afkast: ReturnType<typeof computeAfkast>;
}

// Mæglersalær: fast 70.000 kr (Jacob's faste antagelse — typisk gennemsnit
// for Sjælland-ejerlejligheder). Tidligere 2.5% × pris + 25.000 fast.
const SAVED_BROKER_FIXED = 70_000;
// Markedsafslag: fast 6% af markedsestimat. Tidligere brugte vi
// comps.averageDiscountPct fra historiske handler (svingede 5-15%) — nu
// stabil antagelse uafhængigt af data-støj.
const FIXED_MARKET_DISCOUNT_PCT = 0.06;
// Liggetid før salg: fast 3 mdr. Tidligere 5.
const OWNERSHIP_MONTHS = 3;

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

  // 4. Afkast-beregning med markedsestimat som pris (off-market har ingen rigtig
  // listepris — vi tester ROE ved vores eget marked-vurderede tal).
  const afk = computeAfkast({
    rentMd: estimatedRentMd,
    pris: marketEstimate,
    forhandletPris: null,
    driftTotal: input.driftTotalYearly,
    refurbTotal,
    haeftelseEf: input.haeftelseEf ?? 0,
  });

  // 5. Bud@target ROE er det matematiske svar; vi capper dog ved 95% af
  // marketEstimate, så vi aldrig betaler mere end vores markedsvurdering.
  // - Hvis ROE @ marketEstimate > 20% (mathBud > marketEstimate) → cap binder, vi tilbyder 95% af marked
  // - Ellers tager vi mathBud direkte (det er allerede ≤ marketEstimate)
  // Mellemregninger viser stadig den rene matematik — cap'en er en business-
  // regel oven på, ikke en del af afkast-engine'n.
  const OFF_MARKET_BID_CAP_PCT = 0.95;
  const offMarketCap = Math.round((marketEstimate * OFF_MARKET_BID_CAP_PCT) / 1000) * 1000;
  const mathBud = afk.budAt20PctRoe;
  const finalOffer =
    mathBud != null
      ? Math.min(mathBud, offMarketCap)
      : Math.round(marketEstimate * 0.85);

  // 6. Breakdown — fra markedspris til vores bud, matematisk korrekt så de
  // 4 fradrag + vores margin SUMMERER til delta. Brugeren skal kunne følge
  // tallene fra top til bund.
  const totalDelta = marketEstimate - finalOffer;

  // 6a. Beregn rå tal for hver "argumentation" — alle med faste antagelser:
  //   • Mæglersalær: 70.000 kr fast
  //   • Markedsafslag: 6% af markedsestimat
  //   • Liggetid: 3 mdr × drift/12
  const rawMarketDiscount = Math.round(marketEstimate * FIXED_MARKET_DISCOUNT_PCT);
  const rawBrokerSavings = SAVED_BROKER_FIXED;
  const rawOwnershipCosts = Math.round((input.driftTotalYearly * OWNERSHIP_MONTHS) / 12);
  const rawSum = rawMarketDiscount + rawBrokerSavings + rawOwnershipCosts;

  // 6b. Hvis cap er bindende (rawSum > delta), skaler ned proportionalt.
  // Ellers brug rå tal og tildel resten til vores afkast-margin.
  let marketDiscount: number;
  let brokerSavings: number;
  let ownershipCosts: number;
  let ourMargin: number;
  if (rawSum > totalDelta && totalDelta > 0) {
    const scale = totalDelta / rawSum;
    marketDiscount = Math.round(rawMarketDiscount * scale);
    brokerSavings = Math.round(rawBrokerSavings * scale);
    ownershipCosts = Math.round(rawOwnershipCosts * scale);
    ourMargin = totalDelta - marketDiscount - brokerSavings - ownershipCosts;
  } else {
    marketDiscount = rawMarketDiscount;
    brokerSavings = rawBrokerSavings;
    ownershipCosts = rawOwnershipCosts;
    ourMargin = Math.max(0, totalDelta - rawSum);
  }

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
      minusOurMargin: ourMargin,
      finalOffer,
      targetRoePct: 20,
    },
    afkast: afk,
  };
}
