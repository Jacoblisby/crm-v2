/**
 * Learning agent — Plan A: log + suggest, ingen auto-apply.
 *
 * Hver gang en bruger gemmer estimater (leje, refurb, drift) paa et on-market
 * listing logger vi diff'en mellem systemets default og brugerens faktiske
 * vaerdi sammen med konteksten (postnr, kvm, brokerKind, etc.).
 *
 * Efter nogle hundrede observationer kan vi vise:
 *   "Du saetter typisk leje 8% over default i 4700 Naestved (n=12)"
 *
 * og bruge det som suggestion paa nye listings.
 */
import { and, eq, sql, desc } from 'drizzle-orm';
import { db } from './db/client';
import {
  estimateCalibrations,
  onMarketCandidates,
  type OnMarketCandidate,
  type NewEstimateCalibration,
} from './db/schema';
import { estimateMonthlyRent } from './services/our-rentals';
import { getLearnedDefault } from './learning-sessions';

// ─── Defaults (samme som recompute-on-market.ts) ───────────────────────────
const LEJE_PR_M2_PR_MD: Record<string, number> = {
  '2630': 120,
  '4000': 115,
  '4100': 90,
  '4200': 85,
  '4400': 80,
  '4700': 90,
};
const DEFAULT_LEJE_RATE = 90;
const RENT_SAFETY_DISCOUNT = 0.85;
const REFURB_DEFAULT_PER_SQM = 450; // middel-stand fallback

export type CalibratedField =
  | 'lejeMd'
  | 'refurbTotal'
  | 'refurbGulv'
  | 'refurbMaling'
  | 'refurbRengoring'
  | 'refurbAndre'
  | 'driftTotal'
  | 'costFaellesudgifter'
  | 'costGrundvaerdi'
  | 'costRottebekempelse'
  | 'costRenovation'
  | 'costForsikringer'
  | 'costFaelleslaan'
  | 'costGrundfond'
  | 'costVicevaert'
  | 'costVedligeholdelse'
  | 'costAndreDrift';

export interface DefaultEstimates {
  lejeMd: number;
  refurbTotal: number;
}

/**
 * Hvad systemet VILLE foreslaa for et listing — uden brugerens overrides.
 * Bruges som "defaultValue" i calibrations-log.
 *
 * Reader-rækkefølge:
 *   1. our-rentals.json (faktisk leje fra vores egne lejemål)
 *   2. learned_defaults (fra accepterede learning sessions)
 *   3. Hardcoded LEJE_PR_M2_PR_MD
 */
export async function computeDefaultEstimates(c: OnMarketCandidate): Promise<DefaultEstimates> {
  // Leje-default
  let lejeMd = 0;
  if (c.postalCode && c.kvm && c.kvm > 0) {
    const roadName = c.address?.split(/\s+\d/)[0]?.trim() || null;
    const match = estimateMonthlyRent({ postalCode: c.postalCode, roadName });
    if (match.monthlyRent > 0) {
      lejeMd = Math.round(match.monthlyRent * RENT_SAFETY_DISCOUNT);
    } else {
      // Tjek learned default for dette postnr foer hardcoded fallback
      const learned = await getLearnedDefault('lejeRatePerM2', c.postalCode);
      const rate = learned ?? LEJE_PR_M2_PR_MD[c.postalCode] ?? DEFAULT_LEJE_RATE;
      lejeMd = Math.round(c.kvm * rate * RENT_SAFETY_DISCOUNT);
    }
  }
  // Refurb-default: tjek learned (postnr-specifik > global) foer hardcoded
  let refurbRate = REFURB_DEFAULT_PER_SQM;
  if (c.kvm > 0) {
    const learnedPostal = c.postalCode
      ? await getLearnedDefault('refurbPerSqm', c.postalCode)
      : null;
    const learnedGlobal = learnedPostal ?? (await getLearnedDefault('refurbPerSqm', null));
    if (learnedGlobal) refurbRate = learnedGlobal;
  }
  const refurbTotal = c.kvm > 0 ? Math.round(c.kvm * refurbRate) : 0;
  return { lejeMd, refurbTotal };
}

/**
 * Log en enkelt felt-override. No-op hvis default === actual (intet at laere).
 */
async function logField(input: {
  listingId: string;
  field: CalibratedField;
  defaultValue: number;
  actualValue: number;
  context: {
    kvm: number | null;
    postalCode: string | null;
    standLevel?: string | null;
    brokerKind?: string | null;
    yearBuilt?: number | null;
  };
}) {
  if (input.defaultValue === input.actualValue) return;
  if (input.defaultValue === 0 && input.actualValue === 0) return;

  const row: NewEstimateCalibration = {
    listingId: input.listingId,
    field: input.field,
    defaultValue: input.defaultValue,
    actualValue: input.actualValue,
    kvm: input.context.kvm,
    postalCode: input.context.postalCode,
    standLevel: input.context.standLevel ?? null,
    brokerKind: input.context.brokerKind ?? null,
    yearBuilt: input.context.yearBuilt ?? null,
  };

  try {
    await db.insert(estimateCalibrations).values(row);
  } catch {
    // Tabel mangler maaske endnu (migration ikke koert) — ikke kritisk
  }
}

/**
 * Hovedindgang: log alle relevante diff's for et estimater-save.
 * Kaldes fra updateEstimaterAction.
 */
export async function logEstimaterSave(input: {
  listingId: string;
  candidate: OnMarketCandidate;
  newLejeMd: number;
  newRefurbGulv: number;
  newRefurbMaling: number;
  newRefurbRengoring: number;
  newRefurbAndre: number;
}) {
  const defaults = await computeDefaultEstimates(input.candidate);
  const c = input.candidate;
  const ctx = {
    kvm: c.kvm,
    postalCode: c.postalCode,
    brokerKind: c.brokerKind ?? null,
    yearBuilt: c.yearBuilt ?? null,
  };

  const oldRefurbTotal =
    c.refurbGulv + c.refurbMaling + c.refurbRengoring + c.refurbAndre;
  const newRefurbTotal =
    input.newRefurbGulv + input.newRefurbMaling + input.newRefurbRengoring + input.newRefurbAndre;

  // Leje: log kun hvis brugeren faktisk har aendret den fra default
  await logField({
    listingId: input.listingId,
    field: 'lejeMd',
    defaultValue: defaults.lejeMd,
    actualValue: input.newLejeMd,
    context: ctx,
  });

  // Refurb total: defaultet er kvm × 450
  await logField({
    listingId: input.listingId,
    field: 'refurbTotal',
    defaultValue: defaults.refurbTotal,
    actualValue: newRefurbTotal,
    context: ctx,
  });

  // Log individuelle refurb-felter kun hvis vaerdien har aendret sig
  // (default for individuelle felter er 0 — vi vil ikke spamme tabellen
  // med "0 → 0" rows)
  const individualFields: Array<[CalibratedField, number, number]> = [
    ['refurbGulv', c.refurbGulv, input.newRefurbGulv],
    ['refurbMaling', c.refurbMaling, input.newRefurbMaling],
    ['refurbRengoring', c.refurbRengoring, input.newRefurbRengoring],
    ['refurbAndre', c.refurbAndre, input.newRefurbAndre],
  ];
  for (const [field, oldVal, newVal] of individualFields) {
    if (oldVal !== newVal) {
      await logField({
        listingId: input.listingId,
        field,
        defaultValue: oldVal,
        actualValue: newVal,
        context: ctx,
      });
    }
  }
  // oldRefurbTotal er ikke brugt explicit men kunne logges som "previous"
  // hvis vi senere vil tracke override-historik. For nu nok.
  void oldRefurbTotal;
}

/**
 * Log cost-breakdown overrides (drift-felter).
 */
export async function logCostBreakdownSave(input: {
  listingId: string;
  candidate: OnMarketCandidate;
  newBreakdown: {
    costFaellesudgifter: number;
    costGrundvaerdi: number;
    costRottebekempelse: number;
    costRenovation: number;
    costForsikringer: number;
    costFaelleslaan: number;
    costGrundfond: number;
    costVicevaert: number;
    costVedligeholdelse: number;
    costAndreDrift: number;
  };
}) {
  const c = input.candidate;
  const ctx = {
    kvm: c.kvm,
    postalCode: c.postalCode,
    brokerKind: c.brokerKind ?? null,
    yearBuilt: c.yearBuilt ?? null,
  };
  const map: Array<[CalibratedField, number, number]> = [
    ['costFaellesudgifter', c.costFaellesudgifter, input.newBreakdown.costFaellesudgifter],
    ['costGrundvaerdi', c.costGrundvaerdi, input.newBreakdown.costGrundvaerdi],
    ['costRottebekempelse', c.costRottebekempelse, input.newBreakdown.costRottebekempelse],
    ['costRenovation', c.costRenovation, input.newBreakdown.costRenovation],
    ['costForsikringer', c.costForsikringer, input.newBreakdown.costForsikringer],
    ['costFaelleslaan', c.costFaelleslaan, input.newBreakdown.costFaelleslaan],
    ['costGrundfond', c.costGrundfond, input.newBreakdown.costGrundfond],
    ['costVicevaert', c.costVicevaert, input.newBreakdown.costVicevaert],
    ['costVedligeholdelse', c.costVedligeholdelse, input.newBreakdown.costVedligeholdelse],
    ['costAndreDrift', c.costAndreDrift, input.newBreakdown.costAndreDrift],
  ];
  for (const [field, oldVal, newVal] of map) {
    if (oldVal !== newVal) {
      await logField({
        listingId: input.listingId,
        field,
        defaultValue: oldVal,
        actualValue: newVal,
        context: ctx,
      });
    }
  }
}

// ─── Read-side: aggregeret calibration ──────────────────────────────────────

export interface CalibrationSuggestion {
  field: CalibratedField;
  postalCode: string | null;
  sampleCount: number;
  avgDefault: number;
  avgActual: number;
  avgDeltaPct: number; // (actual - default) / default × 100
  medianActual: number;
}

/**
 * Returnerer aggregeret calibration for et (field, postalCode)-par.
 * null hvis ingen samples.
 *
 * Bruges paa detail-page til at vise "i 4700 Naestved saetter du typisk
 * leje 8% over default (n=12)".
 */
export async function getCalibration(
  field: CalibratedField,
  postalCode: string | null,
): Promise<CalibrationSuggestion | null> {
  try {
    const conditions = [eq(estimateCalibrations.field, field)];
    if (postalCode) {
      conditions.push(eq(estimateCalibrations.postalCode, postalCode));
    }

    const rows = await db
      .select({
        defaultValue: estimateCalibrations.defaultValue,
        actualValue: estimateCalibrations.actualValue,
      })
      .from(estimateCalibrations)
      .where(and(...conditions))
      .orderBy(desc(estimateCalibrations.createdAt))
      .limit(50); // rolling window — seneste 50 observationer

    if (rows.length === 0) return null;

    const n = rows.length;
    const avgDefault = Math.round(rows.reduce((s, r) => s + r.defaultValue, 0) / n);
    const avgActual = Math.round(rows.reduce((s, r) => s + r.actualValue, 0) / n);
    const sortedActuals = rows.map((r) => r.actualValue).sort((a, b) => a - b);
    const medianActual = sortedActuals[Math.floor(n / 2)];
    const avgDeltaPct = avgDefault > 0
      ? Math.round(((avgActual - avgDefault) / avgDefault) * 1000) / 10
      : 0;

    return {
      field,
      postalCode,
      sampleCount: n,
      avgDefault,
      avgActual,
      avgDeltaPct,
      medianActual,
    };
  } catch {
    return null;
  }
}

/**
 * Hent ALLE calibrations gruppered pr. (field, postalCode) — til admin-page.
 */
export async function listCalibrationGroups(): Promise<CalibrationSuggestion[]> {
  try {
    const rows = await db
      .select({
        field: estimateCalibrations.field,
        postalCode: estimateCalibrations.postalCode,
        sampleCount: sql<number>`count(*)::int`,
        avgDefault: sql<number>`avg(default_value)::int`,
        avgActual: sql<number>`avg(actual_value)::int`,
      })
      .from(estimateCalibrations)
      .groupBy(estimateCalibrations.field, estimateCalibrations.postalCode);

    return rows.map((r) => ({
      field: r.field as CalibratedField,
      postalCode: r.postalCode,
      sampleCount: r.sampleCount,
      avgDefault: r.avgDefault,
      avgActual: r.avgActual,
      avgDeltaPct: r.avgDefault > 0
        ? Math.round(((r.avgActual - r.avgDefault) / r.avgDefault) * 1000) / 10
        : 0,
      medianActual: r.avgActual, // simplificeret — vi har ikke median i GROUP BY
    }));
  } catch {
    return [];
  }
}

/**
 * De seneste N raw-observations til admin-debug.
 */
export async function listRecentCalibrations(limit = 100) {
  try {
    const rows = await db
      .select({
        id: estimateCalibrations.id,
        listingId: estimateCalibrations.listingId,
        field: estimateCalibrations.field,
        defaultValue: estimateCalibrations.defaultValue,
        actualValue: estimateCalibrations.actualValue,
        kvm: estimateCalibrations.kvm,
        postalCode: estimateCalibrations.postalCode,
        brokerKind: estimateCalibrations.brokerKind,
        yearBuilt: estimateCalibrations.yearBuilt,
        createdAt: estimateCalibrations.createdAt,
        address: onMarketCandidates.address,
      })
      .from(estimateCalibrations)
      .leftJoin(
        onMarketCandidates,
        eq(estimateCalibrations.listingId, onMarketCandidates.id),
      )
      .orderBy(desc(estimateCalibrations.createdAt))
      .limit(limit);
    return rows;
  } catch {
    return [];
  }
}
