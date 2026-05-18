'use server';

import { revalidatePath } from 'next/cache';
import {
  analyzeCalibrations,
  acceptProposal,
  rejectProposal,
  startSession,
  finalizeSession,
  type Proposal,
} from '@/lib/learning-sessions';

/**
 * Trigger learning session — analyser nye overrides + opret session-row.
 * Returnerer proposals + sessionId. Bruger kan derefter accepte/afvise
 * hver proposal individuelt.
 */
export async function runLearningSessionAction(): Promise<
  | { ok: true; sessionId: string; proposals: Proposal[] }
  | { ok: false; error: string }
> {
  try {
    const proposals = await analyzeCalibrations();
    const sessionId = await startSession();

    if (proposals.length === 0) {
      // Tom session — luk den med det samme
      await finalizeSession({
        sessionId,
        proposalsCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        samplesAbsorbed: 0,
        notes: 'Ingen signifikante afvigelser fundet',
      });
    } else {
      await finalizeSession({
        sessionId,
        proposalsCount: proposals.length,
        acceptedCount: 0,
        rejectedCount: 0,
        samplesAbsorbed: 0,
      });
    }

    return { ok: true, sessionId, proposals };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function acceptProposalAction(input: {
  sessionId: string;
  proposal: Proposal;
}) {
  try {
    await acceptProposal({ proposal: input.proposal, sessionId: input.sessionId });
    revalidatePath('/admin/calibrations');
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function rejectProposalAction(input: {
  sessionId: string;
  proposal: Proposal;
}) {
  try {
    await rejectProposal({ proposal: input.proposal, sessionId: input.sessionId });
    revalidatePath('/admin/calibrations');
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
