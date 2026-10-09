/**
 * Facit fra Udbetaling Danmarks egen vejledende beregner (boligstoette.dk, «Beregn din boligstøtte»,
 * «Fortsæt uden at være logget ind», boligtype Lejebolig, folkepensionist), kørt den 9.10.2026 med
 * satserne for 2026. Hver række er et scenarie, der er sendt gennem den officielle beregner;
 * `forventet` er det beløb pr. måned, den svarede.
 *
 * Opvarmning i den officielle beregner:
 *   · «Betaler varme a conto» = ja, eller nej og «betaler til varmeselskab» = ja
 *       → huslejen er uden forbrug, og der lægges 41,50 kr. pr. m² til (§ 10, stk. 5)
 *   · begge nej → huslejen indeholder varme og varmt vand, og der trækkes 108,25 + 34,25 kr. pr. m² fra
 * Der spørges ikke til el, vand eller vedligeholdelse.
 *
 * Opdateres satserne, skal disse tal hentes igen fra den officielle beregner.
 */
import { describe, expect, it } from 'vitest';
import { lejerAlene, type LejerInput } from './boligstoette';

type Varm = 'tillaeg' | 'fradrag';
type Rad = {
  indk: number; // kr. pr. måned, samlet for husstanden
  formue: number; // samlet formue
  areal: number;
  husleje: number;
  varme: Varm;
  personer?: 1 | 2;
  forventet: number;
};

const lejer = (r: Rad): LejerInput => ({
  huslejeMd: r.husleje,
  areal: r.areal,
  varme: r.varme === 'tillaeg' ? 'saerskilt-fjernvarme-el-gas' : 'i-leje',
  varmtVandILeje: r.varme === 'fradrag',
  elILeje: false,
  vandSaerskilt: false,
  vedligehold: 'udlejer',
});

const T: Varm = 'tillaeg';
const F: Varm = 'fradrag';

const FACIT: Rad[] = [
  // Opvarmning
  { indk: 15000, formue: 0, areal: 55, husleje: 5000, varme: T, forventet: 3415 },
  { indk: 15000, formue: 0, areal: 55, husleje: 5000, varme: F, forventet: 2572 },
  { indk: 15000, formue: 0, areal: 55, husleje: 8000, varme: T, forventet: 4969 },
  { indk: 15000, formue: 0, areal: 55, husleje: 8000, varme: F, forventet: 4969 },
  { indk: 25000, formue: 0, areal: 55, husleje: 5000, varme: T, forventet: 2440 },
  { indk: 25000, formue: 0, areal: 55, husleje: 5000, varme: F, forventet: 1597 },
  { indk: 25000, formue: 0, areal: 55, husleje: 8000, varme: T, forventet: 4825 },
  { indk: 25000, formue: 0, areal: 55, husleje: 8000, varme: F, forventet: 4193 },
  { indk: 17500, formue: 0, areal: 62, husleje: 7500, varme: T, forventet: 4969 },
  // Indkomst
  { indk: 12000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 4433 },
  { indk: 12000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 17000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 4338 },
  { indk: 17000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 20000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 4008 },
  { indk: 20000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 24000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 3563 },
  { indk: 24000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 28000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 2663 },
  { indk: 28000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4913 },
  { indk: 32000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 1763 },
  { indk: 32000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 4013 },
  { indk: 36000, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 863 },
  { indk: 36000, formue: 0, areal: 60, husleje: 9000, varme: T, forventet: 3113 },
  // Formue
  { indk: 17500, formue: 0, areal: 60, husleje: 6000, varme: T, forventet: 4283 },
  { indk: 17500, formue: 1_000_000, areal: 60, husleje: 6000, varme: T, forventet: 4283 },
  { indk: 17500, formue: 1_100_000, areal: 60, husleje: 6000, varme: T, forventet: 4246 },
  { indk: 17500, formue: 1_500_000, areal: 60, husleje: 6000, varme: T, forventet: 3879 },
  { indk: 17500, formue: 2_000_000, areal: 60, husleje: 6000, varme: T, forventet: 3264 },
  { indk: 17500, formue: 2_200_000, areal: 60, husleje: 6000, varme: T, forventet: 2740 },
  { indk: 17500, formue: 2_500_000, areal: 60, husleje: 6000, varme: T, forventet: 1615 },
  { indk: 17500, formue: 3_000_000, areal: 60, husleje: 6000, varme: T, forventet: 0 },
  { indk: 25000, formue: 1_500_000, areal: 60, husleje: 9000, varme: T, forventet: 4764 },
  { indk: 25000, formue: 2_500_000, areal: 60, husleje: 9000, varme: T, forventet: 2178 },
  // Areal og huslejeloft
  { indk: 25000, formue: 0, areal: 50, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 25000, formue: 0, areal: 65, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 25000, formue: 0, areal: 70, husleje: 9000, varme: T, forventet: 4969 },
  { indk: 25000, formue: 0, areal: 90, husleje: 9000, varme: T, forventet: 3726 },
  { indk: 25000, formue: 0, areal: 120, husleje: 9000, varme: T, forventet: 2350 },
  { indk: 30000, formue: 0, areal: 65, husleje: 10000, varme: T, forventet: 4620 },
  { indk: 30000, formue: 0, areal: 65, husleje: 12000, varme: T, forventet: 4620 },
  { indk: 30000, formue: 0, areal: 65, husleje: 14000, varme: T, forventet: 4620 },
  // Par (to folkepensionister). Indkomst og formue er summen af de to.
  { personer: 2, indk: 30000, formue: 0, areal: 80, husleje: 8000, varme: T, forventet: 3765 },
  { personer: 2, indk: 30000, formue: 0, areal: 100, husleje: 8000, varme: T, forventet: 2878 },
  { personer: 2, indk: 30000, formue: 0, areal: 130, husleje: 8000, varme: T, forventet: 1701 },
  { personer: 2, indk: 30000, formue: 2_000_000, areal: 80, husleje: 8000, varme: T, forventet: 2003 },
  { personer: 2, indk: 30000, formue: 2_500_000, areal: 80, husleje: 8000, varme: T, forventet: 0 },
  { personer: 2, indk: 45000, formue: 0, areal: 85, husleje: 9000, varme: T, forventet: 1153 },
  { personer: 2, indk: 45000, formue: 0, areal: 85, husleje: 12000, varme: T, forventet: 1245 },
  { personer: 2, indk: 22000, formue: 0, areal: 80, husleje: 7000, varme: T, forventet: 4815 },
];

describe('mod Udbetaling Danmarks egen beregner (lejer, folkepension, 2026)', () => {
  for (const r of FACIT) {
    const navn = `${r.personer === 2 ? 'par' : 'enlig'} · indkomst ${r.indk} · formue ${r.formue} · ${r.areal} m² · husleje ${r.husleje} · ${r.varme}`;
    it(navn, () => {
      const y = lejerAlene({ personer: r.personer ?? 1, indkomstMd: r.indk, formue: r.formue, lejer: lejer(r) });
      expect(Math.round(y.ydelseMd)).toBe(r.forventet);
    });
  }
});
