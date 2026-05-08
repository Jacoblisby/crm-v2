'use client';

/**
 * MockFunnelZillow — closer-to-real-Zillow clone.
 *
 * Zillow's faktiske flow:
 *   1. Search address (hero med blue gradient)
 *   2. PROPERTY PAGE — den ikoniske Zillow side: Zestimate range bar,
 *      photos placeholder, sale history, taxes, schools, neighborhood,
 *      comparable homes, walk score. Sælger ser MEGET data foer noget
 *      som helst form-filling.
 *   3. CTA "See cash offer" → starter cash-offer flow
 *   4. Quick condition + features
 *   5. Photos
 *   6. Contact
 *   7. Offer reveal
 *
 * Brand-DNA:
 *   - Zillow blue (#006aff) primary
 *   - Dark text (#2a2a33)
 *   - Property cards med foto-placeholder + badges
 *   - Zestimate range bar (Zillow's signatur visualisering)
 *   - Tabs med blue underline
 *   - Sturdy sans (Open Sans-style)
 */
import { useState } from 'react';

const Z_BLUE = '#006aff';
const Z_BLUE_DEEP = '#0050c8';
const Z_INK = '#2a2a33';
const Z_INK_LIGHT = '#5d6071';
const Z_BG = '#ffffff';
const Z_BG_TINT = '#f5f6f7';
const Z_BORDER = '#e5e6eb';
const Z_GREEN = '#179a4a';
const Z_RED = '#df0021';

export function MockFunnelZillow() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(7, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div style={{ background: Z_BG_TINT, color: Z_INK, fontFamily: 'system-ui, -apple-system, "Open Sans", "Segoe UI", sans-serif' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {step === 1 && <StepSearch onContinue={next} />}
        {step === 2 && <StepPropertyPage onContinue={next} />}
        {step >= 3 && (
          <div
            className="bg-white max-w-2xl mx-auto p-5 sm:p-8 space-y-5"
            style={{
              border: `1px solid ${Z_BORDER}`,
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <SubProgress step={step - 2} />
            {step === 3 && <StepCondition />}
            {step === 4 && <StepFeatures />}
            {step === 5 && <StepPhotos />}
            {step === 6 && <StepContact />}
            {step === 7 && <StepOffer />}

            <Nav step={step} prev={prev} next={next} />
          </div>
        )}
      </div>
    </div>
  );
}

function SubProgress({ step }: { step: number }) {
  // step is 1-5 within the cash-offer flow (after property page)
  return (
    <div
      className="flex items-center gap-1.5 text-xs font-semibold"
      style={{ color: Z_INK_LIGHT }}
    >
      <span>Step {step} of 5</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span style={{ color: Z_BLUE }}>Cash offer</span>
    </div>
  );
}

function Nav({ step, prev, next }: { step: number; prev: () => void; next: () => void }) {
  return (
    <div className="flex justify-between pt-5 border-t" style={{ borderColor: Z_BORDER }}>
      <button
        type="button"
        onClick={prev}
        className="px-5 py-2.5 text-sm font-bold"
        style={{ color: Z_BLUE }}
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === 7}
        className="px-7 py-3 text-sm font-bold text-white disabled:opacity-30 hover:opacity-90"
        style={{ background: Z_BLUE, borderRadius: 6 }}
      >
        {step === 6 ? 'Get my offer' : step === 7 ? 'Done' : 'Next'}
      </button>
    </div>
  );
}

// ============================
// STEP 1: SEARCH
// ============================
function StepSearch({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(14,29,53,0.65), rgba(0,80,200,0.45)), linear-gradient(135deg, #2d4f8e 0%, #6b8ec4 100%)',
        borderRadius: 12,
        minHeight: 460,
      }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 70%, rgba(255,255,255,0.2) 0, transparent 35%), radial-gradient(circle at 75% 30%, rgba(0,106,255,0.4) 0, transparent 40%)',
        }}
      />
      <div className="relative px-6 py-16 sm:py-24 text-center text-white space-y-6">
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          Hvad koster din bolig?
        </h1>
        <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ opacity: 0.92 }}>
          Indtast adresse og se boligens estimat baseret på tinglyste handler i området.
        </p>

        <div
          className="flex max-w-2xl mx-auto rounded-md overflow-hidden"
          style={{
            background: 'white',
            boxShadow: '0 16px 60px rgba(0,0,0,0.22)',
          }}
        >
          <div className="flex items-center px-5 flex-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={Z_BLUE}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-3 shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              defaultValue="Svendborgvej 59, 4700 Næstved"
              className="flex-1 py-4 text-base bg-transparent focus:outline-none"
              style={{ color: Z_INK }}
            />
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="px-8 text-base font-bold text-white"
            style={{ background: Z_BLUE }}
          >
            Søg
          </button>
        </div>

        <div className="flex justify-center gap-6 text-sm pt-2 opacity-90">
          <span>★★★★★ <strong>4.8</strong></span>
          <span>·</span>
          <span><strong>87+</strong> tinglyste handler</span>
          <span>·</span>
          <span>Gratis estimat</span>
        </div>
      </div>
    </div>
  );
}

// ============================
// STEP 2: PROPERTY PAGE (the iconic Zillow page)
// ============================
function StepPropertyPage({ onContinue }: { onContinue: () => void }) {
  const [tab, setTab] = useState<'overview' | 'sale' | 'schools' | 'neighborhood'>('overview');
  return (
    <div className="space-y-5">
      {/* Photo gallery placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2 rounded-lg overflow-hidden" style={{ background: 'white' }}>
        <div
          className="h-64 sm:h-96 relative"
          style={{
            background: 'linear-gradient(135deg, #cfd9e8 0%, #94a8c4 100%)',
          }}
        >
          <span
            className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold rounded"
            style={{ background: Z_GREEN, color: 'white' }}
          >
            FOR SALG (estimat)
          </span>
          <span
            className="absolute bottom-4 right-4 px-3 py-1.5 text-xs font-semibold rounded backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}
          >
            📷 1 / 12 fotos
          </span>
        </div>
        <div className="hidden sm:grid grid-rows-2 gap-2">
          <div style={{ background: 'linear-gradient(135deg, #d4dbe8 0%, #a3b3cc 100%)' }} />
          <div style={{ background: 'linear-gradient(135deg, #c3cee0 0%, #8a9bb8 100%)' }} />
        </div>
      </div>

      {/* Header with address + key stats */}
      <div className="bg-white p-6 rounded-lg" style={{ border: `1px solid ${Z_BORDER}` }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: '1.875rem', color: Z_INK, letterSpacing: '-0.01em' }}
            >
              Svendborgvej 59
            </h1>
            <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
              4700 Næstved · Ejerlejlighed · Off-market
            </p>
          </div>
          <button
            className="px-4 py-2 text-sm font-bold rounded flex items-center gap-2"
            style={{ background: 'white', border: `1.5px solid ${Z_BLUE}`, color: Z_BLUE }}
          >
            <span>♡</span> Gem
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 py-4" style={{ borderTop: `1px solid ${Z_BORDER}`, borderBottom: `1px solid ${Z_BORDER}` }}>
          <Stat label="Boligareal" value="67" suffix="m²" />
          <Stat label="Værelser" value="2" />
          <Stat label="Bad" value="1" />
          <Stat label="Byggeår" value="1976" />
          <Stat label="Etager" value="1/4" />
        </div>

        {/* ZESTIMATE RANGE BAR — Zillow's iconic visualization */}
        <div className="pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold" style={{ fontSize: '1.125rem', color: Z_INK }}>
              365-estimat<sup style={{ fontSize: '0.65rem', color: Z_BLUE }}>®</sup>
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold"
              style={{ background: '#e6f1ff', color: Z_BLUE }}
            >
              LIVE
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span
              className="font-bold tracking-tight tabular-nums"
              style={{ fontSize: '2.75rem', color: Z_INK, letterSpacing: '-0.02em' }}
            >
              1.380.000 kr
            </span>
            <span className="text-sm font-semibold" style={{ color: Z_GREEN }}>
              ↑ +24% siden 2018
            </span>
          </div>
          <ZestimateRangeBar low={1310000} mid={1380000} high={1450000} />
          <p className="text-xs" style={{ color: Z_INK_LIGHT }}>
            Vores estimat-interval bygger på 12 sammenlignelige tinglyste handler de sidste
            6 måneder.
          </p>
        </div>

        {/* CTA — see cash offer */}
        <div
          className="mt-5 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: '#f0f7ff', border: `1px solid ${Z_BLUE}33` }}
        >
          <div>
            <div className="font-bold text-sm" style={{ color: Z_INK }}>
              Vil du have et kontant tilbud?
            </div>
            <div className="text-xs mt-0.5" style={{ color: Z_INK_LIGHT }}>
              Se hvad vi vil betale dig kontant — modtages indenfor 24 timer.
            </div>
          </div>
          <button
            onClick={onContinue}
            className="px-5 py-2.5 text-sm font-bold text-white rounded shrink-0"
            style={{ background: Z_BLUE }}
          >
            Få et kontant tilbud →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg" style={{ border: `1px solid ${Z_BORDER}` }}>
        <div className="flex overflow-x-auto" style={{ borderBottom: `1px solid ${Z_BORDER}` }}>
          {(
            [
              ['overview', 'Overblik'],
              ['sale', 'Salg & skat'],
              ['schools', 'Skoler'],
              ['neighborhood', 'Området'],
            ] as const
          ).map(([k, l]) => {
            const active = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className="px-5 py-4 text-sm font-bold whitespace-nowrap transition-colors"
                style={{
                  color: active ? Z_BLUE : Z_INK_LIGHT,
                  borderBottom: `3px solid ${active ? Z_BLUE : 'transparent'}`,
                  marginBottom: '-1px',
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {tab === 'overview' && <TabOverview />}
          {tab === 'sale' && <TabSaleHistory />}
          {tab === 'schools' && <TabSchools />}
          {tab === 'neighborhood' && <TabNeighborhood />}
        </div>
      </div>

      {/* Comparable homes */}
      <div className="bg-white rounded-lg p-6" style={{ border: `1px solid ${Z_BORDER}` }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg" style={{ color: Z_INK }}>
              Sammenlignelige boliger der er solgt
            </h3>
            <p className="text-xs mt-0.5" style={{ color: Z_INK_LIGHT }}>
              Tinglyste handler indenfor de sidste 12 måneder
            </p>
          </div>
          <a className="text-sm font-bold" style={{ color: Z_BLUE }}>
            Se alle 12 →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { addr: 'Svendborgvej 53', kvm: 78, price: '1.180.000 kr', psqm: '15.128', date: 'Mar 2026', tag: 'Samme EF', img: '#cfd9e8' },
            { addr: 'Svendborgvej 59, 2.tv', kvm: 65, price: '985.000 kr', psqm: '15.154', date: 'Jan 2026', tag: 'Samme bygning', img: '#c5d0e2' },
            { addr: 'Sandsvinget 12', kvm: 72, price: '1.050.000 kr', psqm: '14.583', date: 'Dec 2025', tag: 'Samme postnr', img: '#bcc7d8' },
          ].map((c) => (
            <div
              key={c.addr}
              className="rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              style={{ border: `1px solid ${Z_BORDER}` }}
            >
              <div className="h-32 relative" style={{ background: `linear-gradient(135deg, ${c.img}, #94a8c4)` }}>
                <span
                  className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded"
                  style={{ background: Z_BLUE, color: 'white' }}
                >
                  {c.tag}
                </span>
                <span
                  className="absolute bottom-2 right-2 px-2 py-1 text-[10px] font-bold rounded"
                  style={{ background: Z_GREEN, color: 'white' }}
                >
                  SOLGT
                </span>
              </div>
              <div className="p-3">
                <div className="font-bold text-lg tabular-nums" style={{ color: Z_INK }}>
                  {c.price}
                </div>
                <div className="text-xs mt-0.5" style={{ color: Z_INK_LIGHT }}>
                  {c.kvm}m² · {c.psqm} kr/m²
                </div>
                <div className="text-xs mt-0.5" style={{ color: Z_INK_LIGHT, opacity: 0.7 }}>
                  Solgt {c.date}
                </div>
                <div className="text-xs font-semibold mt-2" style={{ color: Z_INK }}>
                  {c.addr}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ZestimateRangeBar({ low, mid, high }: { low: number; mid: number; high: number }) {
  const totalRange = high - low;
  const midPct = ((mid - low) / totalRange) * 100;
  return (
    <div className="space-y-1.5">
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#e6f1ff' }}>
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            background: `linear-gradient(90deg, #b3d4ff, ${Z_BLUE} 50%, #b3d4ff)`,
            width: '100%',
          }}
        />
        {/* Mid marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
          style={{
            left: `${midPct}%`,
            background: 'white',
            border: `3px solid ${Z_BLUE}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold" style={{ color: Z_INK_LIGHT }}>
        <span>{low.toLocaleString('da-DK')} kr</span>
        <span>{high.toLocaleString('da-DK')} kr</span>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: Z_INK_LIGHT }}>
        {label}
      </div>
      <div className="font-bold mt-0.5" style={{ fontSize: '1.25rem', color: Z_INK }}>
        {value}
        {suffix && <span className="text-sm ml-0.5" style={{ color: Z_INK_LIGHT }}>{suffix}</span>}
      </div>
    </div>
  );
}

function TabOverview() {
  return (
    <div className="space-y-4 text-sm" style={{ color: Z_INK }}>
      <p>
        2-værelses ejerlejlighed på 67 m² i Næstved fra 1976. Beliggende i en velholdt
        ejerforening på Svendborgvej tæt på centrum, skole og indkøb.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
        <FactRow label="Energimærke" value="C" />
        <FactRow label="Tagtype" value="Tegl" />
        <FactRow label="Køkken renoveret" value="2015" />
        <FactRow label="Bad renoveret" value="2020" />
        <FactRow label="Fjernvarme" value="Ja" />
        <FactRow label="Elevator" value="Nej" />
        <FactRow label="Altan" value="Ja, sydvendt" />
        <FactRow label="Parkering" value="Gade-parkering" />
        <FactRow label="Bygningsforsikring" value="Inkl." />
      </div>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1" style={{ borderBottom: `1px solid ${Z_BORDER}` }}>
      <span style={{ color: Z_INK_LIGHT }}>{label}</span>
      <span style={{ color: Z_INK, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function TabSaleHistory() {
  const sales = [
    { date: '15. mar 2026', event: 'Solgt offentligt', price: '1.350.000 kr', diff: '+24%', tax: '1.480.000 kr' },
    { date: '02. sep 2018', event: 'Solgt offentligt', price: '1.090.000 kr', diff: '+38%', tax: '1.180.000 kr' },
    { date: '11. apr 2008', event: 'Solgt offentligt', price: '790.000 kr', diff: 'First sale', tax: '880.000 kr' },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-sm mb-3" style={{ color: Z_INK }}>Tinglyste handler</h4>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${Z_BORDER}`, color: Z_INK_LIGHT }}>
              <th className="text-left py-2 font-semibold">Dato</th>
              <th className="text-left py-2 font-semibold">Begivenhed</th>
              <th className="text-right py-2 font-semibold">Pris</th>
              <th className="text-right py-2 font-semibold">Vurdering</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.date} style={{ borderBottom: `1px solid ${Z_BORDER}` }}>
                <td className="py-2" style={{ color: Z_INK }}>{s.date}</td>
                <td className="py-2" style={{ color: Z_INK }}>{s.event}</td>
                <td className="py-2 text-right tabular-nums font-semibold" style={{ color: Z_INK }}>{s.price}</td>
                <td className="py-2 text-right tabular-nums" style={{ color: Z_INK_LIGHT }}>{s.tax}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h4 className="font-bold text-sm mb-3" style={{ color: Z_INK }}>Skat & ejerudgifter</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <FactRow label="Grundskyld 2026" value="4.500 kr/år" />
          <FactRow label="Fællesudgifter" value="24.000 kr/år" />
          <FactRow label="Renovation" value="1.800 kr/år" />
          <FactRow label="Forsikring" value="Inkl." />
        </div>
      </div>
    </div>
  );
}

function TabSchools() {
  const schools = [
    { name: 'Næstved Lille Næstved Skole', grade: 'A-G', dist: '0.4 km', rating: 8 },
    { name: 'Sct Jørgens Skole', grade: 'A-G', dist: '1.1 km', rating: 7 },
    { name: 'Næstved Gymnasium og HF', grade: 'Gym', dist: '0.9 km', rating: 9 },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
        Vurderinger fra Børne- og Undervisningsministeriets data, 2025.
      </p>
      {schools.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-4 p-3 rounded-lg"
          style={{ background: Z_BG_TINT }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0"
            style={{ background: s.rating >= 8 ? Z_GREEN : s.rating >= 6 ? '#f59e0b' : Z_RED }}
          >
            {s.rating}/10
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ color: Z_INK }}>{s.name}</div>
            <div className="text-xs" style={{ color: Z_INK_LIGHT }}>{s.grade} · {s.dist} fra adressen</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabNeighborhood() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ScoreCard label="Walk Score" value="74" desc="Meget gå-venligt" color={Z_GREEN} />
      <ScoreCard label="Transit Score" value="58" desc="God offentlig transport" color="#f59e0b" />
      <ScoreCard label="Bike Score" value="68" desc="Cyklbart" color={Z_GREEN} />
      <ScoreCard label="Crime" value="Lav" desc="Trygt område" color={Z_GREEN} />
    </div>
  );
}

function ScoreCard({ label, value, desc, color }: { label: string; value: string; desc: string; color: string }) {
  return (
    <div className="p-4 rounded-lg" style={{ border: `1px solid ${Z_BORDER}`, background: Z_BG }}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: Z_INK_LIGHT }}>
          {label}
        </span>
        <span className="font-bold text-2xl" style={{ color }}>{value}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: Z_INK_LIGHT }}>{desc}</div>
    </div>
  );
}

// ============================
// STEPS 3-7: CASH OFFER FLOW (after property page)
// ============================
function StepCondition() {
  const [val, setVal] = useState('good');
  return (
    <>
      <div>
        <h2 className="font-bold mb-1" style={{ fontSize: '1.5rem', color: Z_INK, letterSpacing: '-0.01em' }}>
          Hvordan er boligens stand?
        </h2>
        <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
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
              className="px-3 py-3 text-sm font-bold transition-all"
              style={{
                background: active ? Z_BLUE : 'white',
                color: active ? 'white' : Z_INK,
                border: `2px solid ${active ? Z_BLUE : Z_BORDER}`,
                borderRadius: 6,
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </>
  );
}

function StepFeatures() {
  return (
    <>
      <div>
        <h2 className="font-bold mb-1" style={{ fontSize: '1.5rem', color: Z_INK, letterSpacing: '-0.01em' }}>
          Hvilke features har boligen?
        </h2>
        <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
          Klik på alt der gælder.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          'Renoveret køkken',
          'Renoveret bad',
          'Altan / terrasse',
          'Elevator i bygning',
          'Fjernvarme',
          'Parkering',
          'Vaskemaskine',
          'Opvaskemaskine',
        ].map((f, i) => (
          <Toggle key={f} label={f} initial={i < 4} />
        ))}
      </div>
    </>
  );
}

function Toggle({ label, initial = false }: { label: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className="px-4 py-3 text-sm font-semibold text-left flex items-center justify-between transition-all"
      style={{
        background: on ? '#e6f1ff' : 'white',
        color: on ? Z_BLUE_DEEP : Z_INK,
        border: `2px solid ${on ? Z_BLUE : Z_BORDER}`,
        borderRadius: 6,
      }}
    >
      <span>{label}</span>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: on ? Z_BLUE : Z_BORDER, color: 'white' }}
      >
        {on && '✓'}
      </span>
    </button>
  );
}

function StepPhotos() {
  return (
    <>
      <div>
        <h2 className="font-bold mb-1" style={{ fontSize: '1.5rem', color: Z_INK, letterSpacing: '-0.01em' }}>
          Tilføj fotos af din bolig
        </h2>
        <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
          Boliger med 4+ fotos får i gennemsnit et bedre tilbud.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {['Stue', 'Køkken', 'Bad', 'Sov.', 'Altan', 'Plantegning', 'Gang', 'Andet'].map((r) => (
          <div
            key={r}
            className="aspect-square flex flex-col items-center justify-center text-xs gap-1"
            style={{
              background: Z_BG_TINT,
              border: `2px dashed ${Z_BORDER}`,
              borderRadius: 6,
              color: Z_INK_LIGHT,
            }}
          >
            <span className="text-2xl">+</span>
            <span className="font-semibold">{r}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function StepContact() {
  return (
    <>
      <div>
        <h2 className="font-bold mb-1" style={{ fontSize: '1.5rem', color: Z_INK, letterSpacing: '-0.01em' }}>
          Hvor sender vi dit tilbud?
        </h2>
        <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
          Du modtager tilbud på email + SMS. Vi ringer indenfor 24 timer.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ZField label="Fulde navn" value="Jens Hansen" />
        <ZField label="Email" value="jens@example.dk" />
        <ZField label="Telefon" value="20 12 34 56" />
        <ZField label="Hvornår sælge?" value="1-3 mdr" />
      </div>
    </>
  );
}

function ZField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold mb-1.5" style={{ color: Z_INK }}>
        {label}
      </div>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{
          background: 'white',
          border: `1.5px solid ${Z_BORDER}`,
          borderRadius: 6,
          color: Z_INK,
        }}
      />
    </label>
  );
}

function StepOffer() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 py-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: Z_BLUE }}>
          Dit kontant-tilbud
        </p>
        <p
          className="font-bold tracking-tight tabular-nums"
          style={{ fontSize: '3.5rem', color: Z_INK, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          1.245.000 kr
        </p>
        <p className="text-sm" style={{ color: Z_INK_LIGHT }}>
          Range: 1.220.000 – 1.270.000 kr · Gælder 14 dage
        </p>
      </div>

      <div className="p-5 rounded-lg" style={{ background: Z_BG_TINT, border: `1px solid ${Z_BORDER}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: Z_INK }}>Sammenlignet med 365-estimat</h3>
        <div className="space-y-2 text-sm">
          <ZRow label="365-estimat (markedspris)" value="1.380.000 kr" />
          <ZRow label="− Service-fee (5%)" value="−69.000 kr" muted />
          <ZRow label="− Reparations-estimat" value="−66.000 kr" muted />
          <div className="pt-2" style={{ borderTop: `1px solid ${Z_BORDER}` }}>
            <ZRow label="Dit tilbud" value="1.245.000 kr" bold />
          </div>
        </div>
      </div>

      <div
        className="p-4 text-sm rounded"
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          color: '#9a3412',
        }}
      >
        <strong>Inspections-garanti:</strong> Hvis vores endelige tilbud efter besigtigelse
        afviger mere end 5%, kan du trække dig uden konsekvens.
      </div>
    </div>
  );
}

function ZRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: muted ? Z_INK_LIGHT : Z_INK, fontWeight: bold ? 700 : 400 }}>
        {label}
      </span>
      <span
        className="tabular-nums"
        style={{
          color: muted ? Z_INK_LIGHT : Z_INK,
          fontWeight: bold ? 700 : 600,
          fontSize: bold ? '1.25rem' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
