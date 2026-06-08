'use client';

/**
 * EstimatV3 — climax screen.
 *
 * Sektioner:
 *   1. Pris-card (sort) — bud + "bindende efter besigtigelse"
 *   2. "Hvad du faktisk får i hånden" — comparative split-bar 365 vs maegler
 *   3. Naeste skridt — Ring direkte / Eller skriv CTA
 *
 * Overtagelse-slider fjernet maj 2026: gav ikke mening paa foreloebig
 * estimat-side. Bruger har allerede valgt overtagelse paa step 4 (Hvornaar
 * flytter); detaljer faar de paa besigtigelse.
 *
 * SUBMIT ved mount (juni 2026): tidligere ramte estimat-skaermen kun
 * client-side — ingen lead i DB, ingen email. Nu firer vi submitFunnelAction
 * ved foerste mount per address (idempotent via localStorage key).
 */
import { useEffect, useRef, useState } from 'react';
import { useFunnelV3 } from '../FunnelV3Context';
import { submitFunnelAction } from '../../salg/submit-action';

const TEAL = 'oklch(0.35 0.045 200)';
const SUBMIT_KEY = 'salg.v3.submitted';

type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; leadId: string | null }
  | { status: 'error'; error: string }
  | { status: 'already' };

export function EstimatV3() {
  const { state, reset } = useFunnelV3();
  const submittedRef = useRef(false);
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Mangler kontakt-data → kan ikke submitte. Bruger har sandsynligvis hoppet
    // direkte til estimat via dev-tools; vi ignorerer stille.
    if (!state.fullName || !state.email || !state.phone) return;
    if (!state.postalCode || !state.kvm) return;

    // Idempotency: sammensaet noegle fra adresse + email saa samme bruger ikke
    // submitter flere gange ved page-reload. Hvis adressen aendres, faar de
    // et nyt submit.
    const idemKey = `${state.fullAddress || state.postalCode}|${state.email}`;
    try {
      const prev = localStorage.getItem(SUBMIT_KEY);
      if (prev === idemKey) {
        setSubmit({ status: 'already' });
        return;
      }
    } catch {}

    setSubmit({ status: 'sending' });
    (async () => {
      try {
        const r = await submitFunnelAction(state, []);
        if (r.ok) {
          try {
            localStorage.setItem(SUBMIT_KEY, idemKey);
          } catch {}
          setSubmit({ status: 'sent', leadId: r.leadId ?? null });
        } else {
          setSubmit({ status: 'error', error: r.error || 'Ukendt fejl' });
        }
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        setSubmit({ status: 'error', error: m });
      }
    })();
  }, [state]);

  // Beregn bud
  const bud = state.kvm
    ? Math.round((state.kvm ?? 60) * (state.postalCode === '2630' ? 18000 : 14000) * 0.85)
    : 945000;

  const maeglerSalaer = 70000;
  const markedAfslag = Math.round(bud * 0.07);
  const driftSalg = Math.max(1, Math.round(((state.costFaellesudgifter || 24000) / 12) * 3 - 6000));
  const maeglerEkvivalent = bud + maeglerSalaer + markedAfslag + driftSalg;

  const fmt = (n: number) => n.toLocaleString('da-DK');

  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-16 sm:space-y-24">
        {/* Header */}
        <header className="space-y-4">
          <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">
            dit foreløbige tilbud
          </p>
          <h1
            className="font-display ink text-[clamp(36px,5vw,56px)] leading-[1.0] tracking-[-0.025em] text-balance"
            style={{ fontWeight: 400 }}
          >
            {state.fullAddress || '—'}
          </h1>
        </header>

        {/* Pris-card */}
        <section
          className="rounded-[14px] p-10 sm:p-16 text-center space-y-4 shadow-lift"
          style={{
            background: 'var(--ink)',
            color: 'var(--cream)',
          }}
        >
          <p className="font-body text-[12px] tracking-[0.2em] uppercase" style={{ color: 'oklch(0.62 0.022 80 / 0.7)' }}>
            vores tilbud kontant
          </p>
          <div
            className="font-display font-tabular leading-[0.92] tracking-[-0.04em]"
            style={{
              fontSize: 'clamp(64px, 11vw, 128px)',
              fontWeight: 400,
              fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 400",
            }}
          >
            {fmt(bud)}{' '}
            <span
              className="font-body align-baseline"
              style={{
                fontSize: '0.32em',
                fontWeight: 300,
                color: 'oklch(0.62 0.022 80 / 0.6)',
                letterSpacing: '0.02em',
              }}
            >
              kr
            </span>
          </div>
          <p className="font-body text-[13px]" style={{ color: 'oklch(0.62 0.022 80 / 0.55)' }}>
            Bindende tilbud gives efter gratis besigtigelse.
          </p>
        </section>

        {/* Hvad du sparer — comparative bar */}
        <section className="space-y-8">
          <div className="space-y-2">
            <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">sammenligning</p>
            <h2
              className="font-display ink text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.02em]"
              style={{ fontWeight: 400 }}
            >
              Hvad du{' '}
              <em
                className="accent"
                style={{
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                  fontStyle: 'italic',
                }}
              >
                faktisk får
              </em>{' '}
              i hånden.
            </h2>
          </div>

          <ComparativeBar
            bud={bud}
            maeglerSalaer={maeglerSalaer}
            markedAfslag={markedAfslag}
            driftSalg={driftSalg}
            maeglerEkvivalent={maeglerEkvivalent}
          />
        </section>

        {/* Næste skridt */}
        <section
          className="rounded-[14px] p-10 sm:p-14 text-center space-y-6 shadow-card"
          style={{
            background: 'var(--cream-deep)',
            color: 'var(--ink)',
          }}
        >
          <h3
            className="font-display ink text-[clamp(28px,3.5vw,40px)] leading-[1.1] tracking-[-0.02em] text-balance"
            style={{ fontWeight: 400 }}
          >
            Vi ringer{' '}
            <em
              className="accent"
              style={{
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                fontStyle: 'italic',
              }}
            >
              inden 24 timer.
            </em>
          </h3>
          <p className="font-body text-[15px] muted max-w-md mx-auto leading-[1.6]">
            For at aftale en gratis besigtigelse. Efter besigtigelsen giver vi et endeligt bindende tilbud.
          </p>
          {(submit.status === 'sent' || submit.status === 'already') && (
            <p className="font-body text-[13px] accent flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Tilbud sendt på {state.email}
            </p>
          )}
          {submit.status === 'sending' && (
            <p className="font-body text-[13px] soft">Sender bekræftelse til {state.email}…</p>
          )}
          {submit.status === 'error' && (
            <p className="font-body text-[13px]" style={{ color: 'oklch(0.55 0.15 25)' }}>
              Kunne ikke sende mail-bekræftelse ({submit.error}) — vi har stadig dine oplysninger og ringer alligevel.
            </p>
          )}
          <div className="pt-2 flex flex-wrap gap-3 justify-center">
            <a
              href="tel:+4589876634"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-body text-[14px] active:scale-[0.97] transition-transform"
              style={{
                background: 'var(--ink)',
                color: 'var(--cream)',
                fontWeight: 500,
              }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
              Ring direkte
            </a>
            <a
              href="mailto:administration@365ejendom.dk"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-body text-[14px] active:scale-[0.97] transition-transform border border-warm"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                fontWeight: 500,
              }}
            >
              Eller skriv
            </a>
          </div>
        </section>

        {/* Reset */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => reset()}
            className="font-body text-[13px] muted hover:ink transition-colors underline-offset-4 hover:underline"
          >
            Beregn et nyt estimat
          </button>
        </div>
      </main>
    </div>
  );
}


// ─── Comparative Bar (365 vs mægler) ───────────────────────────────────────
function ComparativeBar({
  bud,
  maeglerSalaer,
  markedAfslag,
  driftSalg,
  maeglerEkvivalent,
}: {
  bud: number;
  maeglerSalaer: number;
  markedAfslag: number;
  driftSalg: number;
  maeglerEkvivalent: number;
}) {
  const fmt = (n: number) => n.toLocaleString('da-DK');
  const totalSaved = maeglerSalaer + markedAfslag + driftSalg;

  return (
    <div className="space-y-6">
      {/* Visual stack bar */}
      <div className="relative">
        <div className="flex items-stretch h-20 rounded-[10px] overflow-hidden shadow-soft" style={{ background: 'var(--paper)' }}>
          {/* 365 bud-bar */}
          <div
            className="flex items-center justify-start px-4 sm:px-6 relative"
            style={{
              width: `${(bud / maeglerEkvivalent) * 100}%`,
              background: TEAL,
              color: 'var(--cream)',
              transitionProperty: 'width',
              transitionDuration: '600ms',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            <div>
              <div className="font-body text-[10.5px] tracking-[0.18em] uppercase" style={{ color: 'oklch(0.95 0.025 200 / 0.75)' }}>
                kontant til dig
              </div>
              <div
                className="font-display font-tabular leading-none mt-1"
                style={{
                  fontSize: 'clamp(20px, 2.5vw, 28px)',
                  fontWeight: 500,
                }}
              >
                {fmt(bud)} kr
              </div>
            </div>
          </div>
          {/* Mægler-omkostninger */}
          <div
            className="flex-1 flex items-center justify-end px-4 sm:px-6"
            style={{
              background: 'var(--cream-deep)',
            }}
          >
            <div className="text-right">
              <div className="font-body text-[10.5px] tracking-[0.18em] uppercase soft">
                væk via mægler
              </div>
              <div className="font-display font-tabular ink text-[18px] sm:text-[20px] leading-none mt-1" style={{ fontWeight: 500 }}>
                {fmt(totalSaved)} kr
              </div>
            </div>
          </div>
        </div>

        {/* Total under bar */}
        <div className="flex justify-between items-baseline mt-4 font-body text-[12px] muted">
          <span>0 kr</span>
          <span>
            mægler-pris{' '}
            <span className="font-tabular ink" style={{ fontWeight: 600 }}>
              {fmt(maeglerEkvivalent)} kr
            </span>
          </span>
        </div>
      </div>

      {/* Stack breakdown */}
      <div className="grid sm:grid-cols-3 gap-px bg-warm rounded-[10px] overflow-hidden" style={{ background: 'var(--border)' }}>
        {[
          {
            label: 'Mæglersalær',
            amount: maeglerSalaer,
            detail: 'Vi tager intet salær.',
          },
          {
            label: 'Markedsafslag',
            amount: markedAfslag,
            detail: 'Mægler-pris ligger typisk 6-8% under listepris.',
          },
          {
            label: 'Drift i salgsperioden',
            amount: driftSalg,
            detail: '3 mdr ejerudgifter ingen lejeindtægt.',
          },
        ].map((row) => (
          <div key={row.label} className="bg-paper p-5 sm:p-6 space-y-2">
            <div className="font-body text-[10.5px] tracking-[0.18em] uppercase soft">
              {row.label}
            </div>
            <div className="font-display font-tabular ink text-[24px] sm:text-[28px] leading-none" style={{ fontWeight: 500 }}>
              {fmt(row.amount)} kr
            </div>
            <p className="font-body text-[12.5px] muted leading-[1.5] pt-1">
              {row.detail}
            </p>
          </div>
        ))}
      </div>

      <p className="font-body text-[12.5px] soft leading-[1.6] max-w-md">
        Vi betaler kontant. Ingen ventetid, ingen bank-forbehold, ingen mæglerprovision.
      </p>
    </div>
  );
}
