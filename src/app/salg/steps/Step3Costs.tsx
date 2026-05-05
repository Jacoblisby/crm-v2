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

  const totalAllInclusive = baseDrift + waterCost + heatCost;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CostInput
            label="Fællesudgifter til ejerforeningen"
            hint="Måneds-opkrævning × 12"
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
            hint="Hvis ejerforeningen har lån, din andel/år"
            placeholder="6.800"
            value={state.costFaelleslaan}
            onChange={(v) => update({ costFaelleslaan: v })}
          />
          <CostInput
            label="Renovation"
            hint="Skraldegebyr, hvis særskilt"
            placeholder="1.800"
            value={state.costRenovation}
            onChange={(v) => update({ costRenovation: v })}
          />
          <CostInput
            label="Bygningsforsikring"
            hint="Ofte inkl. i fællesudgifter — skip ellers"
            placeholder="0"
            value={state.costForsikringer}
            onChange={(v) => update({ costForsikringer: v })}
          />
          <CostInput
            label="Rottebekæmpelse"
            hint="Lille gebyr fra kommunen"
            placeholder="120"
            value={state.costRottebekempelse}
            onChange={(v) => update({ costRottebekempelse: v })}
          />
          <CostInput
            label="Andre driftsomkostninger"
            hint="Vicevært, antenne, m.m. (ekskl. vand/varme — det er nedenunder)"
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
            label="Vandforbrug sidste år (faktisk regning)"
            hint="Det du betalte direkte til vandværket sidste år"
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
            label="Varmeforbrug sidste år (faktisk regning)"
            hint="Det du betalte direkte til varmeværket sidste år"
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
          Hvis ejerforeningen har gæld (fx fra renovering, energiforbedring), hæfter du for din
          andel. Det fremgår typisk af tinglysningsattesten eller årsregnskabet. Lader du feltet
          være 0 antager vi at der ingen hæftelse er.
        </p>
        <CostInput
          label="Din andel af ejerforeningens gæld"
          hint="Engangsgæld — IKKE den månedlige fælleslån-ydelse (den indtastede du ovenover)"
          placeholder="0"
          value={state.ejerforeningHaeftelseKr}
          onChange={(v) => update({ ejerforeningHaeftelseKr: v })}
          suffix="kr"
        />
      </section>

      {/* === TOTAL === */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-slate-700 text-sm">Total drift inkl. vand/varme:</span>
          <span className="text-2xl font-bold text-emerald-700">
            {totalAllInclusive.toLocaleString('da-DK')} kr/år
          </span>
        </div>
        <div className="text-xs text-slate-500 text-right">
          ~{Math.round(totalAllInclusive / 12).toLocaleString('da-DK')} kr/md
        </div>
        {state.ejerforeningHaeftelseKr > 0 && (
          <div className="text-xs text-slate-600 border-t border-emerald-200 pt-2 mt-2 flex justify-between">
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
          📎 Relaterede dokumenter (valgfri)
        </h3>
        <p className="text-xs text-slate-600">
          Du kan vedhæfte salgsopstilling, ejerforeningens årsregnskab, vand/varme-regning,
          vurderingsrapport — alt der hjælper os med at give et præcist tilbud.
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
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
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
