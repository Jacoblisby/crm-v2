/**
 * /buy-list/today — top 5-10 boliger at byde på, on/off-market kombineret.
 * Bygges i Uge 6 efter tilbudsformlen er defineret (Week 0 assignment).
 */
export default function BuyListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Buy List</h1>
      <p className="text-sm text-slate-500 mb-6">
        Top 5-10 boliger at byde på i dag — kombineret on-market (4700) + off-market (bid-modne stages)
      </p>

      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
        <div className="text-slate-400 text-sm mb-2">⏳ Uge 6</div>
        <h2 className="font-semibold mb-2">Bygges efter tilbudsformlen er låst</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Buy List kombinerer on-market kandidater (post AVM + tilbudsformel) med off-market leads i
          stages: Interesse, Fremvisning, Aktivt bud. Sorteret efter <code>max(margin_pct, urgency_pct)</code>.
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Forudsætning: <code>tilbudsregel.md</code> skal udfyldes i Week 0 (se design-doc).
        </p>
      </div>
    </div>
  );
}
