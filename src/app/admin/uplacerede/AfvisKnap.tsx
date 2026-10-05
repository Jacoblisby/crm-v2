'use client';

import { useTransition } from 'react';
import { afvisAction } from './actions';

export function AfvisKnap({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await afvisAction(id); })}
      disabled={pending}
      className="text-xs px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
    >
      {pending ? 'Fjerner…' : 'Fjern fra listen'}
    </button>
  );
}
