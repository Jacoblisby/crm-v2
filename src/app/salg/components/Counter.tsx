'use client';

import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
}

/**
 * +/− counter widget for numeric input.
 *
 * Inspireret af Zillow's home-facts-beds-baths flow. Bedre end text-input fordi:
 *   - Mindre kognitiv friction (genkendelse af tal vs taste det)
 *   - Pre-fyldte værdier fra OIS kan justeres med ét klik
 *   - Visuel feedback at vi forventer et lille tal
 *
 * Bruges for vaerelser, fuld badevaerelser, etager, byggeår (med step=1).
 */
export function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix,
  placeholder = '–',
}: CounterProps) {
  const current = value ?? 0;
  const inc = () => onChange(Math.min(max, current + step));
  const dec = () => onChange(Math.max(min, current - step));
  const isUnset = value === null || value === undefined;

  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={dec}
          disabled={current <= min}
          className="w-9 h-10 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
          aria-label={`Minus ${label}`}
        >
          <Minus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center text-sm font-semibold text-slate-900 tabular-nums">
          {isUnset ? placeholder : `${value}${suffix ? ` ${suffix}` : ''}`}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={current >= max}
          className="w-9 h-10 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200"
          aria-label={`Plus ${label}`}
        >
          <Plus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
        </button>
      </div>
    </label>
  );
}

/**
 * Variant: stor counter med tekst-input fallback for store tal.
 * Bruges hvor brugeren skal kunne taste 4-cifrede tal (m², byggeår).
 */
export function CounterWithInput({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 10,
  suffix,
  placeholder = '–',
}: CounterProps) {
  const current = value ?? 0;
  const inc = () => onChange(Math.min(max, current + step));
  const dec = () => onChange(Math.max(min, current - step));

  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1.5">{label}</div>
      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
        <button
          type="button"
          onClick={dec}
          disabled={current <= min}
          className="w-9 h-10 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-200"
          aria-label={`Minus ${label}`}
        >
          <Minus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
        </button>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          placeholder={placeholder}
          min={min}
          max={max}
          className="flex-1 px-2 py-2 text-sm font-semibold text-center text-slate-900 tabular-nums focus:outline-none bg-transparent"
        />
        {suffix && (
          <span className="pr-2 text-xs text-slate-500 tabular-nums">{suffix}</span>
        )}
        <button
          type="button"
          onClick={inc}
          disabled={current >= max}
          className="w-9 h-10 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-200"
          aria-label={`Plus ${label}`}
        >
          <Plus className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
        </button>
      </div>
    </label>
  );
}
