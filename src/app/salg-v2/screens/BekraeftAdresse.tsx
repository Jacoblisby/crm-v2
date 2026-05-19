'use client';

/**
 * BekraeftAdresse — viser OIS/BBR-prefilled detaljer + ret-mode.
 * Mapping til v1-state:
 *   boligtype → bekraeftBoligtype
 *   sqm      → kvm
 *   rooms    → rooms
 *   year     → yearBuilt
 *   floor    → floor
 *   elevator → hasElevator (Ja/Nej)
 *   altan    → hasAltan (Ja/Nej)
 */
import { useState } from 'react';
import { useFunnelV2 } from '../FunnelV2Context';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function BekraeftAdresse() {
  const { state, update } = useFunnelV2();
  const [editing, setEditing] = useState(false);

  const rows: Array<{
    label: string;
    key: string;
    opts?: string[];
    unit?: string;
    value: string | number | null;
    onChangeString: (v: string) => void;
  }> = [
    {
      label: 'Boligtype',
      key: 'boligtype',
      opts: ['Ejerlejlighed', 'Andelsbolig', 'Rækkehus', 'Villa'],
      value: state.bekraeftBoligtype,
      onChangeString: (v) => update({ bekraeftBoligtype: v as typeof state.bekraeftBoligtype }),
    },
    {
      label: 'Boligareal',
      key: 'sqm',
      unit: 'm²',
      value: state.kvm,
      onChangeString: (v) => update({ kvm: parseInt(v) || null }),
    },
    {
      label: 'Antal værelser',
      key: 'rooms',
      unit: 'stk',
      value: state.rooms,
      onChangeString: (v) => update({ rooms: parseInt(v) || null }),
    },
    {
      label: 'Byggeår',
      key: 'year',
      unit: '',
      value: state.yearBuilt,
      onChangeString: (v) => update({ yearBuilt: parseInt(v) || null }),
    },
    {
      label: 'Etage',
      key: 'floor',
      unit: '',
      value: state.floor ?? '',
      onChangeString: (v) => update({ floor: v }),
    },
    {
      label: 'Elevator',
      key: 'elevator',
      opts: ['Ja', 'Nej'],
      value: state.hasElevator ? 'Ja' : 'Nej',
      onChangeString: (v) => update({ hasElevator: v === 'Ja' }),
    },
    {
      label: 'Altan/terrasse',
      key: 'altan',
      opts: ['Ja', 'Nej'],
      value: state.hasAltan ? 'Ja' : 'Nej',
      onChangeString: (v) => update({ hasAltan: v === 'Ja' }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-[#EAE7DE] overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between gap-4 bg-[#F8F2E5]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
                Fra OIS &amp; BBR
              </div>
              <div className="text-[16px] font-semibold mt-0.5 truncate text-[#14181A]">
                {state.fullAddress || '—'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-[13px] font-medium underline hover:no-underline whitespace-nowrap pt-1.5 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] rounded-md px-2 py-1"
            style={{ color: ACCENT, transition: `transform 150ms ${EASE_OUT}` }}
          >
            {editing ? 'Færdig' : 'Ret detaljer'}
          </button>
        </div>

        <div className="divide-y divide-[#EAE7DE]">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="text-[14px] font-medium text-[#14181A]">{row.label}</span>
              {row.opts ? (
                editing ? (
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {row.opts.map((o) => {
                      const sel = row.value === o;
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => row.onChangeString(o)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium border-2 active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                          style={{
                            borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                            background: sel ? '#0F1A1A' : '#fff',
                            color: sel ? '#fff' : '#14181A',
                            transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                          }}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-[15px] font-semibold tabular-nums text-[#14181A]">{row.value}</span>
                )
              ) : editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={row.value ?? ''}
                    onChange={(e) => row.onChangeString(e.target.value)}
                    className="w-24 text-right text-[15px] font-semibold tabular-nums border-b border-stone-300 focus:outline-none focus:border-stone-500 pb-0.5 text-[#14181A] focus-visible:ring-2 focus-visible:ring-[#244949]"
                  />
                  {row.unit && <span className="text-[13px] text-[#5A6166]">{row.unit}</span>}
                </div>
              ) : (
                <span className="text-[15px] font-semibold tabular-nums text-[#14181A]">
                  {row.value ?? '—'}{' '}
                  {row.unit && <span className="text-[13px] font-normal text-[#5A6166]">{row.unit}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-[#5A6166]">
        Vi henter data fra det offentlige (OIS &amp; BBR). Er noget forkert eller ændret? Klik{' '}
        <strong style={{ color: ACCENT }}>&quot;Ret detaljer&quot;</strong> ovenfor og opdater inden du fortsætter.
      </p>
    </div>
  );
}
