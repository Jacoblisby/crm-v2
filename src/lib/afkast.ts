/**
 * Afkast-model — port fra Afkastberegner_v3.xlsx til TypeScript.
 * Bruges til at recompute Bud + ROE når brugeren ændrer estimeret leje
 * eller istandsættelse på en on-market kandidat.
 *
 * Constants matcher Antagelser-arket:
 *   B3=0.97  bankvurdering pct
 *   B4=0.8   realkredit pct
 *   B5=100   kurs
 *   B6=29600 årlig betaling pr lånt mio
 *   B7=0.22  selskabsskat
 *   B9=22500 lånsagsgebyr
 *   B10=0.0015 kurtage pct
 *   B11=0.0145 tinglysning pct
 *   B12=0.20 target ROE for foreslået bud
 */

export interface AfkastInputs {
  rentMd: number;
  listePris: number;
  forhandletPris?: number | null;
  // Drift omkostninger (DKK/år, sum af 10 kategorier)
  driftTotal: number;
  // Refurbish total (DKK)
  refurbTotal: number;
  // Hæftelse til ejerforening fra tingbogen (DKK)
  haeftelseEf?: number;
  // Andre lejeindtægter (DKK/år)
  andreLejeind?: number;
  // Revision (DKK/år)
  revision?: number;
  // Override årlig ydelse (kr per lånt 1 mio) — default 29.600 = 2,96%
  betalingPrMio?: number;
  // Target ROE (default 0.20 = 20%) — beregnes på ROE EBT (uden skat)
  targetRoe?: number;
}

export interface AfkastResult {
  // Inputs gengivet for sporbarhed
  forhandletPris: number;
  // Cash flow
  revenue: number;
  totalCosts: number;
  finansiering: number;
  ebit: number;
  ebt: number;
  netto: number;
  cfMd: number;
  // Equity
  kapitalbehov: number;
  egenkapital: number;
  // Yields
  roaEbitPct: number;
  roeEbtPct: number;
  roeNettoPct: number;
  // Suggested bid
  budAt20PctRoe: number | null;
  // Mellemregninger til debug-side (Excel-style)
  trace: {
    bankvurdering: number;          // pris × 0.97
    refusionMd3: number;             // leje × 3 (refusion til lejer)
    tinglysningSkode: number;        // 1.850 + pris × 0.6%
    handelsomkostninger: number;     // tinglysning + refurb
    realkreditProv: number;          // bankvurd × 0.8
    hovedstol: number;               // realkreditProv / kurs
    lansgsgebyr: number;             // 22.500 fast
    kurtage: number;                 // hovedstol × 0.15%
    tinglysningLaan: number;         // hovedstol × 1.45%
    laanomkTotal: number;            // sum af 3 ovenstående
    haeftelseFraLaaneprov: number;   // EF-hæftelse — trækkes fra låneprovenu
    laaneprov: number;               // hovedstol − låneomk − hæftelse (netto kontant)
    aarligYdelse: number;            // hovedstol × 29.600 / 1.000.000
    selskabsskat: number;            // ebt × 22% (kun hvis ebt>0)
  };
}

const BANKVURD_PCT = 0.97;
const REALKREDIT_PCT = 0.8;
const KURS = 100;
const BETALING_PR_MIO = 29600;
const SKAT = 0.22;
const LAANSAG = 22500;
const KURTAGE = 0.0015;
const TINGLYSNING_LAAN = 0.0145;
const TARGET_ROE = 0.2;

function deriveAt(price: number, inp: AfkastInputs) {
  const haeft = inp.haeftelseEf ?? 0;
  const betalingPrMio = inp.betalingPrMio ?? BETALING_PR_MIO;
  const bankvurd = price * BANKVURD_PCT;
  const refusion = inp.rentMd * 3;
  const kapitalbehov = price - refusion - refusion;
  const tinglysningSkode = 1850 + price * 0.006;
  const handelsomk = tinglysningSkode + inp.refurbTotal;
  // Realkreditlån baseret KUN på bankvurdering — hæftelsen reducerer ikke lånet
  const realkreditProv = bankvurd * REALKREDIT_PCT;
  const hovedstol = realkreditProv / (KURS / 100);
  const kurtageKr = hovedstol * KURTAGE;
  const tinglysningLaanKr = hovedstol * TINGLYSNING_LAAN;
  const laanomk = LAANSAG + kurtageKr + tinglysningLaanKr;
  // Hæftelsen trækkes fra låneprovenuet (kontant til disposition) — den skal
  // afregnes til ejerforeningen ved overdragelse, så vi modtager mindre.
  const laaneprov = hovedstol - laanomk - haeft;
  const finAar = (hovedstol * betalingPrMio) / 1_000_000;
  const egenkapital = kapitalbehov + handelsomk - laaneprov;
  return {
    kapitalbehov,
    egenkapital,
    finAar,
    bankvurd,
    refusion,
    tinglysningSkode,
    handelsomk,
    realkreditProv,
    hovedstol,
    kurtageKr,
    tinglysningLaanKr,
    laanomk,
    laaneprov,
    haeft,
  };
}

export function computeAfkast(inp: AfkastInputs): AfkastResult {
  const price = inp.forhandletPris ?? inp.listePris;
  const revenue = inp.rentMd * 12 + (inp.andreLejeind ?? 0);
  const totalCosts = inp.driftTotal + (inp.revision ?? 0);
  const d = deriveAt(price, inp);

  const ebit = revenue - totalCosts;
  const ebt = ebit - d.finAar;
  const skatBeloeb = Math.max(0, ebt) * SKAT;
  const netto = ebt - skatBeloeb;
  const cfMd = ebt / 12;

  const roaEbit = d.kapitalbehov ? ebit / d.kapitalbehov : 0;
  const roeEbt = d.egenkapital ? ebt / d.egenkapital : 0;
  const roeNetto = d.egenkapital ? netto / d.egenkapital : 0;

  // Find highest price der stadig giver target ROE EBT (FØR skat) — line search
  // Skat indgår IKKE i target — vi kigger på cash-flow før skat (EBT) som er
  // det der reelt sammenlignes med vores afkast-krav.
  const targetRoe = inp.targetRoe ?? TARGET_ROE;
  let budSolve: number | null = null;
  const lo = Math.max(50_000, Math.floor(price * 0.3));
  const hi = Math.ceil(price * 1.1);
  for (let trial = lo; trial <= hi; trial += 5_000) {
    const dt = deriveAt(trial, inp);
    if (dt.egenkapital <= 0) continue;
    const ebitT = revenue - totalCosts;
    const ebtT = ebitT - dt.finAar;
    const roeEbtT = ebtT / dt.egenkapital;
    if (roeEbtT >= targetRoe) budSolve = trial;
  }
  const bud = budSolve != null ? Math.round(budSolve / 1000) * 1000 : null;

  return {
    forhandletPris: price,
    revenue: Math.round(revenue),
    totalCosts: Math.round(totalCosts),
    finansiering: Math.round(d.finAar),
    ebit: Math.round(ebit),
    ebt: Math.round(ebt),
    netto: Math.round(netto),
    cfMd: Math.round(cfMd),
    kapitalbehov: Math.round(d.kapitalbehov),
    egenkapital: Math.round(d.egenkapital),
    roaEbitPct: +(roaEbit * 100).toFixed(1),
    roeEbtPct: +(roeEbt * 100).toFixed(1),
    roeNettoPct: +(roeNetto * 100).toFixed(1),
    budAt20PctRoe: bud,
    trace: {
      bankvurdering: Math.round(d.bankvurd),
      refusionMd3: Math.round(d.refusion),
      tinglysningSkode: Math.round(d.tinglysningSkode),
      handelsomkostninger: Math.round(d.handelsomk),
      realkreditProv: Math.round(d.realkreditProv),
      hovedstol: Math.round(d.hovedstol),
      lansgsgebyr: LAANSAG,
      kurtage: Math.round(d.kurtageKr),
      tinglysningLaan: Math.round(d.tinglysningLaanKr),
      laanomkTotal: Math.round(d.laanomk),
      haeftelseFraLaaneprov: Math.round(d.haeft),
      laaneprov: Math.round(d.laaneprov),
      aarligYdelse: Math.round(d.finAar),
      selskabsskat: Math.round(skatBeloeb),
    },
  };
}

// Eksponer constants så debug-side kan vise dem
export const AFKAST_CONSTANTS = {
  BANKVURD_PCT,
  REALKREDIT_PCT,
  KURS,
  BETALING_PR_MIO,
  SKAT,
  LAANSAG,
  KURTAGE,
  TINGLYSNING_LAAN,
  TARGET_ROE,
};

export const COST_LABELS: Record<string, string> = {
  costGrundvaerdi: 'Grundværdi',
  costFaellesudgifter: 'Fællesudgifter',
  costRottebekempelse: 'Rottebekæmpelse',
  costRenovation: 'Renovation',
  costForsikringer: 'Forsikringer',
  costFaelleslaan: 'Fælleslån',
  costGrundfond: 'Grundfond',
  costVicevaert: 'Vicevært / Administration',
  costVedligeholdelse: 'Vedligeholdelse',
  costAndreDrift: 'Andre driftsomkostninger',
};

export const REFURB_LABELS: Record<string, string> = {
  refurbGulv: 'Gulv slibning',
  refurbMaling: 'Maling',
  refurbRengoring: 'Rengøring',
  refurbAndre: 'Andet',
};
