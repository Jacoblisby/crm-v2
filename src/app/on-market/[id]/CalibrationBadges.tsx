/**
 * CalibrationBadges — viser hvad systemet har LAERT fra brugerens tidligere
 * overrides i samme postnr. Server-component, fetcher fra estimate_calibrations.
 *
 * Plan A: log + suggest. Brugeren beslutter selv om suggestion bruges.
 */
import { getCalibration } from '@/lib/calibrations';

interface Props {
  postalCode: string | null;
  kvm: number;
}

export async function CalibrationBadges({ postalCode, kvm }: Props) {
  if (!postalCode) return null;

  const [lejeCal, refurbCal] = await Promise.all([
    getCalibration('lejeMd', postalCode),
    getCalibration('refurbTotal', postalCode),
  ]);

  if (!lejeCal && !refurbCal) return null;

  return (
    <div className="border rounded-lg p-3 bg-violet-50 border-violet-200 text-sm space-y-2">
      <div className="font-semibold text-violet-900 flex items-center gap-2">
        🧠 Lært fra dine tidligere overrides ({postalCode})
      </div>
      <div className="space-y-1.5">
        {lejeCal && (
          <CalRow
            label="Leje/md"
            sampleCount={lejeCal.sampleCount}
            avgDefault={lejeCal.avgDefault}
            avgActual={lejeCal.avgActual}
            avgDeltaPct={lejeCal.avgDeltaPct}
            suffix="kr"
          />
        )}
        {refurbCal && (
          <CalRow
            label="Refurb total"
            sampleCount={refurbCal.sampleCount}
            avgDefault={refurbCal.avgDefault}
            avgActual={refurbCal.avgActual}
            avgDeltaPct={refurbCal.avgDeltaPct}
            suffix={`kr (${kvm > 0 ? Math.round(refurbCal.avgActual / kvm) : 0} kr/m²)`}
          />
        )}
      </div>
      <p className="text-xs text-violet-700">
        Suggestion only. Tallene opdateres rolling baseret paa dine seneste 50 overrides.
      </p>
    </div>
  );
}

function CalRow(props: {
  label: string;
  sampleCount: number;
  avgDefault: number;
  avgActual: number;
  avgDeltaPct: number;
  suffix: string;
}) {
  const direction = props.avgDeltaPct > 0 ? '↑' : props.avgDeltaPct < 0 ? '↓' : '=';
  const color =
    Math.abs(props.avgDeltaPct) < 5
      ? 'text-slate-700'
      : props.avgDeltaPct > 0
        ? 'text-emerald-700'
        : 'text-amber-700';
  return (
    <div className="flex items-center justify-between text-xs gap-2">
      <span className="text-slate-700">
        <strong>{props.label}</strong> · n={props.sampleCount}
      </span>
      <span className="text-slate-600">
        default <strong>{props.avgDefault.toLocaleString('da-DK')}</strong>{' '}
        <span className="text-slate-400">→</span> du saetter typisk{' '}
        <strong>{props.avgActual.toLocaleString('da-DK')}</strong> {props.suffix}
      </span>
      <span className={`font-semibold ${color}`}>
        {direction} {Math.abs(props.avgDeltaPct).toFixed(1)}%
      </span>
    </div>
  );
}
