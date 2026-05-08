'use client';

/**
 * MockFunnel — interaktiv prototype af salgs-funnel'en.
 *
 * Tager et theme-prop og rendrer alle 5 trin med design-specifik styling.
 * Ingen DAWA, ingen submit, ingen DB. Kun visuel sammenligning.
 *
 * Hver prototype-route wraps denne med deres theme.
 */
import { useState } from 'react';

export interface MockTheme {
  /** Baggrundsfarve for body */
  bg: string;
  /** Sekundaer baggrund (cards, sektioner) */
  bgSecondary: string;
  /** Border for cards */
  border: string;
  /** Primaer tekstfarve */
  text: string;
  /** Daempet tekst */
  textMuted: string;
  /** Accent-farve (CTAs, links, fremhævning) */
  accent: string;
  /** Tekst pa accent-baggrund */
  accentText: string;
  /** Header-tekst farve */
  heading: string;
  /** Heading font */
  fontHeading: string;
  /** Body font */
  fontBody: string;
  /** Card border-radius */
  radius: string;
  /** Stil-specifik label til "tilbud"-celle (eks. "Vi byder", "Estimat") */
  offerLabel?: string;
  /** Sub-label under tilbud */
  offerSub?: string;
}

const STEP_LABELS = ['Adresse', 'Boligen', 'Udgifter', 'Om dig', 'Estimat'];

export function MockFunnel({ theme }: { theme: MockTheme }) {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div
      className="min-h-[600px]"
      style={{ background: theme.bg, color: theme.text, fontFamily: theme.fontBody }}
    >
      <Progress step={step} theme={theme} />
      <div className="px-4 py-6 sm:py-10">
        <div
          className="max-w-2xl mx-auto p-5 sm:p-8 space-y-6"
          style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
          }}
        >
          {step === 1 && <Step1 theme={theme} />}
          {step === 2 && <Step2 theme={theme} />}
          {step === 3 && <Step3 theme={theme} />}
          {step === 4 && <Step4 theme={theme} />}
          {step === 5 && <Step5 theme={theme} />}

          <Nav step={step} theme={theme} prev={prev} next={next} />
        </div>
      </div>
    </div>
  );
}

function Progress({ step, theme }: { step: number; theme: MockTheme }) {
  return (
    <div className="px-4 py-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-1 mb-2">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          const done = num <= step;
          return (
            <div
              key={label}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ background: done ? theme.accent : theme.border }}
            />
          );
        })}
      </div>
      <div className="text-xs" style={{ color: theme.textMuted }}>
        Trin {step}/5 · {STEP_LABELS[step - 1]}
      </div>
    </div>
  );
}

function Nav({
  step,
  theme,
  prev,
  next,
}: {
  step: number;
  theme: MockTheme;
  prev: () => void;
  next: () => void;
}) {
  return (
    <div className="flex justify-between gap-3 pt-4">
      <button
        type="button"
        onClick={prev}
        disabled={step === 1}
        className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-30"
        style={{ color: theme.textMuted }}
      >
        ← Tilbage
      </button>
      <button
        type="button"
        onClick={next}
        disabled={step === 5}
        className="px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-30 hover:opacity-90"
        style={{
          background: theme.accent,
          color: theme.accentText,
          borderRadius: theme.radius,
        }}
      >
        {step === 4 ? 'Vis mit estimat' : step === 5 ? 'Færdig' : 'Næste'} →
      </button>
    </div>
  );
}

// ===== STEP 1: ADRESSE + KONTAKT =====
function Step1({ theme }: { theme: MockTheme }) {
  return (
    <>
      <Heading theme={theme} title="Hvor ligger din lejlighed?" sub="Skriv adressen — vi henter automatisk størrelse, byggeår og data." />
      <Input theme={theme} label="Adresse" placeholder="Vejnavn + nr, postnr" defaultValue="Svendborgvej 59, 4700 Næstved" />

      <FoundCard theme={theme} />

      <div className="space-y-3 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
        <p className="text-sm font-medium pt-3" style={{ color: theme.heading }}>
          Hvor sender vi dit estimat?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input theme={theme} label="Navn" placeholder="Jens Hansen" />
          <Input theme={theme} label="Email" placeholder="din@email.dk" />
          <Input theme={theme} label="Telefon" placeholder="20 12 34 56" />
        </div>
      </div>
    </>
  );
}

function FoundCard({ theme }: { theme: MockTheme }) {
  return (
    <div
      className="p-4 space-y-2"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
      }}
    >
      <div className="text-xs font-medium" style={{ color: theme.accent }}>
        ✓ Vi har fundet din lejlighed
      </div>
      <div className="grid grid-cols-4 gap-3 text-sm">
        <Stat theme={theme} label="m²" value="67" />
        <Stat theme={theme} label="Værelser" value="2" />
        <Stat theme={theme} label="Byggeår" value="1976" />
        <Stat theme={theme} label="BFE" value="281288" />
      </div>
    </div>
  );
}

function Stat({ theme, label, value }: { theme: MockTheme; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: theme.textMuted }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: theme.heading }}>
        {value}
      </div>
    </div>
  );
}

// ===== STEP 2: BOLIGEN (per-rum stand) =====
const ROOM_OPTIONS = [
  { level: 'nyrenoveret', title: 'Nyrenoveret', desc: 'Stenlook-bordplade, integrerede hvidevarer.' },
  { level: 'god', title: 'God stand', desc: 'Velholdt. Laminat-bordplade, hvidevarer fra de sidste ~10 år.' },
  { level: 'middel', title: 'Middel', desc: 'Funktionelt. Ældre overflader, hvidevarer kører stadig.' },
  { level: 'trænger', title: 'Trænger', desc: 'Slidte overflader, ældre hvidevarer.' },
  { level: 'slidt', title: 'Skal renoveres', desc: 'Originalt eller meget slidt.' },
];

function Step2({ theme }: { theme: MockTheme }) {
  const [selected, setSelected] = useState<string>('middel');
  return (
    <>
      <Heading theme={theme} title="Køkken" sub="Vælg det niveau der bedst beskriver dit køkken." />
      <p className="text-xs italic" style={{ color: theme.textMuted }}>
        Vist her: Køkken (1/5 sub-trin) — flow'et fortsætter med Bad, Stue, Soveværelse, Resten.
      </p>
      <div className="space-y-2">
        {ROOM_OPTIONS.map((opt) => {
          const active = selected === opt.level;
          return (
            <button
              key={opt.level}
              type="button"
              onClick={() => setSelected(opt.level)}
              className="w-full text-left p-4 transition-all"
              style={{
                borderRadius: theme.radius,
                border: `1px solid ${active ? theme.accent : theme.border}`,
                background: active ? theme.accent : theme.bg,
                color: active ? theme.accentText : theme.text,
              }}
            >
              <div className="font-semibold text-sm">{opt.title}</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: active ? theme.accentText : theme.textMuted, opacity: active ? 0.85 : 1 }}
              >
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ===== STEP 3: UDGIFTER =====
function Step3({ theme }: { theme: MockTheme }) {
  return (
    <>
      <Heading theme={theme} title="Faste udgifter" sub="Alle beløb er årlige (kr/år). Jo præcisere data, jo bedre tilbud." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input theme={theme} label="Fællesudgifter *" placeholder="24.000" defaultValue="24000" suffix="kr/år" />
        <Input theme={theme} label="Grundskyld" placeholder="4.500" defaultValue="4500" suffix="kr/år" />
        <Input theme={theme} label="Bygningsforsikring" placeholder="0" suffix="kr/år" />
        <Input theme={theme} label="Andet drift" placeholder="0" suffix="kr/år" />
      </div>

      <div
        className="p-4 mt-2"
        style={{
          background: theme.accent,
          color: theme.accentText,
          borderRadius: theme.radius,
        }}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm" style={{ opacity: 0.85 }}>Drift total</span>
          <span className="text-2xl font-bold tabular-nums">28.500 kr/år</span>
        </div>
        <div className="text-xs text-right" style={{ opacity: 0.7 }}>~2.375 kr/md</div>
      </div>
    </>
  );
}

// ===== STEP 4: LIDT OM DIG =====
function Step4({ theme }: { theme: MockTheme }) {
  const [timeframe, setTimeframe] = useState('1to3');
  const [reason, setReason] = useState('flytter');
  const [after, setAfter] = useState('flytter_ud');
  return (
    <>
      <Heading theme={theme} title="Lidt om dig" sub="Vi bruger det her til at finde den løsning der passer dig — alt valgfrit." />

      <ChipSection
        theme={theme}
        label="Hvornår kunne du tænke dig at sælge?"
        options={[
          ['under1', 'Under 1 mdr'],
          ['1to3', '1–3 mdr'],
          ['3to6', '3–6 mdr'],
          ['6plus', '6+ mdr'],
          ['unsure', 'Ved ikke'],
        ]}
        value={timeframe}
        onChange={setTimeframe}
      />

      <ChipSection
        theme={theme}
        label="Hvad er hovedgrunden?"
        options={[
          ['flytter', 'Flytter'],
          ['arv', 'Arv / dødsbo'],
          ['skilsmisse', 'Skilsmisse'],
          ['okonomi', 'Økonomi'],
          ['investering', 'Investering'],
        ]}
        value={reason}
        onChange={setReason}
      />

      <ChipSection
        theme={theme}
        label="Hvad skal du efter salget?"
        options={[
          ['flytter_ud', 'Flytter ud helt'],
          ['lejer_andet', 'Vil leje noget andet'],
          ['blive_boende_lejer', 'Blive boende som lejer'],
          ['ved_ikke', 'Ved ikke endnu'],
        ]}
        value={after}
        onChange={setAfter}
      />
    </>
  );
}

function ChipSection({
  theme,
  label,
  options,
  value,
  onChange,
}: {
  theme: MockTheme;
  label: string;
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: theme.heading }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(([val, lbl]) => {
          const active = value === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className="px-3.5 py-2 text-sm font-medium transition-all"
              style={{
                borderRadius: theme.radius,
                border: `1px solid ${active ? theme.accent : theme.border}`,
                background: active ? theme.accent : theme.bg,
                color: active ? theme.accentText : theme.text,
              }}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===== STEP 5: ESTIMAT =====
function Step5({ theme }: { theme: MockTheme }) {
  return (
    <>
      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: theme.textMuted }}>
          {theme.offerLabel ?? 'Dit foreløbige tilbud'}
        </p>
        <h2 className="text-base font-semibold" style={{ color: theme.heading, fontFamily: theme.fontHeading }}>
          Svendborgvej 59, 4700 Næstved
        </h2>
      </div>

      {/* HOVEDTAL */}
      <div
        className="p-6 text-center space-y-2"
        style={{
          background: theme.accent,
          color: theme.accentText,
          borderRadius: theme.radius,
        }}
      >
        <p className="text-xs uppercase tracking-wider" style={{ opacity: 0.75 }}>
          {theme.offerLabel ?? 'Vores foreløbige tilbud'}
        </p>
        <p
          className="text-5xl sm:text-6xl font-bold tracking-tight"
          style={{ fontFamily: theme.fontHeading }}
        >
          1.245.000 <span className="text-2xl" style={{ opacity: 0.8 }}>kr</span>
        </p>
        <p className="text-xs" style={{ opacity: 0.75 }}>
          {theme.offerSub ?? 'Bindende tilbud gives efter gratis besigtigelse'}
        </p>
      </div>

      {/* SAVINGS */}
      <div
        className="p-5 space-y-3"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: theme.heading }}>
          Hvad du sparer ved at sælge til os
        </h3>
        <SaveItem theme={theme} label="Mæglersalær" value="70.000 kr" sub="Vi tager intet salær." />
        <SaveItem theme={theme} label="Markedsafslag" value="74.700 kr" sub="Slutprisen via mægler er typisk 6% under listepris." />
        <SaveItem theme={theme} label="Drift i salgsperioden" value="7.125 kr" sub="Du betaler ikke ejerudgifter mens boligen står til salg." />

        <div
          className="p-3 mt-2"
          style={{
            background: theme.bgSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
          }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold" style={{ color: theme.heading }}>
              Vores tilbud svarer til at sælge for
            </span>
            <span className="text-lg font-bold tabular-nums" style={{ color: theme.heading }}>
              1.396.825 kr
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
            …hvis du var gået via mægler. Vores 1.245.000 kr kontant plus de tre poster du sparer.
          </p>
        </div>
      </div>

      {/* COMPARABLES */}
      <div
        className="p-5 space-y-3"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
        }}
      >
        <p
          className="text-xs uppercase tracking-[0.16em] font-medium"
          style={{ color: theme.accent }}
        >
          Hvad andre i din ejerforening fik
        </p>
        <ul className="space-y-2 text-sm">
          {[
            { addr: 'Svendborgvej 53, 1.tv', kvm: 78, price: '1.180.000 kr', date: 'Mar 2026' },
            { addr: 'Svendborgvej 59, 2.tv', kvm: 65, price: '985.000 kr', date: 'Jan 2026' },
            { addr: 'Sandsvinget 12', kvm: 72, price: '1.050.000 kr', date: 'Dec 2025' },
          ].map((c) => (
            <li
              key={c.addr}
              className="flex items-baseline justify-between gap-3 py-2"
              style={{ borderTop: `1px solid ${theme.border}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate" style={{ color: theme.heading }}>
                  {c.addr}
                </div>
                <div className="text-xs" style={{ color: theme.textMuted }}>
                  {c.kvm}m² · {c.date}
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums" style={{ color: theme.heading }}>
                {c.price}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function SaveItem({
  theme,
  label,
  value,
  sub,
}: {
  theme: MockTheme;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span style={{ color: theme.accent, fontWeight: 700 }}>✓</span>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-sm" style={{ color: theme.heading }}>
            {label}
          </span>
          <span className="font-semibold text-sm tabular-nums" style={{ color: theme.heading }}>
            {value}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

// ===== SHARED PRIMITIVES =====
function Heading({ theme, title, sub }: { theme: MockTheme; title: string; sub?: string }) {
  return (
    <div className="space-y-1">
      <h2
        className="text-xl sm:text-2xl font-semibold"
        style={{ color: theme.heading, fontFamily: theme.fontHeading }}
      >
        {title}
      </h2>
      {sub && (
        <p className="text-sm" style={{ color: theme.textMuted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Input({
  theme,
  label,
  placeholder,
  defaultValue,
  suffix,
}: {
  theme: MockTheme;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs mb-1" style={{ color: theme.textMuted }}>
        {label}
      </div>
      <div className="relative">
        <input
          type="text"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm focus:outline-none"
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radius,
            color: theme.text,
            paddingRight: suffix ? '3.5rem' : undefined,
          }}
        />
        {suffix && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
            style={{ color: theme.textMuted }}
          >
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
