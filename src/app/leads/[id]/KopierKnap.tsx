'use client';

import { useState } from 'react';

export function KopierKnap({ tekst, label = 'Kopier' }: { tekst: string; label?: string }) {
  const [kopieret, setKopieret] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(tekst);
          setKopieret(true);
          setTimeout(() => setKopieret(false), 1800);
        } catch {
          /* clipboard kan være blokeret; teksten står stadig på siden */
        }
      }}
      className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 text-slate-700"
    >
      {kopieret ? '✓ Kopieret' : label}
    </button>
  );
}
