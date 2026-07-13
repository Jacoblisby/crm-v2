'use client';

/**
 * v4 primitives — designerens flow-design-sprog (fra Figma-framesene):
 *   - Beige baggrund #F5F2F1 ("Beige 3"), hvide kort m. blød skygge
 *   - Valgt tilstand: HEL flade fyldt teal m. hvid tekst (ingen borders/radioer)
 *   - Chips (stand, Ja/Nej/Ved ikke): rounded-full, hvid m. grå border;
 *     valgt = petroleum fyld m. hvid tekst
 *   - Inputs: lys flade, hint-tekst under
 */

export const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const V4 = {
  green: '#145d5f',       // petroleum — knapper, ikoner, footer
  greenDeep: '#0f4749',
  selected: '#317779',    // valgt række (teal fyld, fra "trin 3 valgt"-framen)
  mint: '#cce0dc',        // mint header-bar + prisboks
  mintSoft: '#e7f0ed',
  beige: '#f5f2f1',       // skærm-baggrund ("Beige 3")
  cta: '#83ebeb',         // turkis (Ring-knap på estimat)
  prevBtn: '#c9d9d6',     // "Forrige"-knap
  ink: '#1c2b2b',
  muted: '#5c6b6a',
  soft: '#8a9695',
  border: '#e5e3df',
  cardShadow: '0 6px 24px -10px rgba(28,43,43,0.12)',
};

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[10px] ${className ?? ''}`}
      style={{ boxShadow: V4.cardShadow }}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.muted, fontWeight: 500 }}>
      {children}
    </div>
  );
}

/** Flad valg-række: titel venstre, forklaring højre. Valgt = teal fyld. */
export function OptionRowV4({
  title,
  sub,
  selected,
  onSelect,
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full px-6 py-5 rounded-[10px] flex items-center justify-between gap-6 text-left transition-all active:scale-[0.995]"
      style={{
        background: selected ? V4.selected : '#fff',
        boxShadow: V4.cardShadow,
        transitionDuration: '180ms',
        transitionTimingFunction: EASE,
      }}
    >
      <span className="text-[16px] shrink-0" style={{ color: selected ? '#fff' : V4.ink, fontWeight: 500 }}>
        {title}
      </span>
      {sub && (
        <span className="text-[13px] text-right" style={{ color: selected ? 'rgba(255,255,255,0.85)' : V4.soft }}>
          {sub}
        </span>
      )}
    </button>
  );
}

/** Chip — stand-niveauer og Ja/Nej/Ved ikke. Valgt = petroleum fyld. */
export function ChipV4({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full text-[13.5px] border transition-all active:scale-[0.97]"
      style={{
        borderColor: selected ? V4.green : '#d4d9d6',
        background: selected ? V4.green : '#fff',
        color: selected ? '#fff' : V4.ink,
        fontWeight: selected ? 600 : 400,
        transitionDuration: '150ms',
        transitionTimingFunction: EASE,
      }}
    >
      {label}
    </button>
  );
}

export function ChipGroupV4({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <ChipV4 key={o} label={o} selected={value === o} onClick={() => onChange(o)} />
      ))}
    </div>
  );
}

/** Input m. label over og hint under (som Udgifter-framen) */
export function FieldV4({
  label,
  value,
  onChange,
  placeholder,
  hint,
  numeric,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  numeric?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13.5px] block" style={{ color: V4.ink, fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        inputMode={numeric ? 'numeric' : undefined}
        value={value || ''}
        onChange={(e) => onChange(numeric ? e.target.value.replace(/[^\d]/g, '') : e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 rounded-md text-[14.5px] focus:outline-none focus-visible:ring-2 tabular-nums"
        style={{
          background: '#f2f0ed',
          border: `1px solid ${V4.border}`,
          color: V4.ink,
          ['--tw-ring-color' as never]: V4.selected,
        }}
      />
      {hint && <p className="text-[12px]" style={{ color: V4.soft }}>{hint}</p>}
    </div>
  );
}

/** Ja/Nej(/Ved ikke)-spørgsmål på én linje: tekst venstre, chips højre */
export function QuestionRowV4({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-[14.5px]" style={{ color: V4.ink }}>{label}</span>
      <div className="flex gap-2 shrink-0">
        {options.map((o) => (
          <ChipV4 key={o} label={o} selected={value === o} onClick={() => onChange(o)} />
        ))}
      </div>
    </div>
  );
}
