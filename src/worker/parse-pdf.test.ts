/**
 * Parse-PDF regression tests.
 *
 * Hver case er et komplet text-extract fra en rigtig salgsopstilling PDF.
 * Naar maeglere bruger nye formater (e.g. "Grundskyld bolig 2026" vs
 * "Grundskyld 2026"), tilfoejes ny fixture her med expected values.
 */
import { describe, it, expect } from 'vitest';
import {
  parseSalgsopstilling,
  parseEjerudgiftTotal,
  parseEjerforeningSikkerhed,
  parseEjendomsvaerdiskat,
  assessParseConfidence,
} from './parse-pdf';

describe('parseSalgsopstilling', () => {
  /**
   * danbolig Taastrup — Lindevangshusene 70, 2. mf., 2630 Taastrup.
   * Sag 0060001414. Salgsopstilling 25.5.2026.
   *
   * Format-quirks i denne PDF:
   *   - "Grundskyld bolig 2026 3.669,00" (ekstra ord "bolig" mellem label og aar)
   *   - "Rottebekæmpelse Anslået 2026 200,00" ("Anslået" mellem label og aar)
   *   - "VVS fælleslån Anslået 2026 6.553,92" (samme)
   *   - "Opsparing tagfond 2026 10.845,00" (helt nyt label-moenster)
   *   - "Grundlag for grundskyld: 582.400,00" tidligere i text — maa IKKE
   *     wrongly fanges som grundskyld via colon-fallback.
   */
  const DANBOLIG_LINDEVANG = `
Adresse: Lindevangshusene 70, 2. mf., 2630 Taastrup
Kontantpris: kr. 1.595.000 Sagsnr.: 0060001414 Ejerudgift/md.: kr. 2.968
Grundlag for grundskyld: 582.400,00
Tinglyst areal i alt: 43 m2 BBR-boligareal: 46 m2
Forsikringspræmien, der indgår i ejerudgiften er baseret på: ejerforeningens ejendomsforsikring hos Gjensidige
Kommende fælleslån Køber gøres særskilt opmærksom på at der i foreningen opspares til tagprojekt.
Derfor skal køber forvente et fælles taglån. Nærværende lejligheds andel forventes til kr. 126.427,70,
med en månedlig ydelse på kr. 625,48 + 37,50 i gebyr til administrationen.
Antennebidrag Der gøres opmærksom på, at der betales kr. 3.945 pr. år til antennebidrag.
Ejerudgift 1. år: Pr. år: Kontantbehov ved køb: kr. kr. kr. kr. kr. kr. kr.
Ejendomsværdiskat 2026 4.630,80
Grundskyld bolig 2026 3.669,00
Fællesudgifter 2026 9.712,80
Rottebekæmpelse Anslået 2026 200,00
VVS fælleslån Anslået 2026 6.553,92
Opsparing tagfond 2026 10.845,00
Ejerudgift i alt 1. år: 35.611,52
Sikkerhed til e/f: Ja, med kr. 80.000,00 I form af: Vedtægter lyst pantstiftende
`;

  it('parses danbolig Lindevangshusene 70 cost-breakdown korrekt', () => {
    const b = parseSalgsopstilling(DANBOLIG_LINDEVANG);
    expect(b.costGrundvaerdi).toBe(3669);
    expect(b.costFaellesudgifter).toBe(9713);
    expect(b.costRottebekempelse).toBe(200);
    expect(b.costRenovation).toBe(0);
    expect(b.costForsikringer).toBe(0);
    expect(b.costFaelleslaan).toBe(6554);
    expect(b.costGrundfond).toBe(10845);
    expect(b.costVicevaert).toBe(0);
    expect(b.costVedligeholdelse).toBe(0);
    expect(b.costAndreDrift).toBe(0);

    const drift =
      b.costGrundvaerdi + b.costFaellesudgifter + b.costRottebekempelse +
      b.costRenovation + b.costForsikringer + b.costFaelleslaan +
      b.costGrundfond + b.costVicevaert + b.costVedligeholdelse + b.costAndreDrift;
    expect(drift).toBe(30981);
  });

  it('extracts ejerudgift i alt 1. år', () => {
    expect(parseEjerudgiftTotal(DANBOLIG_LINDEVANG)).toBe(35612);
  });

  it('extracts ejerforening-sikkerhed (Ja, med kr. X)', () => {
    expect(parseEjerforeningSikkerhed(DANBOLIG_LINDEVANG)).toBe(80000);
  });

  it('ignorerer "Grundlag for grundskyld:" beskatningsgrundlag', () => {
    // Pattern 3 (colon-fallback) maa IKKE fange "Grundlag for grundskyld: X"
    // som actual grundskyld. Tidligere bug: returnerede 582400 (beskatningsgrundlag)
    // i stedet for 3669 (actual grundskyld).
    const b = parseSalgsopstilling(DANBOLIG_LINDEVANG);
    expect(b.costGrundvaerdi).not.toBe(582400);
  });

  it('ignorerer "Kommende fælleslån" narrative — bruger table-row VVS fælleslån', () => {
    // 126.427,70 er en informational "kommende fælleslån" andel, ikke en
    // aarlig drift-udgift. Parser skal returnere 6554 (VVS-fælleslån table-row).
    const b = parseSalgsopstilling(DANBOLIG_LINDEVANG);
    expect(b.costFaelleslaan).not.toBe(126428);
    expect(b.costFaelleslaan).toBe(6554);
  });

  it('returns 0 for missing fields without false positives', () => {
    const minimal = 'Bare en helt tom salgsopstilling uden cost-data.';
    const b = parseSalgsopstilling(minimal);
    expect(b.costGrundvaerdi).toBe(0);
    expect(b.costFaellesudgifter).toBe(0);
    expect(b.costFaelleslaan).toBe(0);
    expect(b.costGrundfond).toBe(0);
  });

  /**
   * danbolig Næstved — Kählersvej 2H, 1. 6., 4700 Næstved.
   * Sag 0520002765. Salgsopstilling 4.6.2026.
   *
   * Format-quirk i denne PDF: cost-rows har INGEN aar mellem label og beloeb.
   *   "Grundskyld bolig 6.029,00"          (vs Lindevang: "... bolig 2026 3.669,00")
   *   "Fællesudgifter 10.500,00"
   *   "Rottebekæmpelse 79,03"
   *
   * Pattern 1 maa derfor have aar som OPTIONAL.
   */
  const DANBOLIG_KAEHLERSVEJ = `
Adresse: Kählersvej 2H, 1. 6., 4700 Næstved
Kontantpris: kr. 995.000 Sagsnr.: 0520002765 Ejerudgift/md.: kr. 2.128
Ejerudgift 1. år: Pr. år: Kontantbehov ved køb: kr. kr. kr. kr. kr. kr. kr.
Ejendomsværdiskat 4.218,72
Grundskyld bolig 6.029,00
Fællesudgifter 10.500,00
Grundfond 3.300,00
Renovation 1.406,00
Rottebekæmpelse 79,03
Ejerudgift i alt 1. år: 25.532,75
Sikkerhed til e/f: Ja, med kr. 20.000,00 I form af: Vedtægter lyst pantstiftende
`;

  /**
   * danbolig Slagelse — Nansensgade 14, st. 1, 4200 Slagelse.
   * Sag 2840001501. Salgsopstilling 11.6.2026.
   *
   * Format-quirk: nogle rows viser BAADE md- og aars-beloeb:
   *   "Fællesudgifter kr. 1.490 pr. md. 17.880,00"
   *   "Grundfond kr. 339 pr. md. 4.068,00"
   * Parseren skal tage AARS-beloebet (sidst), ikke md-beloebet (foerst).
   * Tidligere bug: fangede 1.490 som aarlig fællesudgift.
   */
  const DANBOLIG_NANSENSGADE = `
Adresse: Nansensgade 14, st. 1, 4200 Slagelse
Kontantpris: kr. 895.000 Sagsnr.: 2840001501 Ejerudgift/md.: kr. 2.361
Ejerudgift 1. år: Pr. år: Kontantbehov ved køb: kr. kr. kr. kr. kr. kr.
Ejendomsværdiskat 3.321,12
Grundskyld bolig 2.957,04
Fællesudgifter kr. 1.490 pr. md. 17.880,00
Rottebekæmpelse 108,65
Grundfond kr. 339 pr. md. 4.068,00
Ejerudgift i alt 1. år: 28.334,81
Sikkerhed til e/f: Ja, med kr. 20.000,00 I form af: Vedtægter lyst pantstiftende
`;

  it('parses danbolig Nansensgade (md + aar paa samme row → tag aars-beloeb)', () => {
    const b = parseSalgsopstilling(DANBOLIG_NANSENSGADE);
    expect(b.costFaellesudgifter).toBe(17880); // IKKE 1490 (md-beloebet)
    expect(b.costGrundfond).toBe(4068); // IKKE 339
    expect(b.costGrundvaerdi).toBe(2957);
    expect(b.costRottebekempelse).toBe(109);

    const drift =
      b.costGrundvaerdi + b.costFaellesudgifter + b.costRottebekempelse +
      b.costRenovation + b.costForsikringer + b.costFaelleslaan +
      b.costGrundfond + b.costVicevaert + b.costVedligeholdelse + b.costAndreDrift;
    expect(drift).toBe(25014);

    expect(parseEjerudgiftTotal(DANBOLIG_NANSENSGADE)).toBe(28335);
    expect(parseEjerforeningSikkerhed(DANBOLIG_NANSENSGADE)).toBe(20000);
  });

  it('ganger md-beloeb med 12 hvis aars-tal mangler', () => {
    const b = parseSalgsopstilling('Fællesudgifter kr. 1.490 pr. md.');
    expect(b.costFaellesudgifter).toBe(17880);
  });

  /**
   * estaldo (Steffen Christensen) — Nansensgade 14, 2. 16, 4200 Slagelse.
   * Sag SC00218392. Salgsopstilling 25.06.2026.
   *
   * Ikke-DE-format. To-kolonne tabel "Pr. md. / Pr. år" hvor hver row har
   * md-beloeb FOERST og aars-beloeb bagefter, begge med " kr." suffix:
   *   "Ejerforening 1.031 kr. 12.372 kr."   ← "Ejerforening" = fællesudgifter
   *   "Grundfond 227 kr. 2.724 kr."
   *   "Grundskyld 166 kr. 1.989 kr."
   *   "Rottebekæmpelse 8 kr. 95 kr."
   * Parseren skal tage AARS-beloebet (det andet), ikke md.
   */
  const ESTALDO_NANSENSGADE = `
ADRESSE Nansensgade 14, 2. 16, 4200 Slagelse SAGSNR SC00218392 KONTANTPRIS 695.000 kr. DATO 25.06.2026
Ejerudgifter 1. år Pr. md. Pr. år
Ejendomsværdiskat 185 kr. 2.224 kr.
Ejerforening 1.031 kr. 12.372 kr.
Grundfond 227 kr. 2.724 kr.
Grundskyld 166 kr. 1.989 kr.
Rottebekæmpelse 8 kr. 95 kr.
Ejerudgifter i alt 1. år 1.617 kr. 19.404 kr.
Forsikringsforhold Kilde til forsikringspræmie Ejerforenings ejendomsforsikring Forsikringsselskab Tryg
Forening sikkerhed 20.000 kr. - I form af Ejerpantebrev
`;

  it('parses estaldo to-kolonne (md/år) — tager aars-beloeb', () => {
    const b = parseSalgsopstilling(ESTALDO_NANSENSGADE);
    expect(b.costFaellesudgifter).toBe(12372); // "Ejerforening", IKKE 1031
    expect(b.costGrundfond).toBe(2724); // IKKE 227
    expect(b.costGrundvaerdi).toBe(1989); // IKKE 166
    expect(b.costRottebekempelse).toBe(95); // IKKE 8
    expect(b.costForsikringer).toBe(0); // inkl. i ejerforening

    const drift =
      b.costGrundvaerdi + b.costFaellesudgifter + b.costRottebekempelse +
      b.costRenovation + b.costForsikringer + b.costFaelleslaan +
      b.costGrundfond + b.costVicevaert + b.costVedligeholdelse + b.costAndreDrift;
    expect(drift).toBe(17180);

    expect(parseEjerudgiftTotal(ESTALDO_NANSENSGADE)).toBe(19404); // IKKE 1 eller 1617
  });

  /**
   * home Taastrup — Taastrup Vænge 49, 2. 3., 2630 Taastrup.
   * Sag 1330002877. Salgsopstilling 10.6.2026.
   *
   * Format-quirks i home-PDF'er:
   *   "Fællesudgifter (fratrukket YouSee - afmeldt) 15.852,00"
   *     ← parentes-kommentar mellem label og beloeb
   *   "Skadedyrsbekæmpelse 123,76"
   *     ← home's betegnelse for rottebekæmpelse
   */
  const HOME_TAASTRUP_VAENGE = `
Adresse: Taastrup Vænge 49, 2. 3., 2630 Taastrup
Kontantpris: kr. 1.495.000 Sagsnr.: 1330002877 Ejerudgift/md.: kr. 2.119
Ejerudgift 1. år: Pr. år: Kontantbehov ved køb: kr. kr. kr. kr. kr.
Ejendomsværdiskat 5.283,60
Grundskyld bolig 4.173,00
Skadedyrsbekæmpelse 123,76
Fællesudgifter (fratrukket YouSee - afmeldt) 15.852,00
Ejerudgift i alt 1. år: 25.432,36
Sikkerhed til e/f: Ja, med kr. 15.000,00 I form af: Ejerpantebrev
`;

  it('parses home Taastrup Vænge (parentes i label + Skadedyrsbekæmpelse)', () => {
    const b = parseSalgsopstilling(HOME_TAASTRUP_VAENGE);
    expect(b.costGrundvaerdi).toBe(4173);
    expect(b.costFaellesudgifter).toBe(15852);
    expect(b.costRottebekempelse).toBe(124);
    expect(b.costRenovation).toBe(0);
    expect(b.costFaelleslaan).toBe(0);

    const drift =
      b.costGrundvaerdi + b.costFaellesudgifter + b.costRottebekempelse +
      b.costRenovation + b.costForsikringer + b.costFaelleslaan +
      b.costGrundfond + b.costVicevaert + b.costVedligeholdelse + b.costAndreDrift;
    expect(drift).toBe(20149);

    expect(parseEjerudgiftTotal(HOME_TAASTRUP_VAENGE)).toBe(25432);
    expect(parseEjerforeningSikkerhed(HOME_TAASTRUP_VAENGE)).toBe(15000);
  });

  it('parses danbolig Kählersvej 2H (uden aar mellem label og beloeb)', () => {
    const b = parseSalgsopstilling(DANBOLIG_KAEHLERSVEJ);
    expect(b.costGrundvaerdi).toBe(6029);
    expect(b.costFaellesudgifter).toBe(10500);
    expect(b.costRottebekempelse).toBe(79);
    expect(b.costRenovation).toBe(1406);
    expect(b.costGrundfond).toBe(3300);
    expect(b.costForsikringer).toBe(0);
    expect(b.costFaelleslaan).toBe(0);

    const drift =
      b.costGrundvaerdi + b.costFaellesudgifter + b.costRottebekempelse +
      b.costRenovation + b.costForsikringer + b.costFaelleslaan +
      b.costGrundfond + b.costVicevaert + b.costVedligeholdelse + b.costAndreDrift;
    expect(drift).toBe(21314);

    expect(parseEjerudgiftTotal(DANBOLIG_KAEHLERSVEJ)).toBe(25533);
    expect(parseEjerforeningSikkerhed(DANBOLIG_KAEHLERSVEJ)).toBe(20000);
  });
});

describe('parseEjendomsvaerdiskat', () => {
  it('fanger simpelt format', () => {
    expect(parseEjendomsvaerdiskat('Ejendomsværdiskat 4.630,80')).toBe(4631);
  });
  it('fanger estaldo to-kolonne (aars-beloeb)', () => {
    expect(parseEjendomsvaerdiskat('Ejendomsværdiskat 185 kr. 2.224 kr.')).toBe(2224);
  });
  it('returnerer 0 hvis ikke fundet', () => {
    expect(parseEjendomsvaerdiskat('Ingen skat her')).toBe(0);
  });
});

describe('assessParseConfidence', () => {
  it('ok naar drift + ejdvaerdiskat afstemmer med declared total', () => {
    // estaldo Nansensgade: drift 17180 + ejdvaerdiskat 2224 = 19404 = declared
    expect(assessParseConfidence({ driftTotal: 17180, declaredTotal: 19404, ejendomsvaerdiskat: 2224 })).toBe('ok');
  });
  it('uncertain naar drift er langt under forventet (parser missede felter)', () => {
    // estaldo-bug: drift 401 mod forventet 17180
    expect(assessParseConfidence({ driftTotal: 401, declaredTotal: 19404, ejendomsvaerdiskat: 2224 })).toBe('uncertain');
  });
  it('uncertain naar drift er absurd hoej (582k grundskyld-bug)', () => {
    expect(assessParseConfidence({ driftTotal: 592113, declaredTotal: 35612, ejendomsvaerdiskat: 4631 })).toBe('uncertain');
  });
  it('ok (neutral) naar declared total ikke kunne parses', () => {
    expect(assessParseConfidence({ driftTotal: 5000, declaredTotal: 0, ejendomsvaerdiskat: 0 })).toBe('ok');
  });
  it('tolererer smaa afvigelser inden for 5%', () => {
    expect(assessParseConfidence({ driftTotal: 20000, declaredTotal: 25000, ejendomsvaerdiskat: 4200 })).toBe('ok');
  });
});
