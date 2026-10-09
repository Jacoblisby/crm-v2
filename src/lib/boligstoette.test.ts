import { describe, expect, it } from 'vitest';
import {
  SATSER,
  SIKRING,
  arealTilladt,
  beregnYdelse,
  ejerBoligudgift,
  formuetillaeg,
  lejerAlene,
  lejerBoligudgift,
  sammenlign,
  type LejerInput,
} from './boligstoette';

const enlig = (indkomstAar: number, formue = 0) => ({ personer: 1 as const, indkomstAar, formue });

describe('formuetillæg', () => {
  it('er nul under den laveste grænse', () => {
    expect(formuetillaeg(1_060_300)).toBe(0);
    expect(formuetillaeg(-50_000)).toBe(0);
  });
  it('er 10 % mellem grænserne og 20 % over den høje', () => {
    expect(formuetillaeg(1_560_300)).toBeCloseTo(50_000, 5);
    // 10 % af hele båndet (1.060.500) + 20 % af 100.000 over den høje grænse
    expect(formuetillaeg(2_220_800)).toBeCloseTo(106_050 + 20_000, 5);
  });
});

describe('arealloft', () => {
  it('er 65 m² for én og 85 m² for to', () => {
    expect(arealTilladt(1)).toBe(65);
    expect(arealTilladt(2)).toBe(85);
  });
  it('skærer boligudgiften forholdsmæssigt, når arealet er for stort', () => {
    const r = beregnYdelse(100_000, 130, enlig(150_000));
    expect(r.arealBeskaaret).toBe(true);
    expect(r.boligudgift).toBeCloseTo(50_000, 5);
  });
});

describe('boligydelse', () => {
  it('lægger tillægget til boligudgiften, før de 75 % tages (BL-analysen: 7.300 giver 5.475)', () => {
    const r = beregnYdelse(40_000, 50, enlig(150_000));
    expect(r.grundbeloeb).toBeCloseTo(0.75 * (40_000 + 8_500), 5);
  });
  it('trapper ud med 22,5 % af indkomst over grænsen', () => {
    const lav = beregnYdelse(50_000, 50, enlig(201_400));
    const hoej = beregnYdelse(50_000, 50, enlig(221_400));
    expect(lav.beregnet - hoej.beregnet).toBeCloseTo(0.225 * 20_000, 5);
  });
  it('rammer højeste boligydelse, 59.628 kr. om året = 4.969 kr. om måneden', () => {
    const r = beregnYdelse(100_000, 60, enlig(150_000));
    expect(r.ydelseAar).toBe(59_628);
    expect(r.ydelseMd).toBeCloseTo(4_969, 5);
    expect(r.begraenset).toBe('maksimum');
  });
  it('lader brugeren selv betale mindst 21.300 kr.', () => {
    // 0,75 × (27.000 + 8.500) = 26.625, men boligudgiften minus egenbetaling er kun 5.700
    const r = beregnYdelse(27_000, 40, enlig(100_000));
    expect(r.ydelseAar).toBeCloseTo(27_000 - 21_300, 5);
    expect(r.begraenset).toBe('egenbetaling');
  });
  it('kræver mindst 11 % af indkomsten i egenbetaling, når det er mere end 21.300 kr.', () => {
    const r = beregnYdelse(80_000, 60, enlig(300_000));
    expect(r.egenbetalingMin).toBeCloseTo(33_000, 5);
  });
  it('udbetaler ikke under 365 kr. om måneden', () => {
    const r = beregnYdelse(22_000, 40, enlig(100_000));
    expect(r.ydelseAar).toBe(0);
    expect(r.begraenset).toBe('under-minimum');
  });
  it('giver 0 med høj indkomst', () => {
    const r = beregnYdelse(60_000, 50, enlig(450_000));
    expect(r.ydelseAar).toBe(0);
  });
  it('tæller formuetillægget med i indkomsten', () => {
    const uden = beregnYdelse(70_000, 55, enlig(190_000, 0));
    const med = beregnYdelse(70_000, 55, enlig(190_000, 1_560_300));
    expect(med.formuetillaeg).toBeCloseTo(50_000, 5);
    expect(med.ydelseAar).toBeLessThan(uden.ydelseAar);
  });
  it('indkomstloftet rammer ikke for to personer med samme indkomst pr. person', () => {
    const r = beregnYdelse(90_000, 80, { personer: 2, indkomstAar: 190_000, formue: 0 });
    expect(r.arealBeskaaret).toBe(false);
  });
});

describe('lejers boligudgift', () => {
  const grund: LejerInput = {
    huslejeMd: 7_000,
    areal: 60,
    varme: 'saerskilt-andet',
    varmtVandILeje: false,
    elILeje: false,
    vandSaerskilt: false,
    vedligehold: 'udlejer',
  };
  it('er bare huslejen, når intet er indregnet', () => {
    expect(lejerBoligudgift(grund)).toBe(84_000);
  });
  it('trækker varme, varmt vand og el fra, når de er med i huslejen', () => {
    const b = lejerBoligudgift({ ...grund, varme: 'i-leje', varmtVandILeje: true, elILeje: true });
    expect(b).toBeCloseTo(84_000 - (108.25 + 34.25 + 81.75) * 60, 5);
  });
  it('lægger vandtillæg til, når vand betales ud over huslejen', () => {
    expect(lejerBoligudgift({ ...grund, vandSaerskilt: true })).toBeCloseTo(84_000 + (18 + 26.25) * 60, 5);
  });
  it('lægger varmetillæg til ved særskilt fjernvarme, el eller gas', () => {
    expect(lejerBoligudgift({ ...grund, varme: 'saerskilt-fjernvarme-el-gas' })).toBeCloseTo(84_000 + 41.5 * 60, 5);
  });
  it('lægger vedligeholdelsestillæg til', () => {
    expect(lejerBoligudgift({ ...grund, vedligehold: 'maling' })).toBeCloseTo(84_000 + 81.75 * 60, 5);
    expect(lejerBoligudgift({ ...grund, vedligehold: 'alt' })).toBeCloseTo(84_000 + 163.5 * 60, 5);
  });
});

describe('ejers boligudgift', () => {
  const e = { areal: 60, vurdering: 2_000_000, rkYdelseMd: 4_000, rkGaeld: 800_000, bankYdelseMd: 0, bankGaeld: 0, bankPant: true, ejendomsskatMd: 500 };
  it('tæller 80 % af ydelsen, ejendomsskat og standardbeløb for drift', () => {
    expect(ejerBoligudgift(e)).toBeCloseTo(0.8 * 48_000 + 6_000 + SATSER.ejerDrift, 5);
  });
  it('nedsætter ydelsen, når gælden overstiger 80 % af vurderingen', () => {
    const hoej = ejerBoligudgift({ ...e, rkGaeld: 2_000_000 });
    // 80 % af vurderingen er 1.600.000, gælden 2.000.000 -> faktor 0,8
    expect(hoej).toBeCloseTo(0.8 * 48_000 * 0.8 + 6_000 + SATSER.ejerDrift, 5);
  });
  it('tæller kun banklån med pant i boligen', () => {
    const uden = ejerBoligudgift({ ...e, bankYdelseMd: 1_000, bankGaeld: 100_000, bankPant: false });
    const med = ejerBoligudgift({ ...e, bankYdelseMd: 1_000, bankGaeld: 100_000, bankPant: true });
    expect(uden).toBeCloseTo(ejerBoligudgift(e), 5);
    expect(med - uden).toBeCloseTo(0.8 * 12_000, 5);
  });
});

describe('trin 1: boligstøtte som lejer alene', () => {
  const lejer: LejerInput = {
    huslejeMd: 7_000,
    areal: 55,
    varme: 'saerskilt-andet',
    varmtVandILeje: false,
    elILeje: false,
    vandSaerskilt: false,
    vedligehold: 'udlejer',
  };
  it('giver samme boligydelse som den fælles beregning', () => {
    const a = lejerAlene({ personer: 1, indkomstMd: 16_000, formue: 100_000, lejer });
    const b = beregnYdelse(lejerBoligudgift(lejer), 55, { personer: 1, indkomstAar: 192_000, formue: 100_000 });
    expect(a.ydelseAar).toBeCloseTo(b.ydelseAar, 5);
  });
  it('trækkes ned af formue fra salget', () => {
    const lav = lejerAlene({ personer: 1, indkomstMd: 16_000, formue: 100_000, lejer });
    const hoej = lejerAlene({ personer: 1, indkomstMd: 16_000, formue: 1_500_000, lejer });
    expect(hoej.ydelseAar).toBeLessThan(lav.ydelseAar);
  });
});

describe('sammenligning', () => {
  const base = {
    personer: 1 as const,
    indkomstMd: 16_500,
    oevrigFormue: 100_000,
    ejer: {
      areal: 60,
      vurdering: 1_800_000,
      rkYdelseMd: 3_300,
      rkGaeld: 600_000,
      bankYdelseMd: 0,
      bankGaeld: 0,
      bankPant: false,
      ejendomsskatMd: 700,
      faellesudgiftMd: 2_600,
      varmeVandElMd: 800,
      forsikringVedligeholdMd: 400,
    },
    salgspris: null as number | null,
    lejer: {
      huslejeMd: 7_500,
      areal: 60,
      varme: 'saerskilt-fjernvarme-el-gas' as const,
      varmtVandILeje: false,
      elILeje: false,
      vandSaerskilt: true,
      vedligehold: 'udlejer' as const,
      loebendeMd: 800,
    },
  };
  it('summerer ejerens udgifter pr. måned', () => {
    const r = sammenlign(base);
    expect(r.ejer.udgifterMd).toBe(3_300 + 700 + 2_600 + 800 + 400);
  });
  it('trækker boligydelsen fra som lejer, men ikke som ejer (ejere får den som lån)', () => {
    const r = sammenlign(base);
    expect(r.ejer.nettoMd).toBe(r.ejer.udgifterMd);
    expect(r.ejer.laanMd).toBeGreaterThan(0);
    expect(r.lejer.nettoMd).toBeCloseTo(r.lejer.udgifterMd - r.lejer.boligydelseMd, 5);
    expect(r.forskelMd).toBeCloseTo(r.ejer.nettoMd - r.lejer.nettoMd, 5);
    expect(r.forskelAar).toBeCloseTo(r.forskelMd * 12, 5);
  });
  it('lader salgsprisen styre formuen som lejer', () => {
    const lav = sammenlign({ ...base, salgspris: 1_800_000 });
    expect(sammenlign({ ...base, salgspris: null }).lejer.formue).toBe(base.oevrigFormue + base.ejer.vurdering - base.ejer.rkGaeld);
    const hoej = sammenlign({ ...base, salgspris: 2_300_000 });
    expect(hoej.lejer.formue - lav.lejer.formue).toBe(500_000);
    expect(hoej.lejer.boligydelseMd).toBeLessThanOrEqual(lav.lejer.boligydelseMd);
    // …og salget flytter ikke ejerens egen beregning
    expect(hoej.ejer.laanMd).toBe(lav.ejer.laanMd);
  });
  it('markerer, når huslejen er over halvdelen af indkomsten (§ 15)', () => {
    expect(sammenlign(base).huslejeOverHalvdelenAfIndkomst).toBe(false);
    expect(sammenlign({ ...base, indkomstMd: 12_000 }).huslejeOverHalvdelenAfIndkomst).toBe(true);
  });
});

// Egenskaber, der skal holde for alle tal, ikke kun for de eksempler ovenfor.
describe('egenskaber', () => {
  // Lille deterministisk generator, så testen er ens fra gang til gang.
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const tilfaelde = Array.from({ length: 400 }, () => ({
    personer: (rnd() < 0.5 ? 1 : 2) as 1 | 2,
    indkomstAar: Math.round(rnd() * 500_000),
    formue: Math.round(rnd() * 3_000_000),
    boligudgift: Math.round(rnd() * 200_000),
    areal: Math.round(30 + rnd() * 120),
  }));
  it('overskrider aldrig de tre lofter', () => {
    for (const t of tilfaelde) {
      const y = beregnYdelse(t.boligudgift, t.areal, { personer: t.personer, indkomstAar: t.indkomstAar, formue: t.formue });
      expect(y.ydelseAar).toBeGreaterThanOrEqual(0);
      expect(y.ydelseAar).toBeLessThanOrEqual(SATSER.maxYdelse + 0.5);
      expect(y.ydelseAar).toBeLessThanOrEqual(Math.max(0, y.boligudgift - y.egenbetalingMin) + 0.5);
    }
  });
  it('boligsikring overskrider aldrig sine lofter, heller ikke 15 %-loftet uden børn', () => {
    for (const t of tilfaelde) {
      const y = beregnYdelse(t.boligudgift, t.areal, { personer: t.personer, indkomstAar: t.indkomstAar, formue: t.formue }, 'sikring');
      expect(y.ydelseAar).toBeGreaterThanOrEqual(0);
      expect(y.ydelseAar).toBeLessThanOrEqual(SIKRING.maxYdelse + 0.5);
      expect(y.ydelseAar).toBeLessThanOrEqual(0.15 * y.boligudgift + 0.5);
      expect(y.ydelseAar).toBeLessThanOrEqual(Math.max(0, y.boligudgift - SIKRING.egenbetalingMin) + 0.5);
    }
  });
  it('falder aldrig, når indkomst eller formue stiger', () => {
    for (const t of tilfaelde) {
      const hus = { personer: t.personer, indkomstAar: t.indkomstAar, formue: t.formue };
      const a = beregnYdelse(t.boligudgift, t.areal, hus).ydelseAar;
      const b = beregnYdelse(t.boligudgift, t.areal, { ...hus, indkomstAar: hus.indkomstAar + 20_000 }).ydelseAar;
      const c = beregnYdelse(t.boligudgift, t.areal, { ...hus, formue: hus.formue + 500_000 }).ydelseAar;
      expect(b).toBeLessThanOrEqual(a + 1e-6);
      expect(c).toBeLessThanOrEqual(a + 1e-6);
    }
  });
  it('stiger aldrig, når boligudgiften falder', () => {
    for (const t of tilfaelde) {
      const hus = { personer: t.personer, indkomstAar: t.indkomstAar, formue: t.formue };
      const a = beregnYdelse(t.boligudgift, t.areal, hus).ydelseAar;
      const b = beregnYdelse(t.boligudgift * 0.8, t.areal, hus).ydelseAar;
      expect(b).toBeLessThanOrEqual(a + 1e-6);
    }
  });
  it('har satser, der hænger sammen med lovens grundbeløb gange regulering', () => {
    // Lovens grundbeløb (1993-niveau) og 2026-satserne skal have samme faktor, ca. 1,805.
    const faktor = SATSER.indkomstgraense / 111_600;
    expect(SATSER.tillaeg / 4_700).toBeCloseTo(faktor, 1);
    expect(SATSER.egenbetalingMin / 11_800).toBeCloseTo(faktor, 1);
    expect(SATSER.maxYdelse / 33_036).toBeCloseTo(faktor, 1);
    expect(SATSER.maxBoligudgift / 62_600).toBeCloseTo(faktor, 1);
    expect(SATSER.formueLav / 587_500).toBeCloseTo(faktor, 1);
    expect(SATSER.formueHoej / 1_175_100).toBeCloseTo(faktor, 1);
    expect(SATSER.ejerDrift / 9_000).toBeCloseTo(faktor, 1);
    // Boligsikringens satser er reguleret med en anden faktor (ca. 1,526), men hænger indbyrdes sammen
    const f2 = SIKRING.indkomstgraense / 111_600;
    expect(SIKRING.egenbetalingMin / 18_800).toBeCloseTo(f2, 1);
    expect(SIKRING.maxYdelse / 33_036).toBeCloseTo(f2, 1);
    expect(SIKRING.maxBoligudgift / 62_600).toBeCloseTo(f2, 1);
    expect(SIKRING.formueLav / 587_500).toBeCloseTo(f2, 1);
    expect(SIKRING.ejerDrift / 9_000).toBeCloseTo(f2, 1);
  });
});
