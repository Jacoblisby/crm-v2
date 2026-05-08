'use client';

/**
 * MockFunnelZillow — gengiver Zillows info-led approach:
 *
 *   1. Address search
 *   2. Property overview (Zestimate + history + comparables) — INFO-FIRST
 *   3. "Get cash offer" CTA → opens flow
 *   4. Quick condition + photos
 *   5. Contact info
 *   6. Offer
 *
 * Karakteristisk Zillow: viser info FØRST (ingen flow før user vælger),
 * Zestimate prominent, comparables-cards med foto-lookalikes, lower-friction
 * data-first tilgang.
 */
import { useState } from 'react';

const Z_BLUE = '#006aff';
const Z_DARK = '#0e1d35';
const Z_INK = '#0e0e10';
const Z_BG = '#f4f6f9';

const STEP_LABELS = ['Søg', 'Oversigt', 'Stand', 'Fotos', 'Kontakt', 'Tilbud'];

export function MockFunnelZillow() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={{ background: Z_BG, color: Z_INK }} className="min-h-[600px]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        {step > 1 && <Progress step={step} />}

        <div className={step > 1 ? 'mt-4' : ''}>
          {step === 1 && <StepSearch onContinue={next} />}
          {step === 2 && <StepOverview onContinue={next} />}
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
    <div
      className="px-4 py-3 max-w-3xl mx-auto bg-white"
      style={{ border: `1px solid #e2e8f0`, borderRadius: 8 }}
    >
      <div className="flex items-center gap-1 mb-1.5">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num <= step;
          return (
            <div
              key={label}
              className="flex-1 h-1 rounded-full"
              style={{ background: done ? Z_BLUE : '#e2e8f0' }}
            />
          );
        })}
      </div>
      <div className="text-xs font-medium" style={{ color: Z_DARK, opacity: 0.6 }}>
        {step}/6 · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex justify-between">
      <button
        type="button"
        onClick={prev}
        disabled={step === 1}
        className="px-4 py-2 text-sm font-semibold disabled:opacity-30"
        style={{ color: Z_BLUE }}
      >
        ← Tilbage
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === 6}
        className="px-6 py-3 text-sm font-bold text-white disabled:opacity-30 hover:opacity-90"
        style={{ background: Z_BLUE, borderRadius: 6 }}
      >
        {step === 5 ? 'Få mit tilbud' : step === 6 ? 'Færdig' : 'Næste'}
      </button>
    </div>
  );
}

// === STEP 1: Search ===
function StepSearch({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(14,29,53,0.78), rgba(14,29,53,0.55)), linear-gradient(135deg, #2d4f8e 0%, #6b8ec4 100%)',
        minHeight: 420,
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage:
          'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0, transparent 30%), radial-gradient(circle at 80% 20%, rgba(0,106,255,0.25) 0, transparent 35%)',
      }} />
      <div className="relative px-6 py-12 sm:py-16 text-center text-white space-y-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
          Find ud af hvad din bolig er værd
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Hvad koster din bolig?
        </h1>
        <p className="text-sm sm:text-base max-w-md mx-auto opacity-85">
          Indtast adresse og få et øjeblikkeligt estimat — bygget på tinglyste handler.
        </p>
        <div
          className="flex max-w-xl mx-auto rounded-lg overflow-hidden"
          style={{ background: 'white', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}
        >
          <input
            type="text"
            defaultValue="Svendborgvej 59, 4700 Næstved"
            className="flex-1 px-4 py-3 text-sm focus:outline-none"
            style={{ color: Z_INK }}
          />
          <button
            type="button"
            onClick={onContinue}
            className="px-6 text-sm font-bold text-white hover:opacity-90"
            style={{ background: Z_BLUE }}
          >
            Søg
          </button>
        </div>
      </div>
    </div>
  );
}

// === STEP 2: Property overview (info-first) ===
function StepOverview({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-5">
      {/* Hero with Zestimate */}
      <div className="bg-white rounded-lg p-6" style={{ border: `1px solid #e2e8f0` }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: Z_BLUE }}>
              365-estimat
            </p>
            <h2 className="text-2xl font-bold mt-1" style={{ color: Z_DARK }}>
              Svendborgvej 59, 4700 Næstved
            </h2>
            <p className="text-sm mt-0.5" style={{ color: Z_DARK, opacity: 0.7 }}>
              67 m² · 2 værelser · 1976 · Ejerlejlighed
            </p>
          </div>
          <span
            className="px-2 py-1 text-[10px] font-bold uppercase rounded"
            style={{ background: '#e6f1ff', color: Z_BLUE }}
          >
            Live data
          </span>
        </div>
        <div className="flex items-baseline gap-3 pt-2">
          <span
            className="text-5xl font-extrabold tracking-tight tabular-nums"
            style={{ color: Z_BLUE }}
          >
            1.380.000
          </span>
          <span className="text-base font-semibold" style={{ color: Z_DARK }}>
            kr
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: Z_DARK, opacity: 0.6 }}>
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
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <span className="text-sm" style={{ color: Z_DARK }}>{r.date}</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: Z_DARK }}>{r.price}</span>
              <span className="text-xs" style={{ color: '#16a34a' }}>{r.diff}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Comparables */}
      <Section title="Sammenlignelige handler i området">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { addr: 'Svendborgvej 53', kvm: 78, price: '1.180.000 kr', date: 'Mar 2026', tag: 'Samme EF' },
            { addr: 'Svendborgvej 59, 2.tv', kvm: 65, price: '985.000 kr', date: 'Jan 2026', tag: 'Samme bygning' },
            { addr: 'Sandsvinget 12', kvm: 72, price: '1.050.000 kr', date: 'Dec 2025', tag: 'Samme postnr' },
          ].map((c) => (
            <div key={c.addr} className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
              <div
                className="h-24 relative"
                style={{ background: 'linear-gradient(135deg, #cfd9e8 0%, #94a8c4 100%)' }}
              >
                <span
                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded"
                  style={{ background: Z_BLUE, color: 'white' }}
                >
                  {c.tag}
                </span>
              </div>
              <div className="p-3">
                <div className="text-base font-bold tabular-nums" style={{ color: Z_DARK }}>
                  {c.price}
                </div>
                <div className="text-xs" style={{ color: Z_DARK, opacity: 0.7 }}>
                  {c.addr} · {c.kvm}m²
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: Z_DARK, opacity: 0.5 }}>
                  Solgt {c.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA — Zillow's info → action transition */}
      <div
        className="p-5 text-center space-y-3"
        style={{ background: Z_BLUE, color: 'white', borderRadius: 8 }}
      >
        <h3 className="text-xl font-bold">Vil du have et kontant tilbud?</h3>
        <p className="text-sm opacity-90 max-w-md mx-auto">
          Vi køber direkte. Du sparer salær, undgår mæglerventetid, vælger overtagelse selv.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="inline-block px-6 py-3 bg-white text-sm font-bold rounded"
          style={{ color: Z_BLUE }}
        >
          Få et kontant tilbud →
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-5" style={{ border: '1px solid #e2e8f0' }}>
      <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: Z_DARK }}>
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
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 sm:p-8 space-y-5" style={{ border: '1px solid #e2e8f0' }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: Z_DARK }}>
          Hvordan er boligens generelle stand?
        </h2>
        <p className="text-sm mt-1" style={{ color: Z_DARK, opacity: 0.65 }}>
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
              className="px-3 py-3 text-sm font-semibold transition-all"
              style={{
                background: active ? Z_BLUE : 'white',
                color: active ? 'white' : Z_DARK,
                border: `1px solid ${active ? Z_BLUE : '#e2e8f0'}`,
                borderRadius: 8,
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
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
      className="px-3 py-2.5 text-sm font-medium text-left flex items-center justify-between"
      style={{
        background: on ? '#e6f1ff' : 'white',
        color: on ? Z_BLUE : Z_DARK,
        border: `1px solid ${on ? Z_BLUE : '#e2e8f0'}`,
        borderRadius: 8,
      }}
    >
      <span>{label}</span>
      <span
        className="w-4 h-4 rounded-full"
        style={{ background: on ? Z_BLUE : '#e2e8f0' }}
      />
    </button>
  );
}

// === STEP 4: Photos ===
function StepPhotos() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 sm:p-8 space-y-5" style={{ border: '1px solid #e2e8f0' }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: Z_DARK }}>
          Tilføj fotos (valgfri)
        </h2>
        <p className="text-sm mt-1" style={{ color: Z_DARK, opacity: 0.65 }}>
          Med billeder kan vi give et endnu mere præcist tilbud.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['Stue', 'Køkken', 'Bad', 'Sov.', 'Altan', 'Plantegning', 'Gang', 'Andet'].map((r) => (
          <div
            key={r}
            className="aspect-square flex flex-col items-center justify-center text-xs"
            style={{
              background: '#f8fafc',
              border: `1px dashed #cbd5e1`,
              borderRadius: 8,
              color: Z_DARK,
              opacity: 0.65,
            }}
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
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 sm:p-8 space-y-5" style={{ border: '1px solid #e2e8f0' }}>
      <div>
        <h2 className="text-2xl font-bold" style={{ color: Z_DARK }}>
          Hvor sender vi dit tilbud?
        </h2>
        <p className="text-sm mt-1" style={{ color: Z_DARK, opacity: 0.65 }}>
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
      <div className="text-xs font-medium mb-1" style={{ color: Z_DARK, opacity: 0.65 }}>
        {label}
      </div>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 text-sm bg-white"
        style={{ border: '1px solid #e2e8f0', borderRadius: 8, color: Z_DARK }}
      />
    </label>
  );
}

// === STEP 6: Offer ===
function StepOffer() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-lg p-6 text-center" style={{ border: '1px solid #e2e8f0' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: Z_BLUE }}>
          Dit kontant-tilbud
        </p>
        <p className="text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums" style={{ color: Z_DARK }}>
          1.245.000 kr
        </p>
        <p className="text-sm mt-2" style={{ color: Z_DARK, opacity: 0.6 }}>
          Svendborgvej 59 · Range: 1.220.000 – 1.270.000 kr
        </p>
      </div>

      <Section title="Sammenlignet med 365-estimat">
        <div className="space-y-2">
          <Row label="365-estimat (markedspris)" value="1.380.000 kr" />
          <Row label="− Service-fee (5%)" value="−69.000 kr" muted />
          <Row label="− Reparations-estimat" value="−66.000 kr" muted />
          <div className="pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Row label="Dit tilbud" value="1.245.000 kr" bold />
          </div>
        </div>
      </Section>

      <div
        className="p-4 text-sm"
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 8,
          color: '#9a3412',
        }}
      >
        <strong>Inspections-garanti:</strong> Hvis vores endelige tilbud efter besigtigelse
        afviger mere end 5%, kan du trække dig uden konsekvens.
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: Z_DARK, opacity: muted ? 0.6 : 1, fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          color: Z_DARK,
          opacity: muted ? 0.6 : 1,
          fontWeight: bold ? 700 : 600,
          fontSize: bold ? '1.1rem' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
