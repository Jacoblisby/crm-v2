'use client';

/**
 * v4 primitives — designerens grønne design-sprog (Montserrat, petroleum/mint).
 * Selected state: petroleum-grøn border + soft mint fill (ikke sort som v2).
 */

export const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const V4 = {
  green: '#145d5f',
  greenDeep: '#0f4749',
  accent: '#429798',
  mint: '#cce0dc',
  mintCard: '#b9d8d3',
  mintSoft: '#e7f0ed',
  cream: '#f4f6f3',
  cta: '#7ce0da',
  ink: '#1c2b2b',
  muted: '#5c6b6a',
  soft: '#8a9695',
  border: '#e3e9e7',
};

export function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] tracking-[0.2em] uppercase"
      style={{ color: V4.accent, fontWeight: 500 }}
    >
      {children}
    </div>
  );
}

export function MoneyInputV4({
  label,
  value,
  onChange,
  placeholder,
  sub,
  unit = 'kr/år',
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  placeholder?: string;
  sub?: string;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] block" style={{ color: V4.ink, fontWeight: 500 }}>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-16 rounded-lg border bg-white text-[15px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          style={{ borderColor: V4.border, color: V4.ink, ['--tw-ring-color' as never]: V4.accent }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: V4.soft }}>
          {unit}
        </span>
      </div>
      {sub && <p className="text-[12px]" style={{ color: V4.muted }}>{sub}</p>}
    </div>
  );
}

export function YesNoV4({
  label,
  value,
  onChange,
  allowUnsure,
}: {
  label: string;
  value: 'Ja' | 'Nej' | 'Ved ikke' | null | undefined;
  onChange: (v: 'Ja' | 'Nej' | 'Ved ikke') => void;
  allowUnsure?: boolean;
}) {
  const options: Array<'Ja' | 'Nej' | 'Ved ikke'> = allowUnsure ? ['Ja', 'Nej', 'Ved ikke'] : ['Ja', 'Nej'];
  return (
    <div className="flex items-center justify-between gap-4 py-2 flex-wrap">
      <span className="text-[14px]" style={{ color: V4.ink }}>{label}</span>
      <div className="flex gap-2 shrink-0">
        {options.map((v) => {
          const sel = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="px-4 py-2 rounded-lg text-[13px] border transition-all active:scale-[0.97]"
              style={{
                borderColor: sel ? V4.green : V4.border,
                background: sel ? V4.mintSoft : '#fff',
                color: sel ? V4.greenDeep : V4.ink,
                fontWeight: sel ? 600 : 400,
                boxShadow: sel ? `inset 0 0 0 1px ${V4.green}` : 'none',
                transitionDuration: '160ms',
                transitionTimingFunction: EASE,
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

/** Stor option-række med radio-cirkel (Hvornår / Efter salget) */
export function OptionRowV4({
  title,
  sub,
  selected,
  onSelect,
  badge,
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full px-5 py-4 rounded-xl border flex items-center gap-4 text-left transition-all bg-white active:scale-[0.99]"
      style={{
        borderColor: selected ? V4.green : V4.border,
        background: selected ? V4.mintSoft : '#fff',
        boxShadow: selected ? `inset 0 0 0 1px ${V4.green}` : 'none',
        transitionDuration: '180ms',
        transitionTimingFunction: EASE,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15.5px]" style={{ color: V4.ink, fontWeight: 500 }}>{title}</span>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] tracking-wide"
              style={{ background: V4.green, color: '#fff', fontWeight: 600 }}
            >
              {badge}
            </span>
          )}
        </div>
        {sub && <div className="text-[12.5px] mt-0.5" style={{ color: V4.muted }}>{sub}</div>}
      </div>
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: selected ? V4.green : '#c8d2cf',
          background: selected ? V4.green : '#fff',
          transition: `all 160ms ${EASE}`,
        }}
      >
        {selected && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
    </button>
  );
}

export function TextInputV4({
  label,
  value,
  onChange,
  placeholder,
  sub,
  type = 'text',
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  sub?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: 'email' | 'tel' | 'numeric' | 'text';
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] block" style={{ color: V4.ink, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full px-4 py-3 rounded-lg border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
        style={{ borderColor: V4.border, color: V4.ink, ['--tw-ring-color' as never]: V4.accent }}
      />
      {sub && <p className="text-[12px]" style={{ color: V4.muted }}>{sub}</p>}
    </div>
  );
}
