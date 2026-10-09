/**
 * Facit fra Udbetaling Danmarks egen vejledende beregner for IKKE-pensionister (boligsikring):
 * boligstoette.dk, «Fortsæt uden at være logget ind», boligtype Lejebolig, «Er du pensionist?» = nej,
 * enlig, kørt den 9.10.2026 med satserne i VEJ nr. 9336 af 24.3.2026. Hver række er et scenarie:
 * [indkomst pr. måned, husleje uden forbrug, areal, formue, opvarmning, forventet pr. måned].
 *
 * Opvarmning: T = betaler varme a conto eller til varmeselskab (varmetillæg pr. m²),
 *             F = varme og varmt vand er med i huslejen (fradrag pr. m²).
 *
 * Opdateres satserne, skal tallene hentes igen fra den officielle beregner.
 */
import { describe, expect, it } from 'vitest';
import { lejerAlene, type LejerInput } from './boligstoette';

type Rad = [indk: number, husleje: number, areal: number, formue: number, varme: 'T' | 'F', forventet: number];

const FACIT: Rad[] = [
  [12000, 4000, 60, 0, 'T', 626],
  [25000, 4000, 60, 0, 'T', 560],
  [32000, 4000, 60, 0, 'T', 0],
  [36000, 4000, 60, 0, 'T', 0],
  [40000, 4000, 60, 0, 'T', 0],
  [44000, 4000, 60, 0, 'T', 0],
  [12000, 6000, 60, 0, 'T', 926],
  [25000, 6000, 60, 0, 'T', 926],
  [32000, 6000, 60, 0, 'T', 500],
  [36000, 6000, 60, 0, 'T', 0],
  [40000, 6000, 60, 0, 'T', 0],
  [44000, 6000, 60, 0, 'T', 0],
  [12000, 7600, 60, 0, 'T', 1166],
  [25000, 7600, 60, 0, 'T', 1166],
  [32000, 7600, 60, 0, 'T', 1166],
  [36000, 7600, 60, 0, 'T', 740],
  [40000, 7600, 60, 0, 'T', 0],
  [44000, 7600, 60, 0, 'T', 0],
  [12000, 8500, 60, 0, 'T', 1194],
  [25000, 8500, 60, 0, 'T', 1194],
  [32000, 8500, 60, 0, 'T', 1194],
  [36000, 8500, 60, 0, 'T', 850],
  [40000, 8500, 60, 0, 'T', 0],
  [44000, 8500, 60, 0, 'T', 0],
  [12000, 9500, 60, 0, 'T', 1194],
  [25000, 9500, 60, 0, 'T', 1194],
  [32000, 9500, 60, 0, 'T', 1194],
  [36000, 9500, 60, 0, 'T', 850],
  [40000, 9500, 60, 0, 'T', 0],
  [44000, 9500, 60, 0, 'T', 0],
  [12000, 11000, 60, 0, 'T', 1194],
  [25000, 11000, 60, 0, 'T', 1194],
  [32000, 11000, 60, 0, 'T', 1194],
  [36000, 11000, 60, 0, 'T', 850],
  [40000, 11000, 60, 0, 'T', 0],
  [44000, 11000, 60, 0, 'T', 0],
  [33000, 7600, 60, 0, 'T', 1166],
  [34000, 7600, 60, 0, 'T', 1100],
  [35000, 7600, 60, 0, 'T', 920],
  [37000, 7600, 60, 0, 'T', 560],
  [38000, 7600, 60, 0, 'T', 380],
  [39000, 7600, 60, 0, 'T', 0],
  [33000, 6000, 60, 0, 'T', 320],
  [35000, 6000, 60, 0, 'T', 0],
  [37000, 6000, 60, 0, 'T', 0],
  [38000, 6000, 60, 0, 'T', 0],
  [39000, 6000, 60, 0, 'T', 0],
  [20000, 7700, 60, 0, 'T', 1181],
  [20000, 7780, 60, 0, 'T', 1193],
  [20000, 7790, 60, 0, 'T', 1194],
  [20000, 7800, 60, 0, 'T', 1194],
  [20000, 7900, 60, 0, 'T', 1194],
  [20000, 8000, 60, 0, 'T', 1194],
  [20000, 8200, 60, 0, 'T', 1194],
  [20000, 11000, 60, 0, 'F', 1194],
  [20000, 11000, 60, 0, 'T', 1194],
  [20000, 8500, 40, 0, 'T', 1194],
  [20000, 8500, 90, 0, 'T', 949],
  [20000, 5000, 60, 0, 'T', 776],
  [33000, 6000, 60, 0, 'T', 320],
  [20000, 5000, 60, 0, 'T', 776],
  [33000, 6000, 60, 0, 'F', 0],
  [20000, 5000, 60, 0, 'F', 660],
  [33000, 7600, 60, 902600, 'T', 1166],
  [33000, 7600, 60, 1000000, 'T', 1124],
  [33000, 7600, 60, 1200000, 'T', 824],
  [33000, 7600, 60, 1805400, 'T', 0],
  [33000, 7600, 60, 2000000, 'T', 0],
  [33000, 7600, 60, 2500000, 'T', 0],
  [36000, 7600, 60, 800000, 'T', 740],
  [36000, 7600, 60, 895000, 'T', 740],
  [36000, 7600, 60, 902600, 'T', 730],
  [36000, 7600, 60, 903000, 'T', 730],
  [36000, 7600, 60, 910000, 'T', 719],
  [36000, 7600, 60, 920000, 'T', 704],
  [36000, 7600, 60, 950000, 'T', 659],
  [36000, 7600, 60, 1000000, 'T', 584],
  [36000, 7600, 60, 1100000, 'T', 434],
  [36000, 7600, 60, 1500000, 'T', 0],
  [15000, 8500, 67, 0, 'T', 1194],
  [20000, 8500, 67, 0, 'T', 1194],
  [25000, 8500, 67, 0, 'T', 1194],
  [30000, 8500, 67, 0, 'T', 1194],
  [35000, 8500, 67, 0, 'T', 1030],
  [45000, 8500, 67, 0, 'T', 0],
  [15000, 7600, 67, 0, 'T', 1134],
  [20000, 7600, 67, 0, 'T', 1134],
  [25000, 7600, 67, 0, 'T', 1134],
  [30000, 7600, 67, 0, 'T', 1134],
  [35000, 7600, 67, 0, 'T', 792],
  [45000, 7600, 67, 0, 'T', 0],
];

const lejer = (h: number, a: number, v: 'T' | 'F'): LejerInput => ({
  huslejeMd: h,
  areal: a,
  varme: v === 'T' ? 'saerskilt-fjernvarme-el-gas' : 'i-leje',
  varmtVandILeje: v === 'F',
  elILeje: false,
  vandSaerskilt: false,
  vedligehold: 'udlejer',
});

describe('boligsikring mod Udbetaling Danmarks egen beregner (ikke-pensionist, enlig, 2026)', () => {
  for (const [indk, husleje, areal, formue, varme, forventet] of FACIT) {
    it(`indkomst ${indk} · husleje ${husleje} · ${areal} m² · formue ${formue} · ${varme}`, () => {
      const y = lejerAlene({ personer: 1, indkomstMd: indk, formue, lejer: lejer(husleje, areal, varme), ordning: 'sikring' });
      expect(Math.round(y.ydelseMd)).toBe(forventet);
    });
  }
});

// Par uden pension. Indkomst og formue er summen af de to; arealloftet er 85 m².
const PAR: Rad[] = [
  [20000, 8000, 80, 0, 'T', 1194],
  [20000, 8000, 110, 0, 'T', 965],
  [20000, 5000, 70, 0, 'T', 781],
  [33000, 8000, 80, 0, 'T', 1194],
  [40000, 8000, 80, 0, 'T', 0],
  [46000, 9000, 85, 0, 'T', 0],
  [30000, 8000, 80, 2_000_000, 'T', 0],
];

describe('boligsikring for par uden pension mod Udbetaling Danmarks egen beregner', () => {
  for (const [indk, husleje, areal, formue, varme, forventet] of PAR) {
    it(`par · indkomst ${indk} · husleje ${husleje} · ${areal} m² · formue ${formue}`, () => {
      const y = lejerAlene({ personer: 2, indkomstMd: indk, formue, lejer: lejer(husleje, areal, varme), ordning: 'sikring' });
      expect(Math.round(y.ydelseMd)).toBe(forventet);
    });
  }
});
