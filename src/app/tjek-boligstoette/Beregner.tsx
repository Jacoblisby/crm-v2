'use client';

/**
 * Tjek din boligstøtte — for folkepensionister.
 *
 * To trin:
 *   1  Tjek boligstøtte  — indkomst, formue og en lejebolig. Resultat: boligydelse pr. måned.
 *   2  Sammenlign med at eje — hvad man betaler for at eje i dag, sat op mod at leje,
 *      begge pr. måned og efter boligydelse.
 * Regnereglerne ligger i src/lib/boligstoette.ts.
 *
 * Siden åbner med et eksempel, så regnestykket kan ses med det samme. Det er markeret
 * som eksempel, indtil man retter det første tal.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  SATSER,
  lejerAlene,
  sammenlign,
  type LejerInput,
  type Sammenligning,
  type Varme,
  type Vedligehold,
  type YdelseResultat,
} from '@/lib/boligstoette';

// Forsidens farver (CSS-variablerne ligger i layout.tsx).
const EASE = 'var(--fp-out)';
const C = {
  green: 'var(--fp-green)',
  greenDeep: 'var(--fp-green-deep)',
  mint: 'var(--fp-mint-card)',
  mintSoft: 'var(--fp-faq)',
  ink: 'var(--fp-ink)',
  muted: 'var(--fp-muted)',
  soft: '#6b7877',
  rule: 'rgba(28,43,43,0.12)',
  ruleStrong: 'rgba(28,43,43,0.26)',
  cta: 'var(--fp-cta)',
  kantKort: '1px solid rgba(28,43,43,0.08)',
};


const TELEFON = '61 78 90 71';
const LAGER = 'boligstoette-v2';

type Felter = {
  // trin 1
  personer: 1 | 2;
  indkomstMd: string;
  oevrigFormue: string;
  /** Hvad man står tilbage med, når boligen er solgt og gælden betalt. Tæller som formue. */
  provenu: string;
  huslejeMd: string;
  areal: string;
  varme: Varme;
  varmtVandILeje: boolean;
  elILeje: boolean;
  vandSaerskilt: boolean;
  vedligehold: Vedligehold;
  // trin 2
  ejerAreal: string;
  vurdering: string;
  rkYdelseMd: string;
  rkGaeld: string;
  bankYdelseMd: string;
  bankGaeld: string;
  bankPant: boolean;
  ejendomsskatMd: string;
  faellesudgiftMd: string;
  varmeVandElMd: string;
  forsikringVedligeholdMd: string;
  lejerLoebendeMd: string;
};

const EKSEMPEL: Felter = {
  personer: 1,
  indkomstMd: '17500',
  oevrigFormue: '150000',
  provenu: '1300000',
  huslejeMd: '7500',
  areal: '62',
  varme: 'saerskilt-fjernvarme-el-gas',
  varmtVandILeje: false,
  elILeje: false,
  vandSaerskilt: true,
  vedligehold: 'udlejer',
  ejerAreal: '62',
  vurdering: '1900000',
  rkYdelseMd: '3300',
  rkGaeld: '600000',
  bankYdelseMd: '0',
  bankGaeld: '0',
  bankPant: false,
  ejendomsskatMd: '700',
  faellesudgiftMd: '2600',
  varmeVandElMd: '800',
  forsikringVedligeholdMd: '400',
  lejerLoebendeMd: '',
};

const tal = (s: string) => {
  const n = Number(String(s).replace(/\D/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const fmt = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });
const kr = (n: number) => `${fmt.format(Math.round(Math.abs(n)))} kr.`;
const minus = (n: number) => (Math.round(n) < 0 ? '−' : '');

// ── Små byggesten ────────────────────────────────────────────────────────

function Kort({ titel, nr, children }: { titel: string; nr?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl p-5 sm:p-7 space-y-5" style={{ border: C.kantKort }}>
      <div className="flex items-baseline gap-3">
        {nr && (
          <span className="text-[13px] tabular-nums" style={{ color: C.soft, fontWeight: 500 }}>
            {nr}
          </span>
        )}
        <h2 className="text-[22px] sm:text-[26px]" style={{ color: C.ink }}>
          {titel}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Felt({
  id,
  label,
  hint,
  value,
  onChange,
  enhed = 'kr.',
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  enhed?: string;
  placeholder?: string;
}) {
  const vist = value === '' ? '' : fmt.format(tal(value));
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[15px]" style={{ color: C.ink, fontWeight: 500 }}>
        {label}
      </label>
      <div
        className="flex items-center rounded-lg bg-white px-4 h-[54px] focus-within:ring-2"
        style={{ border: `1px solid ${C.ruleStrong}`, ['--tw-ring-color' as string]: C.cta }}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={vist}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className="flex-1 min-w-0 bg-transparent outline-none text-[18px] tabular-nums"
          style={{ color: C.ink }}
        />
        <span className="text-[15px] pl-3" style={{ color: C.muted }}>
          {enhed}
        </span>
      </div>
      {hint && (
        <p className="text-[13px] leading-[1.5]" style={{ color: C.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Valg<T extends string | number>({
  label,
  hint,
  value,
  muligheder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  muligheder: Array<{ v: T; tekst: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[15px]" style={{ color: C.ink, fontWeight: 500 }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {muligheder.map((m) => {
          const valgt = m.v === value;
          return (
            <button
              key={String(m.v)}
              type="button"
              role="radio"
              aria-checked={valgt}
              onClick={() => onChange(m.v)}
              className="rounded-lg px-4 min-h-[44px] text-[15px] text-left"
              style={{
                background: valgt ? C.green : '#fff',
                color: valgt ? '#fff' : C.ink,
                border: `1px solid ${valgt ? C.green : C.ruleStrong}`,
                transition: `background-color 160ms ${EASE}, color 160ms ${EASE}`,
              }}
            >
              {m.tekst}
            </button>
          );
        })}
      </div>
      {hint && (
        <p className="text-[13px] leading-[1.5]" style={{ color: C.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Til({ label, valgt, onChange }: { label: string; valgt: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valgt}
      onClick={() => onChange(!valgt)}
      className="rounded-lg px-4 min-h-[44px] text-[15px] text-left inline-flex items-center gap-2"
      style={{
        background: valgt ? C.green : '#fff',
        color: valgt ? '#fff' : C.ink,
        border: `1px solid ${valgt ? C.green : C.ruleStrong}`,
        transition: `background-color 160ms ${EASE}, color 160ms ${EASE}`,
      }}
    >
      <span aria-hidden>{valgt ? '✓' : '+'}</span>
      {label}
    </button>
  );
}

function Linje({
  label,
  vaerdi,
  fortegn,
  fed,
  dim,
}: {
  label: string;
  vaerdi: number;
  fortegn?: '−' | '';
  fed?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-[7px]"
      style={{ color: dim ? C.soft : C.ink, fontWeight: fed ? 600 : 400 }}
    >
      <span className="text-[15px]">{label}</span>
      <span className="text-[16px] tabular-nums whitespace-nowrap">
        {fortegn === '−' && vaerdi > 0 ? '− ' : ''}
        {vaerdi > 0 || fed ? kr(vaerdi) : '–'}
      </span>
    </div>
  );
}

// ── Siden ────────────────────────────────────────────────────────────────

export function Beregner() {
  const [f, setF] = useState<Felter>(EKSEMPEL);
  const [eksempel, setEksempel] = useState(true);
  const [trin, setTrin] = useState<1 | 2>(1);
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    try {
      const gemt = localStorage.getItem(LAGER);
      if (gemt) {
        const d = JSON.parse(gemt);
        if (d && d.f) {
          setF({ ...EKSEMPEL, ...d.f });
          setEksempel(false);
        }
      }
    } catch {
      /* ingen lager: siden virker alligevel */
    }
    setKlar(true);
  }, []);

  useEffect(() => {
    if (!klar || eksempel) return;
    try {
      localStorage.setItem(LAGER, JSON.stringify({ f }));
    } catch {
      /* privat vindue eller blokeret lager */
    }
  }, [f, eksempel, klar]);

  const sæt = <K extends keyof Felter>(k: K, v: Felter[K]) => {
    setEksempel(false);
    setF((x) => ({ ...x, [k]: v }));
  };

  const gaaTil = (t: 1 | 2) => {
    setTrin(t);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const lejerInput: LejerInput = useMemo(
    () => ({
      huslejeMd: tal(f.huslejeMd),
      areal: tal(f.areal),
      varme: f.varme,
      varmtVandILeje: f.varmtVandILeje,
      elILeje: f.elILeje,
      vandSaerskilt: f.vandSaerskilt,
      vedligehold: f.vedligehold,
    }),
    [f],
  );

  // Trin 1: boligydelse som lejer alene
  const y1 = useMemo(
    () =>
      lejerAlene({
        personer: f.personer,
        indkomstMd: tal(f.indkomstMd),
        formue: tal(f.oevrigFormue) + tal(f.provenu),
        lejer: lejerInput,
      }),
    [f, lejerInput],
  );

  // Trin 2: ejer i dag mod lejer
  const r: Sammenligning = useMemo(
    () =>
      sammenlign({
        personer: f.personer,
        indkomstMd: tal(f.indkomstMd),
        oevrigFormue: tal(f.oevrigFormue),
        // Salgsprisen er det, man står tilbage med efter gæld, plus gælden.
        salgspris: tal(f.provenu) + tal(f.rkGaeld) + tal(f.bankGaeld),
        ejer: {
          areal: tal(f.ejerAreal),
          vurdering: tal(f.vurdering),
          rkYdelseMd: tal(f.rkYdelseMd),
          rkGaeld: tal(f.rkGaeld),
          bankYdelseMd: tal(f.bankYdelseMd),
          bankGaeld: tal(f.bankGaeld),
          bankPant: f.bankPant,
          ejendomsskatMd: tal(f.ejendomsskatMd),
          faellesudgiftMd: tal(f.faellesudgiftMd),
          varmeVandElMd: tal(f.varmeVandElMd),
          forsikringVedligeholdMd: tal(f.forsikringVedligeholdMd),
        },
        lejer: {
          ...lejerInput,
          loebendeMd: f.lejerLoebendeMd === '' ? tal(f.varmeVandElMd) : tal(f.lejerLoebendeMd),
        },
      }),
    [f, lejerInput],
  );

  const startForfra = () => {
    try {
      localStorage.removeItem(LAGER);
    } catch {
      /* ingen lager */
    }
    setF(EKSEMPEL);
    setEksempel(true);
    setTrin(1);
  };

  const billigereSomLejer = r.forskelMd >= 0;
  const forskel = Math.abs(r.forskelMd);
  const huslejeEfter = tal(f.huslejeMd) - y1.ydelseMd;

  const overskrift =
    trin === 1 ? 'Hvad får du i boligstøtte, hvis du lejer?' : 'Hvad koster det at eje, mod at leje?';
  const intro =
    trin === 1
      ? 'Til dig, der modtager folkepension. Skriv din indkomst og hvad en lejebolig koster, så ser du, hvad du kan få i boligstøtte pr. måned.'
      : 'Skriv, hvad du betaler for at eje i dag. Så ser du ejer og lejer side om side pr. måned. Som lejer er boligstøtten et tilskud og trækkes fra. Som ejer kan den kun fås som lån.';

  return (
    <div className="min-h-screen">
      {/* Hero — samme rosa flade som forsiden. Ingen menu, kun vejen tilbage. */}
      <section className="relative" style={{ background: 'var(--fp-rose)' }}>
        <div className="hidden lg:block absolute top-0 right-0 bottom-0" style={{ width: '49%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/frontpage/couple-planning-table.jpg"
            alt="Par gennemgår boligpapirer ved spisebordet"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-[1380px] mx-auto px-6 sm:px-10 pt-6 sm:pt-8 pb-12 sm:pb-20 lg:min-h-[440px]">
          <a
            href="/frontpage"
            className="fp-press inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] text-white"
            style={{ background: 'var(--fp-green)', fontWeight: 500 }}
          >
            <span aria-hidden>←</span>
            Tilbage til forsiden
          </a>
          <div className="max-w-[560px] space-y-5 pt-10 sm:pt-14">
            <p className="fp-kicker">Boligstøtte · trin {trin} af 2</p>
            <h1 className="text-[36px] sm:text-[46px] lg:text-[52px] leading-[1.15]" style={{ color: 'var(--fp-ink)' }}>
              {overskrift}
            </h1>
            <p className="text-[14.5px] leading-[1.7] max-w-[460px]" style={{ color: 'var(--fp-muted)' }}>
              {intro}
            </p>
            {!eksempel && (
              <button
                type="button"
                onClick={startForfra}
                className="fp-press text-[13.5px] underline hover:no-underline"
                style={{ color: 'var(--fp-muted)' }}
              >
                Start forfra
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-10 sm:py-16" style={{ background: 'var(--fp-cream)' }}>
        <div className="max-w-[1240px] mx-auto">
          {/* De to trin */}
          <nav aria-label="Trin" className="flex flex-wrap gap-2 pb-8">
            {([
              [1, 'Tjek boligstøtte'],
              [2, 'Sammenlign med at eje'],
            ] as const).map(([n, tekst]) => {
              const aktiv = trin === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => gaaTil(n)}
                  aria-current={aktiv ? 'step' : undefined}
                  className="fp-press inline-flex items-center gap-2.5 rounded-lg px-4 min-h-[46px] text-[14.5px]"
                  style={{
                    background: aktiv ? C.green : '#fff',
                    color: aktiv ? '#fff' : C.ink,
                    border: `1px solid ${aktiv ? C.green : C.ruleStrong}`,
                    fontWeight: 500,
                  }}
                >
                  <span className="tabular-nums" style={{ opacity: 0.7 }}>
                    {n}
                  </span>
                  {tekst}
                </button>
              );
            })}
          </nav>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-6 lg:gap-8 items-start">
            {/* ── Indtastning ─────────────────────────────────────────── */}
            {trin === 1 ? (
              <div className="space-y-5">
                <Kort nr="1" titel="Din økonomi">
                  <Valg
                    label="Hvem bor i boligen?"
                    value={f.personer}
                    muligheder={[
                      { v: 1, tekst: 'Jeg bor alene' },
                      { v: 2, tekst: 'Vi er to' },
                    ]}
                    onChange={(v) => sæt('personer', v as 1 | 2)}
                  />
                  <Felt
                    id="indkomst"
                    label={f.personer === 2 ? 'Jeres indkomst før skat pr. måned' : 'Din indkomst før skat pr. måned'}
                    hint="Folkepension, arbejdsmarkeds- og firmapension, ATP, løn og renter. Medregn begge, hvis I er to."
                    value={f.indkomstMd}
                    onChange={(v) => sæt('indkomstMd', v)}
                  />
                  <Felt
                    id="formue"
                    label="Formue ud over boligen"
                    hint="Bank, aktier og bil. Pension tæller ikke med."
                    value={f.oevrigFormue}
                    onChange={(v) => sæt('oevrigFormue', v)}
                  />
                  <Felt
                    id="provenu"
                    label="Hvad du står tilbage med efter et salg"
                    hint="Det du får for boligen, når gælden er betalt. Det tæller med i din formue. Har du ikke solgt, så skriv 0."
                    value={f.provenu}
                    onChange={(v) => sæt('provenu', v)}
                  />
                </Kort>

                <Kort nr="2" titel="Hvis du lejer">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Felt id="husleje" label="Husleje pr. måned" value={f.huslejeMd} onChange={(v) => sæt('huslejeMd', v)} />
                    <Felt id="areal" label="Lejeboligens størrelse" enhed="m²" value={f.areal} onChange={(v) => sæt('areal', v)} />
                  </div>
                  <Valg
                    label="Hvordan betaler du varme?"
                    value={f.varme}
                    muligheder={[
                      { v: 'i-leje' as Varme, tekst: 'Med i huslejen' },
                      { v: 'saerskilt-fjernvarme-el-gas' as Varme, tekst: 'Særskilt: fjernvarme, el eller gas' },
                      { v: 'saerskilt-andet' as Varme, tekst: 'Særskilt: andet' },
                    ]}
                    onChange={(v) => sæt('varme', v)}
                  />
                  <div className="space-y-2">
                    <div className="text-[15px]" style={{ color: C.ink, fontWeight: 500 }}>
                      Hvad er med i huslejen?
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Til label="Varmt vand" valgt={f.varmtVandILeje} onChange={(v) => sæt('varmtVandILeje', v)} />
                      <Til label="El" valgt={f.elILeje} onChange={(v) => sæt('elILeje', v)} />
                      <Til label="Vand er ikke med" valgt={f.vandSaerskilt} onChange={(v) => sæt('vandSaerskilt', v)} />
                    </div>
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-[15px] underline hover:no-underline" style={{ color: C.green, fontWeight: 500 }}>
                      Flere valg
                    </summary>
                    <div className="pt-4">
                      <Valg
                        label="Hvem vedligeholder indvendigt?"
                        value={f.vedligehold}
                        muligheder={[
                          { v: 'udlejer' as Vedligehold, tekst: 'Udlejer' },
                          { v: 'maling' as Vedligehold, tekst: 'Jeg maler og tapetserer' },
                          { v: 'alt' as Vedligehold, tekst: 'Jeg vedligeholder alt indvendigt' },
                        ]}
                        onChange={(v) => sæt('vedligehold', v)}
                      />
                    </div>
                  </details>
                </Kort>

                <button
                  type="button"
                  onClick={() => gaaTil(2)}
                  className="fp-press inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-[15px] text-white"
                  style={{ background: C.green, fontWeight: 500 }}
                >
                  Sammenlign med at eje
                  <span aria-hidden>→</span>
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <Kort nr="1" titel="Det betaler du for at eje i dag">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Felt id="ejer-areal" label="Boligens størrelse" enhed="m²" value={f.ejerAreal} onChange={(v) => sæt('ejerAreal', v)} />
                    <Felt
                      id="vurdering"
                      label="Offentlig vurdering"
                      hint="Står på dit ejendomsskattebrev."
                      value={f.vurdering}
                      onChange={(v) => sæt('vurdering', v)}
                    />
                    <Felt
                      id="rk-ydelse"
                      label="Realkreditlån, ydelse pr. måned"
                      hint="Renter, afdrag og bidrag."
                      value={f.rkYdelseMd}
                      onChange={(v) => sæt('rkYdelseMd', v)}
                    />
                    <Felt id="rk-gaeld" label="Realkreditlån, restgæld" value={f.rkGaeld} onChange={(v) => sæt('rkGaeld', v)} />
                    <Felt
                      id="bank-ydelse"
                      label="Banklån, ydelse pr. måned"
                      hint="Lån i banken, som er brugt på boligen."
                      value={f.bankYdelseMd}
                      onChange={(v) => sæt('bankYdelseMd', v)}
                    />
                    <Felt id="bank-gaeld" label="Banklån, restgæld" value={f.bankGaeld} onChange={(v) => sæt('bankGaeld', v)} />
                  </div>
                  {tal(f.bankYdelseMd) > 0 && (
                    <Til label="Banklånet har pant i boligen" valgt={f.bankPant} onChange={(v) => sæt('bankPant', v)} />
                  )}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Felt
                      id="ejendomsskat"
                      label="Ejendomsskat pr. måned"
                      hint="Grundskyld og ejendomsværdiskat."
                      value={f.ejendomsskatMd}
                      onChange={(v) => sæt('ejendomsskatMd', v)}
                    />
                    <Felt
                      id="faelles"
                      label="Fællesudgifter pr. måned"
                      hint="Til ejerforeningen."
                      value={f.faellesudgiftMd}
                      onChange={(v) => sæt('faellesudgiftMd', v)}
                    />
                    <Felt
                      id="vve"
                      label="Varme, vand og el pr. måned"
                      hint="Det du selv betaler, ud over fællesudgifterne."
                      value={f.varmeVandElMd}
                      onChange={(v) => sæt('varmeVandElMd', v)}
                    />
                    <Felt
                      id="forsikring"
                      label="Forsikring og vedligehold pr. måned"
                      value={f.forsikringVedligeholdMd}
                      onChange={(v) => sæt('forsikringVedligeholdMd', v)}
                    />
                  </div>
                </Kort>

                <Kort nr="2" titel="Det koster at leje, ud over huslejen">
                  <Felt
                    id="lejer-loebende"
                    label="Varme, vand og el pr. måned"
                    hint={`Huslejen på ${fmt.format(tal(f.huslejeMd))} kr. har du skrevet i trin 1. Tom her = samme beløb, som du betaler som ejer.`}
                    placeholder={f.varmeVandElMd}
                    value={f.lejerLoebendeMd}
                    onChange={(v) => sæt('lejerLoebendeMd', v)}
                  />
                </Kort>

                <button
                  type="button"
                  onClick={() => gaaTil(1)}
                  className="fp-press inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[14.5px]"
                  style={{ background: '#fff', color: C.green, border: `1px solid ${C.green}`, fontWeight: 500 }}
                >
                  <span aria-hidden>←</span>
                  Tilbage til boligstøtten
                </button>
              </div>
            )}

            {/* ── Resultat ────────────────────────────────────────────── */}
            <aside id="resultat" aria-live="polite" className="lg:sticky lg:top-6 space-y-5">
              {trin === 1 ? (
                <>
                  <div className="bg-white rounded-xl overflow-hidden" style={{ border: C.kantKort }}>
                    <div className="px-5 sm:px-7 pt-6 pb-5" style={{ background: C.mint }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: C.greenDeep, fontWeight: 600 }}>
                          Boligstøtte som lejer
                        </div>
                        {eksempel && (
                          <span
                            className="text-[11px] tracking-[0.1em] uppercase rounded-md px-2.5 py-1"
                            style={{ background: '#fff', color: C.greenDeep, fontWeight: 600 }}
                          >
                            Eksempel
                          </span>
                        )}
                      </div>
                      <div className="pt-3 text-[15px]" style={{ color: C.greenDeep }}>
                        {y1.ydelseAar > 0 ? 'Du kan få ca.' : 'Med de tal får du'}
                      </div>
                      <div className="text-[40px] sm:text-[46px] leading-[1.05] tabular-nums" style={{ color: C.ink, fontWeight: 300 }}>
                        {kr(y1.ydelseMd)}
                      </div>
                      <div className="pt-1 text-[17px]" style={{ color: C.greenDeep, fontWeight: 500 }}>
                        {y1.ydelseAar > 0 ? 'i boligstøtte pr. måned' : 'ikke boligstøtte'}
                      </div>
                      <div className="pt-3 text-[14px] tabular-nums" style={{ color: C.greenDeep }}>
                        {kr(y1.ydelseAar)} om året
                      </div>
                    </div>
                    <div className="px-5 sm:px-7 py-5">
                      <Linje label="Husleje" vaerdi={tal(f.huslejeMd)} />
                      <Linje label="Boligydelse (skøn)" vaerdi={y1.ydelseMd} fortegn="−" />
                      <div className="rounded-lg px-3 mt-2" style={{ background: C.mintSoft }}>
                        <Linje label="Husleje efter boligstøtte" vaerdi={huslejeEfter} fed />
                      </div>
                      <div className="pt-5">
                        <button
                          type="button"
                          onClick={() => gaaTil(2)}
                          className="fp-press w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-[15px] text-white"
                          style={{ background: C.green, fontWeight: 500 }}
                        >
                          Sammenlign med at eje
                          <span aria-hidden>→</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <Noter y={y1} over={y1.huslejeOverHalvdelenAfIndkomst} />

                  <details className="bg-white rounded-xl px-5 sm:px-7 py-4" style={{ border: C.kantKort }}>
                    <summary className="cursor-pointer text-[15px]" style={{ color: C.ink, fontWeight: 500 }}>
                      Sådan er boligydelsen regnet
                    </summary>
                    <div className="pt-4">
                      <Regnestykke titel="Som lejer" y={y1} formue={tal(f.oevrigFormue) + tal(f.provenu)} />
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl overflow-hidden" style={{ border: C.kantKort }}>
                    <div className="px-5 sm:px-7 pt-6 pb-5" style={{ background: C.mint }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: C.greenDeep, fontWeight: 600 }}>
                          Pr. måned
                        </div>
                        {eksempel && (
                          <span
                            className="text-[11px] tracking-[0.1em] uppercase rounded-md px-2.5 py-1"
                            style={{ background: '#fff', color: C.greenDeep, fontWeight: 600 }}
                          >
                            Eksempel
                          </span>
                        )}
                      </div>
                      <div className="pt-3 text-[15px]" style={{ color: C.greenDeep }}>
                        Som lejer betaler du ca.
                      </div>
                      <div className="text-[40px] sm:text-[46px] leading-[1.05] tabular-nums" style={{ color: C.ink, fontWeight: 300 }}>
                        {kr(forskel)}
                      </div>
                      <div className="pt-1 text-[17px]" style={{ color: C.greenDeep, fontWeight: 500 }}>
                        {Math.round(forskel) === 0 ? 'det samme som i dag' : billigereSomLejer ? 'mindre end i dag' : 'mere end i dag'}
                      </div>
                      <div className="pt-3 text-[14px] tabular-nums" style={{ color: C.greenDeep }}>
                        {kr(forskel * 12)} om året
                      </div>
                    </div>

                    <div className="px-5 sm:px-7 py-5 space-y-5">
                      <Side
                        titel="Du ejer i dag"
                        rækker={[
                          { l: 'Realkreditlån', v: r.ejer.ydelseRK },
                          { l: 'Banklån', v: r.ejer.ydelseBank },
                          { l: 'Ejendomsskat', v: r.ejer.ejendomsskat },
                          { l: 'Fællesudgifter', v: r.ejer.faelles },
                          { l: 'Varme, vand og el', v: r.ejer.varmeVandEl },
                          { l: 'Forsikring og vedligehold', v: r.ejer.forsikringVedligehold },
                        ].filter((x) => x.v > 0)}
                        sum={r.ejer.udgifterMd}
                        netto={r.ejer.nettoMd}
                        nettoLabel="Du betaler som ejer"
                        fod={
                          <p className="pt-2.5 text-[13px] leading-[1.55]" style={{ color: C.muted }}>
                            {r.ejer.laanMd > 0
                              ? `Som ejer kan du søge boligydelse på ca. ${kr(r.ejer.laanMd)} pr. måned, men kun som lån med rente. Den trækkes ikke fra her.`
                              : 'Med de tal kan du ikke få boligydelse som ejer.'}
                          </p>
                        }
                      />
                      <div style={{ borderTop: `1px solid ${C.rule}` }} />
                      <Side
                        titel="Du lejer"
                        rækker={[
                          { l: 'Husleje', v: r.lejer.husleje },
                          { l: 'Varme, vand og el', v: r.lejer.loebende },
                        ].filter((x) => x.v > 0)}
                        sum={r.lejer.udgifterMd}
                        ydelse={r.lejer.boligydelseMd}
                        netto={r.lejer.nettoMd}
                        nettoLabel="Du betaler som lejer"
                      />
                    </div>
                  </div>

                  <Noter y={r.lejer.detaljer} over={r.huslejeOverHalvdelenAfIndkomst} laan />

                  <details className="bg-white rounded-xl px-5 sm:px-7 py-4" style={{ border: C.kantKort }}>
                    <summary className="cursor-pointer text-[15px]" style={{ color: C.ink, fontWeight: 500 }}>
                      Sådan er boligydelsen regnet
                    </summary>
                    <div className="pt-4 space-y-6">
                      <Regnestykke titel="Som ejer (udbetales som lån)" y={r.ejer.detaljer} formue={r.ejer.formue} />
                      <Regnestykke titel="Som lejer (udbetales som tilskud)" y={r.lejer.detaljer} formue={r.lejer.formue} />
                    </div>
                  </details>
                </>
              )}
            </aside>
          </div>

          {/* Fast bjælke på mobil: resultatet er nederst, felterne øverst */}
          <a
            href="#resultat"
            className="lg:hidden fixed left-4 right-4 bottom-4 z-20 rounded-lg px-5 min-h-[52px] flex items-center justify-between gap-3 text-[15px]"
            style={{ background: C.green, color: '#fff', boxShadow: '0 10px 30px -8px rgba(15,71,73,0.55)' }}
          >
            {trin === 1 ? (
              <>
                <span>Boligstøtte pr. md.</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {kr(y1.ydelseMd)} ↓
                </span>
              </>
            ) : (
              <>
                <span>{Math.round(forskel) === 0 ? 'Det samme som i dag' : billigereSomLejer ? 'Som lejer: mindre pr. md.' : 'Som lejer: mere pr. md.'}</span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {kr(forskel)} ↓
                </span>
              </>
            )}
          </a>

          <p className="max-w-[760px] pt-10 text-[13px] leading-[1.65]" style={{ color: C.muted }}>
            Regnestykket er vejledende og bygger på boligstøttelovens regler og satserne for {SATSER.aar}. Det er ikke en
            afgørelse og ikke rådgivning. Det er Udbetaling Danmark, der afgør, om du kan få boligydelse, og hvor meget. Du
            søger selv på borger.dk.
          </p>
        </div>
      </section>

      <KomIGang />
      <Bund />
    </div>
  );
}

// ── Afslutning og bund: samme som forsiden ─────────────────────────

function KomIGang() {
  return (
    <section className="px-6 sm:px-10 py-20 sm:py-28" style={{ background: 'var(--fp-green)' }}>
      <div className="max-w-[880px] mx-auto text-center space-y-5">
        <p className="fp-kicker" style={{ color: 'rgba(255,255,255,0.65)' }}>Kom i gang</p>
        <h2 className="text-[30px] sm:text-[40px] leading-[1.2] text-white">Hvad kan din bolig frigøre for dig?</h2>
        <p className="text-[13.5px] leading-[1.7] max-w-[420px] mx-auto" style={{ color: 'rgba(255,255,255,0.78)' }}>
          Start med din adresse og få et første indblik i dine muligheder. Det er gratis, diskret og helt uforpligtende.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/tjek-din-pris"
            className="fp-press inline-flex items-center justify-center px-6 py-3 rounded-lg text-[14px]"
            style={{ background: 'var(--fp-cta)', color: '#123f41', fontWeight: 500 }}
          >
            Tjek din pris
          </a>
          <a
            href="tel:+4561789071"
            className="fp-press inline-flex items-center justify-center px-6 py-3 rounded-lg text-[14px] text-white tabular-nums"
            style={{ border: '1px solid rgba(255,255,255,0.5)', fontWeight: 500 }}
          >
            Ring +45 61 78 90 71
          </a>
        </div>
      </div>
    </section>
  );
}

function Bund() {
  return (
    <footer className="px-6 sm:px-10 py-6 border-t" style={{ background: 'var(--fp-green)', borderColor: 'rgba(255,255,255,0.15)' }}>
      <div
        className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center sm:justify-between gap-4 text-[12px] text-center sm:text-left"
        style={{ color: 'rgba(255,255,255,0.75)' }}
      >
        <div className="leading-relaxed">
          © 365ejendom <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          Boligselskabet Sommerhave ApS <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          Naestved <span className="hidden sm:inline">·</span><br className="sm:hidden" />
          CVR 41763736
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-8">
          <a href="https://365ejendom.dk/privacy-policy/" className="hover:text-white transition-colors">Privatliv</a>
          <a href="https://365ejendom.dk" className="hover:text-white transition-colors">365ejendom.dk</a>
        </div>
      </div>
    </footer>
  );
}

// ── Resultatdele ─────────────────────────────────────────────────────────

function Side({
  titel,
  rækker,
  sum,
  ydelse,
  fod,
  netto,
  nettoLabel,
}: {
  titel: string;
  rækker: Array<{ l: string; v: number }>;
  sum: number;
  /** Boligydelse, der trækkes fra (kun for lejere). Udelades, når støtten er et lån. */
  ydelse?: number;
  fod?: React.ReactNode;
  netto: number;
  nettoLabel: string;
}) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase pb-1" style={{ color: C.muted, fontWeight: 600 }}>
        {titel}
      </div>
      <div>
        {rækker.map((x) => (
          <Linje key={x.l} label={x.l} vaerdi={x.v} />
        ))}
        <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 4 }}>
          <Linje label="Udgifter i alt" vaerdi={sum} fed />
        </div>
        {ydelse !== undefined && <Linje label="Boligydelse (skøn, tilskud)" vaerdi={ydelse} fortegn="−" />}
        <div className="rounded-lg px-3 mt-2" style={{ background: C.mintSoft }}>
          <Linje label={nettoLabel} vaerdi={netto} fed />
        </div>
        {fod}
      </div>
    </div>
  );
}

function Noter({ y, over, laan }: { y: YdelseResultat; over: boolean; laan?: boolean }) {
  const noter: string[] = [];
  if (laan) {
    noter.push(
      'Som ejer får du boligydelsen som et lån. Det forrentes med Nationalbankens diskonto, har pant i boligen og skal betales tilbage med renter, når du sælger. Som lejer er den et tilskud, du ikke skal betale tilbage.',
    );
  }
  if (y.begraenset === 'under-minimum') {
    noter.push('Boligydelsen som lejer bliver under 365 kr. om måneden, og så udbetales den ikke.');
  }
  if (y.begraenset === 'ingen-ydelse') {
    noter.push('Med de tal får du ikke boligydelse som lejer. Det skyldes som regel indkomsten eller formuen.');
  }
  if (y.begraenset === 'maksimum') {
    noter.push(`Du får den højeste boligydelse, ${fmt.format(SATSER.maxYdelse / 12)} kr. om måneden.`);
  }
  if (y.arealBeskaaret) {
    noter.push(
      `Lejeboligen er større end ${y.arealTilladt} m². Boligstøtten regnes kun af ${y.arealTilladt} m², så en stor bolig giver ikke mere i støtte.`,
    );
  }
  if (y.loftBrugt) {
    noter.push(`Boligudgiften regnes højst med ${fmt.format(SATSER.maxBoligudgift)} kr. om året.`);
  }
  if (y.formuetillaeg > 0) {
    noter.push(
      `Din formue lægger ${kr(y.formuetillaeg / 12)} om måneden oven i din indkomst. Det trækker boligydelsen ned.`,
    );
  }
  if (over) {
    noter.push(
      'Huslejen er over halvdelen af indkomsten. Så vurderer Udbetaling Danmark din samlede økonomi, før de beslutter, om du får boligydelse (boligstøtteloven § 15).',
    );
  }
  noter.push(
    'Sælger du din bolig og lejer en anden, kan Udbetaling Danmark vurdere, om lejeaftalen er lavet for at få boligstøtte (§ 15). Er huslejen højere end normalt for en tilsvarende bolig, kan de sætte den ned (§ 11).',
  );
  noter.push('Boligydelsen er skattefri.');

  return (
    <div className="bg-white rounded-xl px-5 sm:px-7 py-5 space-y-2.5" style={{ border: C.kantKort }}>
      <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: C.muted, fontWeight: 600 }}>
        Godt at vide
      </div>
      <ul className="space-y-2.5">
        {noter.map((n) => (
          <li key={n} className="text-[14px] leading-[1.6] flex gap-2.5" style={{ color: C.ink }}>
            <span aria-hidden style={{ color: C.soft }}>
              ·
            </span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Regnestykke({ titel, y, formue }: { titel: string; y: YdelseResultat; formue: number }) {
  const rad = (l: string, v: string, fed = false) => (
    <div className="flex items-baseline justify-between gap-4 py-[5px] text-[14px]" style={{ fontWeight: fed ? 600 : 400 }}>
      <span style={{ color: fed ? C.ink : C.muted }}>{l}</span>
      <span className="tabular-nums whitespace-nowrap" style={{ color: C.ink }}>
        {v}
      </span>
    </div>
  );
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase pb-1" style={{ color: C.muted, fontWeight: 600 }}>
        {titel}
      </div>
      {rad('Boligudgift om året', kr(y.boligudgiftRaa))}
      {y.arealBeskaaret && rad(`Efter arealloft (${y.arealTilladt} m²)`, kr(y.boligudgift))}
      {y.loftBrugt && rad('Efter loft', kr(y.boligudgift))}
      {rad(`+ tillæg ${fmt.format(SATSER.tillaeg)} kr. · ${SATSER.andel * 100} %`, kr(y.grundbeloeb))}
      {rad('Formue', `${minus(formue)}${kr(formue)}`)}
      {rad('Formuetillæg til indkomsten', kr(y.formuetillaeg))}
      {rad('Indkomst inkl. formuetillæg', kr(y.indkomstInklFormue))}
      {rad(`− 22,5 % over ${fmt.format(SATSER.indkomstgraense)} kr.`, kr(y.reduktion))}
      {rad('Beregnet boligydelse', `${minus(y.beregnet)}${kr(y.beregnet)}`)}
      {rad('Mindste egenbetaling', kr(y.egenbetalingMin))}
      {rad('Højeste boligydelse', kr(SATSER.maxYdelse))}
      <div style={{ borderTop: `1px solid ${C.rule}`, marginTop: 6 }} />
      {rad('Boligydelse om året', kr(y.ydelseAar), true)}
      {rad('Boligydelse pr. måned', kr(y.ydelseMd), true)}
    </div>
  );
}
