/**
 * Hvad registrene siger om én lejlighed: BBR + Resights, slået op på adresse.
 *
 * Datafilen laves af scripts/bbr/lejlighed_index.py og dækker lejlighederne
 * i de ejerforeninger vi har målt op — ikke hele landet. En adresse uden for
 * dem giver null, og kortet siger det.
 *
 * Nøglen skal normaliseres præcis som i scriptet: vej+nr og etage/dør, små
 * bogstaver, punktum og dobbelte mellemrum væk, og postnummeret for sig.
 */
import data from '@/lib/data/bbr-lejligheder.json';

export interface BbrLejlighed {
  forening: string | null;
  bbr: {
    kvm: number;
    kvmBeboelse: number | null;
    vaerelser: number | null;
    anvendelse: string;
    status: string;
    /** «Benyttet af ejeren» / «Udlejet» / null — BBR's udlejningsforhold. */
    udlejning: string | null;
    ejendomBfe: number;
    enhedBfe: number;
  };
  ejer: {
    type: string;
    alder: number | null;
    borDer: boolean | null;
    antal: number | null;
    reklamebeskyttet: string | null;
  } | null;
  handel: {
    pris: number | null;
    dato: string;
    krPrKvm: number | null;
    metode: string;
    fri: boolean;
  } | null;
}

// Via unknown: TypeScript udleder ellers en literal-type for alle ~2.000
// lejligheder, og den kan ikke sammenlignes med interfacet.
const LEJLIGHEDER = (data as unknown as { lejligheder: Record<string, BbrLejlighed> }).lejligheder;

const norm = (s: string) => s.toLowerCase().replace(/[\s.]+/g, ' ').trim();

export function bbrForAdresse(adresse: string | null, postnr: string | null): BbrLejlighed | null {
  if (!adresse) return null;
  const pn = postnr || adresse.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/)?.[1];
  if (!pn) return null;
  const vejOgEtage = adresse.split(',').slice(0, 2).map((d) => d.trim()).join(', ');
  return LEJLIGHEDER[`${norm(vejOgEtage)}|${pn}`] ?? null;
}
