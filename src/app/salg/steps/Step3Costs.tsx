'use client';

import { FileText, X } from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import { TOTAL_DRIFT } from '../types';

export function Step3Costs() {
  const { state, update, next, prev } = useFunnel();
  const baseDrift = TOTAL_DRIFT(state);

  // Faellesudgifter er obligatorisk — uden dem kan vi ikke beregne afkast.
  // Andre felter er valgfri/0-default; bruger maa estimere selv hvis ikke kendt.
  const faellesudgValid = state.costFaellesudgifter > 0;
  const formValid = faellesudgValid;

  const waterCost = state.waterPaidViaAssoc
    ? state.waterAcontoYearly
    : state.waterUsageLastYearKr;
  const heatCost = state.heatPaidViaAssoc
    ? state.heatAcontoYearly
    : state.heatUsageLastYearKr;

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-brand-700 font-semibold">
          Udgifter
        </p>
        <h2 className="text-2xl sm:text-[30px] font-semibold text-ink tracking-tight">
          Faste udgifter
        </h2>
        <p className="text-[15px] text-muted leading-relaxed text-pretty">
          <strong className="text-ink">Alle beløb er årlige (kr/år).</strong> Vi bruger
          dem til at beregne afkastet — jo præcisere data, jo bedre tilbud.
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
            label="Fællesudgifter til ejerforeningen *"
            hint="Måneds-opkrævning × 12 (typisk 18-30k). Påkrævet."
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
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Vand</h3>
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
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Varme</h3>
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

      {/* === GÆLD I EJERFORENING === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Gæld i ejerforeningen
        </h3>
        <p className="text-xs text-slate-600">
          Har ejerforeningen taget et lån (fx vinduer, tag, energiforbedring) hvor ejerne hæfter
          solidarisk eller pro rata? Hvis ja, har vi brug for både den årlige ydelse og din
          andel af restgælden.
        </p>
        <ToggleRow
          label="Er der gæld i ejerforeningen?"
          value={state.hasEjerforeningGaeld}
          onChange={(v) => {
            if (!v) {
              // Reset felter når toggle slukkes så de ikke spøger i submit
              update({
                hasEjerforeningGaeld: false,
                costFaelleslaan: 0,
                ejerforeningGaeldRestgaeld: 0,
                faelleslaanCanPrepay: null,
              });
            } else {
              update({ hasEjerforeningGaeld: true });
            }
          }}
        />
        {state.hasEjerforeningGaeld && (
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <CostInput
              label="Din årlige ydelse på lånet"
              hint="Din andel pr. år af ejerforeningens samlede ydelse"
              placeholder="6.800"
              value={state.costFaelleslaan}
              onChange={(v) => update({ costFaelleslaan: v })}
            />
            <CostInput
              label="Din andel af restgælden"
              hint="Engangsbeløb — trækkes fra låneprovenuet ved overdragelse"
              placeholder="0"
              value={state.ejerforeningGaeldRestgaeld}
              onChange={(v) => update({ ejerforeningGaeldRestgaeld: v })}
              suffix="kr"
            />
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
                        ? 'bg-slate-900 border-slate-900 text-white'
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
          </div>
        )}
      </section>

      {/* === HÆFTELSE === */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Hæftelse til ejerforening
        </h3>
        <p className="text-xs text-slate-600">
          Hæftelsen er en sikkerhed ejerforeningen tinglyser foran realkreditlånet. Den dækker
          dine fremtidige indbetalinger og afregnes ved overdragelse — derfor trækkes den fra
          låneprovenuet. Den fremgår af tinglysningsattesten.
        </p>
        <CostInput
          label="Hæftelse jf. tinglysning"
          hint="Engangsbeløb — separat fra eventuel gæld i foreningen"
          placeholder="0"
          value={state.ejerforeningHaeftelseKr}
          onChange={(v) => update({ ejerforeningHaeftelseKr: v })}
          suffix="kr"
        />
      </section>

      {/* === TOTAL === */}
      <div
        className={`rounded-lg p-4 space-y-2 border ${
          baseDrift === 0
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-900 border-slate-900'
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className={`text-sm ${baseDrift === 0 ? 'text-slate-700' : 'text-slate-300'}`}>
            Drift (uden vand/varme)
          </span>
          <span
            className={`text-2xl font-bold ${
              baseDrift === 0 ? 'text-slate-400' : 'text-white'
            }`}
          >
            {baseDrift === 0
              ? 'Indtast for at se total'
              : `${baseDrift.toLocaleString('da-DK')} kr/år`}
          </span>
        </div>
        {baseDrift > 0 && (
          <div className="text-xs text-slate-300 text-right">
            ~{Math.round(baseDrift / 12).toLocaleString('da-DK')} kr/md
          </div>
        )}
        {(waterCost > 0 || heatCost > 0) && (
          <div className={`border-t pt-2 mt-2 space-y-1 text-xs ${baseDrift === 0 ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-300'}`}>
            <div className="flex justify-between">
              <span>Vand ({state.waterPaidViaAssoc ? 'aconto via EF' : 'forbrug'})</span>
              <span className="font-medium">{waterCost.toLocaleString('da-DK')} kr/år</span>
            </div>
            <div className="flex justify-between">
              <span>Varme ({state.heatPaidViaAssoc ? 'aconto via EF' : 'forbrug'})</span>
              <span className="font-medium">{heatCost.toLocaleString('da-DK')} kr/år</span>
            </div>
            <div className={`text-[11px] italic pt-1 ${baseDrift === 0 ? 'text-slate-500' : 'text-slate-400'}`}>
              Vand/varme indgår ikke i ROE-beregningen. Det viderefaktureres til lejer.
            </div>
          </div>
        )}
        {state.ejerforeningHaeftelseKr > 0 && (
          <div className={`border-t pt-2 mt-2 flex justify-between text-xs ${baseDrift === 0 ? 'border-slate-200 text-slate-600' : 'border-slate-700 text-slate-300'}`}>
            <span>+ Hæftelse til EF (engang)</span>
            <span className="font-medium">
              {state.ejerforeningHaeftelseKr.toLocaleString('da-DK')} kr
            </span>
          </div>
        )}
        {state.ejerforeningGaeldRestgaeld > 0 && (
          <div className={`flex justify-between text-xs ${baseDrift === 0 ? 'text-slate-600' : 'text-slate-300'}`}>
            <span>+ Andel af restgæld i EF (engang)</span>
            <span className="font-medium">
              {state.ejerforeningGaeldRestgaeld.toLocaleString('da-DK')} kr
            </span>
          </div>
        )}
      </div>

      {/* === RELATEREDE DOKUMENTER === */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Vedhæft dokumentation (valgfri)
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
        <div className="flex flex-col items-end gap-1">
          {!formValid && (
            <span className="text-xs text-slate-600">
              Fællesudgifter skal udfyldes for at fortsætte
            </span>
          )}
          <button
            onClick={next}
            disabled={!formValid}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
          >
            Fortsæt →
          </button>
        </div>
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
          className="w-full px-3 py-2.5 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
          {suffix}
        </span>
      </div>
      {showPreview && (
        <div className="text-xs text-slate-700 mt-1">
          {formatted} {suffix} {perMonth}
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
              ? 'bg-slate-900 border-slate-900 text-white'
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
              ? 'bg-slate-900 border-slate-900 text-white'
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
      <label className="block w-full px-4 py-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-slate-500 hover:bg-slate-50">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => onSelect(e.target.files)}
        />
        <span className="text-sm text-slate-600">
          <strong>Tap for at vedhæfte filer</strong> (PDF, JPG, DOC)
        </span>
      </label>
      {documents.length > 0 && (
        <ul className="space-y-1">
          {documents.map((doc, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm"
            >
              <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <span className="flex-1 truncate">{doc.name}</span>
              <span className="text-xs text-slate-500">
                {(doc.size / 1024).toFixed(0)} kB
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-slate-400 hover:text-red-600"
                aria-label="Fjern fil"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
