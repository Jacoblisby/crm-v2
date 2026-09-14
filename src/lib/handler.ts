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
  const iPerioden = handler.filter((h) => h.dato >= g);
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
