'use client';

import { useFunnel } from '../FunnelContext';
import { TOTAL_DRIFT } from '../types';

export function Step3Costs() {
  const { state, update, next, prev } = useFunnel();
  const baseDrift = TOTAL_DRIFT(state);

  const waterCost = state.waterPaidViaAssoc
    ? state.waterAcontoYearly
    : state.waterUsageLastYearKr;
  const heatCost = state.heatPaidViaAssoc
    ? state.heatAcontoYearly
    : state.heatUsageLastYearKr;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Faste udgifter</h2>
        <p className="text-sm text-slate-500">
          <strong>Alle beløb er årlige (kr/år)</strong>. Vi bruger dem til at beregne afkastet —
          jo præcisere data, jo bedre tilbud.
        </p>
      </div>

      {/* === EJERUDGIFTER === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Ejerudgifter (kr/år)
        </h3>
        <p className="text-xs text-slate-500">
          Udfyld det du kender — felter du ikke har et tal til lader du bare stå tomme. Jo flere
          du udfylder, jo mere præcist bliver vores tilbud.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CostInput
            label="Fællesudgifter til ejerforeningen"
            hint="Måneds-opkrævning × 12 (typisk 18-30k)"
            placeholder="24.000"
            value={state.costFaellesudgifter}
            onChange={(v) => update({ costFaellesudgifter: v })}
          />
          <CostInput
            label="Grundskyld (ejendomsskat)"
            hint="Står på din opkrævning fra kommunen"
            placeholder="4.500"
            value={state.costGrundvaerdi}
            onChange={(v) => update({ costGrundvaerdi: v })}
          />
          <CostInput
            label="Ydelse på fælleslån"
            hint="Din andel/år hvis ejerforeningen har lån"
            placeholder="6.800"
            value={state.costFaelleslaan}
            onChange={(v) => update({ costFaelleslaan: v })}
          />
          <CostInput
            label="Renovation"
            hint="Skraldegebyr — ofte inkl. i fællesudg., skip ellers"
            placeholder="1.800"
            value={state.costRenovation}
            onChange={(v) => update({ costRenovation: v })}
          />
          <CostInput
            label="Bygningsforsikring"
            hint="Ofte inkl. i fællesudg. — skip ellers"
            placeholder="0"
            value={state.costForsikringer}
            onChange={(v) => update({ costForsikringer: v })}
          />
          <CostInput
            label="Rottebekæmpelse"
            hint="Lille gebyr fra kommunen — typisk 100-200 kr"
            placeholder="120"
            value={state.costRottebekempelse}
            onChange={(v) => update({ costRottebekempelse: v })}
          />
          <CostInput
            label="Andre driftsomkostninger"
            hint="Vicevært, antenne, m.m. (ekskl. vand/varme — nedenunder)"
            placeholder="0"
            value={state.costAndreDrift}
            onChange={(v) => update({ costAndreDrift: v })}
          />
        </div>
      </section>

      {/* === VAND === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">💧 Vand</h3>
        <ToggleRow
          label="Betales acontobeløb for vand til ejerforeningen?"
          value={state.waterPaidViaAssoc}
          onChange={(v) => update({ waterPaidViaAssoc: v })}
        />
        {state.waterPaidViaAssoc ? (
          <CostInput
            label="Acontobeløb for vand"
            hint="Det samlede beløb du betaler ejerforeningen for vand pr. år"
            placeholder="6.000"
            value={state.waterAcontoYearly}
            onChange={(v) => update({ waterAcontoYearly: v })}
          />
        ) : (
          <CostInput
            label="Samlet vandregning sidste år"
            hint="Sum af 4 kvartalsregninger eller årsopgørelse fra forsyningen"
            placeholder="3.500"
            value={state.waterUsageLastYearKr}
            onChange={(v) => update({ waterUsageLastYearKr: v })}
          />
        )}
      </section>

      {/* === VARME === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">🔥 Varme</h3>
        <ToggleRow
          label="Betales acontobeløb for varme til ejerforeningen?"
          value={state.heatPaidViaAssoc}
          onChange={(v) => update({ heatPaidViaAssoc: v })}
        />
        {state.heatPaidViaAssoc ? (
          <CostInput
            label="Acontobeløb for varme"
            hint="Det samlede beløb du betaler ejerforeningen for varme pr. år"
            placeholder="14.000"
            value={state.heatAcontoYearly}
            onChange={(v) => update({ heatAcontoYearly: v })}
          />
        ) : (
          <CostInput
            label="Samlet varmeregning sidste år"
            hint="Årsopgørelse fra fjernvarme/varmeværket"
            placeholder="11.500"
            value={state.heatUsageLastYearKr}
            onChange={(v) => update({ heatUsageLastYearKr: v })}
          />
        )}
      </section>

      {/* === HÆFTELSE === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          🏛️ Hæftelse til ejerforening
        </h3>
        <p className="text-xs text-slate-600">
          {state.costFaelleslaan > 0
            ? 'Du afdrager på et fælleslån — så er der også en restgæld du hæfter for. Vi har brug for at vide hvor stor din andel er, og om lånet kan indfries før tid.'
            : 'Hvis ejerforeningen har gæld (fx fra renovering, energiforbedring), hæfter du for din andel. Det fremgår typisk af tinglysningsattesten eller årsregnskabet. Lader du feltet være 0 antager vi at der ingen hæftelse er.'}
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
          <strong>Eksempel:</strong> ejerforeningen har et fælleslån på 50 mio kr fordelt på 100
          lejligheder → din andel er ca. <strong>500.000 kr</strong>. Tjek tinglysningsattest eller
          spørg administrator hvis du er i tvivl.
        </div>
        <CostInput
          label={state.costFaelleslaan > 0 ? 'Din andel af foreningens restgæld' : 'Din andel af ejerforeningens gæld'}
          hint="Engangsgæld — IKKE den månedlige fælleslån-ydelse (den indtastede du ovenover)"
          placeholder="0"
          value={state.ejerforeningHaeftelseKr}
          onChange={(v) => update({ ejerforeningHaeftelseKr: v })}
          suffix="kr"
        />
        {state.costFaelleslaan > 0 && (
          <div>
            <div className="text-sm font-medium text-slate-700 mb-1">
              Kan lånet indfries før tid?
            </div>
            <div className="flex gap-2">
              {(['ja', 'nej', 'vedikke'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update({ faelleslaanCanPrepay: opt })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    state.faelleslaanCanPrepay === opt
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {opt === 'ja' ? 'Ja' : opt === 'nej' ? 'Nej' : 'Ved ikke'}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Står typisk i ejerforeningens årsregnskab eller hos administrator
            </div>
          </div>
        )}
      </section>

      {/* === TOTAL === */}
      <div
        className={`rounded-xl p-4 space-y-2 border ${
          baseDrift === 0
            ? 'bg-slate-50 border-slate-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-slate-700 text-sm">Drift (uden vand/varme):</span>
          <span
            className={`text-2xl font-bold ${
              baseDrift === 0 ? 'text-slate-400' : 'text-emerald-700'
            }`}
          >
            {baseDrift === 0
              ? 'Indtast for at se total'
              : `${baseDrift.toLocaleString('da-DK')} kr/år`}
          </span>
        </div>
        {baseDrift > 0 && (
          <div className="text-xs text-slate-500 text-right">
            ~{Math.round(baseDrift / 12).toLocaleString('da-DK')} kr/md
          </div>
        )}
        {(waterCost > 0 || heatCost > 0) && (
          <div className="border-t border-emerald-200 pt-2 mt-2 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>💧 Vand ({state.waterPaidViaAssoc ? 'aconto via EF' : 'forbrug'}):</span>
              <span className="font-medium">{waterCost.toLocaleString('da-DK')} kr/år</span>
            </div>
            <div className="flex justify-between">
              <span>🔥 Varme ({state.heatPaidViaAssoc ? 'aconto via EF' : 'forbrug'}):</span>
              <span className="font-medium">{heatCost.toLocaleString('da-DK')} kr/år</span>
            </div>
            <div className="text-[11px] text-slate-500 italic pt-1">
              Vand/varme indgår ikke i ROE-beregningen — viderefaktureres til lejer.
            </div>
          </div>
        )}
        {state.ejerforeningHaeftelseKr > 0 && (
          <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between text-xs text-slate-600">
            <span>+ Hæftelse til EF (engang):</span>
            <span className="font-medium">
              {state.ejerforeningHaeftelseKr.toLocaleString('da-DK')} kr
            </span>
          </div>
        )}
      </div>

      {/* === RELATEREDE DOKUMENTER === */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          📎 Vedhæft dokumentation (valgfri)
        </h3>
        <p className="text-xs text-slate-600">
          Vedhæft gerne salgsopstilling, ejerforeningens årsregnskab, vand/varme-regning eller
          vurderingsrapport — så <strong>dobbelttjekker vi dine tal manuelt</strong>, og kan give
          et mere præcist tilbud. Vi læser dem, men automatik er der ikke.
        </p>
        <DocumentUpload
          documents={state.documents}
          onChange={(docs) => update({ documents: docs })}
        />
      </section>

      <div className="flex justify-between gap-3 pt-2">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function CostInput({
  label,
  hint,
  placeholder,
  value,
  onChange,
  suffix = 'kr/år',
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  // Live preview af tallet med tusind-separator + per-md-omregning når relevant
  const showPreview = value > 0;
  const formatted = value.toLocaleString('da-DK');
  const perMonth =
    suffix === 'kr/år' && value > 0
      ? `(~${Math.round(value / 12).toLocaleString('da-DK')} kr/md)`
      : null;

  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
          {suffix}
        </span>
      </div>
      {showPreview && (
        <div className="text-xs text-emerald-700 mt-1 font-medium">
          = {formatted} {suffix} {perMonth}
        </div>
      )}
      {hint && !showPreview && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </label>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-slate-700 flex-1">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            value
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          Ja
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
            !value
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
          }`}
        >
          Nej
        </button>
      </div>
    </div>
  );
}

function DocumentUpload({
  documents,
  onChange,
}: {
  documents: { name: string; size: number; kind: string }[];
  onChange: (docs: { name: string; size: number; kind: string }[]) => void;
}) {
  function onSelect(files: FileList | null) {
    if (!files) return;
    const newDocs = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      kind: f.type || 'application/octet-stream',
    }));
    onChange([...documents, ...newDocs]);
  }
  function onRemove(i: number) {
    onChange(documents.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <label className="block w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => onSelect(e.target.files)}
        />
        <span className="text-sm text-slate-600">
          📎 <strong>Tap for at vedhæfte filer</strong> (PDF, JPG, DOC)
        </span>
      </label>
      {documents.length > 0 && (
        <ul className="space-y-1">
          {documents.map((doc, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm"
            >
              <span className="text-slate-400">📄</span>
              <span className="flex-1 truncate">{doc.name}</span>
              <span className="text-xs text-slate-500">
                {(doc.size / 1024).toFixed(0)} kB
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-slate-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
