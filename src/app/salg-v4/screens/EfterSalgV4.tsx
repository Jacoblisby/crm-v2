'use client';

/**
 * EfterSalgV4 — "Hvad skal du efter salget?" (01_Adresse trin 4, DIN SITUATION).
 * Viser designerens korte titler, men gemmer de v2-display-strenge som
 * FunnelV2Context mapper til v1-slugs (submit-action).
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { OptionRowV4 } from '../primitives';

const OPTIONS: Array<{ display: string; stateValue: string; sub: string; badge?: string }> = [
  {
    display: 'Flytter ud helt',
    stateValue: 'Flytter ud helt',
    sub: 'Jeg har et andet sted at bo.',
  },
  {
    display: 'Vil blive boende',
    stateValue: 'Vil blive boende som lejer',
    sub: 'Du bliver boende og nyder friværdien bekymringsfrit.',
    badge: 'POPULÆR',
  },
  {
    display: 'Vil leje en anden bolig',
    stateValue: 'Vil leje en anden bolig',
    sub: 'Vi har +20 lejemål klar til udlejning indenfor de næste 3 mdr.',
  },
  {
    display: 'Ved ikke endnu',
    stateValue: 'Ved ikke endnu',
    sub: 'Vi tager den snak senere.',
  },
];

export function EfterSalgV4() {
  const { state, update } = useFunnelV2();
  return (
    <div className="space-y-2.5">
      {OPTIONS.map((o) => (
        <OptionRowV4
          key={o.stateValue}
          title={o.display}
          sub={o.sub}
          badge={o.badge}
          selected={state.afterSaleRaw === o.stateValue}
          onSelect={() => update({ afterSaleRaw: o.stateValue })}
        />
      ))}
    </div>
  );
}
