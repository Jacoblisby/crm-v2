/**
 * /salg-v4 — designerens flow, forkortet efter mødet 23.10.2026.
 *
 * Header viser 3 nummererede stages: 1. ADRESSE · 2. BOLIGEN · 3. ESTIMAT
 *
 * Trin: Bekræft · Dine oplysninger · Efter salget · Boligens stand · Udgifter
 * (valgfrit, 29.10.2026) → Estimat.
 *
 * Fjernet fra flowet efter mødet (for meget for målgruppen 60+, og de kan
 * afklares ved besigtigelsen):
 *   · «Hvornår vil du flytte?»
 *   · årgang på køkken og bad
 *   · hvidevarer, billeder og særlige forhold (DetaljerV4)
 *   · lån/gæld i ejerforeningen (ForholdV4)
 * Udgifterne (UdgifterV4) er kommet tilbage som valgfrit trin. Springer
 * sælger det over, regner submit-action med en standardudgift og skriver det
 * i lead-noten. DetaljerV4 og ForholdV4 ligger i screens/ men bruges ikke.
 *
 * State genbruges 100% fra FunnelV2 (samme localStorage-nøgle) — backend urørt.
 */
import type { FunnelStateV2 } from '../salg-v2/types';

export type V4Stage = 'adresse' | 'boligen' | 'estimat';

export const V4_STAGE_LABELS: Record<V4Stage, string> = {
  adresse: 'Adresse',
  boligen: 'Boligen',
  estimat: 'Estimat',
};

export const V4_STAGE_ORDER: V4Stage[] = ['adresse', 'boligen', 'estimat'];

export interface V4ScreenDef {
  id: string;
  stage: V4Stage;
  kicker: string;
  title: string;
  sub: string;
}

export function getScreensV4(_state: FunnelStateV2): V4ScreenDef[] {
  return [
    {
      id: 'bekraeft',
      stage: 'adresse',
      kicker: 'Din bolig',
      title: 'Bekræft boligens detaljer',
      sub: 'Rigtige oplysninger giver dig et mere præcist bud. Vi har hentet dem fra de offentlige registre. Ret dem, hvis noget ikke passer.',
    },
    {
      id: 'kontakt',
      stage: 'adresse',
      kicker: 'Dine oplysninger',
      title: 'Hvor vil du gerne modtage dit tilbud?',
      sub: 'Du hører fra os inden for 24 timer, og det koster ikke noget. Vil du gå videre, ser vi boligen sammen, og du får et skriftligt bud.',
    },
    {
      id: 'efter_salg',
      stage: 'adresse',
      kicker: 'Din situation',
      title: 'Hvad skal du efter salget?',
      sub: 'Så kan vi finde en løsning, der passer til dig. Dit svar forpligter dig ikke til noget.',
    },
    {
      id: 'stand',
      stage: 'boligen',
      kicker: 'Din bolig',
      title: 'Hvordan er boligens stand?',
      sub: 'Vælg det, der passer bedst. Det hjælper os med at give dig et præcist bud.',
    },
    {
      id: 'udgifter',
      stage: 'boligen',
      kicker: 'Valgfrit',
      title: 'Hvad koster boligen at eje?',
      sub: 'Udfyld det, du kender, så får du et mere præcist bud. Resten finder vi sammen ved besigtigelsen.',
    },
  ];
}
