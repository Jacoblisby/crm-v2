'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { ToggleChip, EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

// Hvidevarer mapping
const HVIDEVARER: Array<{ label: string; key: keyof typeof HVIDEVARE_STATE_KEYS }> = [
  { label: 'Vask', key: 'Vask' },
  { label: 'Tørretumbler', key: 'Tørretumbler' },
  { label: 'Opvask', key: 'Opvask' },
  { label: 'Køl/frys', key: 'Køl/frys' },
  { label: 'Ovn', key: 'Ovn' },
  { label: 'Komfur', key: 'Komfur' },
  { label: 'Mikro', key: 'Mikro' },
  { label: 'Emhætte', key: 'Emhætte' },
];

const HVIDEVARE_STATE_KEYS = {
  'Vask': 'applVaskemaskine',
  'Tørretumbler': 'applTorretumbler',
  'Opvask': 'applOpvaskemaskine',
  'Køl/frys': 'applKoeleFryseskab',
  'Ovn': 'applOvn',
  'Komfur': 'applKomfur',
  'Mikro': 'applMikroovn',
  'Emhætte': 'applEmhaette',
} as const;

export function SidsteDetaljer() {
  const { state, update } = useFunnelV2();

  // Special-forhold mapping
  const specialOptions = [
    { t: 'Altan', sub: 'eller terrasse', icon: 'home', stateKey: 'hasAltan' as const },
    { t: 'Elevator', sub: 'i bygningen', icon: 'arrows', stateKey: 'hasElevator' as const },
    { t: 'Solceller/solfanger', sub: 'Installeret på taget', icon: 'sun', stateKey: 'hasSolarPanels' as const },
    { t: 'Aktuelt udlejet', sub: 'Vi køber gerne udlejede', icon: 'users', stateKey: 'isRented' as const },
  ];

  const priceImpactOptions = [
    { t: 'Fælleslån i ejerforeningen', sub: 'EF har optaget lån du betaler andel af', icon: 'warn', stateKey: 'hasEjerforeningGaeld' as const },
    { t: 'Renoveringsplaner i EF', sub: 'Kommende projekter (tag/facade/vinduer)', icon: 'wrench', stateKey: 'hasRenovationPlans' as const },
    { t: 'Tinglyste servitutter', sub: 'Specielle vilkår noteret på matriklen', icon: 'doc', stateKey: 'hasTinglysteServitutter' as const },
  ];

  return (
    <div className="space-y-10">
      {/* Hvidevarer */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
          Hvidevarer der følger med
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HVIDEVARER.map((h) => {
            const stateKey = HVIDEVARE_STATE_KEYS[h.key];
            const selected = state[stateKey];
            return (
              <ToggleChip
                key={h.label}
                label={h.label}
                selected={!!selected}
                onToggle={() => update({ [stateKey]: !selected } as Partial<typeof state>)}
                variant="checkbox"
              />
            );
          })}
        </div>
      </div>

      {/* Andre fotos */}
      <div className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6 text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
          Andre fotos (valgfri)
        </div>
        <p className="text-[12px] text-[#5A6166]">
          Med billeder kan vi give et endnu mere præcist tilbud.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { t: 'Altan/udsigt', icon: 'view' },
            { t: 'Plantegning', icon: 'plan' },
            { t: 'Gang/entré', icon: 'door' },
            { t: 'Andet rum', icon: 'plus' },
          ].map((p) => (
            <button
              key={p.t}
              type="button"
              className="aspect-[5/4] rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 hover:bg-stone-50 active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA]"
              style={{ transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}` }}
            >
              <MiniIcon name={p.icon} />
              <span className="text-[12px] font-medium text-[#14181A]">{p.t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Andre ting vi bør vide */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[#14181A]">
          Andre ting vi bør vide (valgfri)
        </label>
        <textarea
          value={state.notes || ''}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder='Fx "Fælles tagterrasse i bygningen", "Husdyr accepteret af EF", "Kommende ombygning af bad i 2026"'
          rows={3}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] resize-y border-[#E5E2DA] focus:border-stone-400"
          style={{ transition: `border-color 180ms ${EASE_OUT}` }}
        />
      </div>

      {/* Særlige forhold */}
      <div className="space-y-4 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
            Særlige forhold
          </div>
          <p className="text-[12px] mt-1 text-[#5A6166]">
            Sæt kryds ved det der gælder — eller spring forbi hvis intet
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[#14181A]">Boligens specielle ting</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {specialOptions.map((s) => {
              const sel = !!state[s.stateKey];
              return (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => update({ [s.stateKey]: !sel } as Partial<typeof state>)}
                  className="px-4 py-3 rounded-xl border-2 flex items-start gap-3 text-left active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                  style={{
                    borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                    background: sel ? '#0F1A1A' : '#fff',
                    color: sel ? '#fff' : '#14181A',
                    transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      borderColor: sel ? '#fff' : '#C9C5BA',
                      background: sel ? '#fff' : 'transparent',
                    }}
                  >
                    {sel && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#0F1A1A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MiniIcon name={s.icon} color={sel ? '#fff' : ACCENT} />
                      <span className="text-[14px] font-medium">{s.t}</span>
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#5A6166' }}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-[13px] font-medium text-[#14181A]">Forhold der kan påvirke prisen</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {priceImpactOptions.map((s) => {
              const sel = !!state[s.stateKey];
              return (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => update({ [s.stateKey]: !sel } as Partial<typeof state>)}
                  className="px-3.5 py-3 rounded-xl border-2 flex items-start gap-2.5 text-left active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                  style={{
                    borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                    background: sel ? '#0F1A1A' : '#fff',
                    color: sel ? '#fff' : '#14181A',
                    transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      borderColor: sel ? '#fff' : '#C9C5BA',
                      background: sel ? '#fff' : 'transparent',
                    }}
                  >
                    {sel && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#0F1A1A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MiniIcon name={s.icon} color={sel ? '#fff' : ACCENT} size={13} />
                      <span className="text-[13px] font-medium leading-tight">{s.t}</span>
                    </div>
                    <div className="text-[11px] mt-1 leading-tight" style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#5A6166' }}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
