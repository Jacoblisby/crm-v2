/**
 * /salg-v4 — designerens endelige flow (fra "365 ejendom design.fig").
 *
 * 4 stages i step-indikatoren:
 *   Adresse  → Bekræft, Dine oplysninger (kontakt), Hvornår, Efter salget, [Ny bolig]
 *   Boligen  → Køkken, Badeværelse, Øvrige rum, Sidste detaljer
 *   Udgifter → Boligens udgifter, Særlige forhold
 *   Estimat  → Dit foreløbige kontanttilbud
 *
 * State genbruges 100% fra FunnelV2 (samme localStorage-nøgle), så backend
 * (submitFunnelAction, DAWA, OIS) er uændret.
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
  kind?: 'room';
  roomId?: 'kokken' | 'bad' | 'ovrige';
}

export function getScreensV4(state: FunnelStateV2): V4ScreenDef[] {
  const screens: V4ScreenDef[] = [
    {
      id: 'bekraeft',
      stage: 'adresse',
      kicker: 'Fra OIS og BBR',
      title: 'Bekræft boligens detaljer',
      sub: 'Disse oplysninger er offentligt tilgængelige fra OIS og BBR. Tjek dem og ret hvis noget er ændret.',
    },
    {
      id: 'kontakt',
      stage: 'adresse',
      kicker: 'Dine oplysninger',
      title: 'Hvor sender vi dit tilbud?',
      sub: 'Vi sender estimatet til dig på e-mail og sms. Hvis du ønsker at gå videre, kan vi tage en kort snak og aftale en gratis besigtigelse.',
    },
    {
      id: 'hvornaar',
      stage: 'adresse',
      kicker: 'Tidsplan',
      title: 'Hvornår vil du flytte?',
      sub: 'Det her påvirker ikke dit tilbud — men hjælper os med at planlægge handlen og din overtagelse.',
    },
    {
      id: 'efter_salg',
      stage: 'adresse',
      kicker: 'Din situation',
      title: 'Hvad skal du efter salget?',
      sub: 'Fortæl os, hvad du overvejer efter salget. Det hjælper os med at finde den løsning, der passer bedst til din situation.',
    },
  ];

  if (state.afterSaleRaw === 'Vil leje en anden bolig') {
    screens.push({
      id: 'ny_bolig',
      stage: 'adresse',
      kicker: 'Din næste bolig',
      title: 'Hvad leder du efter?',
      sub: 'Fortæl os, hvad der er vigtigt i din næste bolig. Så kan vi undersøge, om vi har en lejebolig, der passer til dine behov.',
    });
  }

  screens.push(
    {
      id: 'kokken',
      stage: 'boligen',
      kicker: 'Boligens stand',
      title: 'Køkken',
      sub: 'Vurder køkkenets stand — fx skabe, bordplade, hvidevarer og generelt slid.',
      kind: 'room',
      roomId: 'kokken',
    },
    {
      id: 'bad',
      stage: 'boligen',
      kicker: 'Boligens stand',
      title: 'Badeværelse',
      sub: 'Vurder badeværelsets stand — fx fliser, sanitet, installationer og generelt slid.',
      kind: 'room',
      roomId: 'bad',
    },
    {
      id: 'ovrige',
      stage: 'boligen',
      kicker: 'Boligens stand',
      title: 'Øvrige rum',
      sub: 'Vurder boligens øvrige rum — fx stue, værelser, entré og gang.',
      kind: 'room',
      roomId: 'ovrige',
    },
    {
      id: 'detaljer',
      stage: 'boligen',
      kicker: 'Det sidste om boligen',
      title: 'Tilføj de sidste detaljer',
      sub: 'Hvidevarer, billeder og særlige forhold kan hjælpe os med at vurdere boligen mere præcist. Alt er valgfrit — du kan også springe videre.',
    },
    {
      id: 'udgifter',
      stage: 'udgifter',
      kicker: 'Faste udgifter',
      title: 'Boligens udgifter',
      sub: 'Jo flere oplysninger du giver, jo mere præcist kan vi beregne tilbuddet — men du kan sagtens gå videre, selvom du mangler nogle tal.',
    },
    {
      id: 'forhold',
      stage: 'udgifter',
      kicker: 'Særlige forhold',
      title: 'Er der noget, vi skal tage højde for?',
      sub: 'Nogle boliger har lån, gæld eller særlige aftaler, som kan påvirke det endelige beløb. Udfyld kun det, der er relevant — og vælg "ved ikke", hvis du er i tvivl.',
    },
  );

  return screens;
}
