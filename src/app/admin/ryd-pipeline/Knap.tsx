'use client';

import { useState, useTransition } from 'react';
import { rydPipelineAction } from './actions';

export function RydKnap({ antal }: { antal: number }) {
  const [pending, start] = useTransition();
  const [svar, setSvar] = useState<{ arkiveret: number; tilNyLead: number } | null>(null);
  const [bekraeft, setBekraeft] = useState(false);

  if (svar) {
    return (
      <p className="text-sm font-medium text-teal-800">
        Færdig: {svar.arkiveret} leads arkiveret · {svar.tilNyLead} flyttet til Ny lead.
      </p>
    );
  }
  if (!bekraeft) {
    return (
      <button
        onClick={() => setBekraeft(true)}
        disabled={antal === 0}
        className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium disabled:opacity-40"
      >
        Arkivér {antal} leads
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => start(async () => setSvar(await rydPipelineAction()))}
        disabled={pending}
        className="px-4 py-2.5 rounded-lg bg-amber-700 text-white text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Arkiverer…' : `Ja, arkivér ${antal} leads nu`}
      </button>
      <button onClick={() => setBekraeft(false)} className="text-sm text-slate-500 underline underline-offset-2">
        Fortryd
      </button>
    </div>
  );
}
