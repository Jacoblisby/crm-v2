/**
 * /salg-v4 — designerens endelige flow, pixel-matchet mod Figma-framesene
 * i "365 ejendomme design Shared" (NXq53grC6JZj0AeCK657Yw).
 *
 * Header viser 4 nummererede stages: 1. ADRESSE · 2. BOLIGEN · 3. UDGIFTER · 4. ESTIMAT
 *
 * Trin (fra framesene 01_Adresse strin 1 → 04_Estimat):
 *   Adresse  1/4 Bekræft · 2/4 Dine oplysninger · 3/4 Hvornår · 4/4 Efter salget
 *            (+ ekstra: Ny bolig — "IKKE DESIGNET" i filen, holdes i samme sprog)
 *   Boligen  1/2 Boligens stand (alle rum som chips) · 2/2 Sidste detaljer
 *   Udgifter 1/2 Boligens udgifter · 2/2 Særlige forhold
 *   Estimat  Dit foreløbige kontanttilbud
 *
 * State genbruges 100% fra FunnelV2 (samme localStorage-nøgle) — backend urørt.
 */
import type { FunnelStateV2 } from '../salg-v2/types';

export type V4Stage = 'adresse' | 'boligen' | 'udgifter' | 'estimat';

export const V4_STAGE_LABELS: Record<V4Stage, string> = {
  adresse: 'Adresse',
  boligen: 'Boligen',
  udgifter: 'Udgifter',
  estimat: 'Estimat',
};

export const V4_STAGE_ORDER: V4Stage[] = ['adresse', 'boligen', 'udgifter', 'estimat'];

export interface V4ScreenDef {
  id: string;
  stage: V4Stage;
  kicker: string;
  title: string;
  sub: string;
  /** fx "Adresse 1 / 4" — vises som lille caps-counter under sub */
  counter: string;
}

export function getScreensV4(state: FunnelStateV2): V4ScreenDef[] {
  const harNyBolig = state.afterSaleRaw === 'Vil leje en anden bolig';
  const adresseTotal = harNyBolig ? 5 : 4;

  const screens: V4ScreenDef[] = [
    {
      id: 'bekraeft',
      stage: 'adresse',
      kicker: 'Adresseoplysninger',
      title: 'Bekræft boligens detaljer',
      sub: 'Disse oplysninger er offentligt tilgængelige fra OIS og BBR. Tjek dem og ret hvis noget er ændret.',
      counter: `Adresse 1 / ${adresseTotal}`,
    },
    {
      id: 'kontakt',
      stage: 'adresse',
      kicker: 'Dine oplysninger',
      title: 'Hvor sender vi dit tilbud?',
      sub: 'Vi sender estimatet til dig på e-mail og sms. Hvis du ønsker at gå videre, kan vi tage en kort snak og aftale en gratis besigtigelse.',
      counter: `Adresse 2 / ${adresseTotal}`,
    },
    {
      id: 'hvornaar',
      stage: 'adresse',
      kicker: 'Tidsplan',
      title: 'Hvornår vil du flytte?',
      sub: 'Det her påvirker ikke dit tilbud — men hjælper os med at planlægge handlen og din overtagelse.',
      counter: `Adresse 3 / ${adresseTotal}`,
    },
    {
      id: 'efter_salg',
      stage: 'adresse',
      kicker: 'Din situation',
      title: 'Hvad skal du efter salget?',
      sub: 'Fortæl os, hvad du overvejer efter salget. Det hjælper os med at finde den løsning, der passer bedst til din situation.',
      counter: `Adresse 4 / ${adresseTotal}`,
    },
  ];

  if (harNyBolig) {
    screens.push({
      id: 'ny_bolig',
      stage: 'adresse',
      kicker: 'Din næste bolig',
      title: 'Hvad leder du efter?',
      sub: 'Fortæl os, hvad der er vigtigt i din næste bolig. Så kan vi undersøge, om vi har en lejebolig, der passer til dine behov.',
      counter: `Adresse 5 / ${adresseTotal}`,
    });
  }

  screens.push(
    {
      id: 'stand',
      stage: 'boligen',
      kicker: 'Boligen',
      title: 'Boligens stand',
      sub: 'Vurder standen på de vigtigste dele af boligen. Det hjælper os med at give et mere præcist tilbud — og du kan vælge det niveau, der passer bedst.',
      counter: 'Boligen 1 / 2',
    },
    {
      id: 'detaljer',
      stage: 'boligen',
      kicker: 'Det sidste om boligen',
      title: 'Tilføj de sidste detaljer',
      sub: 'Hvidevarer, billeder og særlige forhold kan hjælpe os med at vurdere boligen mere præcist. Alt er valgfrit — du kan også springe videre.',
      counter: 'Boligen 2 / 2',
    },
    {
      id: 'udgifter',
      stage: 'udgifter',
      kicker: 'Faste udgifter',
      title: 'Boligens udgifter',
      sub: 'Jo flere oplysninger du giver, jo mere præcist kan vi beregne tilbuddet — men du kan sagtens gå videre, selvom du mangler nogle tal.',
      counter: 'Udgifter 1 / 2',
    },
    {
      id: 'forhold',
      stage: 'udgifter',
      kicker: 'Særlige forhold',
      title: 'Er der noget, vi skal tage højde for?',
      sub: 'Nogle boliger har lån, gæld eller særlige aftaler, som kan påvirke det endelige beløb. Udfyld kun det, der er relevant — og vælg "ved ikke", hvis du er i tvivl.',
      counter: 'Udgifter 2 / 2',
    },
  );

  return screens;
}
