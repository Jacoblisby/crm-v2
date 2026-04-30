/**
 * SLA-logik som ren funktion. Single source of truth — DB-view bruger samme
 * formel, og denne fil testes i sla.test.ts.
 *
 * Designprincip: Hvis du ændrer SLA-tærskelen, gøres det i pipeline_stages-tabellen
 * og INTET sted ellers. Denne funktion læser sla_days fra stage-row, ikke en const.
 */
import type { PipelineStage, SLAStatus } from './types';

export interface SLAInput {
  stageChangedAt: Date | string;
  stage: Pick<PipelineStage, 'slaDays' | 'isTerminal'>;
  now?: Date;
}

export interface SLAResult {
  status: SLAStatus;
  daysInStage: number;
  slaDays: number | null;
}

export function computeSLA({ stageChangedAt, stage, now = new Date() }: SLAInput): SLAResult {
  const stageChanged = typeof stageChangedAt === 'string' ? new Date(stageChangedAt) : stageChangedAt;
  const daysInStage = (now.getTime() - stageChanged.getTime()) / (1000 * 60 * 60 * 24);

  if (stage.isTerminal || stage.slaDays == null) {
    return { status: 'ok', daysInStage, slaDays: stage.slaDays };
  }

  let status: SLAStatus = 'ok';
  if (daysInStage > stage.slaDays) status = 'breach';
  else if (daysInStage > stage.slaDays * 0.5) status = 'warning';

  return { status, daysInStage, slaDays: stage.slaDays };
}

export function slaBadgeColor(status: SLAStatus): string {
  switch (status) {
    case 'breach':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'ok':
      return 'bg-green-100 text-green-800 border-green-300';
  }
}
