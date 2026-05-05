'use client';

import { useState, useTransition } from 'react';
import { setReviewStatusAction, type ReviewStatus } from './actions';

const OPTIONS: Array<{ value: ReviewStatus; label: string; emoji: string; cls: string }> = [
  { value: 'ny', label: 'Ny', emoji: '🆕', cls: 'bg-slate-100 border-slate-300 text-slate-700' },
  { value: 'interesseret', label: 'Interesseret', emoji: '👀', cls: 'bg-blue-100 border-blue-400 text-blue-800' },
  { value: 'passet', label: 'Passet', emoji: '👋', cls: 'bg-slate-200 border-slate-400 text-slate-600' },
  { value: 'købt', label: 'Købt', emoji: '🎉', cls: 'bg-emerald-100 border-emerald-500 text-emerald-800' },
];

export function ReviewStatusForm({
  id,
  current,
  currentNote,
}: {
  id: string;
  current: ReviewStatus;
  currentNote: string | null;
}) {
  const [status, setStatus] = useState<ReviewStatus>(current);
  const [note, setNote] = useState(currentNote ?? '');
  const [pending, startTransition] = useTransition();

  function pick(next: ReviewStatus) {
    setStatus(next);
    startTransition(async () => {
      await setReviewStatusAction({ id, reviewStatus: next, reviewNote: note || null });
    });
  }

  function saveNote() {
    startTransition(async () => {
      await setReviewStatusAction({ id, reviewStatus: status, reviewNote: note || null });
    });
  }

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-sm">📋 Min review-status</h2>
        {pending && <span className="text-xs text-slate-400">gemmer…</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                active ? opt.cls + ' shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          );
        })}
      </div>
      <div>
        <label className="block">
          <span className="text-xs text-slate-500 block mb-1">Note (valgfri — fx hvorfor passet)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            rows={2}
            placeholder="Fx 'For dyr' eller 'Tilbud sendt 2026-05-12'"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>
      </div>
    </section>
  );
}
