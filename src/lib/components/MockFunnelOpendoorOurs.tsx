'use client';

/**
 * MockFunnelOpendoorOurs — Opendoor's faktiske flow-STRUKTUR med vores
 * slate-900 design. Isolerer "er flow'et bedre?" fra "er stylingen bedre?".
 *
 * Struktur (9 trin — matcher Opendoor's faktiske rækkefølge):
 *   1. Hvornår vil du sælge? (timing FORST)
 *   2. Adresse
 *   3. Verify auto-facts
 *   4. Home features (checkbox grid)
 *   5-7. Condition: koekken, bad, andre rum
 *   8. Kontakt
 *   9. Instant offer med transparent service-fee breakdown
 */
import { useState } from 'react';

const STEP_LABELS = ['Hvornår', 'Adresse', 'Boligen', 'Features', 'Køkken', 'Bad', 'Andre rum', 'Kontakt', 'Tilbud'];
const TOTAL = STEP_LABELS.length;

export function MockFunnelOpendoorOurs() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
        <Progress step={step} />

        <div className="mt-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6">
          {step === 1 && <StepWhen />}
          {step === 2 && <StepAddress />}
          {step === 3 && <StepVerify />}
          {step === 4 && <StepFeatures />}
          {step === 5 && <StepCondition title="Køkken" sub="Hvordan er dit køkken?" />}
          {step === 6 && <StepCondition title="Bad" sub="Hvordan er dit bad?" />}
          {step === 7 && <StepOtherRooms />}
          {step === 8 && <StepContact />}
          {step === 9 && <StepOffer />}

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
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                done ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>
      <div className="text-xs text-slate-500">
        Trin {step}/{TOTAL} · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
      <button
        type="button"
        onClick={prev}
        disabled={step === 1}
        className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
      >
        ← Tilbage
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === TOTAL}
        className="px-6 py-3 text-sm font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg"
      >
        {step === TOTAL - 1 ? 'Vis mit tilbud' : step === TOTAL ? 'Færdig' : 'Næste'} →
      </button>
    </div>
  );
}

// === STEP 1: When ===
function StepWhen() {
  const [selected, setSelected] = useState('1to3');
  const options = [
    { value: 'asap', label: 'Hurtigst muligt', desc: 'Indenfor 30 dage' },
    { value: '1to3', label: '1-3 måneder', desc: 'Du er parat snart' },
    { value: '3to6', label: '3-6 måneder', desc: 'Du planlægger fremad' },
    { value: '6to12', label: '6-12 måneder', desc: 'Du orienterer dig' },
    { value: 'exploring', label: 'Bare nysgerrig', desc: 'Ingen konkret plan' },
  ];
  return (
    <>
      <Heading title="Hvornår vil du sælge?" sub="Det hjælper os med at prioritere din sag. Du forpligter dig ikke til noget." />
      <div className="space-y-2">
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 hover:border-slate-400 bg-white'
              }`}
            >
              <div className={`font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
                {opt.label}
              </div>
              <div className={`text-sm mt-0.5 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// === STEP 1: Address ===
function StepAddress() {
  return (
    <>
      <Heading title="Hvor ligger din bolig?" sub="Vi henter offentlig data automatisk og giver dig et tilbud på 5 minutter." />
      <input
        type="text"
        defaultValue="Svendborgvej 59, 4700 Næstved"
        placeholder="Vejnavn + nr, postnr"
        className="w-full px-3 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
      />
      <div className="text-xs text-slate-500">
        ★ 4.8 fra 87+ sælgere
      </div>
    </>
  );
}

// === STEP 2: Verify ===
function StepVerify() {
  return (
    <>
      <Heading title="Lad os bekræfte boligens detaljer" sub="Vi har auto-udfyldt det meste fra OIS. Ret det hvis vi har fået noget galt." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Boligareal" value="67" suffix="m²" />
        <Field label="Værelser" value="2" />
        <Field label="Byggeår" value="1976" />
        <Field label="Etager" value="1" />
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <strong>Tip:</strong> Det er vigtigt at boligarealet er præcist — det er det vi
        bygger hele estimatet på.
      </div>
    </>
  );
}

// === STEP 3: Features ===
const FEATURES = [
  ['altan', 'Altan / terrasse'],
  ['elevator', 'Elevator i bygning'],
  ['kaelder', 'Kælder eller depotrum'],
  ['parkering', 'Parkeringsplads'],
  ['vaskemaskine', 'Vaskemaskine'],
  ['toerretumbler', 'Tørretumbler'],
  ['opvask', 'Opvaskemaskine'],
  ['emhaette', 'Emhætte'],
  ['ovn', 'Ovn'],
  ['koel', 'Køl/frys'],
];

function StepFeatures() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['altan', 'opvask', 'emhaette', 'ovn', 'koel']),
  );
  return (
    <>
      <Heading title="Hvilke features har boligen?" sub="Klik på alt der gælder — det hjælper os med at give et præcist tilbud." />
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map(([k, label]) => {
          const active = selected.has(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                const nxt = new Set(selected);
                if (active) nxt.delete(k);
                else nxt.add(k);
                setSelected(nxt);
              }}
              className={`px-3 py-2.5 text-sm font-medium text-left rounded-lg border transition-all flex items-center gap-2 ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  active ? 'bg-white border-white' : 'border-slate-300'
                }`}
              >
                {active && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// === STEP 4-5: Condition ===
const CONDITION_LEVELS = [
  { value: 'great', label: 'Som nyt', desc: 'Renoveret indenfor 2-3 år.' },
  { value: 'good', label: 'Velholdt', desc: 'Få mindre slid, ellers fint.' },
  { value: 'average', label: 'Gennemsnitligt', desc: 'Funktionelt men ældre udseende.' },
  { value: 'fair', label: 'Trænger', desc: 'Bør renoveres indenfor de næste år.' },
  { value: 'poor', label: 'Skal renoveres', desc: 'Total udskiftning er nødvendig.' },
];

function StepCondition({ title, sub }: { title: string; sub: string }) {
  const [selected, setSelected] = useState('good');
  return (
    <>
      <Heading title={sub} sub="Vælg det niveau der bedst passer. Bare et par sekunder pr. rum." />
      <div className="space-y-2">
        {CONDITION_LEVELS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                active
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 hover:border-slate-400 bg-white'
              }`}
            >
              <div className={`font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>
                {opt.label}
              </div>
              <div className={`text-sm mt-0.5 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Photo upload — secondary */}
      <div className="border-t border-slate-200 pt-4 space-y-2">
        <p className="text-sm text-slate-700">Tilføj foto af {title.toLowerCase()} (valgfri)</p>
        <p className="text-xs text-slate-500">
          Med billeder kan vi give et endnu mere præcist tilbud.
        </p>
        <label className="block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center gap-2">
          <span className="text-sm font-medium text-slate-700">Tap for at uploade foto</span>
        </label>
      </div>
    </>
  );
}

// === STEP 6: Other rooms ===
function StepOtherRooms() {
  const rooms = ['Stue', 'Soveværelse', 'Spisestue', 'Andet'];
  return (
    <>
      <Heading title="Resten af boligen" sub="En hurtig vurdering af de andre rum." />
      <div className="space-y-3">
        {rooms.map((r) => (
          <div
            key={r}
            className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <span className="font-medium text-sm text-slate-900">{r}</span>
            <select
              defaultValue="good"
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {CONDITION_LEVELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
      <Heading title="Næsten færdig — hvor sender vi dit tilbud?" sub="Du modtager et tilbud på email + SMS. Vi ringer indenfor 24 timer." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fulde navn" value="Jens Hansen" />
        <Field label="Email" value="jens@example.dk" />
        <Field label="Telefon" value="20 12 34 56" />
        <Field label="Hvornår vil du sælge?" value="1-3 mdr" />
      </div>
      <div className="text-xs text-slate-500">
        Vi ringer kun for at aftale besigtigelse. Ingen spam.
      </div>
    </>
  );
}

// === STEP 8: Offer ===
function StepOffer() {
  return (
    <>
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
          Dit instant cash-tilbud
        </p>
        <h2 className="text-base font-semibold text-slate-900">
          Svendborgvej 59, 4700 Næstved
        </h2>
      </div>

      {/* Hero — vores slate-900 dark hero */}
      <div className="bg-slate-900 rounded-lg p-6 text-center space-y-2">
        <p className="text-sm text-slate-400">Vores foreløbige tilbud</p>
        <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
          1.245.000 <span className="text-2xl text-slate-300">kr</span>
        </p>
        <p className="text-xs text-slate-400">Tilbuddet gælder 14 dage</p>
      </div>

      {/* Breakdown — Opendoor signature: transparent service-fee */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Sådan kommer vi frem til dit tilbud
        </h3>
        <BreakRow label="Markedspris" value="1.380.000 kr" />
        <BreakRow label="− Vores gebyr (5%)" value="−69.000 kr" muted />
        <BreakRow label="− Reparations-estimat" value="−66.000 kr" muted />
        <div className="pt-3 border-t border-slate-100">
          <BreakRow label="Dit tilbud" value="1.245.000 kr" bold />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <strong>Inspections-garanti:</strong> Hvis vores endelige tilbud efter besigtigelse
        afviger mere end 5%, kan du trække dig uden konsekvens.
      </div>
    </>
  );
}

// === Shared ===
function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{sub}</p>
    </div>
  );
}

function Field({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <div className="relative">
        <input
          type="text"
          defaultValue={value}
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          style={{ paddingRight: suffix ? '3.5rem' : undefined }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
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
      <span
        className={`${
          muted ? 'text-slate-500' : 'text-slate-900'
        } ${bold ? 'font-bold' : ''}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          muted ? 'text-slate-500' : 'text-slate-900'
        } ${bold ? 'font-bold text-lg' : 'font-semibold'}`}
      >
        {value}
      </span>
    </div>
  );
}
