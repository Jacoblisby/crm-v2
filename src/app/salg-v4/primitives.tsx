'use client';

import { useId } from 'react';

/**
 * v4 primitives — designerens flow-design-sprog (fra Figma-framesene):
 *   - Beige baggrund #F5F2F1 ("Beige 3"), hvide kort m. blød skygge
 *   - Valg hvor KUN ÉT kan vælges (OptionRowV4, ChipGroupV4, QuestionRowV4,
 *     RadioInlineV4) er rigtige radioknapper: en tydelig cirkel, og den valgte
 *     er udfyldt. Besluttet efter mødet 23.10.2026: de hvide kasser var
 *     utydelige for målgruppen 60+.
 *   - Chips (ChipV4) er kun til valg, hvor flere kan vælges
 *   - Inputs: lys flade, hint-tekst under
 */

export const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

export const V4 = {
  green: '#145d5f',       // petroleum — knapper, ikoner, footer
  greenDeep: '#0f4749',
  selected: '#317779',    // valgt række (teal fyld, fra "trin 3 valgt"-framen)
  mint: '#cce0dc',        // mint header-bar + prisboks
  mintSoft: '#e7f0ed',
  /**
   * Varm rose — den ENESTE flade i designerens palet, der ikke er grøn.
   * Hun bruger den som hel sektionsbaggrund på forsiden (hero + "Bliv
   * boende"), så den er lige så meget brand som mint. Bruges her til at
   * fremhæve vores kolonne, så estimat-skærmen ikke bliver ensfarvet grøn.
   */
  rose: '#e8dfde',
  /** Skillestreg der læses ens på hvid OG på rose — derfor gennemsigtig. */
  rule: 'rgba(28,43,43,0.12)',
  ruleStrong: 'rgba(28,43,43,0.26)',
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

/** Cirklen i en radioknap. Udfyldt = valgt. */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className="shrink-0 inline-flex items-center justify-center rounded-full"
      style={{
        width: 22,
        height: 22,
        background: '#fff',
        border: `2px solid ${selected ? V4.green : '#8f9c9a'}`,
        transition: `border-color 150ms ${EASE}`,
      }}
    >
      <span
        className="rounded-full"
        style={{
          width: 10,
          height: 10,
          background: V4.green,
          transform: selected ? 'scale(1)' : 'scale(0)',
          transition: `transform 160ms ${EASE}`,
        }}
      />
    </span>
  );
}

/**
 * Valg-række med radioknap til venstre: titel, og forklaringen under på
 * mobil og til højre på bred skærm. Brug samme `name` til alle rækker i en
 * gruppe, så piletaster og skærmlæser fungerer.
 */
export function OptionRowV4({
  title,
  sub,
  selected,
  onSelect,
  name = 'valg',
  compact = false,
}: {
  title: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
  name?: string;
  compact?: boolean;
}) {
  return (
    <label
      className={`w-full rounded-[10px] flex items-center gap-4 cursor-pointer focus-within:ring-2 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
      style={{
        background: selected ? V4.mintSoft : '#fff',
        boxShadow: selected ? `inset 0 0 0 2px ${V4.green}` : compact ? `inset 0 0 0 1px ${V4.border}` : V4.cardShadow,
        transition: `background-color 160ms ${EASE}, box-shadow 160ms ${EASE}`,
        ['--tw-ring-color' as never]: V4.selected,
      }}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <RadioDot selected={selected} />
      <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-6">
        <span className={compact ? 'text-[15px]' : 'text-[16px]'} style={{ color: V4.ink, fontWeight: selected ? 600 : 500 }}>
          {title}
        </span>
        {sub && (
          <span className="text-[13px] sm:text-right" style={{ color: V4.muted }}>
            {sub}
          </span>
        )}
      </span>
    </label>
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
      className="px-4 py-2 rounded-full text-[13.5px] border transition-[background-color,border-color,scale] active:scale-[0.96]"
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

/** Valg af ét niveau (fx stand): lodret liste af radioknapper. */
export function ChipGroupV4({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: string[];
  value: string | null | undefined;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-2">
      {options.map((o) => (
        <OptionRowV4 key={o} compact name={name} title={o} selected={value === o} onSelect={() => onChange(o)} />
      ))}
    </div>
  );
}

/** Ja/Nej(/Ved ikke) på én linje: radioknapper ved siden af hinanden. */
export function RadioInlineV4({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: string[];
  value: string | null | undefined;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center gap-5 flex-wrap">
      {options.map((o) => {
        const sel = value === o;
        return (
          <label key={o} className="inline-flex items-center gap-2 cursor-pointer rounded-md focus-within:ring-2" style={{ ['--tw-ring-color' as never]: V4.selected }}>
            <input type="radio" name={name} checked={sel} onChange={() => onChange(o)} className="sr-only" />
            <RadioDot selected={sel} />
            <span className="text-[14.5px]" style={{ color: V4.ink, fontWeight: sel ? 600 : 400 }}>{o}</span>
          </label>
        );
      })}
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

/** Ja/Nej(/Ved ikke)-spørgsmål: tekst til venstre, radioknapper til højre */
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
    <div className="flex items-center justify-between gap-x-6 gap-y-2 flex-wrap">
      <span className="text-[14.5px]" style={{ color: V4.ink }}>{label}</span>
      <RadioInlineV4 options={options} value={value} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
