'use client';

import { useState, useTransition } from 'react';
import { moveLeadStageAction, logCommunicationAction } from './actions';

interface Stage {
  slug: string;
  name: string;
  isTerminal: boolean;
}

interface Props {
  leadId: string;
  currentStage: string;
  stages: Stage[];
}

type Mode = 'idle' | 'phone' | 'note' | 'reply' | 'stage';

export function LeadActions({ leadId, currentStage, stages }: Props) {
  const [mode, setMode] = useState<Mode>('idle');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleMove(toStage: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await moveLeadStageAction({ leadId, toStage });
      setMsg(r.ok ? `✅ Flyttet til ${stages.find((s) => s.slug === toStage)?.name}` : `❌ ${r.error}`);
      if (r.ok) setMode('idle');
    });
  }

  return (
    <div className="space-y-2">
      {/* Quick action bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode(mode === 'phone' ? 'idle' : 'phone')}
          className="px-3 py-1.5 rounded text-sm bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800"
        >
          📞 Log samtale
        </button>
        <button
          onClick={() => setMode(mode === 'note' ? 'idle' : 'note')}
          className="px-3 py-1.5 rounded text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800"
        >
          📝 Note
        </button>
        <button
          onClick={() => setMode(mode === 'reply' ? 'idle' : 'reply')}
          className="px-3 py-1.5 rounded text-sm bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800"
        >
          📥 Log indkommet
        </button>
        <div className="ml-auto">
          <StageMover
            currentStage={currentStage}
            stages={stages}
            onMove={handleMove}
            pending={pending}
          />
        </div>
      </div>

      {msg && <div className="text-xs text-slate-600 px-1">{msg}</div>}

      {mode === 'phone' && (
        <LogForm
          leadId={leadId}
          type="phone"
          direction="out"
          placeholder="Hvad blev sagt? Vigtige detaljer fra samtalen…"
          buttonLabel="Log samtale"
          onDone={() => setMode('idle')}
          setMsg={setMsg}
        />
      )}
      {mode === 'note' && (
        <LogForm
          leadId={leadId}
          type="note"
          direction="out"
          placeholder="Note (kun synlig for dig)…"
          buttonLabel="Gem note"
          onDone={() => setMode('idle')}
          setMsg={setMsg}
        />
      )}
      {mode === 'reply' && (
        <LogForm
          leadId={leadId}
          type="email"
          direction="in"
          withSubject
          placeholder="Reply-tekst (paste fra Gmail)…"
          buttonLabel="Log som indkommet"
          onDone={() => setMode('idle')}
          setMsg={setMsg}
        />
      )}
    </div>
  );
}

function StageMover({
  currentStage,
  stages,
  onMove,
  pending,
}: {
  currentStage: string;
  stages: Stage[];
  onMove: (slug: string) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="px-3 py-1.5 rounded text-sm bg-slate-900 hover:bg-slate-800 text-white font-medium disabled:opacity-50"
      >
        {pending ? 'Flytter…' : '➡️ Flyt stage'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
          {stages.map((s) => (
            <button
              key={s.slug}
              onClick={() => {
                onMove(s.slug);
                setOpen(false);
              }}
              disabled={s.slug === currentStage}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-30 disabled:bg-slate-100 ${
                s.isTerminal ? 'text-slate-500 italic' : ''
              }`}
            >
              {s.slug === currentStage && '✓ '}
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LogForm({
  leadId,
  type,
  direction,
  withSubject,
  placeholder,
  buttonLabel,
  onDone,
  setMsg,
}: {
  leadId: string;
  type: 'phone' | 'note' | 'email';
  direction: 'in' | 'out';
  withSubject?: boolean;
  placeholder: string;
  buttonLabel: string;
  onDone: () => void;
  setMsg: (s: string | null) => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await logCommunicationAction({
        leadId,
        type,
        direction,
        subject: withSubject ? subject : undefined,
        body,
      });
      if (r.ok) {
        setMsg(`✅ Logget`);
        setBody('');
        setSubject('');
        onDone();
      } else {
        setMsg(`❌ ${r.error}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
      {withSubject && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (fra reply-emailen)"
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
        />
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={6}
        required
        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm whitespace-pre-line"
      />
      <button
        type="submit"
        disabled={pending || !body.trim()}
        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
      >
        {pending ? 'Gemmer…' : buttonLabel}
      </button>
    </form>
  );
}
