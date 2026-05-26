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
});
