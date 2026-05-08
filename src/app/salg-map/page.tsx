/**
 * Design H — Map-led flow (Compass / Redfin-stil).
 *
 * Kortet er anker hele vejen. Property-pin viser subject's bolig, comparable-pins
 * viser tinglyste handler, EF-grænse vises som polygon-overlay. Sidebar/bottom-sheet
 * holder selve formularen. Stærk territorium-følelse — sælgeren kan se sig selv på kortet.
 *
 * Kortet her er en CSS-mock (gradient + pins). I produktion vil det være Mapbox
 * eller Leaflet med rigtige tiles.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export default function SalgMapPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <Header />
      <MapFlow />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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

function MapFlow() {
  const [step, setStep] = useState(1);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-[calc(100vh-60px)]">
      {/* MAP — left side on desktop, top on mobile */}
      <div className="relative h-[300px] lg:h-auto bg-slate-100 overflow-hidden">
        <MapMock />
      </div>

      {/* SIDEBAR — right side on desktop, bottom-sheet on mobile */}
      <aside className="bg-white border-t lg:border-t-0 lg:border-l border-slate-200 overflow-y-auto">
        <div className="max-w-md mx-auto p-5 sm:p-6 space-y-5">
          <Progress step={step} />
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
          <Nav step={step} onNext={() => setStep((s) => Math.min(4, s + 1))} onPrev={() => setStep((s) => Math.max(1, s - 1))} />
        </div>
      </aside>
    </div>
  );
}

function MapMock() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(135deg, #d4dbe8 0%, #c5cee0 20%, #b8c5db 40%, #cfd9e8 60%, #c4cee0 80%, #d8dfeb 100%)',
      }}
    >
      {/* Mock streets */}
      <svg
        viewBox="0 0 800 600"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.55 }}
      >
        <path d="M0,180 L800,200" stroke="#fff" strokeWidth="6" />
        <path d="M0,360 L800,380" stroke="#fff" strokeWidth="4" />
        <path d="M0,500 L800,510" stroke="#fff" strokeWidth="3" />
        <path d="M180,0 L200,600" stroke="#fff" strokeWidth="5" />
        <path d="M460,0 L480,600" stroke="#fff" strokeWidth="4" />
        <path d="M620,0 L640,600" stroke="#fff" strokeWidth="3" />

        {/* EF polygon overlay */}
        <polygon
          points="380,140 510,150 520,260 390,255"
          fill="#0f172a"
          fillOpacity="0.12"
          stroke="#0f172a"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <text x="400" y="200" fontSize="11" fill="#0f172a" fontWeight="600">
          Bogensevej-foreningen
        </text>
      </svg>

      {/* Pins */}
      <Pin x="55%" y="36%" label="Din bolig" primary />
      <Pin x="42%" y="32%" label="1.180k" />
      <Pin x="60%" y="42%" label="985k" />
      <Pin x="35%" y="55%" label="1.050k" />
      <Pin x="68%" y="62%" label="940k" />

      {/* Map controls (decorative) */}
      <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <button className="block w-9 h-9 text-base font-medium text-slate-700 hover:bg-slate-50">+</button>
        <div className="border-t border-slate-200" />
        <button className="block w-9 h-9 text-base font-medium text-slate-700 hover:bg-slate-50">−</button>
      </div>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="w-3 h-3 rounded-full bg-slate-900" />
          <span>Din bolig</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="w-3 h-3 rounded-full border-2 border-slate-700" />
          <span>Sammenlignelige handler</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <span className="w-3 h-3 border-2 border-slate-900 border-dashed" />
          <span>Din ejerforening</span>
        </div>
      </div>
    </div>
  );
}

function Pin({ x, y, label, primary }: { x: string; y: string; label: string; primary?: boolean }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-full" style={{ left: x, top: y }}>
      <div
        className={`px-2.5 py-1 text-[11px] font-semibold rounded shadow ${
          primary ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-900'
        }`}
      >
        {label}
      </div>
      <div
        className={`mx-auto w-2 h-2 ${
          primary ? 'bg-slate-900' : 'bg-white border border-slate-700'
        } rotate-45 -mt-0.5`}
      />
    </div>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ['Adresse', 'Boligen', 'Udgifter', 'Tilbud'];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        {labels.map((l, i) => (
          <div
            key={l}
            className={`flex-1 h-1 rounded-full ${i < step ? 'bg-slate-900' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="text-xs text-slate-500">
        Trin {step}/4 · {labels[step - 1]}
      </div>
    </div>
  );
}

function Nav({ step, onNext, onPrev }: { step: number; onNext: () => void; onPrev: () => void }) {
  return (
    <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
      <button
        onClick={onPrev}
        disabled={step === 1}
        className="px-4 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-30"
      >
        ← Tilbage
      </button>
      <button
        onClick={onNext}
        disabled={step === 4}
        className="px-6 py-3 text-sm font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg"
      >
        {step === 3 ? 'Vis tilbud' : step === 4 ? 'Færdig' : 'Næste'} →
      </button>
    </div>
  );
}

function Step1() {
  return (
    <>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Hvor ligger din bolig?</h2>
        <p className="text-sm text-slate-500">
          Vi finder den på kortet og henter automatisk data.
        </p>
      </div>
      <input
        type="text"
        defaultValue="Svendborgvej 59, 4700 Næstved"
        className="w-full px-3 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-700">
        <div className="font-medium text-slate-900">På kortet ser du:</div>
        <div>• Din bolig (markeret som primær pin)</div>
        <div>• Sammenlignelige handler i området</div>
        <div>• Grænse for din ejerforening</div>
      </div>
    </>
  );
}

function Step2() {
  return (
    <>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Hvordan er boligen?</h2>
        <p className="text-sm text-slate-500">Vælg overall stand.</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {[
          ['Nyrenoveret', 'Renoveret de seneste 2-3 år'],
          ['God stand', 'Velholdt med moderate opdateringer'],
          ['Middel', 'Funktionelt men ældre overflader'],
          ['Trænger', 'Bør renoveres'],
          ['Slidt', 'Total udskiftning nødvendig'],
        ].map(([t, d], i) => (
          <button
            key={t}
            className={`p-3 text-left rounded-lg border ${
              i === 2 ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 hover:border-slate-400'
            }`}
          >
            <div className="font-semibold text-sm">{t}</div>
            <div className={`text-xs ${i === 2 ? 'text-slate-300' : 'text-slate-500'}`}>{d}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function Step3() {
  return (
    <>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Faste udgifter</h2>
        <p className="text-sm text-slate-500">Mest vigtigt: fællesudgifter.</p>
      </div>
      <NumberField label="Fællesudgifter (kr/år) *" value={24000} />
      <NumberField label="Grundskyld (kr/år)" value={4500} />
      <NumberField label="Bygningsforsikring (kr/år)" value={0} />
    </>
  );
}

function Step4() {
  return (
    <>
      <div className="bg-slate-900 rounded-2xl p-5 text-center space-y-1.5 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-medium">
          Vores foreløbige tilbud
        </p>
        <p className="text-4xl font-bold tabular-nums">1.245.000 kr</p>
        <p className="text-xs text-slate-400">Range: 1.220.000 – 1.270.000 kr</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">
          Hvad andre i Bogensevej-foreningen fik
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-700">Svendborgvej 53, 78m²</span>
          <span className="font-semibold text-slate-900">1.180.000 kr</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-slate-700">Svendborgvej 59 2.tv, 65m²</span>
          <span className="font-semibold text-slate-900">985.000 kr</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-700">Sandsvinget 12, 72m²</span>
          <span className="font-semibold text-slate-900">1.050.000 kr</span>
        </div>
      </div>
      <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg">
        Send mig tilbuddet på email
      </button>
    </>
  );
}

function NumberField({ label, value }: { label: string; value: number }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type="number"
        defaultValue={value}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
      />
    </label>
  );
}
