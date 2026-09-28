'use client';

/**
 * Noter på et lead.
 *
 * Fanen viste før kun den tekst, boligberegneren selv skrev ind på leadet,
 * og sagde «Skrive-tilstand kommer i Uge 3». Noter skrevet med knappen
 * «📝 Note» lå under Kommunikation — så det så ud, som om de ikke blev gemt.
 * Nu skrives og læses de her, og beregnerens egen tekst er foldet sammen
 * nederst.
 */
import { useState, useTransition } from 'react';
import { logCommunicationAction } from './actions';

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string | null;
  /** Telefonnoter vises med, så hele historikken står ét sted. */
  type: string;
}

const dato = (s: string) =>
  new Date(s).toLocaleString('da-DK', {
    timeZone: 'Europe/Copenhagen',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export function NoterTab({ leadId, noter, beregnerNote }: { leadId: string; noter: Note[]; beregnerNote: string | null }) {
  const [tekst, setTekst] = useState('');
  const [pending, start] = useTransition();
  const [fejl, setFejl] = useState<string | null>(null);
  const [visBeregner, setVisBeregner] = useState(false);

  function gem(e: React.FormEvent) {
    e.preventDefault();
    setFejl(null);
    const body = tekst.trim();
    if (!body) return;
    start(async () => {
      const r = await logCommunicationAction({ leadId, type: 'note', direction: 'out', body });
      if (r.ok) setTekst('');
      else setFejl(r.error ?? 'Noten kunne ikke gemmes');
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={gem} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={4}
          placeholder="Skriv en note — hvad blev aftalt, hvad skal huskes til besigtigelsen…"
          className="w-full px-2.5 py-2 border border-slate-300 rounded text-sm"
        />
        <div className="flex items-center justify-between">
          {fejl ? <span className="text-xs text-rose-700">❌ {fejl}</span> : <span className="text-xs text-slate-400">Gemmes på leadet og ses også under Kommunikation.</span>}
          <button
            type="submit"
            disabled={pending || !tekst.trim()}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium"
          >
            {pending ? 'Gemmer…' : 'Gem note'}
          </button>
        </div>
      </form>

      {noter.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8 bg-white border border-slate-200 rounded-lg">Ingen noter endnu.</div>
      ) : (
        <ul className="space-y-2">
          {noter.map((n) => (
            <li key={n.id} className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className={`px-1.5 py-0.5 rounded ${n.type === 'phone' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                  {n.type === 'phone' ? 'samtale' : 'note'}
                </span>
                {n.createdBy && <span className="truncate">{n.createdBy}</span>}
                <span className="ml-auto whitespace-nowrap">{dato(n.createdAt)}</span>
              </div>
              <div className="text-sm text-slate-800 whitespace-pre-line break-words">{n.body}</div>
            </li>
          ))}
        </ul>
      )}

      {beregnerNote && (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <button type="button" onClick={() => setVisBeregner((v) => !v)} className="text-xs text-slate-500 hover:text-slate-800">
            {visBeregner ? '▾ Skjul' : '▸ Vis'} teksten fra boligberegneren
          </button>
          {visBeregner && <div className="mt-2 text-xs text-slate-600 whitespace-pre-line break-words">{beregnerNote}</div>}
        </div>
      )}
    </div>
  );
}
