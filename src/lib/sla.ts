/**
 * SLA-logik som beskrevet i design-doc'en.
 * Eksplicit kodet, ingen "magic" — det er forretningsreglen.
 */
import { Lead, LeadStage, SLA_DAYS, SLAStatus } from './types';

export function computeSLA(lead: Lead): { status: SLAStatus; daysInStage: number; slaDays: number | null } {
  const slaDays = SLA_DAYS[lead.stage];
  const now = new Date();
  const stageChanged = new Date(lead.stage_changed_at);
  const daysInStage = Math.floor((now.getTime() - stageChanged.getTime()) / (1000 * 60 * 60 * 24));

  if (slaDays === null) {
    return { status: 'ok', daysInStage, slaDays };
  }

  let status: SLAStatus = 'ok';
  if (daysInStage > slaDays) status = 'breach';
  else if (daysInStage > slaDays * 0.5) status = 'warning';

  return { status, daysInStage, slaDays };
}

export function slaBadgeColor(status: SLAStatus): string {
  switch (status) {
    case 'breach': return 'bg-red-100 text-red-800 border-red-300';
    case 'warning': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'ok': return 'bg-green-100 text-green-800 border-green-300';
  }
}
