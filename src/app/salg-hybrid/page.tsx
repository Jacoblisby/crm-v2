/**
 * Design I — Hybrid: vores 5-trins flow + Opendoor's transparent breakdown.
 *
 * Vi behnolder vores eksisterende flow-struktur (Adresse + kontakt → Boligen →
 * Udgifter → Lidt om dig → Estimat) men erstatter estimat-siden med Opendoor's
 * signature transparent fee-breakdown:
 *
 *   Markedspris     1.380.000 kr
 *   − Vores gebyr   −69.000 kr (5%)
 *   − Reparation    −66.000 kr
 *   = Dit tilbud    1.245.000 kr
 *
 * Plus vores eksisterende "Hvad du sparer ved mægler"-sektion. Sælger ser baade
 * HVORDAN vi kommer frem til prisen, OG hvorfor det stadig er en god deal.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export default function SalgHybridPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <Header />
      <Hero />
      <HybridFunnel />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/design-preview" className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
          ← Oversigt
        </Link>
        <span className="font-bold text-base text-slate-900">
          365 <span className="text-slate-400">Ejendomme</span>
        </span>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="text-center space-y-4 mt-6 sm:mt-10 px-4 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
        365 Ejendomme · Vi opkøber kontant
      </p>
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
        Hvad er din bolig værd?
      </h1>
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
        5 trin på 5 minutter. Vi viser åbent hvordan vi kommer frem til vores tilbud.
      </p>
    </div>
  );
}

const STEP_LABELS = ['Adresse', 'Boligen', 'Udgifter', 'Om dig', 'Tilbud'];

function HybridFunnel() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      <Progress step={step} />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8 space-y-6">
        {step === 1 && <StepAddress />}
        {step === 2 && <StepBolig />}
        {step === 3 && <StepUdgifter />}
        {step === 4 && <StepOmDig />}
        {step === 5 && <StepTilbud />}

        <Nav step={step} onPrev={prev} onNext={next} />
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((l, i) => (
          <div
            key={l}
            className={`flex-1 h-1.5 rounded-full ${i < step ? 'bg-slate-900' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="text-xs text-slate-500">
        Trin {step}/5 · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, onPrev, onNext }: { step: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
      <button
        onClick={onPrev}
        disabled={step === 1}
        className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
      >
        ← Tilbage
      </button>
      <button
        onClick={onNext}
        disabled={step === 5}
        className="px-6 py-3 text-sm font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg"
      >
        {step === 4 ? 'Vis mit tilbud' : step === 5 ? 'Færdig' : 'Næste'} →
      </button>
    </div>
  );
}

function StepAddress() {
  return (
    <>
      <Heading title="Hvor ligger din lejlighed?" sub="Skriv adressen — vi henter automatisk data." />
      <input
        type="text"
        defaultValue="Svendborgvej 59, 4700 Næstved"
        className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
        <div className="text-xs font-medium text-emerald-700">✓ Vi har fundet din lejlighed</div>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <Stat label="m²" value="67" />
          <Stat label="Værelser" value="2" />
          <Stat label="Byggeår" value="1976" />
          <Stat label="BFE" value="281288" />
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4 space-y-3">
        <p className="text-sm font-medium text-slate-900">Hvor sender vi dit estimat?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Field label="Navn" value="Jens Hansen" />
          <Field label="Email" value="jens@example.dk" />
          <Field label="Telefon" value="20 12 34 56" />
        </div>
      </div>
    </>
  );
}

function StepBolig() {
  return (
    <>
      <Heading title="Boligens stand" sub="Vælg det niveau der bedst beskriver boligen." />
      <p className="text-xs italic text-slate-500">
        I rigtigt flow: per-rum vurdering for køkken, bad, stue, sov.
      </p>
      <div className="space-y-2">
        {[
          ['Nyrenoveret', 'Alt opdateret de seneste 2-3 år'],
          ['God stand', 'Velholdt med moderate opdateringer'],
          ['Middel', 'Funktionelt men ældre overflader'],
          ['Trænger til kærlighed', 'Bør renoveres'],
          ['Slidt', 'Total istandsættelse nødvendig'],
        ].map(([t, d], i) => (
          <button
            key={t}
            className={`w-full p-4 text-left rounded-lg border transition-all ${
              i === 2
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <div className="font-semibold">{t}</div>
            <div className={`text-sm mt-0.5 ${i === 2 ? 'text-slate-300' : 'text-slate-600'}`}>{d}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function StepUdgifter() {
  return (
    <>
      <Heading title="Faste udgifter" sub="Alle beløb er årlige (kr/år)." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fællesudgifter * (kr/år)" value="24.000" />
        <Field label="Grundskyld (kr/år)" value="4.500" />
        <Field label="Bygningsforsikring (kr/år)" value="0" />
        <Field label="Andet drift (kr/år)" value="0" />
      </div>
      <div className="bg-slate-900 rounded-lg p-4 text-white">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-300">Drift total</span>
          <span className="text-2xl font-bold tabular-nums">28.500 kr/år</span>
        </div>
      </div>
    </>
  );
}

function StepOmDig() {
  return (
    <>
      <Heading title="Lidt om dig" sub="Alt er valgfrit." />
      <ChipRow
        label="Hvornår vil du sælge?"
        options={['Under 1 mdr', '1–3 mdr', '3–6 mdr', '6+ mdr', 'Ved ikke']}
        selected={1}
      />
      <ChipRow
        label="Hvad er hovedgrunden?"
        options={['Flytter', 'Arv', 'Skilsmisse', 'Økonomi', 'Investering']}
        selected={0}
      />
      <ChipRow
        label="Hvad skal du efter salget?"
        options={['Flytter ud helt', 'Vil leje andet', 'Blive boende som lejer', 'Ved ikke']}
        selected={0}
      />
    </>
  );
}

function StepTilbud() {
  return (
    <>
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-medium">
          Dit foreløbige tilbud
        </p>
        <h2 className="text-base font-semibold text-slate-900">
          Svendborgvej 59, 4700 Næstved
        </h2>
      </div>

      {/* HOVEDTAL */}
      <div className="bg-slate-900 rounded-lg p-6 text-center space-y-2 text-white">
        <p className="text-sm text-slate-400">Vores foreløbige tilbud</p>
        <p className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums">
          1.245.000 <span className="text-2xl text-slate-300">kr</span>
        </p>
        <p className="text-xs text-slate-400">Bindende efter gratis besigtigelse</p>
      </div>

      {/* OPENDOOR-STYLE TRANSPARENT BREAKDOWN */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Sådan beregner vi dit tilbud</h3>
          <p className="text-xs text-slate-500 mt-0.5">Vi viser åbent hver post — ingen skjulte gebyrer.</p>
        </div>
        <BreakRow label="Markedspris (vores estimat)" value="1.380.000 kr" />
        <BreakRow label="− Vores gebyr (5%)" value="−69.000 kr" muted note="Dækker vores risiko + admin" />
        <BreakRow label="− Reparations-estimat" value="−66.000 kr" muted note="Baseret på bolig-stand 'middel'" />
        <div className="pt-3 border-t border-slate-200">
          <BreakRow label="Dit tilbud" value="1.245.000 kr" bold />
        </div>
      </div>

      {/* OUR EXISTING SAVINGS BREAKDOWN — preserved */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Hvad du sparer vs at gå via mægler
        </h3>
        <SaveItem label="Mæglersalær" value="70.000 kr" sub="Vi tager intet salær." />
        <SaveItem label="Markedsafslag" value="74.700 kr" sub="Slutprisen via mægler er typisk 6% under listepris." />
        <SaveItem label="Drift i salgsperioden" value="7.125 kr" sub="3 mdr drift du slipper for." />

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-900">Vores tilbud svarer til at sælge for</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">1.396.825 kr</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            …hvis du var gået via mægler. Vores 1.245.000 kr kontant + de tre poster du sparer.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <strong>Inspections-garanti:</strong> Hvis vores endelige tilbud efter besigtigelse afviger
        mere end 5%, kan du trække dig uden konsekvens.
      </div>
    </>
  );
}

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{sub}</p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ChipRow({ label, options, selected }: { label: string; options: string[]; selected: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <button
            key={o}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg border ${
              i === selected
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function BreakRow({
  label,
  value,
  bold,
  muted,
  note,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  note?: string;
}) {
  return (
    <div>
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
      {note && <div className="text-xs text-slate-500 mt-0.5">{note}</div>}
    </div>
  );
}

function SaveItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-900 font-bold">✓</span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-sm text-slate-900">{label}</span>
          <span className="font-semibold text-sm text-slate-900 tabular-nums">{value}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="max-w-3xl mx-auto px-4 mt-8 pt-8 pb-12 flex flex-wrap justify-between gap-4 text-xs text-slate-500 border-t border-slate-200">
      <span>© 365 Ejendomme · CVR 42 80 04 22</span>
      <span>Sikret af tinglysning</span>
    </footer>
  );
}
