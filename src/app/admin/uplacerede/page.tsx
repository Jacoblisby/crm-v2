/**
 * Svar, CRM'et ikke kunne placere på et lead. Typisk: kunden svarede fra en
 * anden adresse end den, hun oprettede sig med, og emnet var rettet til.
 * Åbn mailen her, find leadet i pipelinen, og læg svaret på det med
 * «📥 Log indkommet».
 */
import Link from 'next/link';
import { listUplacerede } from '@/lib/uplaceret';
import { AfvisKnap } from './AfvisKnap';

export const dynamic = 'force-dynamic';

export default async function Uplacerede() {
  const liste = await listUplacerede().catch(() => []);
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Uplacerede svar</h1>
        <p className="text-sm text-slate-600 mt-1">
          Mails, der nåede CRM’et, men ikke kunne kobles til et lead. Læg dem på det rette lead med «📥 Log indkommet», og fjern dem her.{' '}
          <Link href="/pipeline" className="underline">Til pipelinen</Link>
        </p>
      </div>
      {liste.length === 0 && (
        <div className="text-sm text-slate-400 text-center py-10 bg-white border border-slate-200 rounded-lg">Intet at placere.</div>
      )}
      <ul className="space-y-3">
        {liste.map((m) => (
          <li key={m.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-baseline justify-between gap-3 text-xs text-slate-500">
              <span className="truncate">
                <strong className="text-slate-800">{m.fraNavn || m.fraMail}</strong> {m.fraNavn ? `<${m.fraMail}>` : ''} til {m.til || '?'}
              </span>
              <span className="whitespace-nowrap">{m.oprettet.toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="font-medium text-sm mt-1">{m.emne || '(intet emne)'}</div>
            <div className="text-sm text-slate-700 mt-2 whitespace-pre-line break-words max-h-64 overflow-auto">{m.tekst}</div>
            <div className="mt-3"><AfvisKnap id={m.id} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
