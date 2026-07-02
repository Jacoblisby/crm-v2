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
import { PdfSourceForm } from './PdfSourceForm';
import { CostBreakdownForm } from './CostBreakdownForm';
import { ReviewStatusForm } from './ReviewStatusForm';
import { CalibrationBadges } from './CalibrationBadges';
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

  // Parse-usikkerhed: sat af parser naar vores drift ikke afstemmer med
  // mæglerens erklaerede "Ejerudgift i alt" (typisk nyt mægler-format vi
  // ikke fanger korrekt). Flagges gult saa forkerte tal er selv-detekterende.
  const parseUncertain = c.pdfStatus === 'parsed_uncertain';

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

      {/* === KONTEKST-RAIL: comparables + leje + drift i 3-col grid === */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        {/* Sammenligning */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">📊 Sammenligning</div>
          <div className="text-lg font-semibold text-slate-900">
            {estimate.marketEstimate.toLocaleString('da-DK')} kr
          </div>
          <div className="text-xs text-slate-600">
            Markedsestimat · {estimate.averageDiscountPct.toFixed(1)}% gennemsnits-afslag
          </div>
          <div className="text-xs text-slate-500 pt-1 flex items-center gap-2 flex-wrap">
            <span>Median <strong className="text-slate-700">{estimate.medianPricePerSqm.toLocaleString('da-DK')}</strong> kr/m²</span>
            <span>·</span>
            <span><strong className="text-slate-700">{estimate.sampleSize}</strong> handler</span>
            {estimate.sameEfCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                {estimate.sameEfCount} i samme EF
              </span>
            )}
          </div>
        </div>

        {/* Leje-kilde */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">🏠 Leje-kilde</div>
          <div className="text-lg font-semibold text-slate-900">
            {rentMd.toLocaleString('da-DK')} kr/md
          </div>
          <div className="text-xs">
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
              <span className="text-slate-500 ml-1">
                ({estimate.rentSampleSize} af vores lejemål)
              </span>
            )}
            {c.estimeretLejeMd != null && c.estimeretLejeMd !== estimate.estimatedRentMd && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                manuelt
              </span>
            )}
          </div>
        </div>

        {/* Drift-kilde */}
        <div
          className={`border rounded-lg p-4 space-y-1 ${
            parseUncertain
              ? 'bg-amber-50 border-amber-300'
              : driftSource === 'breakdown'
                ? 'bg-white border-slate-200'
                : driftSource === 'monthly-expense'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="text-[11px] uppercase tracking-wide text-slate-500">💰 Drift-kilde</div>
          <div className="text-lg font-semibold text-slate-900 tabular-nums">
            {driftTotal.toLocaleString('da-DK')} kr/år
          </div>
          <div className="text-xs">
            <span
              className={
                parseUncertain
                  ? 'text-amber-800 font-semibold'
                  : driftSource === 'breakdown'
                    ? 'text-emerald-700 font-semibold'
                    : driftSource === 'monthly-expense'
                      ? 'text-amber-700 font-semibold'
                      : 'text-red-600 font-semibold'
              }
            >
              {parseUncertain
                ? '⚠ Parse usikker — tjek tal'
                : driftSource === 'breakdown'
                  ? 'Udspec. fra prospekt ✓'
                  : driftSource === 'monthly-expense'
                    ? 'Mæglers ejerudgift × 12'
                    : '❌ Ingen data'}
            </span>
            {driftSource === 'monthly-expense' && c.monthlyExpense != null && !parseUncertain && (
              <span className="text-slate-500 ml-1">
                ({c.monthlyExpense.toLocaleString('da-DK')} × 12)
              </span>
            )}
          </div>
          {parseUncertain && (
            <p className="text-[11px] text-amber-800 leading-snug pt-0.5">
              Vores drift matcher ikke mæglerens erklærede total — parseren har
              sandsynligvis misset et felt. Tjek Ejerudgifter mod salgsopstillingen.
            </p>
          )}
        </div>
      </section>

      {/* === LEARNING AGENT (lært fra dine overrides i samme postnr) === */}
      <CalibrationBadges postalCode={c.postalCode} kvm={c.kvm} />

      {/* === COMPARABLES — collapsible audit tabel === */}
      {estimate.comparables.length > 0 && (
        <details className="bg-white border border-slate-200 rounded-lg overflow-hidden group">
          <summary className="font-semibold p-4 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 text-sm">
            <span>📊 Comparable-handler ({estimate.comparables.length})</span>
            <span className="text-xs text-slate-500 group-open:hidden">vis tabel →</span>
            <span className="text-xs text-slate-500 hidden group-open:inline">skjul ↑</span>
          </summary>
          <div className="px-4 pb-4">
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
        </details>
      )}

      {/* === MELLEMREGNINGER === */}
      {/* key remounter komponenten naar de DB-persisterede tal aendrer sig
          (PDF-parse, manuel cost-save). Uden key beholder AfkastDebug's
          useState de gamle initial-vaerdier indtil fuld page-reload — saa
          Forudsætninger + bud opdaterede sig ikke efter parsing. */}
      <AfkastDebug
        key={`afk-${c.forhandletPris ?? c.listPrice}-${rentMd}-${driftTotal}-${refurbTotal}-${c.ejerforeningSikkerhed}`}
        initial={{
          pris: c.forhandletPris ?? c.listPrice,
          prisLabel: 'listepris',
          lejeMd: rentMd,
          drift: driftTotal,
          refurb: refurbTotal,
          // "Sikkerhed til e/f" fra salgsopstillingen er det beloeb der
          // skal trækkes fra laaneprovenuet — det samme som "Hæftelse EF"
          haeftelse: c.ejerforeningSikkerhed,
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

      {/* === SALGSOPSTILLING + UDGIFTER — collapsible group === */}
      <details className="bg-white border border-slate-200 rounded-lg overflow-hidden group" open={!c.pdfUrl}>
        <summary className="font-semibold p-4 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 text-sm">
          <span>📄 Salgsopstilling & ejerudgifter</span>
          <span className="text-xs text-slate-500 flex items-center gap-2">
            {parseUncertain ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                ⚠ parse usikker
              </span>
            ) : c.pdfUrl ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                PDF parsed ✓
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                ingen PDF
              </span>
            )}
            <span className="group-open:hidden">vis →</span>
            <span className="hidden group-open:inline">skjul ↑</span>
          </span>
        </summary>
        <div className="p-4 pt-0 space-y-4">
          <PdfSourceForm
            id={c.id}
            currentUrl={c.pdfUrl}
            caseUrl={c.caseUrl}
            brokerKind={c.brokerKind}
            pdfStatus={c.pdfStatus}
          />
          <CostBreakdownForm
            key={`cost-${c.costFaellesudgifter}-${c.costGrundvaerdi}-${c.costFaelleslaan}-${c.costRenovation}-${c.costForsikringer}-${c.costRottebekempelse}-${c.costGrundfond}-${c.costVicevaert}-${c.costVedligeholdelse}-${c.costAndreDrift}-${c.ejerforeningSikkerhed}`}
            id={c.id}
            current={{
              costGrundvaerdi: c.costGrundvaerdi,
              costFaellesudgifter: c.costFaellesudgifter,
              costRottebekempelse: c.costRottebekempelse,
              costRenovation: c.costRenovation,
              costForsikringer: c.costForsikringer,
              costFaelleslaan: c.costFaelleslaan,
              costGrundfond: c.costGrundfond,
              costVicevaert: c.costVicevaert,
              costVedligeholdelse: c.costVedligeholdelse,
              costAndreDrift: c.costAndreDrift,
              ejerforeningSikkerhed: c.ejerforeningSikkerhed,
            }}
          />
        </div>
      </details>

      {/* === LEJE + REFURB overrides — collapsible === */}
      <details className="bg-white border border-slate-200 rounded-lg overflow-hidden group">
        <summary className="font-semibold p-4 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 text-sm">
          <span>📝 Estimat-overrides (leje + istandsættelse)</span>
          <span className="text-xs text-slate-500">
            <span className="group-open:hidden">vis →</span>
            <span className="hidden group-open:inline">skjul ↑</span>
          </span>
        </summary>
        <div className="p-4 pt-0">
          <EditEstimaterForm
            key={`est-${c.estimeretLejeMd ?? estimate.estimatedRentMd}-${c.refurbGulv}-${c.refurbMaling}-${c.refurbRengoring}-${c.refurbAndre}`}
            id={c.id}
            currentLeje={c.estimeretLejeMd ?? estimate.estimatedRentMd}
            currentRefurb={{
              gulv: c.refurbGulv,
              maling: c.refurbMaling,
              rengoring: c.refurbRengoring,
              andre: c.refurbAndre,
            }}
          />
        </div>
      </details>

      {/* === RÅ DATA fra prospekt — read-only audit, collapsible === */}
      <details className="bg-white border border-slate-200 rounded-lg overflow-hidden group">
        <summary className="font-semibold p-4 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 text-sm">
          <span>📋 Rå data fra prospekt (ejerudgifter + istandsættelse)</span>
          <span className="text-xs text-slate-500">
            <span className="group-open:hidden">vis →</span>
            <span className="hidden group-open:inline">skjul ↑</span>
          </span>
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
          {/* Ejerudgifter */}
          <div className="border border-slate-100 rounded">
            <p className="text-xs uppercase tracking-wide text-slate-500 px-3 py-2 border-b border-slate-100">
              Ejerudgifter (DKK/år)
            </p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(COST_LABELS).map(([key, label]) => {
                  const v = (c as unknown as Record<string, number>)[key] ?? 0;
                  return (
                    <tr key={key}>
                      <td className="px-3 py-1.5 text-slate-700">{label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {v.toLocaleString('da-DK')}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-3 py-1.5">Total drift</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {driftTotal.toLocaleString('da-DK')}
                  </td>
                </tr>
                {c.monthlyExpense && (
                  <tr className="text-slate-500 text-xs">
                    <td className="px-3 py-1.5">Ejerudgift/md (Boligsiden)</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {c.monthlyExpense.toLocaleString('da-DK')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Refurbish */}
          <div className="border border-slate-100 rounded">
            <p className="text-xs uppercase tracking-wide text-slate-500 px-3 py-2 border-b border-slate-100">
              Istandsættelse (engang, DKK)
            </p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(REFURB_LABELS).map(([key, label]) => {
                  const v = (c as unknown as Record<string, number>)[key] ?? 0;
                  return (
                    <tr key={key}>
                      <td className="px-3 py-1.5 text-slate-700">{label}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {v.toLocaleString('da-DK')}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-3 py-1.5">Total istandsættelse</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {refurbTotal.toLocaleString('da-DK')}
                  </td>
                </tr>
                {userRefurbTotal === 0 && (
                  <tr className="text-xs text-slate-500">
                    <td className="px-3 py-1.5 italic" colSpan={2}>
                      Default 'middel' ({c.kvm} m² × 450 kr/m²)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      {/* === Mægler-beskrivelse — collapsible === */}
      {c.description && (
        <details className="bg-white border border-slate-200 rounded-lg overflow-hidden group">
          <summary className="font-semibold p-4 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 text-sm">
            <span>📝 Mæglerens beskrivelse</span>
            <span className="text-xs text-slate-500">
              <span className="group-open:hidden">vis →</span>
              <span className="hidden group-open:inline">skjul ↑</span>
            </span>
          </summary>
          <div className="p-4 pt-0">
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {c.description}
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

