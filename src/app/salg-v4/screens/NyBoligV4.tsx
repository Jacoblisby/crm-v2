'use client';

/**
 * NyBoligV4 — "Hvad leder du efter?" (01_Adresse ekstra trin, DIN NÆSTE BOLIG).
 * Kun når efter_salg = "Vil leje en anden bolig". Ønskerne synces til
 * rentalSearchCity/rentalSearchType via FunnelV2Context, så de når lead-noten.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, EASE, MoneyInputV4 } from '../primitives';

const OMRAADER = ['Næstved', 'Ringsted', 'Roskilde', 'Kalundborg', 'Taastrup', 'København S', 'Andet'];
const MUST_HAVES = ['Altan/terrasse', 'Have', 'Elevator', 'Husdyr tilladt', 'Tæt på togstation', 'Tæt på skole', 'Møbleret', 'Parkering'];
const INDFLYTNING = ['Samtidig med salget', 'Inden for 1 mdr', '1–3 mdr efter', 'Senere', 'Fleksibel'];

export function NyBoligV4() {
  const { state, update } = useFunnelV2();
  const omr = state.nyOmraade || [];
  const must = state.nyMustHave || [];

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="space-y-8">
      <Field label="Hvilke områder er interessante?">
        <div className="flex flex-wrap gap-2">
          {OMRAADER.map((o) => (
            <TogglePill key={o} label={o} selected={omr.includes(o)} onClick={() => update({ nyOmraade: toggle(omr, o) })} />
          ))}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Antal værelser (min)">
          <select
            value={state.nyRoomsMin || '2'}
            onChange={(e) => update({ nyRoomsMin: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border bg-white text-[15px] focus:outline-none"
            style={{ borderColor: V4.border, color: V4.ink }}
          >
            {['1', '2', '3', '4', '5+'].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
        <MoneyInputV4
          label="Boligareal (min)"
          value={state.nySqmMin}
          onChange={(v) => update({ nySqmMin: v })}
          placeholder="60"
          unit="m²"
        />
      </div>

      <MoneyInputV4
        label="Max månedlig husleje"
        value={state.nyHuslejeMax}
        onChange={(v) => update({ nyHuslejeMax: v })}
        placeholder="9.500"
        unit="kr/md"
      />

      <Field label="Skal-have (valgfri)">
        <div className="grid sm:grid-cols-2 gap-2">
          {MUST_HAVES.map((m) => (
            <TogglePill key={m} label={m} selected={must.includes(m)} onClick={() => update({ nyMustHave: toggle(must, m) })} wide />
          ))}
        </div>
      </Field>

      <Field label="Hvornår skal du bo i den nye bolig?">
        <div className="flex flex-wrap gap-2">
          {INDFLYTNING.map((o) => (
            <TogglePill key={o} label={o} selected={state.nyIndflytning === o} onClick={() => update({ nyIndflytning: o })} />
          ))}
        </div>
      </Field>

      <div className="rounded-2xl p-5 flex items-start gap-3" style={{ background: V4.mintSoft }}>
        <svg className="w-[18px] h-[18px] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={V4.green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p className="text-[13px] leading-relaxed" style={{ color: V4.ink }}>
          Vi har <strong style={{ fontWeight: 600 }}>+20 lejemål</strong> klar til udlejning indenfor de
          næste 3 måneder i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde. Når vi
          snakker, kobler vi dig med en mulig matchende lejebolig.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[14px] block" style={{ color: V4.ink, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function TogglePill({ label, selected, onClick, wide }: { label: string; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg border text-[13.5px] transition-all active:scale-[0.98] ${wide ? 'text-left' : ''}`}
      style={{
        borderColor: selected ? V4.green : V4.border,
        background: selected ? V4.mintSoft : '#fff',
        color: selected ? V4.greenDeep : V4.ink,
        fontWeight: selected ? 600 : 400,
        boxShadow: selected ? `inset 0 0 0 1px ${V4.green}` : 'none',
        transitionDuration: '150ms',
        transitionTimingFunction: EASE,
      }}
    >
      {label}
    </button>
  );
}
