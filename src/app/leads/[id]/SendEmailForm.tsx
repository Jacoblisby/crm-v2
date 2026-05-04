'use client';

import { useState, useTransition } from 'react';
import { sendLeadEmailAction } from './email-actions';

interface Props {
  leadId: string;
  toEmail: string | null;
  toName: string | null;
}

const TEMPLATE_BUD = `Hej {NAVN}

Tusind tak fordi du har brugt vores boligberegner på {ADRESSE}.

På baggrund af de oplysninger vi har modtaget, kan vi tilbyde {BUD} kr. for boligen i den nuværende stand og med de forudsætninger, der er oplyst.
Tilbuddet er naturligvis med forbehold for en endelig besigtigelse.

Jeg vil kort opsummere fordelene ved at handle direkte med os:

• Vi handler kontant – uden bank- og advokatforbehold
• Ingen mægler og dermed ingen salær (typisk en besparelse på 50.000–70.000 kr.)
• Vores rådgiver håndterer alt fra købsaftale til tinglysning og refusionsopgørelse
• Du vælger selv overtagelsesdato – om det er om få dage eller flere måneder

Hvis det har interesse, så svar meget gerne på mailen – eller send dit telefonnummer, så ringer jeg dig op til en uforpligtende snak.

Venlig hilsen
Jacob`;

const TEMPLATE_OPFOLG = `Hej {NAVN}

Jeg skriver for at følge op på det bud, vi har afgivet på din lejlighed på {ADRESSE}.

Har du fået kigget på det? Der er ingen forpligtelser ved at få en uforpligtende snak.

Du kan altid ringe til mig på 61789071.

Venlig hilsen
Jacob`;

export function SendEmailForm({ leadId, toEmail, toName }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function loadTemplate(template: string) {
    const filled = template.replace('{NAVN}', toName?.split(' ')[0] || 'der');
    setBody(filled);
    if (!subject) setSubject('Vedrørende din bolig');
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await sendLeadEmailAction({ leadId, subject, body });
      if (r.ok) {
        setMsg('✅ Sendt — logget under kommunikation');
        setSubject('');
        setBody('');
        setOpen(false);
      } else {
        setMsg(`❌ Fejl: ${r.error}`);
      }
    });
  }

  if (!toEmail) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        Lead har ingen email — kan ikke sende.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg"
      >
        ✉️ Send email til {toEmail}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Til: <strong className="text-slate-700">{toEmail}</strong>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕ Annuller
        </button>
      </div>
      <div className="flex gap-1 text-xs">
        <button
          type="button"
          onClick={() => loadTemplate(TEMPLATE_BUD)}
          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
        >
          📨 Bud-template
        </button>
        <button
          type="button"
          onClick={() => loadTemplate(TEMPLATE_OPFOLG)}
          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
        >
          🔁 Opfølgning
        </button>
      </div>
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={12}
        required
        placeholder="Skriv din besked…"
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-mono whitespace-pre-line"
      />
      <div className="flex items-center justify-between">
        {msg && <span className="text-xs">{msg}</span>}
        <button
          type="submit"
          disabled={pending || !subject || !body}
          className="ml-auto px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
        >
          {pending ? 'Sender…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
