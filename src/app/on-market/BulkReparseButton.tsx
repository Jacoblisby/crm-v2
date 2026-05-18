'use client';

/**
 * BulkReparseButton — trigger bulk re-parse af ALLE on-market candidates
 * der har en pdf_url. Bruges efter parser-koden er forbedret og vi vil
 * opdatere hele DB'en med nye (rigtige) tal.
 *
 * Viser confirmation, progress og result-summary.
 */
import { useState, useTransition } from 'react';
import { bulkReparsePdfAction } from './[id]/actions';

interface Result {
  total: number;
  parsed: number;
  failed: number;
  errors: string[];
  durationSeconds: number;
}

export function BulkReparseButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  function onConfirm() {
    setShowConfirm(false);
    setResult(null);
    setError(null);
    startTransition(async () => {
      const r = await bulkReparsePdfAction();
      if (r.ok) {
        setResult({
          total: r.total,
          parsed: r.parsed,
          failed: r.failed,
          errors: r.errors,
          durationSeconds: r.durationSeconds,
        });
      } else {
        setError('bulk-reparse fejlede');
      }
    });
  }

  if (showConfirm) {
    return (
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300 rounded px-3 py-1.5">
        <span className="text-xs text-amber-900">
          Re-parse alle PDFs? Tager ~3-5 min for 188 cases.
        </span>
        <button
          onClick={onConfirm}
          className="text-xs px-2 py-0.5 rounded bg-amber-700 text-white hover:bg-amber-800"
        >
          Kør
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-xs text-slate-600 hover:text-slate-900"
        >
          Annullér
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={pending}
        className="text-xs px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50"
      >
        {pending ? '⏳ Re-parser alle…' : '🔄 Re-parse alle PDFs'}
      </button>
      {result && (
        <div className="text-xs text-emerald-800">
          ✓ {result.parsed}/{result.total} re-parsed ·{' '}
          {result.failed > 0 && (
            <span className="text-amber-800">{result.failed} fejlede · </span>
          )}
          {result.durationSeconds}s
        </div>
      )}
      {error && <div className="text-xs text-red-700">⚠️ {error}</div>}
      {result?.errors.length ? (
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer">vis fejl</summary>
          <ul className="mt-1 space-y-0.5">
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
