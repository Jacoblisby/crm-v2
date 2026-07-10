'use client';

/**
 * HvornaarV4 — "Hvornår vil du flytte?" (01_Adresse trin 3).
 * Designer-copy inkl. brugerens rettelser ("Jeg skal have tid og ro...",
 * "Jeg vil gerne lære mere om hvad jeg kan sælge for").
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { OptionRowV4, V4 } from '../primitives';

const OPTIONS = [
  { t: 'Hurtigst muligt', sub: 'Inden for 1 måned' },
  { t: '1–3 måneder', sub: 'Vi har lidt fleksibilitet' },
  { t: '3–6 måneder', sub: 'Planlagt, men ikke hastværk' },
  { t: '6+ måneder', sub: 'Jeg skal have tid og ro til at finde noget nyt' },
  { t: 'Ved ikke endnu', sub: 'Jeg vil gerne lære mere om hvad jeg kan sælge for' },
];

export function HvornaarV4() {
  const { state, update } = useFunnelV2();
  return (
    <div className="space-y-2.5">
      {OPTIONS.map((o) => (
        <OptionRowV4
          key={o.t}
          title={o.t}
          sub={o.sub}
          selected={state.moveTimeframeRaw === o.t}
          onSelect={() => update({ moveTimeframeRaw: o.t })}
        />
      ))}
      <p className="text-[12.5px] pt-3" style={{ color: V4.soft }}>
        Det her påvirker ikke dit tilbud, men hjælper os med at planlægge.
      </p>
    </div>
  );
}
