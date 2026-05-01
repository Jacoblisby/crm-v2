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
  const bankvurd = price * BANKVURD_PCT;
  const refusion = inp.rentMd * 3;
  const kapitalbehov = price - refusion - refusion;
  const tinglysningSkode = 1850 + price * 0.006;
  const handelsomk = tinglysningSkode + inp.refurbTotal;
  const realkreditProv = bankvurd * REALKREDIT_PCT - haeft;
  const hovedstol = realkreditProv / (KURS / 100);
  const laanomk = LAANSAG + hovedstol * (KURTAGE + TINGLYSNING_LAAN);
  const laaneprov = hovedstol - laanomk;
  const finAar = (hovedstol * BETALING_PR_MIO) / 1_000_000;
  const egenkapital = kapitalbehov + handelsomk - laaneprov;
  return { kapitalbehov, egenkapital, finAar };
}

export function computeAfkast(inp: AfkastInputs): AfkastResult {
  const price = inp.forhandletPris ?? inp.listePris;
  const revenue = inp.rentMd * 12 + (inp.andreLejeind ?? 0);
  const totalCosts = inp.driftTotal + (inp.revision ?? 0);
  const { kapitalbehov, egenkapital, finAar } = deriveAt(price, inp);

  const ebit = revenue - totalCosts;
  const ebt = ebit - finAar;
  const netto = ebt - Math.max(0, ebt) * SKAT;
  const cfMd = ebt / 12;

  const roaEbit = kapitalbehov ? ebit / kapitalbehov : 0;
  const roeEbt = egenkapital ? ebt / egenkapital : 0;
  const roeNetto = egenkapital ? netto / egenkapital : 0;

  // Find highest price der stadig giver target ROE — line search
  let budSolve: number | null = null;
  const lo = Math.max(50_000, Math.floor(price * 0.3));
  const hi = Math.ceil(price * 1.1);
  for (let trial = lo; trial <= hi; trial += 5_000) {
    const d = deriveAt(trial, inp);
    if (d.egenkapital <= 0) continue;
    const ebitT = revenue - totalCosts;
    const ebtT = ebitT - d.finAar;
    const nettoT = ebtT - Math.max(0, ebtT) * SKAT;
    const roeT = nettoT / d.egenkapital;
    if (roeT >= TARGET_ROE) budSolve = trial;
  }
  const bud = budSolve != null ? Math.round(budSolve / 1000) * 1000 : null;

  return {
    forhandletPris: price,
    revenue: Math.round(revenue),
    totalCosts: Math.round(totalCosts),
    finansiering: Math.round(finAar),
    ebit: Math.round(ebit),
    ebt: Math.round(ebt),
    netto: Math.round(netto),
    cfMd: Math.round(cfMd),
    kapitalbehov: Math.round(kapitalbehov),
    egenkapital: Math.round(egenkapital),
    roaEbitPct: +(roaEbit * 100).toFixed(1),
    roeEbtPct: +(roeEbt * 100).toFixed(1),
    roeNettoPct: +(roeNetto * 100).toFixed(1),
    budAt20PctRoe: bud,
  };
}

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
