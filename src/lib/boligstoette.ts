/**
 * Boligydelse (boligstøtte til folkepensionister) — regnemotor.
 *
 * Kilder (alle slået op 9.10.2026):
 *   · Lov om individuel boligstøtte, LBK nr. 995 af 1.7.2025: §§ 8, 8 a, 10–15, 17, 20, 21, 23
 *   · Vejledning om regulering pr. 1.1.2026 af satser, gældende udgave VEJ nr. 9336 af 24.3.2026, tabel 1
 *     (boligydelse) og tabel 2 (boligsikring). Tabel 2 blev rettet i 2026, så ældre udgaver (VEJ nr. 10077)
 *     har forkerte boligsikringssatser.
 *   · Bekendtgørelse nr. 137 af 11.2.2013 (opgørelse af boligudgift for ejere, § 1 om ejerlejligheder)
 *   · BL-analyse maj 2022 (bl.dk): tillægget lægges til boligudgiften, før de 75 % tages
 *     («bruttotillægget udgør 7.300 kr.», «medfører 5.475 kr. mere i boligydelsen» = 75 % af 7.300)
 *
 * LEJERE får boligydelsen som TILSKUD (§ 30). EJERE får den som LÅN (§ 31): den forrentes med
 * Nationalbankens diskonto (§ 35), har pant i boligen (§ 36) og forfalder ved ejerskifte (§ 39).
 * Derfor trækkes den kun fra lejerens udgifter, aldrig fra ejerens.
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

/** Boligsikring (ikke-pensionister), tabel 2. Samme opbygning som SATSER, andre satser. */
export const SIKRING = {
  aar: 2026,
  formueLav: 896_400,
  formueHoej: 1_793_000,
  andel: 0.6,
  aftrapning: 0.18,
  indkomstgraense: 170_300,
  /** Fast mindstebeløb, ikke en procent af indkomsten som ved boligydelse (§ 22, stk. 2). */
  egenbetalingMin: 28_700,
  maxYdelse: 50_412,
  maxBoligudgift: 95_500,
  minimumAar: 3_696,
  ejerDrift: 13_700,
  /** Uden børn kan boligsikringen højst være 15 % af boligudgiften (§ 22, stk. 3). */
  loftUdenBoern: 0.15,
  lejer: {
    fradragVarme: 91.5,
    fradragVarmtVand: 29.0,
    fradragEl: 69.0,
    tillaegVandafgift: 15.25,
    tillaegVandafledning: 22.0,
    tillaegMaling: 69.0,
    tillaegAnden: 69.0,
    tillaegVarmeSaerskilt: 35.0,
  },
} as const;

/** Boligydelse er for folkepensionister, boligsikring for alle andre. */
export type Ordning = 'ydelse' | 'sikring';

export type Husstand = {
  /** 1 = bor alene, 2 = to voksne. Begge antages at have folkepension. */
  personer: 1 | 2;
  /** Samlet personlig indkomst + positiv kapitalindkomst, kr. om året før skat. */
  indkomstAar: number;
  /** Nettoformue, kr. (bank, aktier, bil, friværdi i bolig minus gæld; ikke pension). */
  formue: number;
};

export type Begraensning = 'ingen' | 'egenbetaling' | 'maksimum' | 'femtenprocent' | 'under-minimum' | 'ingen-ydelse';

export type YdelseResultat = {
  ordning: Ordning;
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
  /** Kun boligsikring: 15 %-loftet. */
  loft15: number | null;
  ydelseAar: number;
  ydelseMd: number;
  begraenset: Begraensning;
};

const maxNul = (x: number) => Math.max(0, x);

export function formuetillaeg(formue: number, ordning: Ordning = 'ydelse'): number {
  const S = ordning === 'ydelse' ? SATSER : SIKRING;
  const mellem = Math.min(formue, S.formueHoej) - S.formueLav;
  const over = formue - S.formueHoej;
  return 0.1 * maxNul(mellem) + 0.2 * maxNul(over);
}

export function arealTilladt(personer: 1 | 2): number {
  return SATSER.arealFoerste + SATSER.arealEkstra * (personer - 1);
}

/** Fælles beregning for lejere og ejere, når boligudgiften (før areal og loft) er kendt. */
export function beregnYdelse(boligudgiftRaa: number, areal: number, hus: Husstand, ordning: Ordning = 'ydelse'): YdelseResultat {
  const S = ordning === 'ydelse' ? SATSER : SIKRING;
  const tilladt = arealTilladt(hus.personer);
  const arealBeskaaret = areal > tilladt && areal > 0;
  const efterAreal = arealBeskaaret ? (boligudgiftRaa * tilladt) / areal : boligudgiftRaa;
  const loftBrugt = efterAreal > S.maxBoligudgift;
  const boligudgift = Math.min(efterAreal, S.maxBoligudgift);

  const ft = formuetillaeg(hus.formue, ordning);
  const indkomst = hus.indkomstAar + ft;
  // Boligydelse lægger et tillæg til boligudgiften, før de 75 % tages. Boligsikring har intet tillæg.
  const grundbeloeb = S.andel * (boligudgift + (ordning === 'ydelse' ? SATSER.tillaeg : 0));
  const reduktion = S.aftrapning * maxNul(indkomst - S.indkomstgraense);
  const beregnet = grundbeloeb - reduktion;
  const egenbetalingMin = ordning === 'ydelse' ? Math.max(SATSER.egenbetalingPct * indkomst, SATSER.egenbetalingMin) : SIKRING.egenbetalingMin;

  const efterEgenbetaling = boligudgift - egenbetalingMin;
  const loft15 = ordning === 'sikring' ? SIKRING.loftUdenBoern * boligudgift : null;
  let ydelse = Math.min(beregnet, efterEgenbetaling, S.maxYdelse, loft15 ?? Infinity);
  // Hvilken grænse er det, der bider? Den mindste af dem.
  let begraenset: Begraensning = 'ingen';
  if (loft15 !== null && ydelse === loft15 && loft15 < beregnet) begraenset = 'femtenprocent';
  else if (ydelse === efterEgenbetaling && efterEgenbetaling < beregnet) begraenset = 'egenbetaling';
  else if (ydelse === S.maxYdelse && beregnet > S.maxYdelse) begraenset = 'maksimum';

  if (ydelse <= 0) {
    ydelse = 0;
    begraenset = 'ingen-ydelse';
  } else if (ydelse < S.minimumAar) {
    ydelse = 0;
    begraenset = 'under-minimum';
  }

  return {
    ordning,
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
    loft15,
    // Den officielle beregner runder det årlige beløb til hele kroner, før det deles med 12.
    ydelseAar: Math.round(ydelse),
    ydelseMd: Math.round(ydelse) / 12,
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

export function lejerBoligudgift(l: LejerInput, ordning: Ordning = 'ydelse'): number {
  const s = ordning === 'ydelse' ? SATSER.lejer : SIKRING.lejer;
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

// ── Trin 1: boligstøtte som lejer alene ──────────────────────────────────

export function lejerAlene(i: {
  personer: 1 | 2;
  indkomstMd: number;
  /** Nettoformue som lejer: bank, aktier, bil og det, der er tilbage af boligen efter gæld. */
  formue: number;
  lejer: LejerInput;
  /** Folkepensionister får boligydelse, alle andre boligsikring. */
  ordning?: Ordning;
}): YdelseResultat & { huslejeOverHalvdelenAfIndkomst: boolean } {
  const ordning = i.ordning ?? 'ydelse';
  const indkomstAar = i.indkomstMd * 12;
  const y = beregnYdelse(
    lejerBoligudgift(i.lejer, ordning),
    i.lejer.areal,
    { personer: i.personer, indkomstAar, formue: i.formue },
    ordning,
  );
  return { ...y, huslejeOverHalvdelenAfIndkomst: i.lejer.huslejeMd * 12 > indkomstAar / 2 };
}

// ── Sammenligning ────────────────────────────────────────────────────────

export type SammenligningInput = {
  /** Folkepensionister får boligydelse (ejere som lån). Andre får boligsikring som lejere og ingenting som ejere. */
  ordning?: Ordning;
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
  /** Hvad boligen sælges for. null = vurderingen. */
  salgspris: number | null;
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
    /** Boligydelse, som ejeren kan søge som LÅN. Trækkes ikke fra udgifterne. */
    laanMd: number;
    /** Ejerens udgifter. Lig med udgifterMd, fordi støtten er et lån. */
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
  const ordning = i.ordning ?? 'ydelse';
  const indkomstAar = i.indkomstMd * 12;
  const gaeld = i.ejer.rkGaeld + i.ejer.bankGaeld;
  const salgspris = i.salgspris ?? i.ejer.vurdering;

  const formueEjer = i.oevrigFormue + i.ejer.vurdering - gaeld;
  const formueLejer = i.oevrigFormue + salgspris - gaeld;

  const ejerYdelse = beregnYdelse(ejerBoligudgift(i.ejer), i.ejer.areal, {
    personer: i.personer,
    indkomstAar,
    formue: formueEjer,
  });
  const lejerYdelse = beregnYdelse(
    lejerBoligudgift(i.lejer, ordning),
    i.lejer.areal,
    { personer: i.personer, indkomstAar, formue: formueLejer },
    ordning,
  );

  const ejerUdgifter =
    i.ejer.rkYdelseMd + i.ejer.bankYdelseMd + i.ejer.ejendomsskatMd + i.ejer.faellesudgiftMd + i.ejer.varmeVandElMd + i.ejer.forsikringVedligeholdMd;
  const lejerUdgifter = i.lejer.huslejeMd + i.lejer.loebendeMd;

  const ejerNetto = ejerUdgifter; // boligydelse til ejere er et lån, ikke et tilskud
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
      // Ejere får kun boligstøtte, hvis de modtager folkepension (§ 2).
      laanMd: ordning === 'ydelse' ? ejerYdelse.ydelseMd : 0,
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
