'use client';

/**
 * LearningSessionPanel — interaktiv learning session UI.
 *
 * Flow:
 *   1. Bruger klikker "Koer learning session"
 *   2. Vi henter proposals fra server
 *   3. Hver proposal vises som card med Accept/Reject knapper
 *   4. Accept opdaterer learned_defaults + absorbere underliggende calibrations
 *   5. Reject markerer bare som absorberet (uden at opdatere defaults)
 *   6. Naar session er tom — vis "alle proposals haandteret" + close
 */
import { useState, useTransition } from 'react';
import {
  runLearningSessionAction,
  acceptProposalAction,
  rejectProposalAction,
} from './actions';
import type { Proposal } from '@/lib/learning-sessions';

const FIELD_LABELS: Record<string, string> = {
  lejeRatePerM2: 'Leje pr. m²/md',
  refurbPerSqm: 'Refurb pr. m²',
};

interface SessionState {
  sessionId: string;
  proposals: Proposal[];
  acceptedKeys: Set<string>;
  rejectedKeys: Set<string>;
}

export function LearningSessionPanel() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startSession() {
    setError(null);
    setSession(null);
    startTransition(async () => {
      const r = await runLearningSessionAction();
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSession({
        sessionId: r.sessionId,
        proposals: r.proposals,
        acceptedKeys: new Set(),
        rejectedKeys: new Set(),
      });
    });
  }

  function handleAccept(p: Proposal) {
    if (!session) return;
    startTransition(async () => {
      const r = await acceptProposalAction({ sessionId: session.sessionId, proposal: p });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSession({
        ...session,
        acceptedKeys: new Set([...session.acceptedKeys, p.proposalKey]),
      });
    });
  }

  function handleReject(p: Proposal) {
    if (!session) return;
    startTransition(async () => {
      const r = await rejectProposalAction({ sessionId: session.sessionId, proposal: p });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSession({
        ...session,
        rejectedKeys: new Set([...session.rejectedKeys, p.proposalKey]),
      });
    });
  }

  function closeSession() {
    setSession(null);
  }

  if (!session) {
    return (
      <div className="border border-violet-200 bg-violet-50 rounded-lg p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-violet-900">🧠 Learning session</h2>
            <p className="text-sm text-violet-800 mt-1">
              Koer en session for at analysere alle nye (uabsorberede) overrides og
              foreslaa opdaterede defaults pr. postnummer.
            </p>
          </div>
          <button
            type="button"
            onClick={startSession}
            disabled={pending}
            className="text-sm px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:bg-violet-300 text-white font-medium whitespace-nowrap"
          >
            {pending ? 'Analyserer…' : '🧠 Kør session'}
          </button>
        </div>
        {error && <div className="text-sm text-red-700">⚠️ {error}</div>}
      </div>
    );
  }

  const remaining = session.proposals.filter(
    (p) => !session.acceptedKeys.has(p.proposalKey) && !session.rejectedKeys.has(p.proposalKey),
  );

  if (session.proposals.length === 0) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-5 space-y-3">
        <h2 className="text-base font-semibold text-emerald-900">
          ✓ Session færdig — ingen signifikante afvigelser
        </h2>
        <p className="text-sm text-emerald-800">
          Alle dine overrides ligger inden for ±5% af de eksisterende defaults, eller
          der er ikke nok samples (min 3 pr. gruppe) til at lave et statistisk
          solidt forslag.
        </p>
        <button
          onClick={closeSession}
          className="text-sm px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          Luk
        </button>
      </div>
    );
  }

  return (
    <div className="border border-violet-200 bg-violet-50 rounded-lg p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-violet-900">
            🧠 Session i gang · {session.proposals.length} forslag
          </h2>
          <p className="text-sm text-violet-800 mt-1">
            {session.acceptedKeys.size} accepteret · {session.rejectedKeys.size} afvist ·{' '}
            {remaining.length} tilbage
          </p>
        </div>
        <button
          onClick={closeSession}
          className="text-xs text-violet-700 hover:text-violet-900 underline"
        >
          Luk session
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        {session.proposals.map((p) => {
          const accepted = session.acceptedKeys.has(p.proposalKey);
          const rejected = session.rejectedKeys.has(p.proposalKey);
          const handled = accepted || rejected;
          return (
            <div
              key={p.proposalKey}
              className={`bg-white rounded-lg border p-4 ${
                accepted
                  ? 'border-emerald-300 opacity-60'
                  : rejected
                    ? 'border-slate-300 opacity-50'
                    : 'border-violet-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">
                      {FIELD_LABELS[p.field] ?? p.field}
                    </span>
                    {p.postalCode && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Postnr {p.postalCode}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      n={p.sampleCount}
                    </span>
                    {p.source === 'learned' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        opdaterer eksisterende
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-700">{p.rationale}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500 tabular-nums">
                      {p.currentDefault.toLocaleString('da-DK')}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold tabular-nums text-violet-900">
                      {p.proposedValue.toLocaleString('da-DK')}
                    </span>
                    <span
                      className={`font-medium tabular-nums ${
                        p.deltaPct > 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      ({p.deltaPct > 0 ? '+' : ''}
                      {p.deltaPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {accepted ? (
                    <span className="text-xs px-3 py-1 rounded bg-emerald-100 text-emerald-800 font-medium">
                      ✓ Accepteret
                    </span>
                  ) : rejected ? (
                    <span className="text-xs px-3 py-1 rounded bg-slate-100 text-slate-600 font-medium">
                      Afvist
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAccept(p)}
                        disabled={pending || handled}
                        className="text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white font-medium"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(p)}
                        disabled={pending || handled}
                        className="text-xs px-3 py-1.5 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-300"
                      >
                        Afvis
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
