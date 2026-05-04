'use client';

import { useState, useTransition } from 'react';
import { setPdfUrlAction } from './actions';

interface Props {
  id: string;
  currentUrl: string | null;
  caseUrl: string | null;
  brokerKind: string | null;
}

export function PdfUrlForm({ id, currentUrl, caseUrl, brokerKind }: Props) {
  const [url, setUrl] = useState(currentUrl ?? '');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await setPdfUrlAction({ id, pdfUrl: url || null });
      if (r.ok) setMsg(url ? 'Gemt' : 'Ryddet');
      else setMsg(`Fejl: ${r.error}`);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2 text-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Salgsopstilling</h2>
        {currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          >
            📄 Hent PDF ↗
          </a>
        ) : (
          <span className="text-xs text-slate-500">ikke hentet endnu</span>
        )}
      </div>
      <p className="text-xs text-slate-600">
        Indsæt direkte PDF-URL fra mæglerens side. realmaeglerne hentes
        automatisk via cron 04:00; for {brokerKind ?? 'andre'} skal du finde
        URLen manuelt på{' '}
        {caseUrl ? (
          <a
            href={caseUrl}
            target="_blank"
            className="text-blue-700 hover:underline"
          >
            mæglerens side ↗
          </a>
        ) : (
          'mæglerens side'
        )}
        .
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
      {msg && <span className="text-xs text-emerald-700">{msg}</span>}
    </form>
  );
}
