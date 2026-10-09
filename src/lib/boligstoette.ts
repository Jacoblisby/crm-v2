/**
 * Boligydelse (boligstøtte til folkepensionister) — regnemotor.
 *
 * Kilder (alle slået op 9.10.2026):
 *   · Lov om individuel boligstøtte, LBK nr. 995 af 1.7.2025: §§ 8, 8 a, 10–15, 17, 20, 21, 23
 *   · Vejledning om regulering pr. 1.1.2026 af satser (VEJ nr. 10077), tabel 1: satserne herunder
 *   · BL-analyse maj 2022 (bl.dk): tillægget lægges til boligudgiften, før de 75 % tages
 *     («bruttotillægget udgør 7.300 kr.», «medfører 5.475 kr. mere i boligydelsen» = 75 % af 7.300)
 *
 * Det her er et SKØN, ikke en afgørelse. Udbetaling Danmark afgør, hvad man får, og bruger
 * oplysninger vi ikke har (bruttoetageareal, konkrete lejekontrakt, indkomstregisteret).
 * Satserne skal opdateres hvert år i januar: ret SATSER og årstallet, kør testene.
 */

export const SATSER = {
  aar: 2026,
  /** Formuetillæg (§ 8 a): 10 % af formue mellem lav og høj grænse, 20 % over den høje. */
  formueLav: 1_060_300,
  formueHoej: 2_120_800,
  /** Tillæg til boligudgiften (§ 21, stk. 1). Lægges til, før andelen tages. */
  tillaeg: 8_500,
  andel: 0.75,
  /** Aftrapning: andel af husstandsindkomsten over grænsen. */
  aftrapning: 0.225,
  indkomstgraense: 201_400,
  /** Man betaler mindst 11 % af husstandsindkomsten selv, dog mindst 21.300 kr. (§ 21, stk. 2). */
  egenbetalingPct: 0.11,
  egenbetalingMin: 21_300,
  /** Højeste årlige boligydelse (§ 23, stk. 1). 4.969 kr. pr. måned. */
  maxYdelse: 59_628,
  /** Højeste årlige boligudgift, der regnes med (§ 14, stk. 1). */
  maxBoligudgift: 113_000,
  /** Under 4.380 kr. om året (365 kr. pr. måned) udbetales boligydelse ikke første gang. */
  minimumAar: 4_380,
  /** Standardbeløb for ejeres drift og vedligehold (§ 17, stk. 1, nr. 4). */
  ejerDrift: 16_200,
  /** Arealloft (§ 12, stk. 2): 65 m² for første person, 20 m² for hver ekstra. */
  arealFoerste: 65,
  arealEkstra: 20,
  /** Kr. pr. m² bruttoetageareal om året (§ 10, stk. 2–5). */
  lejer: {
    fradragVarme: 108.25,
    fradragVarmtVand: 34.25,
    fradragEl: 81.75,
    tillaegVandafgift: 18.0,
    tillaegVandafledning: 26.25,
    tillaegMaling: 81.75,
    tillaegAnden: 81.75,
    tillaegVarmeSaerskilt: 41.5,
  },
} as const;

export type Husstand = {
  /** 1 = bor alene, 2 = to voksne. Begge antages at have folkepension. */
  personer: 1 | 2;
  /** Samlet personlig indkomst + positiv kapitalindkomst, kr. om året før skat. */
  indkomstAar: number;
  /** Nettoformue, kr. (bank, aktier, bil, friværdi i bolig minus gæld; ikke pension). */
  formue: number;
};

export type Begraensning = 'ingen' | 'egenbetaling' | 'maksimum' | 'under-minimum' | 'ingen-ydelse';

export type YdelseResultat = {
  boligudgiftRaa: number;
  /** Efter arealloft og loft på boligudgiften. */
  boligudgift: number;
  arealTilladt: number;
  arealBeskaaret: boolean;
  loftBrugt: boolean;
  formuetillaeg: number;
  indkomstInklFormue: number;
  /** 75 % af (boligudgift + tillæg). */
  grundbeloeb: number;
  reduktion: number;
  beregnet: number;
  egenbetalingMin: number;
  ydelseAar: number;
  ydelseMd: number;
  begraenset: Begraensning;
};

const maxNul = (x: number) => Math.max(0, x);

export function formuetillaeg(formue: number): number {
  const mellem = Math.min(formue, SATSER.formueHoej) - SATSER.formueLav;
  const over = formue - SATSER.formueHoej;
  return 0.1 * maxNul(mellem) + 0.2 * maxNul(over);
}

export function arealTilladt(personer: 1 | 2): number {
  return SATSER.arealFoerste + SATSER.arealEkstra * (personer - 1);
}

/** Fælles beregning for lejere og ejere, når boligudgiften (før areal og loft) er kendt. */
export function beregnYdelse(boligudgiftRaa: number, areal: number, hus: Husstand): YdelseResultat {
  const tilladt = arealTilladt(hus.personer);
  const arealBeskaaret = areal > tilladt && areal > 0;
  const efterAreal = arealBeskaaret ? (boligudgiftRaa * tilladt) / areal : boligudgiftRaa;
  const loftBrugt = efterAreal > SATSER.maxBoligudgift;
  const boligudgift = Math.min(efterAreal, SATSER.maxBoligudgift);

  const ft = formuetillaeg(hus.formue);
  const indkomst = hus.indkomstAar + ft;
  const grundbeloeb = SATSER.andel * (boligudgift + SATSER.tillaeg);
  const reduktion = SATSER.aftrapning * maxNul(indkomst - SATSER.indkomstgraense);
  const beregnet = grundbeloeb - reduktion;
  const egenbetalingMin = Math.max(SATSER.egenbetalingPct * indkomst, SATSER.egenbetalingMin);

  const efterEgenbetaling = boligudgift - egenbetalingMin;
  let ydelse = Math.min(beregnet, efterEgenbetaling, SATSER.maxYdelse);
  // Hvilken grænse er det, der bider? Den mindste af de tre.
  let begraenset: Begraensning = 'ingen';
  if (ydelse === efterEgenbetaling && efterEgenbetaling < beregnet) begraenset = 'egenbetaling';
  else if (ydelse === SATSER.maxYdelse && beregnet > SATSER.maxYdelse) begraenset = 'maksimum';

  if (ydelse <= 0) {
    ydelse = 0;
    begraenset = 'ingen-ydelse';
  } else if (ydelse < SATSER.minimumAar) {
    ydelse = 0;
    begraenset = 'under-minimum';
  }

  return {
    boligudgiftRaa,
    boligudgift,
    arealTilladt: tilladt,
    arealBeskaaret,
    loftBrugt,
    formuetillaeg: ft,
    indkomstInklFormue: indkomst,
    grundbeloeb,
    reduktion,
    beregnet,
    egenbetalingMin,
    ydelseAar: ydelse,
    ydelseMd: ydelse / 12,
    begraenset,
  };
}

// ── Lejer ────────────────────────────────────────────────────────────────

export type Varme = 'i-leje' | 'saerskilt-fjernvarme-el-gas' | 'saerskilt-andet';
export type Vedligehold = 'udlejer' | 'maling' | 'alt';

export type LejerInput = {
  huslejeMd: number;
  areal: number;
  varme: Varme;
  /** Er varmt vand og el med i huslejen? */
  varmtVandILeje: boolean;
  elILeje: boolean;
  /** Betaler lejeren vandafgift og afledningsafgift ud over huslejen? */
  vandSaerskilt: boolean;
  vedligehold: Vedligehold;
};

export function lejerBoligudgift(l: LejerInput): number {
  const s = SATSER.lejer;
  let b = l.huslejeMd * 12;
  const a = l.areal;
  if (l.varme === 'i-leje') b -= s.fradragVarme * a;
  if (l.varmtVandILeje) b -= s.fradragVarmtVand * a;
  if (l.elILeje) b -= s.fradragEl * a;
  if (l.vandSaerskilt) b += (s.tillaegVandafgift + s.tillaegVandafledning) * a;
  if (l.varme === 'saerskilt-fjernvarme-el-gas') b += s.tillaegVarmeSaerskilt * a;
  if (l.vedligehold === 'maling') b += s.tillaegMaling * a;
  if (l.vedligehold === 'alt') b += (s.tillaegMaling + s.tillaegAnden) * a;
  return maxNul(b);
}

// ── Ejer ─────────────────────────────────────────────────────────────────

export type EjerInput = {
  areal: number;
  /** Offentlig ejendomsvurdering (kontant), kr. */
  vurdering: number;
  rkYdelseMd: number;
  rkGaeld: number;
  bankYdelseMd: number;
  bankGaeld: number;
  /** Har banklånet pant i boligen? Kun tinglyste lån tæller (§ 17, stk. 2). */
  bankPant: boolean;
  /** Pålignet ejendomsskat (grundskyld og ejendomsværdiskat), kr. pr. måned. */
  ejendomsskatMd: number;
};

/** § 17: 80 % af renter og afdrag på tinglyste lån (nedsat, hvis gælden overstiger 80 % af vurderingen), ejendomsskat og et standardbeløb for drift. */
export function ejerBoligudgift(e: EjerInput): number {
  const tinglystYdelse = (e.rkYdelseMd + (e.bankPant ? e.bankYdelseMd : 0)) * 12;
  const tinglystGaeld = e.rkGaeld + (e.bankPant ? e.bankGaeld : 0);
  const graense = 0.8 * e.vurdering;
  const faktor = tinglystGaeld > graense && tinglystGaeld > 0 ? graense / tinglystGaeld : 1;
  const lan = 0.8 * tinglystYdelse * faktor;
  return lan + e.ejendomsskatMd * 12 + SATSER.ejerDrift;
}

// ── Sammenligning ────────────────────────────────────────────────────────

export type SammenligningInput = {
  personer: 1 | 2;
  indkomstMd: number;
  /** Bank, aktier, bil. Ikke pension, ikke boligen. */
  oevrigFormue: number;
  ejer: EjerInput & {
    /** Øvrige udgifter pr. måned, som ikke indgår i boligstøtten. */
    faellesudgiftMd: number;
    varmeVandElMd: number;
    forsikringVedligeholdMd: number;
  };
  /** Hvad boligen sælges for. Tom = vurderingen. */
  salgspris: number;
  lejer: LejerInput & {
    /** Varme, vand og el, som lejeren selv betaler ud over huslejen, kr. pr. måned. */
    loebendeMd: number;
  };
};

export type Sammenligning = {
  ejer: {
    ydelseRK: number;
    ydelseBank: number;
    ejendomsskat: number;
    faelles: number;
    varmeVandEl: number;
    forsikringVedligehold: number;
    udgifterMd: number;
    boligydelseMd: number;
    nettoMd: number;
    detaljer: YdelseResultat;
    formue: number;
  };
  lejer: {
    husleje: number;
    loebende: number;
    udgifterMd: number;
    boligydelseMd: number;
    nettoMd: number;
    detaljer: YdelseResultat;
    formue: number;
  };
  /** Positiv = billigere som lejer. */
  forskelMd: number;
  forskelAar: number;
  huslejeOverHalvdelenAfIndkomst: boolean;
};

export function sammenlign(i: SammenligningInput): Sammenligning {
  const indkomstAar = i.indkomstMd * 12;
  const gaeld = i.ejer.rkGaeld + i.ejer.bankGaeld;
  const salgspris = i.salgspris > 0 ? i.salgspris : i.ejer.vurdering;

  const formueEjer = i.oevrigFormue + i.ejer.vurdering - gaeld;
  const formueLejer = i.oevrigFormue + salgspris - gaeld;

  const ejerYdelse = beregnYdelse(ejerBoligudgift(i.ejer), i.ejer.areal, {
    personer: i.personer,
    indkomstAar,
    formue: formueEjer,
  });
  const lejerYdelse = beregnYdelse(lejerBoligudgift(i.lejer), i.lejer.areal, {
    personer: i.personer,
    indkomstAar,
    formue: formueLejer,
  });

  const ejerUdgifter =
    i.ejer.rkYdelseMd + i.ejer.bankYdelseMd + i.ejer.ejendomsskatMd + i.ejer.faellesudgiftMd + i.ejer.varmeVandElMd + i.ejer.forsikringVedligeholdMd;
  const lejerUdgifter = i.lejer.huslejeMd + i.lejer.loebendeMd;

  const ejerNetto = ejerUdgifter - ejerYdelse.ydelseMd;
  const lejerNetto = lejerUdgifter - lejerYdelse.ydelseMd;

  return {
    ejer: {
      ydelseRK: i.ejer.rkYdelseMd,
      ydelseBank: i.ejer.bankYdelseMd,
      ejendomsskat: i.ejer.ejendomsskatMd,
      faelles: i.ejer.faellesudgiftMd,
      varmeVandEl: i.ejer.varmeVandElMd,
      forsikringVedligehold: i.ejer.forsikringVedligeholdMd,
      udgifterMd: ejerUdgifter,
      boligydelseMd: ejerYdelse.ydelseMd,
      nettoMd: ejerNetto,
      detaljer: ejerYdelse,
      formue: formueEjer,
    },
    lejer: {
      husleje: i.lejer.huslejeMd,
      loebende: i.lejer.loebendeMd,
      udgifterMd: lejerUdgifter,
      boligydelseMd: lejerYdelse.ydelseMd,
      nettoMd: lejerNetto,
      detaljer: lejerYdelse,
      formue: formueLejer,
    },
    forskelMd: ejerNetto - lejerNetto,
    forskelAar: (ejerNetto - lejerNetto) * 12,
    huslejeOverHalvdelenAfIndkomst: i.lejer.huslejeMd * 12 > indkomstAar / 2,
  };
}
