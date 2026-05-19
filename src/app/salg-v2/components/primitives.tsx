'use client';

/**
 * Form primitives — bruges af alle screens.
 * Designtokens fra handoff. Design-eng tweaks:
 *   - active:scale(0.97) på alle pressable buttons (interaktivt press-feedback)
 *   - transition-colors specific (ikke transition-all)
 *   - Custom ease-out for snappy feedback
 *   - focus-visible:ring synlig keyboard-fokus
 *   - touch-manipulation for hurtigt tap (intet 300ms wait)
 */
import { type ReactNode } from 'react';
import { MiniIcon } from './icons';

// ─── Custom ease-out curve ─────────────────────────────────────────────────
// Bruges via inline style fordi Tailwind v4 ikke har en builtin der matcher
export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';

// ─── SectionHeading ────────────────────────────────────────────────────────
export function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
        {title}
      </div>
      {sub && (
        <p className="text-[13px] leading-relaxed max-w-2xl text-[#5A6166]">{sub}</p>
      )}
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[14px] font-medium text-[#14181A]">{label}</label>
      {children}
    </div>
  );
}

// ─── MoneyInput ────────────────────────────────────────────────────────────
export function MoneyInput({
  label,
  value,
  onChange,
  placeholder,
  sub,
  unit = 'kr/år',
}: {
  label: string;
  value: number | string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  sub?: string;
  required?: boolean;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-[#14181A]">{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-16 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] tabular-nums border-[#E5E2DA] focus:border-stone-400"
          style={{ transition: `border-color 180ms ${EASE_OUT}, box-shadow 180ms ${EASE_OUT}` }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9C988C]">
          {unit}
        </span>
      </div>
      {sub && <p className="text-[12px] text-[#5A6166]">{sub}</p>}
    </div>
  );
}

// ─── YesNoRow ──────────────────────────────────────────────────────────────
export function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: 'Ja' | 'Nej') => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 flex-wrap">
      <span className="text-[14px] text-[#14181A]">{label}</span>
      <div className="flex gap-2 shrink-0">
        {(['Ja', 'Nej'] as const).map((v) => {
          const sel = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="px-5 py-2 rounded-lg text-[13px] font-medium border-2 active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
              style={{
                borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                background: sel ? '#0F1A1A' : '#fff',
                color: sel ? '#fff' : '#14181A',
                transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
              }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ChipRow ────────────────────────────────────────────────────────────────
export function ChipRow({
  options,
  value,
  onChange,
  wrap = false,
}: {
  options: (string | { t: string; sub?: string })[];
  value?: string;
  onChange: (v: string) => void;
  wrap?: boolean;
}) {
  return (
    <div className={`flex ${wrap ? 'flex-wrap' : ''} gap-2`}>
      {options.map((o) => {
        const t = typeof o === 'string' ? o : o.t;
        const sub = typeof o === 'string' ? null : o.sub;
        const sel = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="px-4 py-2.5 rounded-xl border-2 text-[14px] font-medium text-left active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
            style={{
              borderColor: sel ? '#0F1A1A' : '#E5E2DA',
              background: sel ? '#0F1A1A' : '#fff',
              color: sel ? '#fff' : '#14181A',
              transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
            }}
          >
            {t}
            {sub && (
              <div
                className="text-[11px] mt-0.5 font-normal"
                style={{ color: sel ? 'rgba(255,255,255,0.65)' : '#5A6166' }}
              >
                {sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── ToggleChip ─────────────────────────────────────────────────────────────
// Pill/chip for multi-select arrays (hvidevarer, must-have, omr).
export function ToggleChip({
  label,
  selected,
  onToggle,
  variant = 'pill',
  icon,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  variant?: 'pill' | 'checkbox';
  icon?: string;
}) {
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="px-4 py-2.5 rounded-full border-2 text-[13.5px] font-medium active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
        style={{
          borderColor: selected ? '#0F1A1A' : '#EAE7DE',
          background: selected ? '#0F1A1A' : '#fff',
          color: selected ? '#fff' : '#14181A',
          transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
        }}
      >
        {label}
      </button>
    );
  }
  // checkbox variant
  return (
    <button
      type="button"
      onClick={onToggle}
      className="px-4 py-3 rounded-xl border-2 text-[14px] font-medium flex items-center gap-3 text-left active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
      style={{
        borderColor: selected ? '#0F1A1A' : '#E5E2DA',
        background: selected ? '#0F1A1A' : '#fff',
        color: selected ? '#fff' : '#14181A',
        transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
      }}
    >
      <div
        className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0"
        style={{
          borderColor: selected ? '#fff' : '#C9C5BA',
          background: selected ? '#fff' : 'transparent',
        }}
      >
        {selected && (
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#0F1A1A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      {icon && <MiniIcon name={icon} color={selected ? '#fff' : '#244949'} />}
      {label}
    </button>
  );
}
