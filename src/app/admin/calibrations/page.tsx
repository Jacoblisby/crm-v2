/**
 * /admin/calibrations — learning agent overview.
 *
 * Viser:
 *   1. Aggregeret tabel pr. (field, postnr) — avg default vs avg actual,
 *      sample-count, delta%.
 *   2. De seneste 100 raw-observations til debug.
 */
import Link from 'next/link';
import { listCalibrationGroups, listRecentCalibrations } from '@/lib/calibrations';
import { listSessions, listLearnedDefaults } from '@/lib/learning-sessions';
import { LearningSessionPanel } from './LearningSessionPanel';

export const dynamic = 'force-dynamic';

const FIELD_LABELS: Record<string, string> = {
  lejeMd: 'Leje/md',
  refurbTotal: 'Refurb total',
  refurbGulv: 'Refurb · gulv',
  refurbMaling: 'Refurb · maling',
  refurbRengoring: 'Refurb · rengøring',
  refurbAndre: 'Refurb · andre',
  driftTotal: 'Drift total',
  costFaellesudgifter: 'Fællesudg.',
  costGrundvaerdi: 'Grundskyld',
  costRottebekempelse: 'Rottebek.',
  costRenovation: 'Renovation',
  costForsikringer: 'Forsikringer',
  costFaelleslaan: 'Fælleslån',
  costGrundfond: 'Grundfond',
  costVicevaert: 'Vicevært',
  costVedligeholdelse: 'Vedligeh.',
  costAndreDrift: 'Andre drift',
};

export default async function CalibrationsAdminPage() {
  const [groups, recent, sessions, learned] = await Promise.all([
    listCalibrationGroups(),
    listRecentCalibrations(100),
    listSessions(20),
    listLearnedDefaults(),
  ]);

  // Sortér grupper: høj sample-count først
  const sortedGroups = [...groups].sort((a, b) => b.sampleCount - a.sampleCount);

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learning Agent — Calibrations</h1>
        <p className="text-sm text-slate-600 mt-1">
          Log af alle dine manuelle overrides på estimater. Kør learning sessions
          for at opdatere defaults pr. postnummer baseret på dine observationer.
        </p>

      {/* === LEARNING SESSION PANEL === */}
      <div className="mt-6">
        <LearningSessionPanel />
      </div>

      {/* === LEARNED DEFAULTS (aktive overrides) === */}
      {learned.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Aktive learned defaults ({learned.length})
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50 border-b border-emerald-200">
                <tr className="text-left text-xs uppercase text-emerald-800">
                  <th className="px-3 py-2">Felt</th>
                  <th className="px-3 py-2">Postnr</th>
                  <th className="px-3 py-2 text-right">Værdi</th>
                  <th className="px-3 py-2 text-right">Tidl.</th>
                  <th className="px-3 py-2 text-right">Samples</th>
                  <th className="px-3 py-2">Sidst opdateret</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {learned.map((ld) => (
                  <tr key={ld.id} className="hover:bg-emerald-50/30">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {ld.field === 'lejeRatePerM2'
                        ? 'Leje pr m²/md'
                        : ld.field === 'refurbPerSqm'
                          ? 'Refurb pr m²'
                          : ld.field}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{ld.postalCode ?? 'global'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-900">
                      {ld.value.toLocaleString('da-DK')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                      {ld.previousValue?.toLocaleString('da-DK') ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {ld.sampleCount}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {new Date(ld.updatedAt).toLocaleString('da-DK', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* === SESSION HISTORIK === */}
      {sessions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Tidligere sessions ({sessions.length})
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase text-slate-600">
                  <th className="px-3 py-2">Tid</th>
                  <th className="px-3 py-2 text-right">Forslag</th>
                  <th className="px-3 py-2 text-right">Accepteret</th>
                  <th className="px-3 py-2 text-right">Afvist</th>
                  <th className="px-3 py-2">Noter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                      {new Date(s.ranAt).toLocaleString('da-DK', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.proposalsCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                      {s.acceptedCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {s.rejectedCount}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{s.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      </div>

      {/* === AGGREGERET PR. (FIELD, POSTNR) === */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Aggregeret pr. felt + postnummer
        </h2>
        {sortedGroups.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
            Ingen overrides logget endnu. Aendr et estimat på en /on-market listing for at starte.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase text-slate-600">
                  <th className="px-3 py-2">Felt</th>
                  <th className="px-3 py-2">Postnr</th>
                  <th className="px-3 py-2 text-right">n</th>
                  <th className="px-3 py-2 text-right">avg default</th>
                  <th className="px-3 py-2 text-right">avg actual</th>
                  <th className="px-3 py-2 text-right">Δ%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedGroups.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {FIELD_LABELS[g.field] ?? g.field}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{g.postalCode ?? '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {g.sampleCount}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {g.avgDefault.toLocaleString('da-DK')}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-900 font-semibold">
                      {g.avgActual.toLocaleString('da-DK')}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-semibold ${
                        Math.abs(g.avgDeltaPct) < 5
                          ? 'text-slate-500'
                          : g.avgDeltaPct > 0
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                      }`}
                    >
                      {g.avgDeltaPct > 0 ? '+' : ''}
                      {g.avgDeltaPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* === SENESTE RAW OVERRIDES === */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Seneste 100 overrides (raw)
        </h2>
        {recent.length === 0 ? (
          <div className="text-slate-500 text-sm">Ingen overrides endnu.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs uppercase text-slate-600">
                  <th className="px-3 py-2">Tid</th>
                  <th className="px-3 py-2">Adresse</th>
                  <th className="px-3 py-2">Felt</th>
                  <th className="px-3 py-2 text-right">Default</th>
                  <th className="px-3 py-2 text-right">Du satte</th>
                  <th className="px-3 py-2 text-right">Δ%</th>
                  <th className="px-3 py-2">Postnr</th>
                  <th className="px-3 py-2 text-right">m²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((r) => {
                  const deltaPct =
                    r.defaultValue > 0
                      ? ((r.actualValue - r.defaultValue) / r.defaultValue) * 100
                      : 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString('da-DK', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        <Link
                          href={`/on-market/${r.listingId}`}
                          className="text-violet-700 hover:underline"
                        >
                          {r.address?.slice(0, 40) ?? r.listingId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {FIELD_LABELS[r.field] ?? r.field}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                        {r.defaultValue.toLocaleString('da-DK')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">
                        {r.actualValue.toLocaleString('da-DK')}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          Math.abs(deltaPct) < 5
                            ? 'text-slate-500'
                            : deltaPct > 0
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {deltaPct > 0 ? '+' : ''}
                        {deltaPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.postalCode ?? '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                        {r.kvm ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
