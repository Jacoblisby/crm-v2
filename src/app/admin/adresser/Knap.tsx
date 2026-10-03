'use client';

import { useState, useTransition } from 'react';
import { importerAction } from './actions';

export function Knap({ kommunekode, label }: { kommunekode?: string; label: string }) {
  const [pending, start] = useTransition();
  const [svar, setSvar] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() =>
          start(async () => {
            setSvar(null);
            const r = await importerAction(kommunekode);
            setSvar(r.ok ? `✅ ${r.skrevet?.toLocaleString('da-DK')} adresser` : `❌ ${r.fejl}`);
          })
        }
        disabled={pending}
        className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium"
      >
        {pending ? 'Henter…' : label}
      </button>
      {svar && <span className="text-xs">{svar}</span>}
    </span>
  );
}
