'use client';

/**
 * MockFunnelOpendoor — gengiver Opendoors faktiske flow-struktur:
 *
 *   1. Adresse
 *   2. Verify property (auto-facts du bekraefter/redigerer)
 *   3. Home features (checkboxes: garage, AC, basement, pool…)
 *   4. Condition: koekken (foto + 5-niveau)
 *   5. Condition: bad (foto + 5-niveau)
 *   6. Condition: ovrige rum (kompakt grid)
 *   7. Contact info
 *   8. Instant offer reveal
 *
 * Karakteristisk Opendoor: meget data-driven, bruger auto-facts som
 * udgangspunkt, foto-tungt condition-step, instant offer "service-fee"
 * vist transparent i breakdown.
 */
import { useState } from 'react';

const OD_BLUE = '#143cd9';
const OD_INK = '#0b1330';
const OD_CORAL = '#ff5d3a';
const OD_BG = '#ffffff';
const OD_BG2 = '#f5f7fb';
const OD_BORDER = '#e5e9f2';

const STEP_LABELS = ['Adresse', 'Boligen', 'Features', 'Køkken', 'Bad', 'Andre rum', 'Kontakt', 'Tilbud'];

export function MockFunnelOpendoor() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(8, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={{ background: OD_BG2, color: OD_INK }}>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <Progress step={step} />

        <div
          className="mt-5 p-5 sm:p-8 space-y-6 bg-white"
          style={{ border: `1px solid ${OD_BORDER}`, borderRadius: 16 }}
        >
          {step === 1 && <StepAddress />}
          {step === 2 && <StepVerify />}
          {step === 3 && <StepFeatures />}
          {step === 4 && <StepCondition title="Køkken" sub="Hvordan er dit køkken?" />}
          {step === 5 && <StepCondition title="Bad" sub="Hvordan er dit bad?" />}
          {step === 6 && <StepOtherRooms />}
          {step === 7 && <StepContact />}
          {step === 8 && <StepOffer />}

          <Nav step={step} prev={prev} next={next} />
        </div>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num <= step;
          return (
            <div
              key={label}
              className="flex-1 h-1 rounded-full"
              style={{ background: done ? OD_BLUE : OD_BORDER }}
            />
          );
        })}
      </div>
      <div className="text-xs font-medium" style={{ color: OD_INK, opacity: 0.6 }}>
        Step {step} of 8 · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex justify-between gap-3 pt-4 border-t" style={{ borderColor: OD_BORDER }}>
      <button
        type="button"
        onClick={prev}
        disabled={step === 1}
        className="px-4 py-2 text-sm font-medium disabled:opacity-30"
        style={{ color: OD_BLUE }}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === 8}
        className="px-7 py-3 text-sm font-bold rounded-full text-white disabled:opacity-30 hover:opacity-90"
        style={{ background: OD_BLUE }}
      >
        {step === 7 ? 'Get my offer' : step === 8 ? 'Done' : 'Continue'} →
      </button>
    </div>
  );
}

// === STEP 1: Address ===
function StepAddress() {
  return (
    <>
      <Title big>Hvor ligger din bolig?</Title>
      <p className="text-base" style={{ color: OD_INK, opacity: 0.7 }}>
        Vi henter offentlig data automatisk og giver dig et tilbud på 5 minutter.
      </p>
      <div
        className="flex flex-col sm:flex-row gap-2 p-2"
        style={{ background: OD_BG, border: `1px solid ${OD_BORDER}`, borderRadius: 14 }}
      >
        <input
          type="text"
          defaultValue="Svendborgvej 59, 4700 Næstved"
          className="flex-1 px-3 py-3 text-base bg-transparent focus:outline-none"
          style={{ color: OD_INK }}
        />
        <button
          className="px-6 py-3 text-sm font-bold text-white rounded-lg"
          style={{ background: OD_BLUE }}
        >
          Find boligen
        </button>
      </div>
      <div className="text-xs flex items-center gap-2" style={{ color: OD_INK, opacity: 0.55 }}>
        <span style={{ color: OD_CORAL }}>★</span>
        4.8 fra 87+ sælgere
      </div>
    </>
  );
}

// === STEP 2: Verify property facts ===
function StepVerify() {
  return (
    <>
      <Title>Lad os bekræfte boligens detaljer</Title>
      <p className="text-sm" style={{ color: OD_INK, opacity: 0.7 }}>
        Vi har auto-udfyldt det meste fra OIS. Ret det hvis vi har fået noget galt.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Boligareal" value="67" suffix="m²" />
        <Field label="Værelser" value="2" />
        <Field label="Byggeår" value="1976" />
        <Field label="Etager" value="1" />
      </div>
      <div
        className="p-3 text-sm"
        style={{
          background: '#eef2ff',
          border: `1px solid #c7d2fe`,
          borderRadius: 10,
          color: '#3730a3',
        }}
      >
        <strong>Tip:</strong> Det er vigtigt at boligarealet er præcist — det er det vi
        bygger hele estimatet på.
      </div>
    </>
  );
}

// === STEP 3: Home features (checkbox grid) ===
const FEATURES = [
  ['altan', '🌅 Altan / terrasse'],
  ['elevator', '⬆️ Elevator i bygning'],
  ['kaelder', '🏠 Kælder eller depotrum'],
  ['parkering', '🚗 Parkeringsplads'],
  ['vaskemaskine', '🧺 Vaskemaskine'],
  ['toerretumbler', '🌀 Tørretumbler'],
  ['opvask', '🍽️ Opvaskemaskine'],
  ['emhaette', '💨 Emhætte'],
  ['ovn', '🔥 Ovn'],
  ['koel', '❄️ Køl/frys'],
];

function StepFeatures() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['altan', 'opvask', 'emhaette', 'ovn', 'koel']));
  return (
    <>
      <Title>Hvilke features har boligen?</Title>
      <p className="text-sm" style={{ color: OD_INK, opacity: 0.7 }}>
        Klik på alt der gælder — det hjælper os med at give et præcist tilbud.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map(([k, label]) => {
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
              className="px-4 py-3 text-sm font-medium text-left transition-all"
              style={{
                background: active ? OD_BLUE : OD_BG,
                color: active ? 'white' : OD_INK,
                border: `2px solid ${active ? OD_BLUE : OD_BORDER}`,
                borderRadius: 12,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}

// === STEP 4 + 5: Condition (køkken / bad) ===
const CONDITION_LEVELS = [
  { value: 'great', label: 'Som nyt', desc: 'Renoveret indenfor 2-3 år.', emoji: '✨' },
  { value: 'good', label: 'Velholdt', desc: 'Få mindre slid, ellers fint.', emoji: '👍' },
  { value: 'average', label: 'Gennemsnitligt', desc: 'Funktionelt men ældre udseende.', emoji: '🤷' },
  { value: 'fair', label: 'Trænger', desc: 'Bør renoveres indenfor de næste år.', emoji: '🔧' },
  { value: 'poor', label: 'Dårligt', desc: 'Total udskiftning er nødvendig.', emoji: '🚧' },
];

function StepCondition({ title, sub }: { title: string; sub: string }) {
  const [selected, setSelected] = useState('good');
  return (
    <>
      <Title>{sub}</Title>
      <p className="text-sm" style={{ color: OD_INK, opacity: 0.7 }}>
        Vælg det niveau der bedst passer. Bare et par sekunder pr. rum.
      </p>
      <div className="space-y-2">
        {CONDITION_LEVELS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className="w-full text-left p-4 transition-all flex items-center gap-3"
              style={{
                background: active ? OD_BLUE : OD_BG,
                color: active ? 'white' : OD_INK,
                border: `2px solid ${active ? OD_BLUE : OD_BORDER}`,
                borderRadius: 14,
              }}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <div className="font-bold">{opt.label}</div>
                <div className="text-sm" style={{ opacity: 0.85 }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Photo upload — secondary */}
      <div
        className="p-4 mt-2 text-center text-sm"
        style={{
          background: OD_BG2,
          border: `2px dashed ${OD_BORDER}`,
          borderRadius: 12,
          color: OD_INK,
          opacity: 0.7,
        }}
      >
        📸 Tilføj foto af {title.toLowerCase()} (valgfri — gør estimatet mere præcist)
      </div>
    </>
  );
}

// === STEP 6: Other rooms (compact) ===
function StepOtherRooms() {
  const rooms = ['Stue', 'Soveværelse', 'Spisestue', 'Andet'];
  return (
    <>
      <Title>Resten af boligen</Title>
      <p className="text-sm" style={{ color: OD_INK, opacity: 0.7 }}>
        En hurtig vurdering af de andre rum — vi tager gennemsnit.
      </p>
      <div className="space-y-3">
        {rooms.map((r) => (
          <div
            key={r}
            className="p-3 flex items-center justify-between gap-3"
            style={{ background: OD_BG2, borderRadius: 10 }}
          >
            <span className="font-medium text-sm">{r}</span>
            <select
              defaultValue="good"
              className="px-3 py-2 text-sm bg-white"
              style={{ border: `1px solid ${OD_BORDER}`, borderRadius: 8 }}
            >
              {CONDITION_LEVELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

// === STEP 7: Contact ===
function StepContact() {
  return (
    <>
      <Title>Næsten færdig — hvor sender vi dit tilbud?</Title>
      <p className="text-sm" style={{ color: OD_INK, opacity: 0.7 }}>
        Du modtager et instant tilbud på email + SMS. Vi ringer indenfor 24 timer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fulde navn" value="Jens Hansen" />
        <Field label="Email" value="jens@example.dk" />
        <Field label="Telefon" value="20 12 34 56" />
        <Field label="Hvornår vil du sælge?" value="1-3 mdr" />
      </div>
      <div className="text-xs" style={{ color: OD_INK, opacity: 0.5 }}>
        Vi ringer kun for at aftale besigtigelse. Ingen spam.
      </div>
    </>
  );
}

// === STEP 8: Instant offer ===
function StepOffer() {
  return (
    <>
      <div className="text-center space-y-2 py-4">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: OD_CORAL }}>
          Dit instant cash-tilbud
        </p>
        <p
          className="text-5xl sm:text-6xl font-extrabold tracking-tight"
          style={{ color: OD_INK }}
        >
          1.245.000 kr
        </p>
        <p className="text-sm" style={{ color: OD_INK, opacity: 0.6 }}>
          for Svendborgvej 59, 4700 Næstved · 67m²
        </p>
      </div>

      {/* Breakdown — Opendoor's signature transparent style */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: OD_INK, opacity: 0.7 }}>
          Sådan kommer vi frem til dit tilbud
        </h3>
        <div
          className="p-4 space-y-3"
          style={{ background: OD_BG2, border: `1px solid ${OD_BORDER}`, borderRadius: 12 }}
        >
          <BreakRow label="Markedspris" value="1.380.000 kr" />
          <BreakRow label="− Vores gebyr (5%)" value="−69.000 kr" muted />
          <BreakRow label="− Reparations-estimat" value="−66.000 kr" muted />
          <div className="pt-2 border-t" style={{ borderColor: OD_BORDER }}>
            <BreakRow label="Dit tilbud" value="1.245.000 kr" bold />
          </div>
        </div>
      </div>

      <div
        className="p-4 text-center"
        style={{
          background: OD_BLUE,
          color: 'white',
          borderRadius: 14,
        }}
      >
        <p className="text-sm font-bold mb-2">Tilbuddet gælder 14 dage</p>
        <p className="text-xs" style={{ opacity: 0.85 }}>
          Du vælger selv overtagelsesdato fra 14 dage til 6 måneder.
        </p>
      </div>
    </>
  );
}

function Title({ children, big }: { children: React.ReactNode; big?: boolean }) {
  return (
    <h2
      className={`${big ? 'text-3xl sm:text-4xl' : 'text-2xl'} font-extrabold tracking-tight`}
      style={{ color: OD_INK, letterSpacing: '-0.025em' }}
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
      <div className="text-xs font-medium mb-1" style={{ color: OD_INK, opacity: 0.65 }}>
        {label}
      </div>
      <div className="relative">
        <input
          type="text"
          defaultValue={value}
          className="w-full px-3 py-2.5 text-sm bg-white"
          style={{ border: `1px solid ${OD_BORDER}`, borderRadius: 10, color: OD_INK }}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
            style={{ color: OD_INK, opacity: 0.5 }}
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
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: OD_INK, opacity: muted ? 0.6 : 1, fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        style={{
          color: OD_INK,
          opacity: muted ? 0.6 : 1,
          fontWeight: bold ? 700 : 600,
          fontSize: bold ? '1.125rem' : undefined,
        }}
        className="tabular-nums"
      >
        {value}
      </span>
    </div>
  );
}
