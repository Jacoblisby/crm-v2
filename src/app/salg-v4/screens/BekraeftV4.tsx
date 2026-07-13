'use client';

/**
 * BekraeftV4 — "Bekræft boligens detaljer" (Figma: 01_Adresse strin 1).
 * Card m. mint header (grønt hus-ikon i cirkel, FRA OIS OG BBR + adresse,
 * "Ret detaljer" højre) og rækker m. ikon + label venstre, værdi højre.
 * Rækker: Boligtype · Boligareal · Antal værelser · Byggeår · Etage ·
 * Elevator · Altan/terrasse · Energimærke.
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, EASE, Card, ChipV4 } from '../primitives';

export function BekraeftV4() {
  const { state, update } = useFunnelV2();
  const [editing, setEditing] = useState(false);

  const rows: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    edit?: React.ReactNode;
  }> = [
    {
      icon: <RowIcon d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />,
      label: 'Boligtype',
      value: state.bekraeftBoligtype,
      edit: (
        <div className="flex gap-1.5 flex-wrap justify-end">
          {(['Ejerlejlighed', 'Andelsbolig', 'Rækkehus', 'Villa'] as const).map((o) => (
            <ChipV4 key={o} label={o} selected={state.bekraeftBoligtype === o} onClick={() => update({ bekraeftBoligtype: o })} />
          ))}
        </div>
      ),
    },
    {
      icon: <RowIcon d="M3 3h18v18H3zM3 12h18M12 3v18" />,
      label: 'Boligareal',
      value: state.kvm ? `${state.kvm} m²` : '—',
      edit: <NumEdit value={state.kvm ?? ''} unit="m²" onChange={(v) => update({ kvm: parseInt(v) || null })} />,
    },
    {
      icon: <RowIcon d="M4 21V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M4 21h16M9 21v-6h6v6" />,
      label: 'Antal værelser',
      value: state.rooms ? `${state.rooms} stk` : '—',
      edit: <NumEdit value={state.rooms ?? ''} unit="stk" onChange={(v) => update({ rooms: parseInt(v) || null })} />,
    },
    {
      icon: <RowIcon d="M12 2v4M4.9 4.9l2.8 2.8M2 12h4M4.9 19.1l2.8-2.8M12 22v-4M19.1 19.1l-2.8-2.8M22 12h-4M19.1 4.9l-2.8 2.8" />,
      label: 'Byggeår',
      value: state.yearBuilt ? `${state.yearBuilt}` : '—',
      edit: <NumEdit value={state.yearBuilt ?? ''} unit="" onChange={(v) => update({ yearBuilt: parseInt(v) || null })} />,
    },
    {
      icon: <RowIcon d="M4 20h4v-4h4v-4h4V8h4M4 20V4" />,
      label: 'Etage',
      value: state.floor || 'st.',
      edit: (
        <input
          value={state.floor ?? ''}
          onChange={(e) => update({ floor: e.target.value })}
          className="w-20 text-right text-[14.5px] tabular-nums border-b focus:outline-none pb-0.5"
          style={{ borderColor: '#c8d2cf', color: V4.ink, fontWeight: 600 }}
        />
      ),
    },
    {
      icon: <RowIcon d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
      label: 'Elevator',
      value: state.hasElevator ? 'Ja' : 'Nej',
      edit: (
        <div className="flex gap-1.5">
          <ChipV4 label="Ja" selected={state.hasElevator} onClick={() => update({ hasElevator: true })} />
          <ChipV4 label="Nej" selected={!state.hasElevator} onClick={() => update({ hasElevator: false })} />
        </div>
      ),
    },
    {
      icon: <RowIcon d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M9 13h1M14 9h1M14 13h1" />,
      label: 'Altan/terrasse',
      value: state.hasAltan ? 'Ja' : 'Nej',
      edit: (
        <div className="flex gap-1.5">
          <ChipV4 label="Ja" selected={state.hasAltan} onClick={() => update({ hasAltan: true })} />
          <ChipV4 label="Nej" selected={!state.hasAltan} onClick={() => update({ hasAltan: false })} />
        </div>
      ),
    },
    {
      icon: <RowIcon d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
      label: 'Energimærke',
      value: state.energyClass || '—',
      edit: (
        <input
          value={state.energyClass ?? ''}
          onChange={(e) => update({ energyClass: e.target.value.toUpperCase().slice(0, 2) })}
          className="w-20 text-right text-[14.5px] tabular-nums border-b focus:outline-none pb-0.5"
          style={{ borderColor: '#c8d2cf', color: V4.ink, fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      {/* Mint header */}
      <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ background: V4.mint }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: V4.green }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="text-[12px] tracking-[0.1em] uppercase" style={{ color: V4.ink, fontWeight: 600 }}>
              Fra OIS og BBR
            </div>
            <div className="text-[13px] truncate" style={{ color: V4.muted }}>
              {state.fullAddress || '—'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-[13.5px] whitespace-nowrap hover:opacity-70"
          style={{ color: V4.greenDeep, fontWeight: 600, transition: `opacity 150ms ${EASE}` }}
        >
          {editing ? 'Gem detaljer' : 'Ret detaljer'}
        </button>
      </div>

      {/* Rækker */}
      <div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 px-6 py-[15px]"
            style={{ borderTop: i === 0 ? 'none' : `1px solid ${V4.border}` }}
          >
            <span className="flex items-center gap-3 text-[14.5px]" style={{ color: V4.ink }}>
              {r.icon}
              {r.label}
            </span>
            {editing && r.edit ? (
              r.edit
            ) : (
              <span className="text-[14.5px] tabular-nums" style={{ color: V4.ink, fontWeight: 600 }}>{r.value}</span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function RowIcon({ d }: { d: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke={V4.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function NumEdit({ value, unit, onChange }: { value: number | string; unit: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        className="w-20 text-right text-[14.5px] tabular-nums border-b focus:outline-none pb-0.5"
        style={{ borderColor: '#c8d2cf', color: V4.ink, fontWeight: 600 }}
      />
      {unit && <span className="text-[13px]" style={{ color: V4.muted }}>{unit}</span>}
    </div>
  );
}
