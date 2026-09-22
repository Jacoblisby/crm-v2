'use client';

/**
 * Hele mailen. Kundens nye tekst vises altid i fuld længde; den citerede
 * tråd under den (vores egen mail, som kunden svarede på) er foldet sammen.
 * Lange udgående mails foldes efter 6 linjer.
 */
import { useState } from 'react';
import { delCiteret } from '@/lib/mail-citat';

export function MailTekst({ body, indgaaende }: { body: string; indgaaende: boolean }) {
  const [citat, setCitat] = useState(false);
  const [hel, setHel] = useState(false);

  if (indgaaende) {
    const { nyt, citeret } = delCiteret(body);
    return (
      <div className="mt-1">
        <div className="text-sm text-slate-800 whitespace-pre-line break-words">{nyt}</div>
        {citeret && (
          <>
            <button type="button" onClick={() => setCitat((v) => !v)} className="mt-1.5 text-xs text-slate-500 hover:text-slate-800">
              {citat ? '▾ Skjul citeret tekst' : '▸ Vis citeret tekst'}
            </button>
            {citat && (
              <div className="mt-1 text-xs text-slate-500 whitespace-pre-line break-words border-l-2 border-slate-200 pl-2">{citeret}</div>
            )}
          </>
        )}
      </div>
    );
  }

  const lang = body.split('\n').length > 6 || body.length > 500;
  return (
    <div className="mt-1">
      <div className={`text-sm text-slate-700 whitespace-pre-line break-words ${lang && !hel ? 'line-clamp-6' : ''}`}>{body}</div>
      {lang && (
        <button type="button" onClick={() => setHel((v) => !v)} className="mt-1 text-xs text-slate-500 hover:text-slate-800">
          {hel ? '▾ Vis mindre' : '▸ Vis hele mailen'}
        </button>
      )}
    </div>
  );
}
