'use client';

import { useFunnelV2 } from '../FunnelV2Context';
import { MiniIcon } from '../components/icons';
import { ToggleChip, MoneyInput, YesNoRow, EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

// Hvidevarer mapping
const HVIDEVARER: Array<{ label: string; key: keyof typeof HVIDEVARE_STATE_KEYS }> = [
  { label: 'Vask', key: 'Vask' },
  { label: 'Tørretumbler', key: 'Tørretumbler' },
  { label: 'Opvask', key: 'Opvask' },
  { label: 'Køl/frys', key: 'Køl/frys' },
  { label: 'Ovn', key: 'Ovn' },
  { label: 'Komfur', key: 'Komfur' },
  { label: 'Mikro', key: 'Mikro' },
  { label: 'Emhætte', key: 'Emhætte' },
];

const HVIDEVARE_STATE_KEYS = {
  'Vask': 'applVaskemaskine',
  'Tørretumbler': 'applTorretumbler',
  'Opvask': 'applOpvaskemaskine',
  'Køl/frys': 'applKoeleFryseskab',
  'Ovn': 'applOvn',
  'Komfur': 'applKomfur',
  'Mikro': 'applMikroovn',
  'Emhætte': 'applEmhaette',
} as const;

export function SidsteDetaljer() {
  const { state, update } = useFunnelV2();

  // Special-forhold mapping
  const specialOptions = [
    { t: 'Altan', sub: 'eller terrasse', icon: 'home', stateKey: 'hasAltan' as const },
    { t: 'Elevator', sub: 'i bygningen', icon: 'arrows', stateKey: 'hasElevator' as const },
    { t: 'Solceller/solfanger', sub: 'Installeret på taget', icon: 'sun', stateKey: 'hasSolarPanels' as const },
    { t: 'Aktuelt udlejet', sub: 'Vi køber gerne udlejede', icon: 'users', stateKey: 'isRented' as const },
  ];

  const priceImpactOptions = [
    { t: 'Fælleslån i ejerforeningen', sub: 'EF har optaget lån du betaler andel af', icon: 'warn', stateKey: 'hasEjerforeningGaeld' as const },
    { t: 'Renoveringsplaner i EF', sub: 'Kommende projekter (tag/facade/vinduer)', icon: 'wrench', stateKey: 'hasRenovationPlans' as const },
    { t: 'Tinglyste servitutter', sub: 'Specielle vilkår noteret på matriklen', icon: 'doc', stateKey: 'hasTinglysteServitutter' as const },
  ];

  return (
    <div className="space-y-10">
      {/* Hvidevarer */}
      <div className="space-y-3">
        <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
          Hvidevarer der følger med
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HVIDEVARER.map((h) => {
            const stateKey = HVIDEVARE_STATE_KEYS[h.key];
            const selected = state[stateKey];
            return (
              <ToggleChip
                key={h.label}
                label={h.label}
                selected={!!selected}
                onToggle={() => update({ [stateKey]: !selected } as Partial<typeof state>)}
                variant="checkbox"
              />
            );
          })}
        </div>
      </div>

      {/* Andre fotos */}
      <div className="space-y-3 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6 text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
          Andre fotos (valgfri)
        </div>
        <p className="text-[12px] text-[#5A6166]">
          Med billeder kan vi give et endnu mere præcist tilbud.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { t: 'Altan/udsigt', icon: 'view' },
            { t: 'Plantegning', icon: 'plan' },
            { t: 'Gang/entré', icon: 'door' },
            { t: 'Andet rum', icon: 'plus' },
          ].map((p) => (
            <button
              key={p.t}
              type="button"
              className="aspect-[5/4] rounded-2xl border bg-white flex flex-col items-center justify-center gap-2 hover:bg-stone-50 active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA]"
              style={{ transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}` }}
            >
              <MiniIcon name={p.icon} />
              <span className="text-[12px] font-medium text-[#14181A]">{p.t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Andre ting vi bør vide */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-[#14181A]">
          Andre ting vi bør vide (valgfri)
        </label>
        <textarea
          value={state.notes || ''}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder='Fx "Fælles tagterrasse i bygningen", "Husdyr accepteret af EF", "Kommende ombygning af bad i 2026"'
          rows={3}
          className="w-full px-4 py-3 rounded-xl border bg-white text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] resize-y border-[#E5E2DA] focus:border-stone-400"
          style={{ transition: `border-color 180ms ${EASE_OUT}` }}
        />
      </div>

      {/* Særlige forhold */}
      <div className="space-y-4 pt-2 border-t border-[#E5E2DA]">
        <div className="pt-6">
          <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
            Særlige forhold
          </div>
          <p className="text-[12px] mt-1 text-[#5A6166]">
            Sæt kryds ved det der gælder — eller spring forbi hvis intet
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-[#14181A]">Boligens specielle ting</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {specialOptions.map((s) => {
              const sel = !!state[s.stateKey];
              return (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => update({ [s.stateKey]: !sel } as Partial<typeof state>)}
                  className="px-4 py-3 rounded-xl border-2 flex items-start gap-3 text-left active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                  style={{
                    borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                    background: sel ? '#0F1A1A' : '#fff',
                    color: sel ? '#fff' : '#14181A',
                    transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5"
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MiniIcon name={s.icon} color={sel ? '#fff' : ACCENT} />
                      <span className="text-[14px] font-medium">{s.t}</span>
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#5A6166' }}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional rental details — vises kun naar "Aktuelt udlejet" er valgt */}
        <RentalDetailsSection />

        <div className="space-y-2 pt-2">
          <label className="text-[13px] font-medium text-[#14181A]">Forhold der kan påvirke prisen</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {priceImpactOptions.map((s) => {
              const sel = !!state[s.stateKey];
              return (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => update({ [s.stateKey]: !sel } as Partial<typeof state>)}
                  className="px-3.5 py-3 rounded-xl border-2 flex items-start gap-2.5 text-left active:scale-[0.98] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
                  style={{
                    borderColor: sel ? '#0F1A1A' : '#E5E2DA',
                    background: sel ? '#0F1A1A' : '#fff',
                    color: sel ? '#fff' : '#14181A',
                    transition: `transform 150ms ${EASE_OUT}, background-color 150ms ${EASE_OUT}, color 150ms ${EASE_OUT}, border-color 150ms ${EASE_OUT}`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5"
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MiniIcon name={s.icon} color={sel ? '#fff' : ACCENT} size={13} />
                      <span className="text-[13px] font-medium leading-tight">{s.t}</span>
                    </div>
                    <div className="text-[11px] mt-1 leading-tight" style={{ color: sel ? 'rgba(255,255,255,0.6)' : '#5A6166' }}>
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * RentalDetailsSection — conditional reveal naar isRented = true.
 * Vi spoerger om alle de felter v1 brugte (rentalMonthlyRent etc.) plus
 * smooth expand via grid-template-rows transition.
 * ────────────────────────────────────────────────────────────────────── */
function RentalDetailsSection() {
  const { state, update } = useFunnelV2();
  const open = state.isRented;

  return (
    <div
      className="grid overflow-hidden"
      style={{
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: `grid-template-rows 280ms ${EASE_OUT}`,
      }}
      aria-hidden={!open}
    >
      <div className="min-h-0">
        <div
          className="mt-3 rounded-2xl p-5 sm:p-6 space-y-5"
          style={{
            background: '#F8F2E5',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-4px)',
            transition: `opacity 220ms ${EASE_OUT}, transform 220ms ${EASE_OUT}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#9C988C]">
                Udlejning
              </div>
              <div className="text-[15px] font-semibold mt-0.5 text-[#14181A]">
                Detaljer om lejekontrakten
              </div>
              <p className="text-[12px] mt-1 leading-relaxed text-[#5A6166] max-w-md">
                Vi køber gerne udlejede boliger — men har brug for kontraktdetaljer for at give et præcist tilbud.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <MoneyInput
              label="Månedlig leje"
              value={state.rentalMonthlyRent || ''}
              onChange={(v) => update({ rentalMonthlyRent: parseInt(v) || 0 })}
              placeholder="9.500"
              sub="Hvad lejeren betaler hver måned"
              unit="kr/md"
            />
            <MoneyInput
              label="Depositum"
              value={state.rentalDeposit || ''}
              onChange={(v) => update({ rentalDeposit: parseInt(v) || 0 })}
              placeholder="28.500"
              sub="Typisk 3 måneders leje"
              unit="kr"
            />
            <MoneyInput
              label="Forudbetalt leje"
              value={state.rentalPrepaidRent || ''}
              onChange={(v) => update({ rentalPrepaidRent: parseInt(v) || 0 })}
              placeholder="0"
              sub="Typisk 0-3 måneder (kontrakt-aftalt)"
              unit="kr"
            />
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[#14181A]">
                Startdato for lejekontrakt
              </label>
              <input
                type="date"
                value={state.rentalStartDate || ''}
                onChange={(e) => update({ rentalStartDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA] focus:border-stone-400 text-[#14181A]"
                style={{ transition: `border-color 180ms ${EASE_OUT}` }}
              />
              <p className="text-[12px] text-[#5A6166]">Hvornår startede lejeforholdet</p>
            </div>
          </div>

          {/* Uopsigelig */}
          <div className="space-y-2 pt-1">
            <YesNoRow
              label="Er lejekontrakten uopsigelig fra udlejers side?"
              value={state.rentalUopsigelig ? 'Ja' : undefined}
              onChange={(v) => update({ rentalUopsigelig: v === 'Ja' })}
            />
            <div
              className="grid overflow-hidden"
              style={{
                gridTemplateRows: state.rentalUopsigelig ? '1fr' : '0fr',
                transition: `grid-template-rows 250ms ${EASE_OUT}`,
              }}
            >
              <div className="min-h-0">
                <div className="pt-3">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#14181A]">
                      Antal måneder uopsigelig
                    </label>
                    <div className="relative max-w-[200px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={state.rentalUopsigeligMaaneder || ''}
                        onChange={(e) =>
                          update({
                            rentalUopsigeligMaaneder:
                              parseInt(e.target.value.replace(/[^\d]/g, '')) || 0,
                          })
                        }
                        placeholder="12"
                        className="w-full px-4 py-3 pr-16 rounded-xl border bg-white text-[15px] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA] focus:border-stone-400 text-[#14181A]"
                        style={{ transition: `border-color 180ms ${EASE_OUT}` }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#9C988C]">
                        mdr
                      </span>
                    </div>
                    <p className="text-[12px] text-[#5A6166]">
                      Hvor mange måneder du som udlejer er bundet til ikke at opsige
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload kontrakt */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#14181A]">
              Lejekontrakt (valgfri, anbefales)
            </label>
            <button
              type="button"
              className="w-full py-4 rounded-xl border-2 border-dashed bg-white hover:bg-stone-50 text-[14px] font-medium border-[#D6D2C5] text-[#14181A] active:scale-[0.99] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949]"
              style={{ transition: `background-color 150ms ${EASE_OUT}, transform 150ms ${EASE_OUT}` }}
            >
              {state.rentalContract ? (
                <span className="text-[#244949]">
                  ✓ {state.rentalContract.name} ({Math.round(state.rentalContract.size / 1024)} KB)
                </span>
              ) : (
                <>
                  Upload lejekontrakt <span className="text-[#9C988C]">(PDF, JPG, DOC)</span>
                </>
              )}
            </button>
            <p className="text-[12px] text-[#5A6166]">
              Sender en kopi du kan se mæglerens spørgsmål i forvejen — mere præcist tilbud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
