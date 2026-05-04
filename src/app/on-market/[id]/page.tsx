/**
 * On-market kandidat — detail view.
 * Viser:
 *  - Hero (adresse, pris, dage på markedet, billeder)
 *  - Mægler-beskrivelse (collapsible)
 *  - Udspecificerede ejerudgifter fra prospekt
 *  - Estimeret leje (editable via /actions)
 *  - Istandsættelse breakdown (editable)
 *  - Aktuel afkast-beregning (Bud 20% ROE + ROE Netto)
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOnMarketCandidateById } from '@/lib/db/queries';
import { computeAfkast, COST_LABELS, REFURB_LABELS } from '@/lib/afkast';
import { EditEstimaterForm } from './EditEstimaterForm';
import { PdfUrlForm } from './PdfUrlForm';

export const dynamic = 'force-dynamic';

export default async function OnMarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getOnMarketCandidateById(id);
  if (!c) notFound();

  const driftTotal =
    c.costGrundvaerdi +
    c.costFaellesudgifter +
    c.costRottebekempelse +
    c.costRenovation +
    c.costForsikringer +
    c.costFaelleslaan +
    c.costGrundfond +
    c.costVicevaert +
    c.costVedligeholdelse +
    c.costAndreDrift;

  const refurbTotal =
    c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;

  const rentMd = c.estimeretLejeMd ?? 0;
  const afk = computeAfkast({
    rentMd,
    listePris: c.listPrice,
    forhandletPris: c.forhandletPris ?? null,
    driftTotal,
    refurbTotal,
  });

  const dage = c.firstSeenAt
    ? Math.floor((Date.now() - new Date(c.firstSeenAt).getTime()) / 86_400_000)
    : null;

  const images: string[] = Array.isArray(c.images) ? (c.images as string[]) : [];
  const hero = c.primaryImage || images[0];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/on-market" className="text-sm text-slate-500 hover:underline">
          ← On-market
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{c.address}</h1>
        <p className="text-slate-600">
          {c.postalCode} {c.city} · {c.kvm} m² · {c.rooms ?? '–'} værelser{' '}
          {c.yearBuilt && `· opført ${c.yearBuilt}`}
        </p>
        <div className="flex flex-wrap gap-2 text-sm pt-2">
          <span className="px-2 py-1 rounded bg-slate-100">
            Listepris: <strong>{c.listPrice.toLocaleString('da-DK')} kr</strong>
          </span>
          {c.m2Pris ? (
            <span className="px-2 py-1 rounded bg-slate-100">
              {c.m2Pris.toLocaleString('da-DK')} kr/m²
            </span>
          ) : null}
          {dage != null && (
            <span
              className={`px-2 py-1 rounded ${
                dage < 14
                  ? 'bg-emerald-100 text-emerald-700'
                  : dage < 60
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {dage} dage på markedet
            </span>
          )}
          {c.brokerKind && (
            <span className="px-2 py-1 rounded bg-slate-100">
              Mægler: {c.brokerKind}
            </span>
          )}
          {c.sourceUrl && (
            <a
              href={c.sourceUrl}
              target="_blank"
              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Boligsiden ↗
            </a>
          )}
          {c.caseUrl && (
            <a
              href={c.caseUrl}
              target="_blank"
              className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              Mægler ↗
            </a>
          )}
          {c.pdfUrl && (
            <a
              href={c.pdfUrl}
              target="_blank"
              className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium"
            >
              📄 Hent salgsopstilling
            </a>
          )}
        </div>
      </header>

      {hero && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <img
            src={hero}
            alt={c.address}
            className="md:col-span-2 w-full h-72 object-cover rounded-lg"
          />
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {images.slice(1, 5).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Afkast-blok */}
      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Afkastberegning</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat
            label="Bud (20% ROE)"
            value={
              afk.budAt20PctRoe
                ? `${afk.budAt20PctRoe.toLocaleString('da-DK')} kr`
                : 'ikke nået'
            }
            tone={afk.budAt20PctRoe ? 'good' : 'muted'}
          />
          <Stat
            label="ROE Netto"
            value={`${afk.roeNettoPct}%`}
            tone={
              afk.roeNettoPct >= 10
                ? 'good'
                : afk.roeNettoPct >= 5
                ? 'warn'
                : 'bad'
            }
          />
          <Stat
            label="Cash flow / md (EBT)"
            value={`${afk.cfMd.toLocaleString('da-DK')} kr`}
          />
          <Stat
            label="Egenkapital"
            value={`${afk.egenkapital.toLocaleString('da-DK')} kr`}
          />
        </div>
      </section>

      {/* PDF URL form */}
      <PdfUrlForm
        id={c.id}
        currentUrl={c.pdfUrl}
        caseUrl={c.caseUrl}
        brokerKind={c.brokerKind}
      />

      {/* Editable form */}
      <EditEstimaterForm
        id={c.id}
        currentLeje={rentMd}
        currentRefurb={{
          gulv: c.refurbGulv,
          maling: c.refurbMaling,
          rengoring: c.refurbRengoring,
          andre: c.refurbAndre,
        }}
      />

      {/* Cost breakdown */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold p-4 pb-2">
          Ejerudgifter fra prospekt (DKK/år)
        </h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {Object.entries(COST_LABELS).map(([key, label]) => {
              const v = (c as unknown as Record<string, number>)[key] ?? 0;
              return (
                <tr key={key}>
                  <td className="px-4 py-2 text-slate-700">{label}</td>
                  <td className="px-4 py-2 text-right">
                    {v.toLocaleString('da-DK')}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2">Total drift</td>
              <td className="px-4 py-2 text-right">
                {driftTotal.toLocaleString('da-DK')}
              </td>
            </tr>
            {c.monthlyExpense && (
              <tr className="text-slate-500 text-xs">
                <td className="px-4 py-2">Ejerudgift/md (fra Boligsiden)</td>
                <td className="px-4 py-2 text-right">
                  {c.monthlyExpense.toLocaleString('da-DK')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Refurbish breakdown */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <h2 className="font-semibold p-4 pb-2">Istandsættelse (engang, DKK)</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {Object.entries(REFURB_LABELS).map(([key, label]) => {
              const v = (c as unknown as Record<string, number>)[key] ?? 0;
              return (
                <tr key={key}>
                  <td className="px-4 py-2 text-slate-700">{label}</td>
                  <td className="px-4 py-2 text-right">
                    {v.toLocaleString('da-DK')}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2">Total istandsættelse</td>
              <td className="px-4 py-2 text-right">
                {refurbTotal.toLocaleString('da-DK')}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Mægler description */}
      {c.description && (
        <section className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Mæglerens beskrivelse</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {c.description}
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad' | 'muted';
}) {
  const valueCls =
    tone === 'good'
      ? 'text-emerald-700'
      : tone === 'warn'
      ? 'text-amber-700'
      : tone === 'bad'
      ? 'text-red-700'
      : tone === 'muted'
      ? 'text-slate-400'
      : 'text-slate-900';
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${valueCls}`}>{value}</div>
    </div>
  );
}
