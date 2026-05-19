'use client';

/**
 * EstimatV3 — climax screen.
 *
 * Interactive moves:
 *   1. Overtagelse-slider: drag handle paa horisontal time-axis.
 *      14 dage → 6 maaneder, snaps til 4 anker-positioner.
 *      Pris animerer LIVE m. blur-crossfade.
 *   2. "Hvad du sparer"-stak: animeret fill-bar viser ratio
 *      mellem 365-tilbud og maegler-aekvivalent.
 *   3. Comparables row: hover for at se hver handlers placering
 *      paa et lille map-spark.
 *
 * Editorial v3 tokens: Fraunces display + tabular tal, tinted shadows,
 * cream paper bg, grain-friendly.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFunnelV3 } from '../FunnelV3Context';

const TEAL = 'oklch(0.35 0.045 200)';
const TEAL_DEEP = 'oklch(0.25 0.05 200)';

interface OvertagOption {
  value: 0.5 | 1 | 3 | 6;
  t: string;
  sub: string;
  delta: number;
  /** Position paa slider 0-1 */
  pos: number;
}

const OPTIONS: OvertagOption[] = [
  { value: 0.5, t: '14 dage', sub: '+15.000 kr', delta: 15000, pos: 0 },
  { value: 1, t: '1 mdr', sub: 'standard', delta: 0, pos: 0.33 },
  { value: 3, t: '3 mdr', sub: 'standard', delta: 0, pos: 0.66 },
  { value: 6, t: '6 mdr', sub: '−10.000 kr', delta: -10000, pos: 1 },
];

export function EstimatV3() {
  const { state, reset } = useFunnelV3();
  const [overtagelse, setOvertagelse] = useState<0.5 | 1 | 3 | 6>(3);
  const [priceBlur, setPriceBlur] = useState(false);
  const lastBudRef = useRef<number>(0);

  // Beregn base bud
  const baseBud = state.kvm
    ? Math.round((state.kvm ?? 60) * (state.postalCode === '2630' ? 18000 : 14000) * 0.85)
    : 945000;
  const selected = OPTIONS.find((o) => o.value === overtagelse) ?? OPTIONS[2];
  const bud = baseBud + selected.delta;

  const maeglerSalaer = 70000;
  const markedAfslag = Math.round(bud * 0.07);
  const driftSalg = Math.max(1, Math.round(((state.costFaellesudgifter || 24000) / 12) * 3 - 6000));
  const maeglerEkvivalent = bud + maeglerSalaer + markedAfslag + driftSalg;

  // Trigger blur ved bud aendring
  useEffect(() => {
    if (lastBudRef.current && lastBudRef.current !== bud) {
      setPriceBlur(true);
      const t = setTimeout(() => setPriceBlur(false), 200);
      return () => clearTimeout(t);
    }
    lastBudRef.current = bud;
  }, [bud]);

  const fmt = (n: number) => n.toLocaleString('da-DK');

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16 sm:space-y-24">
        {/* Header */}
        <header className="space-y-4">
          <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">
            dit foreløbige tilbud
          </p>
          <h1
            className="font-display ink text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.025em] text-balance"
            style={{ fontWeight: 400 }}
          >
            {state.fullAddress || '—'}
          </h1>
        </header>

        {/* Pris-card */}
        <section
          className="rounded-[14px] p-10 sm:p-16 text-center space-y-4 shadow-lift"
          style={{
            background: 'var(--ink)',
            color: 'var(--cream)',
          }}
        >
          <p className="font-body text-[12px] tracking-[0.2em] uppercase" style={{ color: 'oklch(0.62 0.022 80 / 0.7)' }}>
            vores tilbud kontant
          </p>
          <div
            className="font-display font-tabular leading-[0.92] tracking-[-0.04em]"
            style={{
              fontSize: 'clamp(64px, 11vw, 128px)',
              fontWeight: 400,
              fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 400",
              filter: priceBlur ? 'blur(6px)' : 'none',
              opacity: priceBlur ? 0.55 : 1,
              transitionProperty: 'filter, opacity',
              transitionDuration: '220ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {fmt(bud)}{' '}
            <span
              className="font-body align-baseline"
              style={{
                fontSize: '0.32em',
                fontWeight: 300,
                color: 'oklch(0.62 0.022 80 / 0.6)',
                letterSpacing: '0.02em',
              }}
            >
              kr
            </span>
          </div>
          <p className="font-body text-[13px]" style={{ color: 'oklch(0.62 0.022 80 / 0.55)' }}>
            Bindende tilbud gives efter gratis besigtigelse.
          </p>
        </section>

        {/* Overtagelse drag slider */}
        <section className="space-y-8">
          <div className="space-y-2">
            <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">overtagelse</p>
            <h2
              className="font-display ink text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.02em]"
              style={{ fontWeight: 400 }}
            >
              Hvornår vil du{' '}
              <em
                className="accent"
                style={{
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                  fontStyle: 'italic',
                }}
              >
                overtage?
              </em>
            </h2>
          </div>

          <OvertagSlider value={overtagelse} onChange={setOvertagelse} />

          <p className="font-body text-[13.5px] muted leading-[1.55] max-w-md">
            Hurtigere overtagelse giver dig en bonus. Længere overtagelse gør tilbuddet en smule lavere — vi venter længere på at få lejeindtægt.
          </p>
        </section>

        {/* Hvad du sparer — comparative bar */}
        <section className="space-y-8 pt-4 border-t border-warm">
          <div className="pt-12 space-y-2">
            <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">sammenligning</p>
            <h2
              className="font-display ink text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.02em]"
              style={{ fontWeight: 400 }}
            >
              Hvad du{' '}
              <em
                className="accent"
                style={{
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                  fontStyle: 'italic',
                }}
              >
                faktisk får
              </em>{' '}
              i hånden.
            </h2>
          </div>

          <ComparativeBar
            bud={bud}
            maeglerSalaer={maeglerSalaer}
            markedAfslag={markedAfslag}
            driftSalg={driftSalg}
            maeglerEkvivalent={maeglerEkvivalent}
            priceBlur={priceBlur}
          />
        </section>

        {/* Næste skridt */}
        <section
          className="rounded-[14px] p-10 sm:p-14 text-center space-y-6 shadow-card"
          style={{
            background: 'var(--cream-deep)',
            color: 'var(--ink)',
          }}
        >
          <h3
            className="font-display ink text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.02em] text-balance"
            style={{ fontWeight: 400 }}
          >
            Vi ringer{' '}
            <em
              className="accent"
              style={{
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                fontStyle: 'italic',
              }}
            >
              inden 24 timer.
            </em>
          </h3>
          <p className="font-body text-[15px] muted max-w-md mx-auto leading-[1.6]">
            For at aftale en gratis besigtigelse. Efter besigtigelsen giver vi et endeligt bindende tilbud.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 justify-center">
            <a
              href="tel:+4589876634"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-body text-[14px] active:scale-[0.97] transition-transform"
              style={{
                background: 'var(--ink)',
                color: 'var(--cream)',
                fontWeight: 500,
              }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
              Ring direkte
            </a>
            <a
              href="mailto:administration@365ejendom.dk"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-body text-[14px] active:scale-[0.97] transition-transform border border-warm"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                fontWeight: 500,
              }}
            >
              Eller skriv
            </a>
          </div>
        </section>

        {/* Reset */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="font-body text-[13px] muted hover:ink transition-colors underline-offset-4 hover:underline"
          >
            Beregn et nyt estimat
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Overtagelse Slider (drag + snap) ──────────────────────────────────────
function OvertagSlider({
  value,
  onChange,
}: {
  value: 0.5 | 1 | 3 | 6;
  onChange: (v: 0.5 | 1 | 3 | 6) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[2];
  const livePos = hoverPos ?? current.pos;

  function snapToNearest(pos: number): OvertagOption {
    let nearest = OPTIONS[0];
    let minDist = Math.abs(pos - OPTIONS[0].pos);
    for (const opt of OPTIONS) {
      const d = Math.abs(pos - opt.pos);
      if (d < minDist) {
        nearest = opt;
        minDist = d;
      }
    }
    return nearest;
  }

  function pointerToPos(e: PointerEvent | React.PointerEvent): number {
    const track = trackRef.current;
    if (!track) return 0;
    const r = track.getBoundingClientRect();
    const x = e.clientX - r.left;
    return Math.max(0, Math.min(1, x / r.width));
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    const pos = pointerToPos(e);
    setHoverPos(pos);
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const pos = pointerToPos(e);
      const snapped = snapToNearest(pos);
      onChange(snapped.value);
      setHoverPos(null);
      setDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
    [onChange, onPointerMove],
  );

  function startDrag(e: React.PointerEvent) {
    e.preventDefault();
    setDragging(true);
    const pos = pointerToPos(e);
    setHoverPos(pos);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return (
    <div className="space-y-6 select-none">
      {/* Track */}
      <div className="relative pt-12 pb-10">
        {/* Active label floating above handle */}
        <div
          className="absolute -top-2 transition-all"
          style={{
            left: `${livePos * 100}%`,
            transform: 'translateX(-50%)',
            transitionProperty: 'left',
            transitionDuration: dragging ? '0ms' : '260ms',
            transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <div
            className="font-display ink text-center whitespace-nowrap"
            style={{
              fontSize: 'clamp(20px, 2.2vw, 28px)',
              fontWeight: 400,
              fontVariationSettings: "'opsz' 144, 'SOFT' 30",
            }}
          >
            {snapToNearest(livePos).t}
          </div>
          <div className="font-body text-[11px] soft text-center tracking-[0.15em] uppercase mt-0.5">
            {snapToNearest(livePos).sub}
          </div>
        </div>

        <div
          ref={trackRef}
          onPointerDown={startDrag}
          className="relative h-2 rounded-full cursor-pointer touch-none"
          style={{
            background: 'var(--cream-deep)',
          }}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(current.pos * 100)}
          aria-label="Overtagelses-periode"
          tabIndex={0}
          onKeyDown={(e) => {
            const idx = OPTIONS.findIndex((o) => o.value === value);
            if (e.key === 'ArrowLeft' && idx > 0) onChange(OPTIONS[idx - 1].value);
            if (e.key === 'ArrowRight' && idx < OPTIONS.length - 1) onChange(OPTIONS[idx + 1].value);
          }}
        >
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${livePos * 100}%`,
              background: TEAL,
              transitionProperty: 'width',
              transitionDuration: dragging ? '0ms' : '260ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
          {/* Snap-anchors */}
          {OPTIONS.map((o) => (
            <div
              key={o.value}
              className="absolute top-1/2 -translate-y-1/2 w-[3px] h-3 rounded-full"
              style={{
                left: `${o.pos * 100}%`,
                transform: 'translateX(-50%) translateY(-50%)',
                background: o.pos <= livePos ? 'oklch(0.95 0.025 200)' : 'oklch(0.86 0.02 80)',
              }}
            />
          ))}
          {/* Handle */}
          <button
            type="button"
            onPointerDown={startDrag}
            className="absolute top-1/2 w-7 h-7 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--teal)]/30"
            style={{
              left: `${livePos * 100}%`,
              transform: `translate(-50%, -50%) scale(${dragging ? 1.15 : 1})`,
              background: 'var(--ink)',
              boxShadow: dragging
                ? '0 8px 24px -8px oklch(0.25 0.05 200 / 0.5), 0 0 0 6px oklch(0.35 0.045 200 / 0.12)'
                : '0 4px 12px -4px oklch(0.25 0.05 200 / 0.35)',
              transitionProperty: 'transform, box-shadow, left',
              transitionDuration: dragging ? '0ms, 200ms, 0ms' : '260ms, 260ms, 260ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Snap labels under track */}
        <div className="relative mt-3 h-4">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className="absolute font-body text-[11px] tracking-tight cursor-pointer hover:ink transition-colors px-2 py-1 -mx-2 -my-1"
              style={{
                left: `${o.pos * 100}%`,
                transform: 'translateX(-50%)',
                color: o.value === value ? 'var(--teal)' : 'var(--soft)',
                fontWeight: o.value === value ? 600 : 400,
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comparative Bar (365 vs mægler) ───────────────────────────────────────
function ComparativeBar({
  bud,
  maeglerSalaer,
  markedAfslag,
  driftSalg,
  maeglerEkvivalent,
  priceBlur,
}: {
  bud: number;
  maeglerSalaer: number;
  markedAfslag: number;
  driftSalg: number;
  maeglerEkvivalent: number;
  priceBlur: boolean;
}) {
  const fmt = (n: number) => n.toLocaleString('da-DK');
  const totalSaved = maeglerSalaer + markedAfslag + driftSalg;

  return (
    <div className="space-y-6">
      {/* Visual stack bar */}
      <div className="relative">
        <div className="flex items-stretch h-20 rounded-[10px] overflow-hidden shadow-soft" style={{ background: 'var(--paper)' }}>
          {/* 365 bud-bar */}
          <div
            className="flex items-center justify-start px-4 sm:px-6 relative"
            style={{
              width: `${(bud / maeglerEkvivalent) * 100}%`,
              background: TEAL,
              color: 'var(--cream)',
              transitionProperty: 'width',
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            <div>
              <div className="font-body text-[10.5px] tracking-[0.18em] uppercase" style={{ color: 'oklch(0.95 0.025 200 / 0.75)' }}>
                kontant til dig
              </div>
              <div
                className="font-display font-tabular leading-none mt-1"
                style={{
                  fontSize: 'clamp(20px, 2.5vw, 28px)',
                  fontWeight: 500,
                  filter: priceBlur ? 'blur(3px)' : 'none',
                  opacity: priceBlur ? 0.6 : 1,
                  transitionProperty: 'filter, opacity',
                  transitionDuration: '220ms',
                }}
              >
                {fmt(bud)} kr
              </div>
            </div>
          </div>
          {/* Mægler-omkostninger */}
          <div
            className="flex-1 flex items-center justify-end px-4 sm:px-6"
            style={{
              background: 'var(--cream-deep)',
            }}
          >
            <div className="text-right">
              <div className="font-body text-[10.5px] tracking-[0.18em] uppercase soft">
                væk via mægler
              </div>
              <div className="font-display font-tabular ink text-[18px] sm:text-[20px] leading-none mt-1" style={{ fontWeight: 500 }}>
                {fmt(totalSaved)} kr
              </div>
            </div>
          </div>
        </div>

        {/* Total under bar */}
        <div className="flex justify-between items-baseline mt-4 font-body text-[12px] muted">
          <span>0 kr</span>
          <span>
            mægler-pris{' '}
            <span className="font-tabular ink" style={{ fontWeight: 600 }}>
              {fmt(maeglerEkvivalent)} kr
            </span>
          </span>
        </div>
      </div>

      {/* Stack breakdown */}
      <div className="grid sm:grid-cols-3 gap-px bg-warm rounded-[10px] overflow-hidden" style={{ background: 'var(--border)' }}>
        {[
          {
            label: 'Mæglersalær',
            amount: maeglerSalaer,
            detail: 'Vi tager intet salær.',
          },
          {
            label: 'Markedsafslag',
            amount: markedAfslag,
            detail: 'Mægler-pris ligger typisk 6-8% under listepris.',
          },
          {
            label: 'Drift i salgsperioden',
            amount: driftSalg,
            detail: '3 mdr ejerudgifter ingen lejeindtægt.',
          },
        ].map((row) => (
          <div key={row.label} className="bg-paper p-5 sm:p-6 space-y-2">
            <div className="font-body text-[10.5px] tracking-[0.18em] uppercase soft">
              {row.label}
            </div>
            <div className="font-display font-tabular ink text-[24px] sm:text-[28px] leading-none" style={{ fontWeight: 500 }}>
              {fmt(row.amount)} kr
            </div>
            <p className="font-body text-[12.5px] muted leading-[1.5] pt-1">
              {row.detail}
            </p>
          </div>
        ))}
      </div>

      <p className="font-body text-[12.5px] soft leading-[1.6] max-w-md">
        Vi betaler kontant. Ingen ventetid, ingen bank-forbehold, ingen mæglerprovision.
      </p>
    </div>
  );
}
