'use client';

/**
 * Tjek din boligstøtte — for folkepensionister.
 *
 * Til venstre indtaster man, hvad man betaler for at eje i dag og hvad en lejebolig
 * koster. Til højre står regnestykket pr. måned: ejer i dag mod lejer, begge med
 * boligydelse trukket fra. Regnereglerne ligger i src/lib/boligstoette.ts.
 *
 * Siden åbner med et eksempel, så regnestykket kan ses med det samme. Det er markeret
 * som eksempel, indtil man retter det første tal.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  SATSER,
  sammenlign,
  type Sammenligning,
  type Varme,
  type Vedligehold,
  type YdelseResultat,
} from '@/lib/boligstoette';
import { V4, EASE } from '../salg-v4/primitives';

const TELEFON = '61 78 90 71';
const LAGER = 'boligstoette-v1';

type Felter = {
  personer: 1 | 2;
  indkomstMd: string;
  oevrigFormue: string;
  // ejer
  areal: string;
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
  salgspris: string;
  // lejer
  huslejeMd: string;
  lejerAreal: string;
  lejerLoebendeMd: string;
  varme: Varme;
  varmtVandILeje: boolean;
  elILeje: boolean;
  vandSaerskilt: boolean;
  vedligehold: Vedligehold;
};

const EKSEMPEL: Felter = {
  personer: 1,
  indkomstMd: '17500',
  oevrigFormue: '150000',
  areal: '62',
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
  salgspris: '',
  huslejeMd: '7500',
  lejerAreal: '',
  lejerLoebendeMd: '',
  varme: 'saerskilt-fjernvarme-el-gas',
  varmtVandILeje: false,
  elILeje: false,
  vandSaerskilt: true,
  vedligehold: 'udlejer',
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
    <section className="bg-white rounded-[10px] p-5 sm:p-7 space-y-5" style={{ boxShadow: V4.cardShadow }}>
      <div className="flex items-baseline gap-3">
        {nr && (
          <span className="text-[13px] tabular-nums" style={{ color: V4.soft, fontWeight: 500 }}>
            {nr}
          </span>
        )}
        <h2 className="text-[21px] sm:text-[24px]" style={{ color: V4.ink }}>
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
      <label htmlFor={id} className="block text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>
        {label}
      </label>
      <div
        className="flex items-center rounded-[8px] bg-white px-4 h-[54px] focus-within:ring-2"
        style={{ border: `1px solid ${V4.ruleStrong}`, ['--tw-ring-color' as string]: V4.cta }}
      >
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          value={vist}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className="flex-1 min-w-0 bg-transparent outline-none text-[18px] tabular-nums"
          style={{ color: V4.ink }}
        />
        <span className="text-[15px] pl-3" style={{ color: V4.muted }}>
          {enhed}
        </span>
      </div>
      {hint && (
        <p className="text-[13px] leading-[1.5]" style={{ color: V4.muted }}>
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
      <div className="text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>
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
              className="rounded-full px-4 min-h-[44px] text-[15px] text-left"
              style={{
                background: valgt ? V4.green : '#fff',
                color: valgt ? '#fff' : V4.ink,
                border: `1px solid ${valgt ? V4.green : V4.ruleStrong}`,
                transition: `background-color 160ms ${EASE}, color 160ms ${EASE}`,
              }}
            >
              {m.tekst}
            </button>
          );
        })}
      </div>
      {hint && (
        <p className="text-[13px] leading-[1.5]" style={{ color: V4.muted }}>
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
      className="rounded-full px-4 min-h-[44px] text-[15px] text-left inline-flex items-center gap-2"
      style={{
        background: valgt ? V4.green : '#fff',
        color: valgt ? '#fff' : V4.ink,
        border: `1px solid ${valgt ? V4.green : V4.ruleStrong}`,
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
      style={{ color: dim ? V4.soft : V4.ink, fontWeight: fed ? 600 : 400 }}
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

  const r: Sammenligning = useMemo(
    () =>
      sammenlign({
        personer: f.personer,
        indkomstMd: tal(f.indkomstMd),
        oevrigFormue: tal(f.oevrigFormue),
        salgspris: tal(f.salgspris),
        ejer: {
          areal: tal(f.areal),
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
          huslejeMd: tal(f.huslejeMd),
          areal: f.lejerAreal === '' ? tal(f.areal) : tal(f.lejerAreal),
          varme: f.varme,
          varmtVandILeje: f.varmtVandILeje,
          elILeje: f.elILeje,
          vandSaerskilt: f.vandSaerskilt,
          vedligehold: f.vedligehold,
          loebendeMd: f.lejerLoebendeMd === '' ? tal(f.varmeVandElMd) : tal(f.lejerLoebendeMd),
        },
      }),
    [f],
  );

  const startForfra = () => {
    try {
      localStorage.removeItem(LAGER);
    } catch {
      /* ingen lager */
    }
    setF(EKSEMPEL);
    setEksempel(true);
  };

  const billigereSomLejer = r.forskelMd >= 0;
  const forskel = Math.abs(r.forskelMd);

  return (
    <div className="bs-root min-h-screen">
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <a href="/frontpage" className="inline-flex items-center" aria-label="365 Ejendomme, til forsiden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/365-ejendomme.png" alt="365 Ejendomme" width={38} height={44} className="h-[44px] w-auto" />
        </a>
        <a
          href={`tel:${TELEFON.replace(/\s/g, '')}`}
          className="text-[15px] underline hover:no-underline tabular-nums"
          style={{ color: V4.green, fontWeight: 500 }}
        >
          Ring {TELEFON}
        </a>
      </header>

      <main className="px-5 sm:px-8 pb-24 max-w-[1180px] mx-auto">
        <div className="max-w-[640px] pt-4 pb-9 space-y-4">
          <div className="text-[12px] tracking-[0.18em] uppercase" style={{ color: V4.ink, fontWeight: 500 }}>
            Boligstøtte
          </div>
          <h1 className="text-[34px] sm:text-[46px]" style={{ color: V4.ink }}>
            Hvad får du i boligstøtte, hvis du lejer?
          </h1>
          <p className="text-[17px] leading-[1.65]" style={{ color: V4.muted }}>
            Til dig, der modtager folkepension. Skriv, hvad du betaler for at eje i dag, og hvad en lejebolig koster.
            Så ser du begge dele pr. måned, efter boligstøtten er trukket fra.
          </p>
          {!eksempel && (
            <button
              type="button"
              onClick={startForfra}
              className="text-[14px] underline hover:no-underline"
              style={{ color: V4.muted }}
            >
              Start forfra
            </button>
          )}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-6 lg:gap-8 items-start">
          {/* ── Indtastning ───────────────────────────────────────────── */}
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
                hint="Bank, aktier og bil. Pension tæller ikke med. Boligens friværdi regner vi selv med."
                value={f.oevrigFormue}
                onChange={(v) => sæt('oevrigFormue', v)}
              />
            </Kort>

            <Kort nr="2" titel="Det betaler du for at eje i dag">
              <div className="grid sm:grid-cols-2 gap-5">
                <Felt id="areal" label="Boligens størrelse" enhed="m²" value={f.areal} onChange={(v) => sæt('areal', v)} />
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

            <Kort nr="3" titel="Hvis du lejer">
              <div className="grid sm:grid-cols-2 gap-5">
                <Felt id="husleje" label="Husleje pr. måned" value={f.huslejeMd} onChange={(v) => sæt('huslejeMd', v)} />
                <Felt
                  id="lejer-areal"
                  label="Lejeboligens størrelse"
                  enhed="m²"
                  hint="Tom = samme som din bolig."
                  placeholder={f.areal}
                  value={f.lejerAreal}
                  onChange={(v) => sæt('lejerAreal', v)}
                />
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
                <div className="text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>
                  Hvad er med i huslejen?
                </div>
                <div className="flex flex-wrap gap-2">
                  <Til label="Varmt vand" valgt={f.varmtVandILeje} onChange={(v) => sæt('varmtVandILeje', v)} />
                  <Til label="El" valgt={f.elILeje} onChange={(v) => sæt('elILeje', v)} />
                  <Til
                    label="Vand er ikke med"
                    valgt={f.vandSaerskilt}
                    onChange={(v) => sæt('vandSaerskilt', v)}
                  />
                </div>
              </div>
              <Felt
                id="lejer-loebende"
                label="Varme, vand og el pr. måned ud over huslejen"
                hint="Tom = samme beløb, som du betaler i dag."
                placeholder={f.varmeVandElMd}
                value={f.lejerLoebendeMd}
                onChange={(v) => sæt('lejerLoebendeMd', v)}
              />
              <details className="group">
                <summary className="cursor-pointer text-[15px] underline hover:no-underline" style={{ color: V4.green, fontWeight: 500 }}>
                  Flere valg
                </summary>
                <div className="pt-4 space-y-5">
                  <Felt
                    id="salgspris"
                    label="Hvad du får for din bolig"
                    hint="Pengene tæller med i din formue, når du har solgt. Tom = den offentlige vurdering."
                    placeholder={f.vurdering}
                    value={f.salgspris}
                    onChange={(v) => sæt('salgspris', v)}
                  />
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
          </div>

          {/* ── Resultat ──────────────────────────────────────────────── */}
          <aside id="resultat" aria-live="polite" className="lg:sticky lg:top-6 space-y-5">
            <div className="bg-white rounded-[10px] overflow-hidden" style={{ boxShadow: V4.cardShadow }}>
              <div className="px-5 sm:px-7 pt-6 pb-5" style={{ background: V4.mint }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.greenDeep, fontWeight: 600 }}>
                    Pr. måned
                  </div>
                  {eksempel && (
                    <span
                      className="text-[11px] tracking-[0.1em] uppercase rounded-full px-2.5 py-1"
                      style={{ background: '#fff', color: V4.greenDeep, fontWeight: 600 }}
                    >
                      Eksempel
                    </span>
                  )}
                </div>
                <div className="pt-3 text-[15px]" style={{ color: V4.greenDeep }}>
                  Som lejer betaler du ca.
                </div>
                <div className="text-[40px] sm:text-[46px] leading-[1.05] tabular-nums" style={{ color: V4.ink, fontWeight: 300 }}>
                  {kr(forskel)}
                </div>
                <div className="pt-1 text-[17px]" style={{ color: V4.greenDeep, fontWeight: 500 }}>
                  {Math.round(forskel) === 0 ? 'det samme som i dag' : billigereSomLejer ? 'mindre end i dag' : 'mere end i dag'}
                </div>
                <div className="pt-3 text-[14px] tabular-nums" style={{ color: V4.greenDeep }}>
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
                  ydelse={r.ejer.boligydelseMd}
                  netto={r.ejer.nettoMd}
                  nettoLabel="Du betaler som ejer"
                />
                <div style={{ borderTop: `1px solid ${V4.rule}` }} />
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

            <Noter r={r} />

            <details className="bg-white rounded-[10px] px-5 sm:px-7 py-4" style={{ boxShadow: V4.cardShadow }}>
              <summary className="cursor-pointer text-[15px]" style={{ color: V4.ink, fontWeight: 500 }}>
                Sådan er boligydelsen regnet
              </summary>
              <div className="pt-4 space-y-6">
                <Regnestykke titel="Som ejer" y={r.ejer.detaljer} formue={r.ejer.formue} />
                <Regnestykke titel="Som lejer" y={r.lejer.detaljer} formue={r.lejer.formue} />
              </div>
            </details>

            <div className="bg-white rounded-[10px] p-5 sm:p-7 space-y-4" style={{ boxShadow: V4.cardShadow }}>
              <h2 className="text-[20px]" style={{ color: V4.ink }}>
                Vil du vide, hvad din bolig er værd?
              </h2>
              <p className="text-[15px] leading-[1.6]" style={{ color: V4.muted }}>
                Få et foreløbigt kontantbud på to minutter. Det er gratis, og du forpligter dig ikke til noget.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/tjek-din-pris"
                  className="inline-flex items-center justify-center rounded-full px-6 min-h-[48px] text-[16px]"
                  style={{ background: V4.green, color: '#fff', fontWeight: 500 }}
                >
                  Tjek din pris
                </a>
                <a
                  href={`tel:${TELEFON.replace(/\s/g, '')}`}
                  className="inline-flex items-center justify-center rounded-full px-6 min-h-[48px] text-[16px] tabular-nums"
                  style={{ border: `1px solid ${V4.green}`, color: V4.green, fontWeight: 500 }}
                >
                  Ring {TELEFON}
                </a>
              </div>
            </div>
          </aside>
        </div>

        <a
          href="#resultat"
          className="lg:hidden fixed left-4 right-4 bottom-4 z-20 rounded-full px-5 min-h-[52px] flex items-center justify-between gap-3 text-[15px]"
          style={{ background: V4.green, color: '#fff', boxShadow: '0 10px 30px -8px rgba(15,71,73,0.55)' }}
        >
          <span>{Math.round(forskel) === 0 ? 'Det samme som i dag' : billigereSomLejer ? 'Som lejer: mindre pr. md.' : 'Som lejer: mere pr. md.'}</span>
          <span className="tabular-nums" style={{ fontWeight: 600 }}>
            {kr(forskel)} ↓
          </span>
        </a>

        <p className="max-w-[760px] pt-10 text-[13px] leading-[1.65]" style={{ color: V4.muted }}>
          Regnestykket er vejledende og bygger på boligstøttelovens regler og satserne for {SATSER.aar}. Det er ikke en
          afgørelse og ikke rådgivning. Det er Udbetaling Danmark, der afgør, om du kan få boligydelse, og hvor meget. Du
          søger selv på borger.dk.
        </p>
      </main>
    </div>
  );
}

// ── Resultatdele ─────────────────────────────────────────────────────────

function Side({
  titel,
  rækker,
  sum,
  ydelse,
  netto,
  nettoLabel,
}: {
  titel: string;
  rækker: Array<{ l: string; v: number }>;
  sum: number;
  ydelse: number;
  netto: number;
  nettoLabel: string;
}) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase pb-1" style={{ color: V4.muted, fontWeight: 600 }}>
        {titel}
      </div>
      <div>
        {rækker.map((x) => (
          <Linje key={x.l} label={x.l} vaerdi={x.v} />
        ))}
        <div style={{ borderTop: `1px solid ${V4.rule}`, marginTop: 4 }}>
          <Linje label="Udgifter i alt" vaerdi={sum} fed />
        </div>
        <Linje label="Boligydelse (skøn)" vaerdi={ydelse} fortegn="−" />
        <div className="rounded-[8px] px-3 mt-2" style={{ background: V4.mintSoft }}>
          <Linje label={nettoLabel} vaerdi={netto} fed />
        </div>
      </div>
    </div>
  );
}

function Noter({ r }: { r: Sammenligning }) {
  const noter: string[] = [];
  if (r.lejer.detaljer.begraenset === 'under-minimum') {
    noter.push('Boligydelsen som lejer bliver under 365 kr. om måneden, og så udbetales den ikke.');
  }
  if (r.lejer.detaljer.begraenset === 'ingen-ydelse') {
    noter.push('Med de tal får du ikke boligydelse som lejer. Det skyldes som regel indkomsten eller formuen.');
  }
  if (r.lejer.detaljer.begraenset === 'maksimum') {
    noter.push(`Du får den højeste boligydelse, ${fmt.format(SATSER.maxYdelse / 12)} kr. om måneden.`);
  }
  if (r.lejer.detaljer.arealBeskaaret) {
    noter.push(
      `Lejeboligen er større end ${r.lejer.detaljer.arealTilladt} m². Boligstøtten regnes kun af ${r.lejer.detaljer.arealTilladt} m², så en stor bolig giver ikke mere i støtte.`,
    );
  }
  if (r.lejer.detaljer.loftBrugt) {
    noter.push(`Boligudgiften regnes højst med ${fmt.format(SATSER.maxBoligudgift)} kr. om året.`);
  }
  if (r.lejer.detaljer.formuetillaeg > 0) {
    noter.push(
      `Din formue lægger ${kr(r.lejer.detaljer.formuetillaeg / 12)} om måneden oven i din indkomst. Det trækker boligydelsen ned.`,
    );
  }
  if (r.huslejeOverHalvdelenAfIndkomst) {
    noter.push(
      'Huslejen er over halvdelen af indkomsten. Så vurderer Udbetaling Danmark din samlede økonomi, før de beslutter, om du får boligydelse (boligstøtteloven § 15).',
    );
  }
  noter.push(
    'Sælger du din bolig og lejer en anden, kan Udbetaling Danmark vurdere, om lejeaftalen er lavet for at få boligstøtte (§ 15). Er huslejen højere end normalt for en tilsvarende bolig, kan de sætte den ned (§ 11).',
  );
  noter.push('Boligydelsen er skattefri.');

  return (
    <div className="bg-white rounded-[10px] px-5 sm:px-7 py-5 space-y-2.5" style={{ boxShadow: V4.cardShadow }}>
      <div className="text-[11px] tracking-[0.16em] uppercase" style={{ color: V4.muted, fontWeight: 600 }}>
        Godt at vide
      </div>
      <ul className="space-y-2.5">
        {noter.map((n) => (
          <li key={n} className="text-[14px] leading-[1.6] flex gap-2.5" style={{ color: V4.ink }}>
            <span aria-hidden style={{ color: V4.soft }}>
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
      <span style={{ color: fed ? V4.ink : V4.muted }}>{l}</span>
      <span className="tabular-nums whitespace-nowrap" style={{ color: V4.ink }}>
        {v}
      </span>
    </div>
  );
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase pb-1" style={{ color: V4.muted, fontWeight: 600 }}>
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
      <div style={{ borderTop: `1px solid ${V4.rule}`, marginTop: 6 }} />
      {rad('Boligydelse om året', kr(y.ydelseAar), true)}
      {rad('Boligydelse pr. måned', kr(y.ydelseMd), true)}
    </div>
  );
}
