/**
 * On-market kandidat — detail view.
 * Bruger samme afkast-engine som off-market (boligberegner): leje fra vores
 * 218 faktiske lejemål, refurbish per stand-niveau, comparables fra historiske
 * tinglyste handler. Detaljeret mellemregninger via AfkastDebug-komponenten.
 *
 * Forskel fra off-market: ingen kunde-input om stand → vi defaulter til
 * 'middel' i refurb-rate. Kan overrides via EditEstimaterForm.
 */
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOnMarketCandidateById } from '@/lib/db/queries';
import { COST_LABELS, REFURB_LABELS, computeAfkast } from '@/lib/afkast';
import { computeEstimate } from '@/lib/services/price-engine';
import { AfkastDebug } from '@/app/admin/afkast/AfkastDebug';
import { EditEstimaterForm } from './EditEstimaterForm';
import { PdfUrlForm } from './PdfUrlForm';
import { ReviewStatusForm } from './ReviewStatusForm';
import type { ReviewStatus } from './actions';

export const dynamic = 'force-dynamic';

// Parser "Bogensevej 53, 2. th, 4700 Næstved" → streetName + houseNumber.
// Bruges til at finde same-EF-match i vores faktiske lejedata.
function parseAddress(addr: string): { streetName: string | null; houseNumber: string | null } {
  const m = addr.match(/^([^\d,]+?)\s+(\d+\S*)/);
  if (!m) return { streetName: null, houseNumber: null };
  return { streetName: m[1].trim(), houseNumber: m[2] };
}

export default async function OnMarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getOnMarketCandidateById(id);
  if (!c) notFound();

  // Drift fra udspecificerede prospekt-felter. Hvis ingen er tastet (typisk
  // når salgsopstilling endnu ikke er parsed), fald tilbage til mæglers
  // 'ejerudgift/md × 12' direkte — det tal inkluderer allerede grundskyld
  // + EF-bidrag + forsikringer ifølge dansk mægler-praksis.
  const driftFromBreakdown =
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
  const driftTotal =
    driftFromBreakdown > 0
      ? driftFromBreakdown
      : c.monthlyExpense
        ? c.monthlyExpense * 12
        : 0;
  const driftSource: 'breakdown' | 'monthly-expense' | 'none' =
    driftFromBreakdown > 0
      ? 'breakdown'
      : c.monthlyExpense
        ? 'monthly-expense'
        : 'none';

  // User-overridden refurb hvis felter er udfyldt, ellers default 'middel'-rate.
  const userRefurbTotal =
    c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;

  const { streetName, houseNumber } = parseAddress(c.address);

  // Kør hele engine'n — vi bruger 'middel' som default stand siden on-market
  // mangler kunde-rating. Hvis bruger har tastet refurb manuelt overrider vi.
  const estimate = await computeEstimate({
    postalCode: c.postalCode,
    kvm: c.kvm,
    yearBuilt: c.yearBuilt,
    rooms: c.rooms ? Number(c.rooms) : null,
    roadName: streetName,
    houseNumber,
    stand: 'middel',
    driftTotalYearly: driftTotal,
    currentListingPrice: c.listPrice,
  });

  // Hvis brugeren har manuelt redigeret leje på dette lead, brug deres tal —
  // ellers brug vores estimat fra de 218 lejemål.
  const rentMd = c.estimeretLejeMd ?? estimate.estimatedRentMd;
  const refurbTotal = userRefurbTotal > 0 ? userRefurbTotal : estimate.refurbTotal;

  // Re-beregn afkast med de aktuelle (potentielt user-edited) leje + refurb-tal.
  // Hvis intet er overrided er resultatet identisk med estimate.afkast.
  const afkRaw =
    rentMd === estimate.estimatedRentMd && refurbTotal === estimate.refurbTotal
      ? estimate.afkast
      : computeAfkast({
          rentMd,
          pris: c.listPrice,
          forhandletPris: c.forhandletPris ?? null,
          driftTotal,
          refurbTotal,
        });

  // On-market: ingen cap. Vi byder hvad ROE-modellen siger — listepris er
  // saelgers/maeglers tal og noget vi alligevel forhandler udenom.
  const afk = afkRaw;

  const dage = c.firstSeenAt
    ? Math.floor((Date.now() - new Date(c.firstSeenAt).getTime()) / 86_400_000)
    : null;

  const images: string[] = Array.isArray(c.images) ? (c.images as string[]) : [];
  const hero = c.primaryImage || images[0];

  const rentSourceLabel: Record<string, string> = {
    'same-vej': 'Same vej (samme EF)',
    'same-postal': 'Same postnr',
    'kvm-fallback': 'Postnr × m² fallback',
    'no-match': 'Ingen match',
  };

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt={c.address}
            className="md:col-span-2 w-full h-72 object-cover rounded-lg"
          />
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {images.slice(1, 5).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
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

      {/* === REVIEW STATUS === */}
      <ReviewStatusForm
        id={c.id}
        current={(c.reviewStatus as ReviewStatus) ?? 'ny'}
        currentNote={c.reviewNote ?? null}
      />

      {/* === AFKAST-OVERSIGT === */}
      <section className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-5 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="Vores bud"
            value={
              afk.budAt20PctRoe
                ? `${afk.budAt20PctRoe.toLocaleString('da-DK')} kr`
                : 'ikke nået'
            }
            tone={afk.budAt20PctRoe ? 'good' : 'muted'}
          />
          <Stat
            label="ROA EBIT"
            value={`${afk.roaEbitPct}%`}
            tone={afk.roaEbitPct >= 5 ? 'good' : afk.roaEbitPct >= 3 ? 'warn' : 'bad'}
          />
          <Stat
            label="ROE EBT"
            value={`${afk.roeEbtPct}%`}
            tone={afk.roeEbtPct >= 20 ? 'good' : afk.roeEbtPct >= 10 ? 'warn' : 'bad'}
          />
          <Stat
            label="Cash flow / md (EBT)"
            value={`${afk.cfMd.toLocaleString('da-DK')} kr`}
          />
        </div>
      </section>

      {/* === COMPARABLES + LEJE-KILDE === */}
      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="font-semibold">📊 Sammenligningsgrundlag</h2>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>
              Median pr m²: <strong>{estimate.medianPricePerSqm.toLocaleString('da-DK')}</strong>
            </span>
            <span>
              Comparables: <strong>{estimate.sampleSize}</strong>
            </span>
            {estimate.sameEfCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                {estimate.sameEfCount} i samme EF
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          Markedsestimat: <strong>{estimate.marketEstimate.toLocaleString('da-DK')} kr</strong>
          {' '} · gennemsnitligt afslag i området: {estimate.averageDiscountPct.toFixed(1)}%
        </div>
        {estimate.comparables.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="text-left py-1">Adresse</th>
                  <th className="text-right py-1">m²</th>
                  <th className="text-right py-1">Pris</th>
                  <th className="text-right py-1">Dato</th>
                  <th className="text-left py-1 pl-2">Vægt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estimate.comparables.slice(0, 8).map((cmp, i) => (
                  <tr key={i}>
                    <td className="py-1">{cmp.address}</td>
                    <td className="text-right py-1">{cmp.kvm}</td>
                    <td className="text-right py-1">{cmp.price.toLocaleString('da-DK')}</td>
                    <td className="text-right py-1 text-slate-500">{cmp.date?.slice(0, 7) ?? '—'}</td>
                    <td className="pl-2 py-1">
                      {cmp.weight >= 4 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                          samme EF
                        </span>
                      )}
                      {cmp.weight === 3 && (
                        <span className="text-[10px] text-slate-500">samme vej</span>
                      )}
                      {cmp.weight < 3 && <span className="text-[10px] text-slate-400">postnr</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* === LEJE-KILDE === */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex items-center justify-between flex-wrap gap-2">
        <div>
          🏠 <strong>Leje-kilde:</strong>{' '}
          <span
            className={
              estimate.rentSource === 'same-vej'
                ? 'text-emerald-700 font-semibold'
                : estimate.rentSource === 'same-postal'
                  ? 'text-amber-700 font-semibold'
                  : 'text-slate-500'
            }
          >
            {rentSourceLabel[estimate.rentSource]}
          </span>
          {estimate.rentSampleSize > 0 && (
            <span className="text-slate-500 text-xs ml-2">
              ({estimate.rentSampleSize} af vores lejemål)
            </span>
          )}
          {c.estimeretLejeMd != null && c.estimeretLejeMd !== estimate.estimatedRentMd && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              manuelt overridet
            </span>
          )}
        </div>
        <div className="text-xs text-slate-600">
          Brugt leje: <strong>{rentMd.toLocaleString('da-DK')} kr/md</strong>
          {c.estimeretLejeMd == null && (
            <span className="ml-2 text-slate-400">
              (auto · vores forslag {estimate.estimatedRentMd.toLocaleString('da-DK')})
            </span>
          )}
        </div>
      </div>

      {/* === DRIFT-KILDE === */}
      <div
        className={`border rounded-lg p-3 text-sm space-y-1 ${
          driftSource === 'breakdown'
            ? 'bg-white border-slate-200'
            : driftSource === 'monthly-expense'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            💰 <strong>Drift-kilde:</strong>{' '}
            <span
              className={
                driftSource === 'breakdown'
                  ? 'text-emerald-700 font-semibold'
                  : driftSource === 'monthly-expense'
                    ? 'text-amber-700 font-semibold'
                    : 'text-red-600 font-semibold'
              }
            >
              {driftSource === 'breakdown'
                ? 'Udspecificeret fra prospekt ✓'
                : driftSource === 'monthly-expense'
                  ? `Mæglers "ejerudgift/md × 12" (upload salgsopstilling for detaljeret breakdown)`
                  : '❌ Ingen data — drift = 0'}
            </span>
          </div>
          <div className="text-xs text-slate-600">
            Brugt drift: <strong>{driftTotal.toLocaleString('da-DK')} kr/år</strong>
            {driftSource === 'monthly-expense' && c.monthlyExpense != null && (
              <span className="ml-2 text-slate-400">
                ({c.monthlyExpense.toLocaleString('da-DK')} × 12)
              </span>
            )}
          </div>
        </div>
        {driftSource === 'monthly-expense' && (
          <p className="text-xs text-amber-900">
            Default-drift = mæglerannoncens "Mdl ejerudgifter" × 12. Upload
            salgsopstilling-PDF for præcis breakdown (grundskyld, fælleslån,
            forsikringer udspecificeret).
          </p>
        )}
      </div>

      {/* === MELLEMREGNINGER === */}
      <AfkastDebug
        initial={{
          pris: c.forhandletPris ?? c.listPrice,
          prisLabel: 'listepris',
          lejeMd: rentMd,
          drift: driftTotal,
          refurb: refurbTotal,
          driftBreakdown: {
            fællesudgifter: c.costFaellesudgifter,
            grundskyld: c.costGrundvaerdi,
            fælleslån: c.costFaelleslaan,
            renovation: c.costRenovation,
            forsikringer: c.costForsikringer,
            rottebekæmpelse: c.costRottebekempelse,
            grundfond: c.costGrundfond,
            vicevært: c.costVicevaert,
            vedligeholdelse: c.costVedligeholdelse,
            andreDrift: c.costAndreDrift,
          },
        }}
      />

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
        currentLeje={c.estimeretLejeMd ?? estimate.estimatedRentMd}
        currentRefurb={{
          gulv: c.refurbGulv,
          maling: c.refurbMaling,
          rengoring: c.refurbRengoring,
          andre: c.refurbAndre,
        }}
      />

      {/* Cost breakdown — rå data fra prospekt */}
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
            {userRefurbTotal === 0 && (
              <tr className="text-xs text-slate-500">
                <td className="px-4 py-2 italic">
                  Ingen manuelle tal — vi bruger default 'middel'-rate ({c.kvm} m² × 450 kr/m²)
                </td>
                <td className="px-4 py-2"></td>
              </tr>
            )}
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
