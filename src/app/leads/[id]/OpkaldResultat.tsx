'use client';

/**
 * «Hvordan gik det?» — logger opkaldet og flytter leadet, så Jacob ikke skal
 * huske det bagefter. Seks udfald, fordi et opkald slutter på seks måder.
 */
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { opkaldResultatAction, type OpkaldUdfald } from './actions';

const UDFALD: { id: OpkaldUdfald; label: string; hint: string; tid?: 'kraeves' | 'valgfri'; farve: string }[] = [
  { id: 'aftalt', label: 'Aftalt besigtigelse', hint: 'Flytter til «Besigtigelse aftalt» og lægger bekræftelsen klar.', tid: 'kraeves', farve: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { id: 'ring-igen', label: 'Ring igen', hint: 'Logger, at du skal ringe tilbage. Vælg gerne hvornår.', tid: 'valgfri', farve: 'bg-slate-100 hover:bg-slate-200 text-slate-900' },
  { id: 'ikke-truffet', label: 'Ikke truffet', hint: 'Logger et forsøg.', farve: 'bg-slate-100 hover:bg-slate-200 text-slate-900' },
  { id: 'lagde-besked', label: 'Lagde besked', hint: 'Logger, at du har lagt besked.', farve: 'bg-slate-100 hover:bg-slate-200 text-slate-900' },
  { id: 'ikke-nu', label: 'Ikke aktuelt nu', hint: 'Flytter til «Vil ikke sælge nu» og skriver igen om tre måneder.', farve: 'bg-amber-100 hover:bg-amber-200 text-amber-900' },
  { id: 'vil-ikke-kontaktes', label: 'Vil ikke kontaktes', hint: 'Arkiverer leadet. Skriv ikke til dem igen.', farve: 'bg-rose-100 hover:bg-rose-200 text-rose-900' },
];

/**
 * Jacobs regler for besigtigelser: torsdag 10–17, fredag 10–15, aldrig weekend.
 * Kun en påmindelse. Han kan have en grund til at gøre noget andet.
 */
function udenForReglerne(v: string): string | null {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const dag = d.getDay();
  const t = d.getHours() + d.getMinutes() / 60;
  if (dag === 0 || dag === 6) return 'Det er en weekend.';
  if (dag === 4 && (t < 10 || t >= 17)) return 'Torsdage kører du besigtigelser kl. 10–17.';
  if (dag === 5 && (t < 10 || t >= 15)) return 'Fredage kører du besigtigelser kl. 10–15.';
  if (dag !== 4 && dag !== 5) return 'Du kører normalt kun besigtigelser torsdag og fredag.';
  return null;
}

export function OpkaldResultat({ leadId }: { leadId: string }) {
  const [valgt, setValgt] = useState<OpkaldUdfald | null>(null);
  const [tid, setTid] = useState('');
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();
  const [fejl, setFejl] = useState<string | null>(null);
  const [gemt, setGemt] = useState<OpkaldUdfald | null>(null);

  const def = UDFALD.find((u) => u.id === valgt);
  const erBesigtigelse = valgt === 'aftalt';

  function gem() {
    if (!valgt) return;
    setFejl(null);
    start(async () => {
      const r = await opkaldResultatAction({ leadId, udfald: valgt, tid: tid || undefined, note });
      if (r.ok) {
        setGemt(valgt);
        setValgt(null);
        setTid('');
        setNote('');
      } else {
        setFejl(r.error ?? 'Kunne ikke gemme.');
      }
    });
  }

  return (
    <section id="resultat" className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Efter opkaldet</h3>
        <p className="text-xs text-slate-500 mt-0.5">Vælg, hvordan det gik. Det logges på leadet, og det flyttes, hvis det skal.</p>
      </div>

      {gemt && (
        <div className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-900 rounded px-3 py-2">
          ✅ Gemt.{' '}
          {gemt === 'aftalt' && (
            <>
              Bekræftelsen ligger som udkast under{' '}
              <Link href={`/leads/${leadId}?tab=kommunikation`} className="underline font-medium">
                Kommunikation
              </Link>
              .
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {UDFALD.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => {
              setValgt(u.id === valgt ? null : u.id);
              setGemt(null);
              setFejl(null);
            }}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-[box-shadow,transform] active:scale-[0.98] ${u.farve} ${valgt === u.id ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {def && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">{def.hint}</p>
          {def.tid && (
            <label className="block text-xs text-slate-600">
              {def.tid === 'kraeves' ? 'Dag og tid for besigtigelsen' : 'Ring igen (valgfrit)'}
              <input
                type="datetime-local"
                value={tid}
                onChange={(e) => setTid(e.target.value)}
                className="mt-1 block w-full sm:w-64 px-2 py-1.5 border border-slate-300 rounded text-sm"
              />
            </label>
          )}
          {erBesigtigelse && tid && udenForReglerne(tid) && (
            <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded px-2 py-1.5">
              {udenForReglerne(tid)} Du kan stadig gemme den.
            </p>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Hvad blev sagt? (valgfrit) Det vigtigste fra samtalen."
            className="w-full px-2.5 py-2 border border-slate-300 rounded text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            {fejl ? <span className="text-xs text-rose-700">❌ {fejl}</span> : <span />}
            <button
              type="button"
              onClick={gem}
              disabled={pending || (def.tid === 'kraeves' && !tid)}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-medium"
            >
              {pending ? 'Gemmer…' : `Gem: ${def.label}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
