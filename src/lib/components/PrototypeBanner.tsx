/**
 * PrototypeBanner — diskret bar oeverst pa design-prototyper.
 * Signalerer at siden ikke er funktionel + giver vej tilbage til /salg.
 */
export function PrototypeBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs py-2 px-4 text-center">
      <span className="font-semibold uppercase tracking-wider">Design-forslag</span>
      <span className="opacity-60 mx-2">·</span>
      <span>Ikke funktionel — kun visuel</span>
      <span className="opacity-60 mx-2">·</span>
      <a href="https://crm.365ejendom.dk/salg" className="underline font-medium hover:text-amber-700">
        Til ægte boligberegner
      </a>
    </div>
  );
}
