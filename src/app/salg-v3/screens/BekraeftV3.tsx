'use client';

/**
 * BekraeftV3 — editorial-styled OIS/BBR confirmation.
 * Fraunces til adresse-heading, Geist body, lowercase kicker, ingen border-2 rect.
 */
import { useState } from 'react';
import { useFunnelV3 } from '../FunnelV3Context';

export function BekraeftV3() {
  const { state, update } = useFunnelV3();
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
      value: state.yearBuilt,
      onChangeString: (v) => update({ yearBuilt: parseInt(v) || null }),
    },
    {
      label: 'Etage',
      key: 'floor',
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
      label: 'Altan eller terrasse',
      key: 'altan',
      opts: ['Ja', 'Nej'],
      value: state.hasAltan ? 'Ja' : 'Nej',
      onChangeString: (v) => update({ hasAltan: v === 'Ja' }),
    },
    {
      label: 'Energi-mærke',
      key: 'energy',
      opts: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      value: state.energyClass ?? '—',
      onChangeString: (v) => update({ energyClass: v }),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-paper rounded-[14px] shadow-soft overflow-hidden">
        <div className="px-7 py-6 flex items-start justify-between gap-4 bg-cream-deep">
          <div className="min-w-0">
            <p className="font-body text-[11px] tracking-[0.2em] uppercase soft">fra ois &amp; bbr</p>
            <h3
              className="font-display ink text-[18px] sm:text-[22px] leading-[1.2] mt-1 tracking-[-0.015em]"
              style={{ fontWeight: 400 }}
            >
              {state.fullAddress || '—'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="font-body text-[13px] accent shrink-0 hover:underline underline-offset-4 active:scale-[0.97] transition-transform"
            style={{ fontWeight: 500 }}
          >
            {editing ? 'færdig' : 'ret detaljer'}
          </button>
        </div>

        <div className="divide-y border-warm">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 px-7 py-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="font-body text-[14px] ink-soft" style={{ fontWeight: 500 }}>
                {row.label}
              </span>
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
                          className="px-3 py-1.5 rounded-full font-body text-[12px] active:scale-[0.97] transition-all"
                          style={{
                            background: sel ? 'var(--ink)' : 'var(--paper)',
                            color: sel ? 'var(--cream)' : 'var(--ink)',
                            border: `1px solid ${sel ? 'var(--ink)' : 'var(--border)'}`,
                            fontWeight: 500,
                          }}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="font-body font-tabular ink text-[15px]" style={{ fontWeight: 500 }}>
                    {row.value}
                  </span>
                )
              ) : editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={row.value ?? ''}
                    onChange={(e) => row.onChangeString(e.target.value)}
                    className="w-24 text-right font-body font-tabular text-[15px] ink bg-transparent focus:outline-none border-b focus:border-[var(--teal)]"
                    style={{
                      borderColor: 'var(--border)',
                      fontWeight: 500,
                    }}
                  />
                  {row.unit && <span className="font-body text-[13px] muted">{row.unit}</span>}
                </div>
              ) : (
                <span className="font-body font-tabular ink text-[15px]" style={{ fontWeight: 500 }}>
                  {row.value ?? '—'}
                  {row.unit && <span className="font-body muted ml-1" style={{ fontWeight: 400 }}>{row.unit}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="font-body text-[13px] muted leading-[1.6] max-w-md">
        Tallene kommer fra det offentlige (OIS &amp; BBR). Er noget forkert eller ændret, klik{' '}
        <em className="accent" style={{ fontStyle: 'italic', fontWeight: 500 }}>
          ret detaljer
        </em>{' '}
        ovenfor og opdatér inden du fortsætter.
      </p>
    </div>
  );
}
