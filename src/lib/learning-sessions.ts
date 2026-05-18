/**
 * Learning Sessions — Plan B i learning agent.
 *
 * Workflow:
 *   1. Du klikker "Koer learning session" paa /admin/calibrations
 *   2. analyzeCalibrations() laeser alle nye (ikke-absorberede) overrides,
 *      grupperer pr. (field, postal_code), beregner forslag til opdaterede
 *      defaults
 *   3. UI viser hver proposal som card med Accept/Reject knapper
 *   4. acceptProposal() opdaterer learned_defaults + markerer underliggende
 *      calibrations som absorberede
 *   5. rejectProposal() markerer bare calibrations som absorberede (saa de
 *      ikke vises igen) men opdaterer ikke defaults
 *
 * Sessions er additive: hver session ser kun NYE observations siden sidste.
 * Det betyder learned_defaults bliver mere praecise over tid.
 */
import { and, eq, isNull, sql, desc } from 'drizzle-orm';
import { db } from './db/client';
import {
  estimateCalibrations,
  learnedDefaults,
  learningSessions,
} from './db/schema';

// ─── Hardcoded fallbacks (samme som recompute-on-market.ts) ────────────────
export const HARDCODED_LEJE_RATE: Record<string, number> = {
  '2630': 120,
  '4000': 115,
  '4100': 90,
  '4200': 85,
  '4400': 80,
  '4700': 90,
};
export const HARDCODED_LEJE_RATE_DEFAULT = 90;
export const HARDCODED_REFURB_PER_SQM = 450;

// ─── Tunable thresholds ─────────────────────────────────────────────────────
/** Min antal samples for at vi vil foreslaa en aendring */
const MIN_SAMPLES = 3;
/** Min |delta%| for at vi vil foreslaa (under det er det stoejende) */
const MIN_DELTA_PCT = 5;

export interface Proposal {
  proposalKey: string;             // unik key for accept/reject (field|postal)
  field: string;                    // fx 'lejeRatePerM2' eller 'refurbPerSqm'
  postalCode: string | null;
  currentDefault: number;           // hvad systemet bruger nu
  proposedValue: number;            // hvad sessionen foreslar
  deltaPct: number;                 // %-aendring
  sampleCount: number;
  rationale: string;                // 1-linje forklaring til UI
  calibrationIds: string[];         // som vil blive absorbed ved accept
  source: 'learned' | 'hardcoded';  // hvor currentDefault kom fra
}

/**
 * Sammenfatter en gruppe af raw calibrations til en proposal.
 * Returns null hvis gruppen ikke er signifikant nok.
 */
async function buildProposal(args: {
  field: string;
  postalCode: string | null;
  rawField: string;          // det rå field-navn i estimate_calibrations
  rawValues: number[];       // raw user actuals
  rawKvms: (number | null)[]; // kvm for hver row (til refurb-rate)
  calibrationIds: string[];
}): Promise<Proposal | null> {
  if (args.rawValues.length < MIN_SAMPLES) return null;

  // Find nuvaerende default for dette felt+postnr
  let currentDefault: number;
  let source: 'learned' | 'hardcoded' = 'hardcoded';

  if (args.field === 'lejeRatePerM2') {
    const existing = await db
      .select()
      .from(learnedDefaults)
      .where(
        and(
          eq(learnedDefaults.field, 'lejeRatePerM2'),
          args.postalCode
            ? eq(learnedDefaults.postalCode, args.postalCode)
            : isNull(learnedDefaults.postalCode),
        ),
      );
    if (existing[0]) {
      currentDefault = existing[0].value;
      source = 'learned';
    } else {
      currentDefault = args.postalCode && HARDCODED_LEJE_RATE[args.postalCode]
        ? HARDCODED_LEJE_RATE[args.postalCode]
        : HARDCODED_LEJE_RATE_DEFAULT;
    }
  } else if (args.field === 'refurbPerSqm') {
    const existing = await db
      .select()
      .from(learnedDefaults)
      .where(
        and(
          eq(learnedDefaults.field, 'refurbPerSqm'),
          args.postalCode
            ? eq(learnedDefaults.postalCode, args.postalCode)
            : isNull(learnedDefaults.postalCode),
        ),
      );
    if (existing[0]) {
      currentDefault = existing[0].value;
      source = 'learned';
    } else {
      currentDefault = HARDCODED_REFURB_PER_SQM;
    }
  } else {
    return null;
  }

  // Beregn proposedValue
  // For lejeRatePerM2: actualValue er kr/md, vi divider med kvm for at faa
  //   rate pr m². 0.85 RENT_SAFETY_DISCOUNT er allerede applied i logger.
  //   Vi reverse-engineerer: hvis bruger sad 9500 kr/md for 90 kvm,
  //   det implies en raw markedsrate paa ca 9500/90/0.85 = 124 kr/m²/md.
  //   Vi vil have systemets default (post-discount), saa: 9500/90 = 105.6.
  //   Dvs vi vil opdatere LEJE_PR_M2_PR_MD til ~105 saa naeste gang en
  //   90 kvm-bolig i samme postnr faar default 90*105*0.85 = 8033 (tæt
  //   paa hvad bruger faktisk satte men ikke 1:1, fordi vi beholder
  //   safety-discount).
  // Faktisk: simplere — beregn rate = actual / kvm for hver row,
  //   tag median (mere robust end avg mod outliers).
  let proposedValue: number;
  if (args.field === 'lejeRatePerM2' || args.field === 'refurbPerSqm') {
    const rates: number[] = [];
    for (let i = 0; i < args.rawValues.length; i++) {
      const kvm = args.rawKvms[i];
      if (!kvm || kvm <= 0) continue;
      rates.push(args.rawValues[i] / kvm);
    }
    if (rates.length < MIN_SAMPLES) return null;
    rates.sort((a, b) => a - b);
    const median = rates[Math.floor(rates.length / 2)];
    proposedValue = Math.round(median);
  } else {
    return null;
  }

  const deltaPct = currentDefault > 0
    ? ((proposedValue - currentDefault) / currentDefault) * 100
    : 0;

  if (Math.abs(deltaPct) < MIN_DELTA_PCT) return null;

  const fieldLabel = args.field === 'lejeRatePerM2' ? 'leje pr m²/md' : 'refurb pr m²';
  const direction = deltaPct > 0 ? 'højere' : 'lavere';
  const rationale = `n=${args.rawValues.length}: du satte ${fieldLabel} typisk ${Math.abs(deltaPct).toFixed(1)}% ${direction} end ${source === 'learned' ? 'sidste learned default' : 'hardcoded default'}.`;

  return {
    proposalKey: `${args.field}|${args.postalCode ?? '_global'}`,
    field: args.field,
    postalCode: args.postalCode,
    currentDefault,
    proposedValue,
    deltaPct: Math.round(deltaPct * 10) / 10,
    sampleCount: args.rawValues.length,
    rationale,
    calibrationIds: args.calibrationIds,
    source,
  };
}

/**
 * Analyser alle nye (ikke-absorberede) overrides og generer proposals.
 * Returner liste af forslag — UI rendrer dem som cards med Accept/Reject.
 *
 * Generation er stateless — opretter ikke session-row endnu. Det sker
 * foerst naar bruger Accepter eller Afviser noget.
 */
export async function analyzeCalibrations(): Promise<Proposal[]> {
  // Hent alle nye (uabsorberede) leje + refurb-total overrides.
  // (Vi ignorerer cost-felter for nu — de er typisk PDF-parsed praecist,
  // saa der er ikke meget at laere.)
  const rows = await db
    .select({
      id: estimateCalibrations.id,
      field: estimateCalibrations.field,
      actualValue: estimateCalibrations.actualValue,
      kvm: estimateCalibrations.kvm,
      postalCode: estimateCalibrations.postalCode,
    })
    .from(estimateCalibrations)
    .where(
      and(
        sql`${estimateCalibrations.field} IN ('lejeMd', 'refurbTotal')`,
        isNull(estimateCalibrations.absorbedAt),
      ),
    );

  // Group by (mapped_field, postal_code)
  type Group = {
    field: string;
    postalCode: string | null;
    rawField: string;
    ids: string[];
    actuals: number[];
    kvms: (number | null)[];
  };
  const groups = new Map<string, Group>();

  for (const r of rows) {
    const mappedField = r.field === 'lejeMd' ? 'lejeRatePerM2' : 'refurbPerSqm';
    const key = `${mappedField}|${r.postalCode ?? '_global'}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        field: mappedField,
        postalCode: r.postalCode,
        rawField: r.field,
        ids: [],
        actuals: [],
        kvms: [],
      };
      groups.set(key, g);
    }
    g.ids.push(r.id);
    g.actuals.push(r.actualValue);
    g.kvms.push(r.kvm);
  }

  const proposals: Proposal[] = [];
  for (const g of groups.values()) {
    const p = await buildProposal({
      field: g.field,
      postalCode: g.postalCode,
      rawField: g.rawField,
      rawValues: g.actuals,
      rawKvms: g.kvms,
      calibrationIds: g.ids,
    });
    if (p) proposals.push(p);
  }

  // Sort by |deltaPct| desc — de stoerste afvigelser oeverst
  proposals.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  return proposals;
}

/**
 * Accepter en proposal: opret/opdater learned_defaults og marker
 * underliggende calibrations som absorberede.
 *
 * Idempotent: koert samme proposal igen vil bare opdatere updatedAt.
 */
export async function acceptProposal(args: {
  proposal: Proposal;
  sessionId: string;
}): Promise<{ ok: true; updated: boolean }> {
  const { proposal, sessionId } = args;

  // Upsert learned_defaults
  const existing = await db
    .select()
    .from(learnedDefaults)
    .where(
      and(
        eq(learnedDefaults.field, proposal.field),
        proposal.postalCode
          ? eq(learnedDefaults.postalCode, proposal.postalCode)
          : isNull(learnedDefaults.postalCode),
      ),
    );

  if (existing[0]) {
    await db
      .update(learnedDefaults)
      .set({
        previousValue: existing[0].value,
        value: proposal.proposedValue,
        sampleCount: existing[0].sampleCount + proposal.sampleCount,
        sessionId,
        updatedAt: new Date(),
      })
      .where(eq(learnedDefaults.id, existing[0].id));
  } else {
    await db.insert(learnedDefaults).values({
      field: proposal.field,
      postalCode: proposal.postalCode,
      value: proposal.proposedValue,
      previousValue: proposal.currentDefault,
      sampleCount: proposal.sampleCount,
      sessionId,
    });
  }

  // Marker absorbed
  await db
    .update(estimateCalibrations)
    .set({ absorbedAt: new Date(), absorbedInSession: sessionId })
    .where(sql`${estimateCalibrations.id} = ANY(${proposal.calibrationIds})`);

  return { ok: true, updated: !!existing[0] };
}

/**
 * Afvis en proposal: marker bare calibrations som absorberede saa de ikke
 * vises igen. Opdater ikke learned_defaults.
 */
export async function rejectProposal(args: {
  proposal: Proposal;
  sessionId: string;
}): Promise<{ ok: true }> {
  await db
    .update(estimateCalibrations)
    .set({ absorbedAt: new Date(), absorbedInSession: args.sessionId })
    .where(sql`${estimateCalibrations.id} = ANY(${args.proposal.calibrationIds})`);
  return { ok: true };
}

/**
 * Opretter en ny session-row. Returnerer sessionId som accept/reject
 * skal passe.
 */
export async function startSession(): Promise<string> {
  const [row] = await db
    .insert(learningSessions)
    .values({})
    .returning({ id: learningSessions.id });
  return row.id;
}

/**
 * Lukker en session — opdaterer counts og noter.
 */
export async function finalizeSession(args: {
  sessionId: string;
  proposalsCount: number;
  acceptedCount: number;
  rejectedCount: number;
  samplesAbsorbed: number;
  notes?: string;
}) {
  await db
    .update(learningSessions)
    .set({
      proposalsCount: args.proposalsCount,
      acceptedCount: args.acceptedCount,
      rejectedCount: args.rejectedCount,
      samplesAbsorbed: args.samplesAbsorbed,
      notes: args.notes ?? null,
    })
    .where(eq(learningSessions.id, args.sessionId));
}

/**
 * Hent learned defaults for et felt+postnr. Bruges i computeDefaultEstimates.
 * Returnerer null hvis ingen learned default findes (caller falder tilbage
 * til hardcoded).
 */
export async function getLearnedDefault(
  field: 'lejeRatePerM2' | 'refurbPerSqm',
  postalCode: string | null,
): Promise<number | null> {
  try {
    const rows = await db
      .select({ value: learnedDefaults.value })
      .from(learnedDefaults)
      .where(
        and(
          eq(learnedDefaults.field, field),
          postalCode
            ? eq(learnedDefaults.postalCode, postalCode)
            : isNull(learnedDefaults.postalCode),
        ),
      )
      .limit(1);
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * List alle past sessions til admin-historik.
 */
export async function listSessions(limit = 20) {
  try {
    return await db
      .select()
      .from(learningSessions)
      .orderBy(desc(learningSessions.ranAt))
      .limit(limit);
  } catch {
    return [];
  }
}

/**
 * List alle aktive learned defaults til admin-historik.
 */
export async function listLearnedDefaults() {
  try {
    return await db
      .select()
      .from(learnedDefaults)
      .orderBy(desc(learnedDefaults.updatedAt));
  } catch {
    return [];
  }
}
