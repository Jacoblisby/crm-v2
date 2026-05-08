'use client';

/**
 * MockFunnelOpendoor — closer-to-real-Opendoor clone.
 *
 * Opendoor's faktiske flow-raekkefolge:
 *   1. When are you planning to sell? (timeline forst — Opendoor's
 *      faktiske aabnings-sporsmal: tidshorisont)
 *   2. Address
 *   3. Verify auto-facts
 *   4. Home features (checkbox grid)
 *   5. Kitchen condition (5 detailed cards + photo)
 *   6. Bathroom condition (5 detailed cards + photo)
 *   7. Other rooms condition
 *   8. Photos upload (prominent, 8 slots)
 *   9. Contact info
 *   10. Get instant offer
 *
 * Brand-DNA:
 *   - Deep purple/blue primary (#143cd9 → derivative #1d2545 for dark navy)
 *   - Coral accent (#ff5d3a)
 *   - White cards med subtle borders, rundede 16-20px
 *   - Pill-shaped chunky buttons med fed sans
 *   - Emoji-led condition cards
 *   - "Step X of Y" format
 */
import { useState } from 'react';

const OD_BLUE = '#143cd9';
const OD_NAVY = '#1d2545';
const OD_INK = '#0b1330';
const OD_CORAL = '#ff5d3a';
const OD_BG = '#f6f7fb';
const OD_CARD = '#ffffff';
const OD_BORDER = '#e3e7f0';
const OD_TEXT_MUTED = '#576074';

const STEP_LABELS = [
  'Hvornår sælger du?',
  'Adresse',
  'Boligens detaljer',
  'Features',
  'Køkken',
  'Bad',
  'Andre rum',
  'Fotos',
  'Kontakt',
  'Tilbud',
];

const TOTAL_STEPS = STEP_LABELS.length;

export function MockFunnelOpendoor() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={{ background: OD_BG, color: OD_INK, fontFamily: 'system-ui, -apple-system, "Inter", sans-serif' }}>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <Progress step={step} />

        <div
          className="mt-6 p-6 sm:p-10 space-y-7"
          style={{
            background: OD_CARD,
            border: `1px solid ${OD_BORDER}`,
            borderRadius: 24,
            boxShadow: '0 1px 2px rgba(11,19,48,0.04), 0 8px 24px rgba(11,19,48,0.04)',
          }}
        >
          {step === 1 && <StepWhen />}
          {step === 2 && <StepAddress />}
          {step === 3 && <StepVerify />}
          {step === 4 && <StepFeatures />}
          {step === 5 && <StepRoomCondition title="Køkken" emoji="🍳" />}
          {step === 6 && <StepRoomCondition title="Bad" emoji="🚿" />}
          {step === 7 && <StepRoomCondition title="Stue + soveværelse" emoji="🛋️" combined />}
          {step === 8 && <StepPhotos />}
          {step === 9 && <StepContact />}
          {step === 10 && <StepOffer />}

          <Nav step={step} prev={prev} next={next} />
        </div>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  const pct = (step / TOTAL_STEPS) * 100;
  return (
    <div className="space-y-2">
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: OD_BORDER }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: OD_BLUE }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: OD_TEXT_MUTED }}
        >
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs font-medium" style={{ color: OD_TEXT_MUTED }}>
          {STEP_LABELS[step - 1]}
        </span>
      </div>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-6" style={{ borderTop: `1px solid ${OD_BORDER}` }}>
      <button
        type="button"
        onClick={prev}
        disabled={step === 1}
        className="px-5 py-3 text-sm font-bold disabled:opacity-30"
        style={{ color: OD_BLUE }}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === TOTAL_STEPS}
        className="px-9 py-4 text-base font-bold rounded-full text-white disabled:opacity-30 hover:shadow-lg transition-all"
        style={{ background: OD_BLUE, letterSpacing: '-0.01em' }}
      >
        {step === 9 ? 'Get my offer' : step === 10 ? 'Done' : 'Continue'} →
      </button>
    </div>
  );
}

// ============================
// STEP 1: WHEN ARE YOU PLANNING TO SELL?
// ============================
const TIMELINES = [
  { value: 'asap', label: 'Hurtigst muligt', emoji: '⚡', desc: 'Indenfor 30 dage — du er klar til at handle.' },
  { value: '1to3', label: '1-3 måneder', emoji: '📅', desc: 'Du er parat snart men har lidt tid.' },
  { value: '3to6', label: '3-6 måneder', emoji: '🗓️', desc: 'Du planlægger fremad og samler info.' },
  { value: '6to12', label: '6-12 måneder', emoji: '⏳', desc: 'Du er længere ude men vil orientere dig nu.' },
  { value: 'exploring', label: 'Bare nysgerrig', emoji: '🔍', desc: 'Du undersøger markedet uden konkret plan.' },
];

function StepWhen() {
  const [selected, setSelected] = useState('1to3');
  return (
    <>
      <Title big>Hvornår vil du sælge?</Title>
      <p className="text-base leading-relaxed" style={{ color: OD_TEXT_MUTED }}>
        Det hjælper os med at prioritere din sag og give den rette behandling. Du forpligter
        dig ikke til noget.
      </p>
      <div className="space-y-3">
        {TIMELINES.map((t) => {
          const active = selected === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setSelected(t.value)}
              className="w-full text-left p-5 transition-all flex items-start gap-4"
              style={{
                background: active ? OD_BLUE : OD_CARD,
                color: active ? 'white' : OD_INK,
                border: `2px solid ${active ? OD_BLUE : OD_BORDER}`,
                borderRadius: 16,
                boxShadow: active ? '0 4px 12px rgba(20,60,217,0.2)' : 'none',
              }}
            >
              <span className="text-3xl shrink-0">{t.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-lg" style={{ letterSpacing: '-0.01em' }}>{t.label}</div>
                <div
                  className="text-sm mt-0.5"
                  style={{ color: active ? 'rgba(255,255,255,0.85)' : OD_TEXT_MUTED }}
                >
                  {t.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============================
// STEP 2: ADDRESS
// ============================
function StepAddress() {
  return (
    <>
      <Title big>Hvor ligger din bolig?</Title>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Vi henter offentlig data automatisk og giver dig et tilbud på 5 minutter.
      </p>
      <div className="relative">
        <input
          type="text"
          defaultValue="Svendborgvej 59, 4700 Næstved"
          className="w-full px-6 py-5 text-lg font-medium focus:outline-none"
          style={{
            background: OD_BG,
            border: `2px solid ${OD_BORDER}`,
            borderRadius: 14,
            color: OD_INK,
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: OD_TEXT_MUTED }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color: OD_CORAL }}>★</span>
          <span><strong style={{ color: OD_INK }}>4.8</strong> fra 87+ sælgere</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#22c55e' }}>✓</span>
          <span>Ingen forpligtelse</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: '#22c55e' }}>✓</span>
          <span>Gratis at få estimat</span>
        </div>
      </div>
    </>
  );
}

// ============================
// STEP 3: VERIFY
// ============================
function StepVerify() {
  return (
    <>
      <Title>Lad os bekræfte boligens detaljer</Title>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Vi har auto-udfyldt det meste fra OIS. Ret det hvis vi har fået noget galt — det er
        vigtigt at tallene er præcise.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Field label="Boligareal" value="67" suffix="m²" />
        <Field label="Værelser" value="2" />
        <Field label="Byggeår" value="1976" />
        <Field label="Etager" value="1" />
      </div>
      <div
        className="p-5 flex gap-4 items-start"
        style={{
          background: '#fff7f5',
          border: `1px solid ${OD_CORAL}33`,
          borderRadius: 14,
        }}
      >
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: OD_CORAL, color: 'white' }}
        >
          💡
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: OD_INK }}>
            Hvorfor det her er vigtigt
          </div>
          <div className="text-sm mt-1" style={{ color: OD_TEXT_MUTED }}>
            Boligarealet er fundamentet for hele estimatet — selv små unøjagtigheder
            kan flytte tilbuddet flere tusinde kroner.
          </div>
        </div>
      </div>
    </>
  );
}

// ============================
// STEP 4: FEATURES
// ============================
const FEATURES = [
  ['altan', '🌅', 'Altan / terrasse'],
  ['elevator', '⬆️', 'Elevator i bygning'],
  ['kaelder', '📦', 'Kælder eller depotrum'],
  ['parkering', '🚗', 'Parkeringsplads'],
  ['fjernvarme', '🔥', 'Fjernvarme'],
  ['nyt_tag', '🏠', 'Nyt tag (< 10 år)'],
  ['gulvvarme', '♨️', 'Gulvvarme i bad'],
  ['energirenovation', '💡', 'Energirenovation foretaget'],
  ['vaskemaskine', '🧺', 'Vaskemaskine'],
  ['toerretumbler', '🌀', 'Tørretumbler'],
  ['opvask', '🍽️', 'Opvaskemaskine'],
  ['emhaette', '💨', 'Emhætte'],
];

function StepFeatures() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['altan', 'fjernvarme', 'opvask', 'emhaette']),
  );
  return (
    <>
      <Title>Hvilke features har boligen?</Title>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Klik på alt der gælder. Det hjælper os med at give et præcist tilbud.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(([k, emoji, label]) => {
          const active = selected.has(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (active) next.delete(k);
                else next.add(k);
                setSelected(next);
              }}
              className="px-5 py-4 text-left transition-all flex items-center gap-3"
              style={{
                background: active ? OD_BLUE : OD_CARD,
                color: active ? 'white' : OD_INK,
                border: `2px solid ${active ? OD_BLUE : OD_BORDER}`,
                borderRadius: 14,
                boxShadow: active ? '0 4px 12px rgba(20,60,217,0.15)' : 'none',
              }}
            >
              <span className="text-2xl shrink-0">{emoji}</span>
              <span className="font-semibold text-base">{label}</span>
              {active && (
                <span className="ml-auto text-lg" style={{ color: 'white' }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ============================
// STEP 5-7: ROOM CONDITION (5 cards per room)
// ============================
const CONDITION_CARDS = [
  {
    value: 'great',
    label: 'Som nyt',
    emoji: '✨',
    color: '#22c55e',
    desc: 'Renoveret indenfor 2-3 år. Moderne overflader, integrerede hvidevarer, alt fungerer fejlfrit.',
  },
  {
    value: 'good',
    label: 'Velholdt',
    emoji: '👍',
    color: '#3b82f6',
    desc: 'Få tegn på slid. Renoveret indenfor 5-10 år. Hvidevarer kører fint men ikke nyeste model.',
  },
  {
    value: 'avg',
    label: 'Funktionelt',
    emoji: '🤷',
    color: '#f59e0b',
    desc: 'Ældre overflader men brugbare. Hvidevarer fungerer. Bør opdateres indenfor 5-10 år.',
  },
  {
    value: 'fair',
    label: 'Trænger',
    emoji: '🔧',
    color: '#fb923c',
    desc: 'Synligt slid på overflader. Ældre VVS/hvidevarer. Bør renoveres indenfor de næste år.',
  },
  {
    value: 'poor',
    label: 'Skal renoveres',
    emoji: '🚧',
    color: '#ef4444',
    desc: 'Originalt eller meget slidt. Total udskiftning af overflader, VVS og evt. hvidevarer nødvendig.',
  },
];

function StepRoomCondition({
  title,
  emoji,
  combined,
}: {
  title: string;
  emoji: string;
  combined?: boolean;
}) {
  const [selected, setSelected] = useState('good');
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <Title>{combined ? `${title}` : `Hvordan er dit ${title.toLowerCase()}?`}</Title>
      </div>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Vælg det niveau der bedst beskriver det. Bagefter kan du tilføje fotos.
      </p>
      <div className="space-y-3">
        {CONDITION_CARDS.map((c) => {
          const active = selected === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelected(c.value)}
              className="w-full text-left p-5 transition-all flex items-start gap-4"
              style={{
                background: active ? OD_BLUE : OD_CARD,
                color: active ? 'white' : OD_INK,
                border: `2px solid ${active ? OD_BLUE : OD_BORDER}`,
                borderRadius: 16,
                boxShadow: active ? '0 4px 16px rgba(20,60,217,0.2)' : 'none',
              }}
            >
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : `${c.color}20`,
                }}
              >
                {c.emoji}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg" style={{ letterSpacing: '-0.01em' }}>{c.label}</div>
                <div
                  className="text-sm mt-1 leading-relaxed"
                  style={{ color: active ? 'rgba(255,255,255,0.85)' : OD_TEXT_MUTED }}
                >
                  {c.desc}
                </div>
              </div>
              {active && (
                <span className="text-2xl shrink-0" style={{ color: 'white' }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Photo upload */}
      <div
        className="p-5 flex flex-col items-center justify-center text-center gap-2"
        style={{
          background: OD_BG,
          border: `2px dashed ${OD_BORDER}`,
          borderRadius: 16,
          minHeight: 140,
        }}
      >
        <span className="text-4xl">📸</span>
        <div className="font-bold" style={{ color: OD_INK }}>
          Tilføj 1-3 fotos
        </div>
        <div className="text-sm" style={{ color: OD_TEXT_MUTED }}>
          Med billeder kan vi give et mere præcist tilbud (~5% mere nøjagtigt).
        </div>
      </div>
    </>
  );
}

// ============================
// STEP 8: PHOTOS UPLOAD (prominent)
// ============================
const PHOTO_SLOTS = [
  { key: 'exterior', label: 'Ydre / facade', emoji: '🏢' },
  { key: 'living', label: 'Stue', emoji: '🛋️' },
  { key: 'kitchen', label: 'Køkken', emoji: '🍳' },
  { key: 'bath', label: 'Bad', emoji: '🚿' },
  { key: 'bed1', label: 'Soveværelse', emoji: '🛏️' },
  { key: 'bed2', label: 'Børneværelse', emoji: '🧸' },
  { key: 'altan', label: 'Altan/udsigt', emoji: '🌅' },
  { key: 'plan', label: 'Plantegning', emoji: '📐' },
];

function StepPhotos() {
  return (
    <>
      <Title>Tilføj fotos af din bolig</Title>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Sælgere der uploader 4+ fotos får typisk{' '}
        <strong style={{ color: OD_INK }}>40-70.000 kr højere tilbud</strong>, fordi vi kan
        se den faktiske stand i stedet for at gætte.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PHOTO_SLOTS.map((s) => (
          <div
            key={s.key}
            className="aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md"
            style={{
              background: OD_BG,
              border: `2px dashed ${OD_BORDER}`,
              borderRadius: 14,
            }}
          >
            <span className="text-3xl">{s.emoji}</span>
            <span className="text-xs font-semibold text-center px-1" style={{ color: OD_INK }}>
              {s.label}
            </span>
            <span className="text-[10px]" style={{ color: OD_TEXT_MUTED }}>
              + Upload
            </span>
          </div>
        ))}
      </div>
      <div
        className="p-4 text-sm flex gap-3 items-start"
        style={{
          background: '#eef2ff',
          border: `1px solid #c7d2fe`,
          borderRadius: 12,
          color: '#3730a3',
        }}
      >
        <span className="text-lg shrink-0">💡</span>
        <div>
          <strong>Tip:</strong> Tag fotos i dagslys og fra hjørner — det giver os det bedste
          billede af pladsen og overfladerne.
        </div>
      </div>
    </>
  );
}

// ============================
// STEP 9: CONTACT
// ============================
function StepContact() {
  return (
    <>
      <Title>Næsten færdig — hvor sender vi dit tilbud?</Title>
      <p className="text-base" style={{ color: OD_TEXT_MUTED }}>
        Du modtager et instant tilbud på email + SMS. Vi ringer indenfor 24 timer for at
        aftale en gratis besigtigelse.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fulde navn" value="Jens Hansen" />
        <Field label="Email" value="jens@example.dk" />
        <Field label="Telefon" value="20 12 34 56" />
        <Field label="Hvornår vil du sælge?" value="1-3 mdr" />
      </div>
      <div className="text-sm flex items-center gap-2" style={{ color: OD_TEXT_MUTED }}>
        <span style={{ color: '#22c55e' }}>🔒</span>
        <span>Vi ringer kun for at aftale besigtigelse. Ingen spam.</span>
      </div>
    </>
  );
}

// ============================
// STEP 10: OFFER REVEAL
// ============================
function StepOffer() {
  return (
    <>
      {/* Property card with photo placeholder */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${OD_BORDER}` }}
      >
        <div
          className="h-32 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #cfd9e8 0%, #94a8c4 100%)',
          }}
        >
          <span className="text-5xl">🏠</span>
        </div>
        <div className="p-4" style={{ background: OD_CARD }}>
          <div className="font-bold text-base" style={{ color: OD_INK }}>
            Svendborgvej 59, 4700 Næstved
          </div>
          <div className="text-sm" style={{ color: OD_TEXT_MUTED }}>
            67 m² · 2 værelser · 1976 · Ejerlejlighed
          </div>
        </div>
      </div>

      {/* Big offer */}
      <div className="text-center space-y-3 py-2">
        <p
          className="text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: OD_CORAL }}
        >
          Dit instant cash-tilbud
        </p>
        <p
          className="font-extrabold tracking-tight tabular-nums"
          style={{
            color: OD_INK,
            fontSize: 'clamp(3rem, 10vw, 5rem)',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          1.245.000 kr
        </p>
        <p className="text-sm" style={{ color: OD_TEXT_MUTED }}>
          Range: 1.220.000 – 1.270.000 kr · Gælder 14 dage
        </p>
      </div>

      {/* Transparent breakdown */}
      <div className="space-y-3">
        <h3
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: OD_TEXT_MUTED }}
        >
          Sådan beregnes dit tilbud
        </h3>
        <div
          className="p-5 space-y-3"
          style={{
            background: OD_BG,
            border: `1px solid ${OD_BORDER}`,
            borderRadius: 14,
          }}
        >
          <BreakRow label="Markedspris" value="1.380.000 kr" />
          <BreakRow label="− Vores gebyr" value="−69.000 kr" sub="5% af markedspris" muted />
          <BreakRow label="− Reparations-estimat" value="−66.000 kr" sub="Baseret på dine svar" muted />
          <div className="pt-3" style={{ borderTop: `1px solid ${OD_BORDER}` }}>
            <BreakRow label="Dit tilbud" value="1.245.000 kr" bold />
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        className="w-full py-5 text-base font-bold rounded-full text-white hover:shadow-lg transition-all"
        style={{ background: OD_CORAL, letterSpacing: '-0.01em' }}
      >
        Book gratis besigtigelse →
      </button>
      <p className="text-center text-xs" style={{ color: OD_TEXT_MUTED }}>
        Inspections-garanti: Hvis tilbud efter besigtigelse afviger &gt;5%, kan du trække dig.
      </p>
    </>
  );
}

// ============================
// SHARED PRIMITIVES
// ============================
function Title({ children, big }: { children: React.ReactNode; big?: boolean }) {
  return (
    <h2
      className="font-extrabold tracking-tight"
      style={{
        color: OD_INK,
        letterSpacing: '-0.025em',
        fontSize: big ? 'clamp(1.75rem, 5vw, 2.5rem)' : 'clamp(1.5rem, 4vw, 1.875rem)',
        lineHeight: 1.05,
      }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div
        className="text-xs font-bold uppercase tracking-wider mb-1.5"
        style={{ color: OD_TEXT_MUTED }}
      >
        {label}
      </div>
      <div className="relative">
        <input
          type="text"
          defaultValue={value}
          className="w-full px-4 py-3.5 text-base font-medium focus:outline-none"
          style={{
            background: OD_CARD,
            border: `2px solid ${OD_BORDER}`,
            borderRadius: 12,
            color: OD_INK,
          }}
        />
        {suffix && (
          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold"
            style={{ color: OD_TEXT_MUTED }}
          >
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function BreakRow({
  label,
  value,
  sub,
  bold,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span
          style={{
            color: muted ? OD_TEXT_MUTED : OD_INK,
            fontWeight: bold ? 700 : 500,
            fontSize: bold ? '1.125rem' : undefined,
          }}
        >
          {label}
        </span>
        <span
          className="tabular-nums"
          style={{
            color: muted ? OD_TEXT_MUTED : OD_INK,
            fontWeight: bold ? 800 : 600,
            fontSize: bold ? '1.5rem' : '1rem',
            letterSpacing: bold ? '-0.02em' : undefined,
          }}
        >
          {value}
        </span>
      </div>
      {sub && (
        <div className="text-xs mt-0.5" style={{ color: OD_TEXT_MUTED }}>
          {sub}
        </div>
      )}
    </div>
  );
}
