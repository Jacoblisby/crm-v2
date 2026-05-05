/**
 * Afkast-debug — Excel-style mellemregningsside.
 * Indtast input-tal, se hele beregningen step-for-step.
 */
import { AfkastDebug } from './AfkastDebug';

export const dynamic = 'force-dynamic';

export default function AfkastDebugPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Afkast-beregner (debug)</h1>
        <p className="text-sm text-slate-500">
          Indtast en pris + drift + leje. Se alle mellemregninger som i Excel-arket.
        </p>
      </div>
      <AfkastDebug />
    </div>
  );
}
