'use client';

import { useState } from 'react';

/**
 * Kalder better-auths eget magic-link-endpoint direkte, så der ikke skal
 * installeres en klient-pakke for én formular.
 *
 * Kvitteringen er den samme uanset udfald — også hvis serveren svarer fejl.
 * Ellers kunne man taste adresser ind og aflæse på svaret, hvem der er
 * ansat. Rigtige fejl havner i serverloggen, hvor de hører hjemme.
 */
export function LoginForm({ videre }: { videre: string }) {
  const [email, setEmail] = useState('');
  const [tilstand, setTilstand] = useState<'klar' | 'sender' | 'sendt'>('klar');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setTilstand('sender');

    try {
      await fetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), callbackURL: videre }),
      });
    } catch {
      // Med vilje tavs — se noten ovenfor.
    }
    setTilstand('sendt');
  }

  if (tilstand === 'sendt') {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="font-medium text-slate-900">Tjek din indbakke</div>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Er <span className="text-slate-700">{email}</span> på den interne liste,
          ligger der nu et link. Det udløber om fem minutter.
        </p>
        <button
          type="button"
          onClick={() => setTilstand('klar')}
          className="text-sm text-slate-500 underline underline-offset-2 mt-4 hover:text-slate-900"
        >
          Prøv en anden adresse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="flex flex-col gap-3">
      <label htmlFor="email" className="sr-only">
        Arbejdsmail
      </label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="dig@365ejendom.dk"
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-[15px]
                   focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={tilstand === 'sender'}
        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white text-[15px] font-medium
                   transition-[background-color,scale] active:scale-[0.98]
                   disabled:opacity-60 disabled:active:scale-100"
        style={{ transitionDuration: '150ms' }}
      >
        {tilstand === 'sender' ? 'Sender…' : 'Send login-link'}
      </button>
    </form>
  );
}
