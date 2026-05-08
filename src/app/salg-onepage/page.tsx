/**
 * Design G — Single-page scroll-flow (Stripe checkout-stil).
 *
 * Alt på én scrollbar side. Sticky live-summary på højre side på desktop.
 * Ingen "næste-knap"-stress — du kan rette tidligere svar uden at føle
 * du går "tilbage". Sektion-anchors viser hvor langt du er.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export default function SalgOnepagePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <Header />
      <Hero />
      <OnepageFlow />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-100 bg-white sticky top-0 z-20">
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

function Hero() {
  return (
    <div className="text-center space-y-4 mt-8 sm:mt-14 px-4 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
        365 Ejendomme · Vi opkøber kontant
      </p>
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
        Hvad er din bolig værd?
      </h1>
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
        Udfyld det hele på én side. Du kan altid scrolle op og rette. Estimat opdateres
        live på højre side.
      </p>
    </div>
  );
}

function OnepageFlow() {
  const [stand, setStand] = useState('middel');
  const [drift, setDrift] = useState(24000);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* MAIN COLUMN: All sections in one scroll */}
      <div className="space-y-12">
        <Section num={1} title="Adresse + kontakt" anchor="adresse">
          <input
            type="text"
            defaultValue="Svendborgvej 59, 4700 Næstved"
            placeholder="Vejnavn + nr, postnr"
            className="w-full px-4 py-3.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <FoundFacts />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Fulde navn" value="Jens Hansen" />
            <Input label="Email" value="jens@example.dk" />
            <Input label="Telefon" value="20 12 34 56" />
          </div>
        </Section>

        <Section num={2} title="Boligen — overall stand" anchor="boligen">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              ['nyrenoveret', 'Nyrenoveret'],
              ['god', 'God stand'],
              ['middel', 'Middel'],
              ['trænger', 'Trænger'],
              ['slidt', 'Slidt'],
            ].map(([k, l]) => {
              const active = stand === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStand(k)}
                  className={`px-3 py-3 text-sm font-medium rounded-lg border ${
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
          <p className="text-xs text-slate-500">
            Bemærk: I rigtigt flow vil hvert rum have sin egen vurdering. Her vist forkortet.
          </p>
        </Section>

        <Section num={3} title="Faste udgifter" anchor="udgifter">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput label="Fællesudgifter * (kr/år)" value={drift} onChange={setDrift} />
            <NumberInput label="Grundskyld (kr/år)" value={4500} />
            <NumberInput label="Bygningsforsikring (kr/år)" value={0} />
            <NumberInput label="Andet drift (kr/år)" value={0} />
          </div>
        </Section>

        <Section num={4} title="Lidt om dig" anchor="om-dig">
          <ChipSection
            label="Hvornår vil du sælge?"
            options={[
              ['under1', 'Under 1 mdr'],
              ['1to3', '1–3 mdr'],
              ['3to6', '3–6 mdr'],
              ['6plus', '6+ mdr'],
              ['unsure', 'Ved ikke'],
            ]}
            defaultValue="1to3"
          />
          <ChipSection
            label="Hvad er hovedgrunden?"
            options={[
              ['flytter', 'Flytter'],
              ['arv', 'Arv'],
              ['skilsmisse', 'Skilsmisse'],
              ['okonomi', 'Økonomi'],
              ['investering', 'Investering'],
            ]}
            defaultValue="flytter"
          />
          <ChipSection
            label="Hvad skal du efter salget?"
            options={[
              ['flytter_ud', 'Flytter ud'],
              ['lejer_andet', 'Vil leje andet'],
              ['blive_boende_lejer', 'Blive boende som lejer'],
              ['ved_ikke', 'Ved ikke endnu'],
            ]}
            defaultValue="flytter_ud"
          />
        </Section>

        <Section num={5} title="Dit estimat" anchor="estimat">
          <div className="bg-slate-900 rounded-2xl p-6 text-center space-y-2 text-white">
            <p className="text-sm text-slate-400">Vores foreløbige tilbud</p>
            <p className="text-5xl sm:text-6xl font-bold tracking-tight tabular-nums">
              1.245.000 <span className="text-2xl text-slate-300">kr</span>
            </p>
            <p className="text-xs text-slate-400">Bindende efter gratis besigtigelse</p>
          </div>
          <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold rounded-lg">
            Send mig tilbuddet på email →
          </button>
        </Section>
      </div>

      {/* STICKY SUMMARY on desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
              Live-estimat
            </p>
            <div>
              <p className="text-3xl font-bold tabular-nums text-slate-900">1.245.000 kr</p>
              <p className="text-xs text-slate-500 mt-1">Range: 1.220.000 – 1.270.000 kr</p>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-sm">
              <SummaryRow label="Adresse" value="Svendborgvej 59" />
              <SummaryRow label="Boligareal" value="67 m²" />
              <SummaryRow label="Stand" value={stand} />
              <SummaryRow label="Drift" value={`${drift.toLocaleString('da-DK')} kr/år`} />
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
            <strong className="text-slate-900">Tip:</strong> Jo mere præcist du udfylder, jo
            tættere kommer estimatet på det endelige tilbud.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({
  num,
  title,
  anchor,
  children,
}: {
  num: number;
  title: string;
  anchor: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} className="space-y-4 scroll-mt-20">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-bold text-slate-400 tabular-nums">{String(num).padStart(2, '0')}</span>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FoundFacts() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
      <div className="text-xs font-medium text-emerald-700">✓ Vi har fundet din lejlighed</div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-xs text-slate-500">m²</div>
          <div className="text-sm font-semibold text-slate-900">67</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Værelser</div>
          <div className="text-sm font-semibold text-slate-900">2</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Byggeår</div>
          <div className="text-sm font-semibold text-slate-900">1976</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">BFE</div>
          <div className="text-sm font-semibold text-slate-900">281288</div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value }: { label: string; value: string }) {
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

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-600 mb-1">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value) || 0)}
        readOnly={!onChange}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 tabular-nums"
      />
    </label>
  );
}

function ChipSection({
  label,
  options,
  defaultValue,
}: {
  label: string;
  options: [string, string][];
  defaultValue: string;
}) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([k, l]) => {
          const active = val === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setVal(k)}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg border ${
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
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-900 tabular-nums truncate">{value}</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-4 mt-8 pt-8 pb-12 flex flex-wrap justify-between gap-4 text-xs text-slate-500 border-t border-slate-200">
      <span>© 365 Ejendomme · CVR 42 80 04 22</span>
      <span>Sikret af tinglysning</span>
    </footer>
  );
}
