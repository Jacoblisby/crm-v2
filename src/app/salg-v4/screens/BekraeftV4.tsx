'use client';

/**
 * BekraeftV4 — "Bekræft boligens detaljer" (01_Adresse trin 1).
 * OIS/BBR-prefill i card m. "Ret detaljer" / "Gem detaljer" (designer-copy).
 */
import { useState } from 'react';
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, EASE } from '../primitives';

export function BekraeftV4() {
  const { state, update } = useFunnelV2();
  const [editing, setEditing] = useState(false);

  const rows: Array<{
    label: string;
    value: string;
    edit?: React.ReactNode;
  }> = [
    {
      label: 'Boligtype',
      value: state.bekraeftBoligtype,
      edit: (
        <div className="flex gap-1.5 flex-wrap justify-end">
          {(['Ejerlejlighed', 'Andelsbolig', 'Rækkehus', 'Villa'] as const).map((o) => (
            <Chip key={o} label={o} selected={state.bekraeftBoligtype === o} onClick={() => update({ bekraeftBoligtype: o })} />
          ))}
        </div>
      ),
    },
    {
      label: 'Boligareal',
      value: state.kvm ? `${state.kvm} m²` : '—',
      edit: (
        <NumEdit value={state.kvm ?? ''} unit="m²" onChange={(v) => update({ kvm: parseInt(v) || null })} />
      ),
    },
    {
      label: 'Antal værelser',
      value: state.rooms ? `${state.rooms}` : '—',
      edit: (
        <NumEdit value={state.rooms ?? ''} unit="stk" onChange={(v) => update({ rooms: parseInt(v) || null })} />
      ),
    },
    {
      label: 'Byggeår',
      value: state.yearBuilt ? `${state.yearBuilt}` : '—',
      edit: (
        <NumEdit value={state.yearBuilt ?? ''} unit="" onChange={(v) => update({ yearBuilt: parseInt(v) || null })} />
      ),
    },
    {
      label: 'Etage',
      value: state.floor || 'st.',
      edit: (
        <input
          value={state.floor ?? ''}
          onChange={(e) => update({ floor: e.target.value })}
          className="w-20 text-right text-[15px] tabular-nums border-b focus:outline-none pb-0.5"
          style={{ borderColor: '#c8d2cf', color: V4.ink, fontWeight: 600 }}
        />
      ),
    },
    {
      label: 'Elevator',
      value: state.hasElevator ? 'Ja' : 'Nej',
      edit: (
        <div className="flex gap-1.5">
          <Chip label="Ja" selected={state.hasElevator} onClick={() => update({ hasElevator: true })} />
          <Chip label="Nej" selected={!state.hasElevator} onClick={() => update({ hasElevator: false })} />
        </div>
      ),
    },
    {
      label: 'Altan/terrasse',
      value: state.hasAltan ? 'Ja' : 'Nej',
      edit: (
        <div className="flex gap-1.5">
          <Chip label="Ja" selected={state.hasAltan} onClick={() => update({ hasAltan: true })} />
          <Chip label="Nej" selected={!state.hasAltan} onClick={() => update({ hasAltan: false })} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: V4.border }}>
        <div className="px-6 py-5 flex items-start justify-between gap-4" style={{ background: V4.mintSoft }}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={V4.green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] tracking-[0.18em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
                Fra OIS og BBR
              </div>
              <div className="text-[15.5px] mt-0.5 truncate" style={{ color: V4.ink, fontWeight: 500 }}>
                {state.fullAddress || '—'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="text-[13px] underline hover:no-underline whitespace-nowrap pt-1.5"
            style={{ color: V4.green, fontWeight: 500, transition: `opacity 150ms ${EASE}` }}
          >
            {editing ? 'Gem detaljer' : 'Ret detaljer'}
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: V4.border }}>
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-6 py-4" style={{ borderColor: V4.border }}>
              <span className="text-[14px]" style={{ color: V4.ink, fontWeight: 500 }}>{r.label}</span>
              {editing && r.edit ? (
                r.edit
              ) : (
                <span className="text-[15px] tabular-nums" style={{ color: V4.ink, fontWeight: 600 }}>{r.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed" style={{ color: V4.muted }}>
        Vi henter data fra det offentlige (OIS &amp; BBR). Er noget forkert eller ændret?
        Klik <strong style={{ color: V4.green }}>&quot;Ret detaljer&quot;</strong> ovenfor og opdater inden du fortsætter.
      </p>
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[12px] border transition-all"
      style={{
        borderColor: selected ? V4.green : V4.border,
        background: selected ? V4.mintSoft : '#fff',
        color: selected ? V4.greenDeep : V4.ink,
        fontWeight: selected ? 600 : 400,
        boxShadow: selected ? `inset 0 0 0 1px ${V4.green}` : 'none',
        transitionDuration: '150ms',
        transitionTimingFunction: EASE,
      }}
    >
      {label}
    </button>
  );
}

function NumEdit({ value, unit, onChange }: { value: number | string; unit: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        className="w-20 text-right text-[15px] tabular-nums border-b focus:outline-none pb-0.5"
        style={{ borderColor: '#c8d2cf', color: V4.ink, fontWeight: 600 }}
      />
      {unit && <span className="text-[13px]" style={{ color: V4.muted }}>{unit}</span>}
    </div>
  );
}
