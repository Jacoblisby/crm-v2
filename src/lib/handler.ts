/**
 * Handler pr. forening — comps og nøgletal.
 *
 * Datafilen laves af scripts/bbr/handler.py ud fra Resights' udtræk og
 * indeholder seneste handel pr. lejlighed, 36 måneder tilbage. Her regnes
 * der på den: hvor mange frie handler i perioden, og hvad kvadratmeteren
 * gik til.
 *
 * Nøgletallene bygger KUN på frie handler. En familieoverdragelse eller en
 * porteføljehandel har også en pris, men det er ikke en pris nogen fremmed
 * ville betale, og den ville trække medianen skævt. Handlerne vises stadig i
 * listen — mærket — så man kan se, hvad der er sorteret fra.
 */
import data from '@/lib/data/handler-forening.json';

export interface Handel {
  bfe: number;
  adresse: string;
  kvm: number;
  pris: number;
  dato: string;
  krPrKvm: number;
  metode: string;
  fri: boolean;
  /** Vores eget køb. Tæller ikke med i markedet — det er dét, vi måler mod. */
  vores: boolean;
}

export interface Koeb extends Handel {
  /**
   * Markedets median kr/kvm for lejligheder i SAMME STØRRELSE i månederne
   * op til købet, uden vores egne køb. Størrelsen er afgørende: i
   * Byskovparken handles 43 kvm til 15–17.000 og 107 kvm til 9–12.000, og
   * mod hele foreningens median ville et godt køb af en lille se dyrt ud.
   */
  markedKrPrKvm: number | null;
  /** Kvm-spændet markedet er målt på (±20 % af lejligheden). */
  markedKvmFra: number;
  markedKvmTil: number;
  /** Antal frie handler bag markedstallet. */
  markedAntal: number;
  /** Hvor mange måneder tilbage markedstallet bygger på (12, ellers 24). */
  markedMdr: number;
  /** Negativ = under markedet. */
  forskelPct: number | null;
}

export interface Noegletal {
  /** Frie handler i perioden. */
  antal: number;
  /** Alle handler i perioden, også dem der ikke tæller med. */
  antalAlle: number;
  medianKrPrKvm: number | null;
  gnsKrPrKvm: number | null;
  minKrPrKvm: number | null;
  maxKrPrKvm: number | null;
  medianPris: number | null;
}

const FORENINGER = data.foreninger as Record<string, Handel[]>;

export const HANDLER_GENERERET = data.genereret;
export const HANDLER_MAANEDER = data.maaneder;

export function handlerFor(foreningNavn: string): Handel[] {
  return FORENINGER[foreningNavn] ?? [];
}

function median(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function graense(maaneder: number, fra: Date = new Date()): string {
  const d = new Date(fra);
  d.setMonth(d.getMonth() - maaneder);
  return d.toISOString().slice(0, 10);
}

export function noegletal(handler: Handel[], maaneder: number): Noegletal {
  const g = graense(maaneder);
  // Vores egne køb er ikke markedet. Var de med, ville et godt køb trække
  // medianen ned og få det næste til at se mindre godt ud.
  const iPerioden = handler.filter((h) => h.dato >= g && !h.vores);
  const frie = iPerioden.filter((h) => h.fri && h.krPrKvm > 0);
  const kvm = frie.map((h) => h.krPrKvm);
  return {
    antal: frie.length,
    antalAlle: iPerioden.length,
    medianKrPrKvm: median(kvm),
    gnsKrPrKvm: kvm.length ? Math.round(kvm.reduce((a, b) => a + b, 0) / kvm.length) : null,
    minKrPrKvm: kvm.length ? Math.min(...kvm) : null,
    maxKrPrKvm: kvm.length ? Math.max(...kvm) : null,
    medianPris: median(frie.map((h) => h.pris)),
  };
}

export const kr = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `${Math.round(n).toLocaleString('da-DK')} kr.`;

function tilbage(iso: string, maaneder: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() - maaneder);
  return d.toISOString().slice(0, 10);
}

/** Comps i samme størrelse: ±20 % af lejlighedens kvm. */
const KVM_TOLERANCE = 0.2;

/**
 * Vores køb i foreningen, hver målt mod markedet på købstidspunktet:
 * medianen af foreningens frie handler af lejligheder i samme størrelse
 * (±20 % kvm) i de 12 måneder op til købet. Er der færre end tre, udvides
 * vinduet til 24 og så 36 måneder. Er der stadig for få, står forskellen
 * tom frem for at bygge på én tilfældig handel.
 */
export function voresKoeb(handler: Handel[]): Koeb[] {
  const marked = handler.filter((h) => !h.vores && h.fri && h.krPrKvm > 0);
  return handler
    .filter((h) => h.vores)
    .map((h) => {
      const kvmFra = Math.round(h.kvm * (1 - KVM_TOLERANCE));
      const kvmTil = Math.round(h.kvm * (1 + KVM_TOLERANCE));
      const sammeStr = marked.filter((m) => m.kvm >= kvmFra && m.kvm <= kvmTil && m.dato <= h.dato);
      let mdr = 12;
      let v = sammeStr.filter((m) => m.dato >= tilbage(h.dato, mdr));
      for (const bredere of [24, 36]) {
        if (v.length >= 3) break;
        mdr = bredere;
        v = sammeStr.filter((m) => m.dato >= tilbage(h.dato, mdr));
      }
      const med = v.length >= 3 ? median(v.map((m) => m.krPrKvm)) : null;
      return {
        ...h,
        markedKrPrKvm: med,
        markedKvmFra: kvmFra,
        markedKvmTil: kvmTil,
        markedAntal: v.length,
        markedMdr: mdr,
        forskelPct: med && h.krPrKvm ? Math.round((1000 * (h.krPrKvm - med)) / med) / 10 : null,
      };
    })
    .sort((a, b) => (a.dato < b.dato ? 1 : -1));
}

/** Samlet: median af vores kr/kvm og median-forskel til markedet. */
export function koebOpsummering(koeb: Koeb[]) {
  const medForskel = koeb.filter((k) => k.forskelPct !== null);
  return {
    antal: koeb.length,
    medianKrPrKvm: median(koeb.map((k) => k.krPrKvm).filter((x) => x > 0)),
    medianForskelPct: median(medForskel.map((k) => k.forskelPct as number)),
    antalMedForskel: medForskel.length,
  };
}

export const pct = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('da-DK', { maximumFractionDigits: 1 })} %`;
