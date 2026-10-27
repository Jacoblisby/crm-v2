/**
 * /salg-v4 — designerens flow, forkortet efter mødet 23.10.2026.
 *
 * Header viser 3 nummererede stages: 1. ADRESSE · 2. BOLIGEN · 3. ESTIMAT
 *
 * Trin: Bekræft · Dine oplysninger · Efter salget · Boligens stand → Estimat.
 *
 * Fjernet fra flowet efter mødet (for meget for målgruppen 60+, og de kan
 * afklares ved besigtigelsen):
 *   · «Hvornår vil du flytte?»
 *   · årgang på køkken og bad
 *   · hvidevarer, billeder og særlige forhold (DetaljerV4)
 *   · udgifter og lån/gæld i ejerforeningen (UdgifterV4, ForholdV4)
 * De tre sidste skærme ligger stadig i screens/ men bruges ikke. Mangler
 * udgifterne, regner submit-action med en standardudgift og skriver det i
 * lead-noten.
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
  /** fx "Trin 1 af 4" — vises som lille caps-counter under sub */
  counter: string;
}

export function getScreensV4(_state: FunnelStateV2): V4ScreenDef[] {
  const total = 4;
  return [
    {
      id: 'bekraeft',
      stage: 'adresse',
      kicker: 'Din bolig',
      title: 'Bekræft boligens detaljer',
      sub: 'Vi har hentet oplysningerne fra de offentlige registre (OIS og BBR). Ret dem, hvis noget ikke passer.',
      counter: `Trin 1 af ${total}`,
    },
    {
      id: 'kontakt',
      stage: 'adresse',
      kicker: 'Dine oplysninger',
      title: 'Hvor vil du gerne modtage dit tilbud?',
      sub: 'Vi kontakter dig inden for 24 timer. Så aftaler vi en gratis besigtigelse, og bagefter får du dit skriftlige bud.',
      counter: `Trin 2 af ${total}`,
    },
    {
      id: 'efter_salg',
      stage: 'adresse',
      kicker: 'Din situation',
      title: 'Hvad skal du efter salget?',
      sub: 'Så kan vi finde en løsning, der passer til dig. Dit svar forpligter dig ikke til noget.',
      counter: `Trin 3 af ${total}`,
    },
    {
      id: 'stand',
      stage: 'boligen',
      kicker: 'Din bolig',
      title: 'Hvordan er boligens stand?',
      sub: 'Vælg det, der passer bedst. Det hjælper os med at give dig et præcist bud.',
      counter: `Trin 4 af ${total}`,
    },
  ];
}
