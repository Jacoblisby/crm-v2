'use client';

/**
 * MockFunnelZillowOurs — Zillow's info-led flow-STRUKTUR med vores
 * slate-900 design. Isolerer "er deres flow bedre?" fra "er deres styling bedre?".
 *
 * Struktur (6 trin):
 *   1. Søg (hero med adresse)
 *   2. Property overview (estimat + range + history + comparables) — INFO-FIRST
 *   3. Quick condition
 *   4. Photos
 *   5. Kontakt
 *   6. Tilbud
 */
import { useState } from 'react';

const STEP_LABELS = ['Søg', 'Oversigt', 'Stand', 'Fotos', 'Kontakt', 'Tilbud'];

export function MockFunnelZillowOurs() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="bg-slate-50 min-h-[600px]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {step > 1 && step !== 2 && <Progress step={step} />}

        <div className={step > 1 && step !== 2 ? 'mt-5' : ''}>
          {step === 1 && <StepSearch onContinue={next} />}
          {step === 2 && <StepOverview step={step} onContinue={next} />}
          {step === 3 && <StepCondition />}
          {step === 4 && <StepPhotos />}
          {step === 5 && <StepContact />}
          {step === 6 && <StepOffer />}
        </div>

        {step !== 1 && step !== 2 && (
          <div className="max-w-2xl mx-auto mt-4">
            <Nav step={step} prev={prev} next={next} />
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 max-w-2xl mx-auto">
      <div className="flex items-center gap-1 mb-1.5">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num <= step;
          return (
            <div
              key={label}
              className={`flex-1 h-1.5 rounded-full ${done ? 'bg-slate-900' : 'bg-slate-200'}`}
            />
          );
        })}
      </div>
      <div className="text-xs text-slate-500">
        Trin {step}/6 · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex justify-between gap-3">
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
        disabled={step === 6}
        className="px-6 py-3 text-sm font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg"
      >
        {step === 5 ? 'Få mit tilbud' : step === 6 ? 'Færdig' : 'Næste'} →
      </button>
    </div>
  );
}

// === STEP 1: Search hero ===
function StepSearch({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-12 sm:py-16 text-center space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
          Find ud af hvad din bolig er værd
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Hvad koster din bolig?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
          Indtast adresse og få et øjeblikkeligt estimat — bygget på tinglyste handler.
        </p>
        <div className="flex max-w-xl mx-auto">
          <input
            type="text"
            defaultValue="Svendborgvej 59, 4700 Næstved"
            className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={onContinue}
            className="px-6 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-r-lg"
          >
            Søg
          </button>
        </div>
      </div>
    </div>
  );
}

// === STEP 2: Property overview (info-first) ===
function StepOverview({ step, onContinue }: { step: number; onContinue: () => void }) {
  return (
    <div className="space-y-5">
      {/* Mini progress bar above overview */}
      <Progress step={step} />

      {/* Hero with estimat */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
              365-estimat
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Svendborgvej 59, 4700 Næstved
            </h2>
            <p className="text-sm text-slate-500">
              67 m² · 2 værelser · 1976 · Ejerlejlighed
            </p>
          </div>
          <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
            Live data
          </span>
        </div>
        <div className="flex items-baseline gap-3 pt-2">
          <span className="text-5xl font-bold tracking-tight text-slate-900 tabular-nums">
            1.380.000
          </span>
          <span className="text-base font-semibold text-slate-700">kr</span>
        </div>
        <p className="text-xs mt-1 text-slate-500">
          Range: 1.310.000 – 1.450.000 kr · Bygget på 12 sammenlignelige handler
        </p>
      </div>

      {/* Sales history */}
      <Section title="Salgshistorik">
        <div className="space-y-2">
          {[
            { date: 'Mar 2026', price: '1.350.000 kr', diff: '+24%' },
            { date: 'Sep 2018', price: '1.090.000 kr', diff: '+38%' },
            { date: 'Apr 2008', price: '790.000 kr', diff: 'Solgt' },
          ].map((r) => (
            <div
              key={r.date}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
            >
              <span className="text-sm text-slate-700">{r.date}</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">{r.price}</span>
              <span className="text-xs text-slate-500">{r.diff}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparables — Zillow-style cards but with our slate styling */}
      <Section title="Sammenlignelige handler i området">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { addr: 'Svendborgvej 53', kvm: 78, price: '1.180.000 kr', date: 'Mar 2026', tag: 'Samme EF' },
            { addr: 'Svendborgvej 59, 2.tv', kvm: 65, price: '985.000 kr', date: 'Jan 2026', tag: 'Samme bygning' },
            { addr: 'Sandsvinget 12', kvm: 72, price: '1.050.000 kr', date: 'Dec 2025', tag: 'Samme postnr' },
          ].map((c) => (
            <div key={c.addr} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="h-24 bg-slate-100 relative">
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-900 text-white">
                  {c.tag}
                </span>
              </div>
              <div className="p-3">
                <div className="text-base font-bold tabular-nums text-slate-900">{c.price}</div>
                <div className="text-xs text-slate-700">
                  {c.addr} · {c.kvm}m²
                </div>
                <div className="text-[11px] mt-0.5 text-slate-500">Solgt {c.date}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA — info → action transition */}
      <div className="bg-slate-900 rounded-2xl p-5 text-center space-y-3 text-white">
        <h3 className="text-xl font-bold">Vil du have et kontant tilbud?</h3>
        <p className="text-sm text-slate-300 max-w-md mx-auto">
          Vi køber direkte. Du sparer salær, undgår mæglerventetid, vælger overtagelse selv.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="inline-block px-6 py-3 bg-white text-sm font-medium rounded-lg text-slate-900 hover:bg-slate-100"
        >
          Få et kontant tilbud →
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// === STEP 3: Quick condition ===
function StepCondition() {
  const [val, setVal] = useState('good');
  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Hvordan er boligens generelle stand?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Vælg det niveau der bedst beskriver boligen.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {[
          ['great', 'Som nyt'],
          ['good', 'Velholdt'],
          ['avg', 'Gennemsnit'],
          ['fair', 'Trænger'],
          ['poor', 'Slidt'],
        ].map(([k, l]) => {
          const active = val === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setVal(k)}
              className={`px-3 py-3 text-sm font-medium rounded-lg border transition-all ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100">
        <Toggle label="Renoveret køkken" />
        <Toggle label="Renoveret bad" />
        <Toggle label="Altan / terrasse" />
        <Toggle label="Elevator" />
      </div>
    </div>
  );
}

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`px-3 py-2.5 text-sm font-medium text-left rounded-lg border flex items-center justify-between ${
        on
          ? 'bg-slate-900 border-slate-900 text-white'
          : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
      }`}
    >
      <span>{label}</span>
      <span className={`w-4 h-4 rounded-full ${on ? 'bg-white' : 'bg-slate-200'}`} />
    </button>
  );
}

// === STEP 4: Photos ===
function StepPhotos() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Tilføj fotos (valgfri)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Med billeder kan vi give et endnu mere præcist tilbud.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['Stue', 'Køkken', 'Bad', 'Sov.', 'Altan', 'Plantegning', 'Gang', 'Andet'].map((r) => (
          <div
            key={r}
            className="aspect-square flex flex-col items-center justify-center text-xs text-slate-600 bg-slate-50 border border-dashed border-slate-300 rounded-lg"
          >
            <span className="text-2xl mb-1">+</span>
            <span>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// === STEP 5: Contact ===
function StepContact() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Hvor sender vi dit tilbud?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Du modtager tilbuddet på email + SMS. Vi ringer indenfor 24 timer.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fulde navn" value="Jens Hansen" />
        <Field label="Email" value="jens@example.dk" />
        <Field label="Telefon" value="20 12 34 56" />
        <Field label="Hvornår sælge?" value="1-3 mdr" />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    </label>
  );
}

// === STEP 6: Offer ===
function StepOffer() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Vores slate-900 dark hero */}
      <div className="bg-slate-900 rounded-2xl p-6 text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-medium">
          Dit kontant-tilbud
        </p>
        <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight tabular-nums">
          1.245.000 <span className="text-2xl text-slate-300">kr</span>
        </p>
        <p className="text-xs text-slate-400">
          Svendborgvej 59 · Range: 1.220.000 – 1.270.000 kr
        </p>
      </div>

      <Section title="Sammenlignet med 365-estimat">
        <div className="space-y-2">
          <Row label="365-estimat (markedspris)" value="1.380.000 kr" />
          <Row label="− Service-fee (5%)" value="−69.000 kr" muted />
          <Row label="− Reparations-estimat" value="−66.000 kr" muted />
          <div className="pt-2 border-t border-slate-100">
            <Row label="Dit tilbud" value="1.245.000 kr" bold />
          </div>
        </div>
      </Section>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <strong>Inspections-garanti:</strong> Hvis vores endelige tilbud efter besigtigelse
        afviger mere end 5%, kan du trække dig uden konsekvens.
      </div>
    </div>
  );
}

function Row({
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
      <span className={`${muted ? 'text-slate-500' : 'text-slate-900'} ${bold ? 'font-bold' : ''}`}>
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
