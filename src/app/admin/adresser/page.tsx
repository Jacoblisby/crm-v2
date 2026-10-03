/**
 * Adressetabellen: hvor mange adresser vi har pr. kommune, og knapper til
 * at hente dem. Importen tager et par minutter pr. kommune, så den kan
 * køres kommune for kommune, hvis hele listen er for lang ad gangen.
 */
import { KOMMUNER, status } from '@/lib/adresser';
import { Knap } from './Knap';

export const dynamic = 'force-dynamic';

export default async function AdresserAdmin() {
  const s = await status().catch(() => null);
  const antal = new Map((s?.prKommune ?? []).map((k) => [k.kommunekode, k]));

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Adresser</h1>
        <p className="text-sm text-slate-600 mt-1">
          Adressevælgeren på saelg.365ejendom.dk søger i denne tabel. Er den tom, falder søgningen
          tilbage på spejlet af den lukkede DAWA.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-slate-600">I alt</div>
          <div className="text-2xl font-semibold tabular-nums">{(s?.ialt ?? 0).toLocaleString('da-DK')}</div>
        </div>
        <div className="mt-3">
          <Knap label="Hent alle kommuner" />
        </div>
      </div>

      <table className="w-full text-sm bg-white border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-2">Kommune</th>
            <th className="text-right px-3 py-2">Adresser</th>
            <th className="text-left px-3 py-2">Opdateret</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {KOMMUNER.map((k) => {
            const a = antal.get(k.kode);
            return (
              <tr key={k.kode}>
                <td className="px-3 py-2">{k.navn}</td>
                <td className="px-3 py-2 text-right tabular-nums">{a ? a.antal.toLocaleString('da-DK') : '—'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {a?.opdateret ? a.opdateret.toLocaleDateString('da-DK') : '—'}
                </td>
                <td className="px-3 py-2 text-right">
                  <Knap kommunekode={k.kode} label="Hent" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
