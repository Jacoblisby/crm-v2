'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { Field, ChipRow, ToggleChip, EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function NyBolig() {
  const { state, update } = useFunnelV2();

  const omr = state.nyOmraade.length > 0 ? state.nyOmraade : ['Næstved'];

  function toggleOmr(o: string) {
    const next = omr.includes(o) ? omr.filter((x) => x !== o) : [...omr, o];
    update({ nyOmraade: next });
  }

  function toggleMust(m: string) {
    const next = state.nyMustHave.includes(m)
      ? state.nyMustHave.filter((x) => x !== m)
      : [...state.nyMustHave, m];
    update({ nyMustHave: next });
  }

  return (
    <div className="space-y-8">
      <Field label="Hvilke områder er interessante?">
        <div className="flex flex-wrap gap-2">
          {['Næstved', 'Ringsted', 'Roskilde', 'Kalundborg', 'Taastrup', 'København S', 'Andet'].map((o) => (
            <ToggleChip
              key={o}
              label={o}
              selected={omr.includes(o)}
              onToggle={() => toggleOmr(o)}
              variant="pill"
            />
          ))}
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Antal værelser (min)">
          <select
            value={state.nyRoomsMin}
            onChange={(e) => update({ nyRoomsMin: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#EAE7DE] focus:border-stone-400"
            style={{ transition: `border-color 180ms ${EASE_OUT}` }}
          >
            {['1', '2', '3', '4', '5+'].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Field label="Boligareal (min)">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={state.nySqmMin}
              onChange={(e) => update({ nySqmMin: e.target.value.replace(/[^\d]/g, '') })}
              placeholder="60"
              className="w-full px-4 py-3 pr-12 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] tabular-nums border-[#EAE7DE] focus:border-stone-400"
              style={{ transition: `border-color 180ms ${EASE_OUT}` }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9C988C]">m²</span>
          </div>
        </Field>
      </div>

      <Field label="Max månedlig husleje">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={state.nyHuslejeMax}
            onChange={(e) => update({ nyHuslejeMax: e.target.value.replace(/[^\d]/g, '') })}
            placeholder="9.500"
            className="w-full px-4 py-3 pr-16 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] tabular-nums border-[#EAE7DE] focus:border-stone-400"
            style={{ transition: `border-color 180ms ${EASE_OUT}` }}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9C988C]">kr/md</span>
        </div>
      </Field>

      <Field label="Skal-have (valgfri)">
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { t: 'Altan/terrasse', icon: 'sun' },
            { t: 'Have', icon: 'view' },
            { t: 'Elevator', icon: 'arrows' },
            { t: 'Husdyr tilladt', icon: 'paw' },
            { t: 'Tæt på togstation', icon: 'train' },
            { t: 'Tæt på skole', icon: 'school' },
            { t: 'Møbleret', icon: 'sofa' },
            { t: 'Parkering', icon: 'car' },
          ].map((m) => {
            const sel = state.nyMustHave.includes(m.t);
            return (
              <button
                key={m.t}
                type="button"
                onClick={() => toggleMust(m.t)}
                className="px-4 py-3 rounded-xl border-2 flex items-center gap-2.5 text-left active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                style={{
                  borderColor: sel ? '#0F1A1A' : '#EAE7DE',
                  background: sel ? '#0F1A1A' : '#fff',
                  color: sel ? '#fff' : '#14181A',
                  transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: sel ? '#fff' : '#C9C5BA',
                    background: sel ? '#fff' : 'transparent',
                  }}
                >
                  {sel && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#0F1A1A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <MiniIcon name={m.icon} color={sel ? '#fff' : ACCENT} size={14} />
                <span className="text-[13.5px] font-medium">{m.t}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Hvornår skal du bo i den nye bolig?">
        <ChipRow
          options={['Samtidig med salget', 'Inden for 1 mdr', '1–3 mdr efter', 'Senere', 'Fleksibel']}
          value={state.nyIndflytning}
          onChange={(v) => update({ nyIndflytning: v })}
        />
      </Field>

      <div className="rounded-2xl p-5 flex items-start gap-3 bg-[#F8F2E5]">
        <MiniIcon name="info" color={ACCENT} size={18} />
        <p className="text-[13px] leading-relaxed text-[#14181A]">
          Vi har <strong>18 lejemål</strong> klar i vores portefølje i Næstved, Ringsted, Kalundborg, Taastrup og Roskilde. Når vi snakker, kobler vi dig med en mulig matchende lejebolig.
        </p>
      </div>
    </div>
  );
}
