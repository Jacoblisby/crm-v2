'use client';

/**
 * DetaljerV4 — "Tilføj de sidste detaljer" (02_Boligen trin 4, DET SIDSTE OM BOLIGEN).
 * Hvidevarer, fotos (valgfri), røgfri (designer-tilføjelse), boligens specielle
 * ting og fri-tekst. Alt valgfrit.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, EASE, YesNoV4 } from '../primitives';

const HVIDEVARER: Array<{ label: string; key: 'applVaskemaskine' | 'applTorretumbler' | 'applOpvaskemaskine' | 'applKoeleFryseskab' | 'applOvn' | 'applKomfur' | 'applMikroovn' | 'applEmhaette' }> = [
  { label: 'Vask', key: 'applVaskemaskine' },
  { label: 'Tørretumbler', key: 'applTorretumbler' },
  { label: 'Opvask', key: 'applOpvaskemaskine' },
  { label: 'Køl/frys', key: 'applKoeleFryseskab' },
  { label: 'Ovn', key: 'applOvn' },
  { label: 'Komfur', key: 'applKomfur' },
  { label: 'Mikro', key: 'applMikroovn' },
  { label: 'Emhætte', key: 'applEmhaette' },
];

const SPECIAL: Array<{ t: string; sub: string; key: 'hasAltan' | 'hasElevator' | 'hasSolarPanels' | 'isRented' }> = [
  { t: 'Altan', sub: 'eller terrasse', key: 'hasAltan' },
  { t: 'Elevator', sub: 'i bygningen', key: 'hasElevator' },
  { t: 'Solceller/solfanger', sub: 'installeret på taget', key: 'hasSolarPanels' },
  { t: 'Aktuelt udlejet', sub: 'vi køber gerne udlejede', key: 'isRented' },
];

export function DetaljerV4() {
  const { state, update } = useFunnelV2();

  return (
    <div className="space-y-9">
      {/* Hvidevarer */}
      <section className="space-y-3">
        <Heading>Hvidevarer der følger med</Heading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HVIDEVARER.map((h) => {
            const sel = !!state[h.key];
            return (
              <button
                key={h.key}
                type="button"
                onClick={() => update({ [h.key]: !sel } as Partial<typeof state>)}
                className="px-4 py-3 rounded-lg border text-[14px] flex items-center gap-3 text-left transition-all active:scale-[0.98]"
                style={{
                  borderColor: sel ? V4.green : V4.border,
                  background: sel ? V4.mintSoft : '#fff',
                  color: sel ? V4.greenDeep : V4.ink,
                  fontWeight: sel ? 600 : 400,
                  boxShadow: sel ? `inset 0 0 0 1px ${V4.green}` : 'none',
                  transitionDuration: '150ms',
                  transitionTimingFunction: EASE,
                }}
              >
                <span
                  className="w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0"
                  style={{ borderColor: sel ? V4.green : '#c8d2cf', background: sel ? V4.green : 'transparent' }}
                >
                  {sel && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                {h.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Fotos */}
      <section className="space-y-3 pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <Heading>Fotos (valgfri)</Heading>
          <p className="text-[12.5px] mt-1" style={{ color: V4.muted }}>
            Med billeder kan vi give et endnu mere præcist tilbud.
          </p>
        </div>
        <button
          type="button"
          className="w-full py-8 rounded-xl border-2 border-dashed bg-white hover:bg-[var(--v4-cream,#f4f6f3)] flex flex-col items-center justify-center gap-2 transition-colors"
          style={{ borderColor: '#cfdad6' }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={V4.soft} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-[13px]" style={{ color: V4.ink, fontWeight: 500 }}>Tap for at vedhæfte billeder</span>
          <span className="text-[11px]" style={{ color: V4.soft }}>JPG, PNG, HEIC — max 10 stk</span>
        </button>
      </section>

      {/* Røgfri */}
      <section className="pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <YesNoV4
            label="Har boligen været røgfri?"
            value={state.smokeFree}
            onChange={(v) => update({ smokeFree: v === 'Ja' ? 'Ja' : 'Nej' })}
          />
        </div>
      </section>

      {/* Særlige forhold */}
      <section className="space-y-3 pt-2 border-t" style={{ borderColor: V4.border }}>
        <div className="pt-5">
          <Heading>Boligens specielle ting</Heading>
          <p className="text-[12.5px] mt-1" style={{ color: V4.muted }}>
            Sæt kryds ved det der gælder — eller spring forbi hvis intet.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {SPECIAL.map((s) => {
            const sel = !!state[s.key];
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => update({ [s.key]: !sel } as Partial<typeof state>)}
                className="px-4 py-3 rounded-lg border flex items-start gap-3 text-left transition-all active:scale-[0.98]"
                style={{
                  borderColor: sel ? V4.green : V4.border,
                  background: sel ? V4.mintSoft : '#fff',
                  boxShadow: sel ? `inset 0 0 0 1px ${V4.green}` : 'none',
                  transitionDuration: '150ms',
                  transitionTimingFunction: EASE,
                }}
              >
                <span
                  className="w-4 h-4 mt-0.5 rounded-[4px] border flex items-center justify-center shrink-0"
                  style={{ borderColor: sel ? V4.green : '#c8d2cf', background: sel ? V4.green : 'transparent' }}
                >
                  {sel && (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span>
                  <span className="block text-[14px]" style={{ color: sel ? V4.greenDeep : V4.ink, fontWeight: 500 }}>{s.t}</span>
                  <span className="block text-[12px] mt-0.5" style={{ color: V4.muted }}>{s.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Udlejnings-detaljer (kun hvis udlejet) */}
      {state.isRented && (
        <section className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ background: V4.mintSoft }}>
          <div>
            <Heading>Detaljer om lejekontrakten</Heading>
            <p className="text-[12.5px] mt-1" style={{ color: V4.muted }}>
              Vi køber gerne udlejede boliger — men har brug for kontraktdetaljer for at give et præcist tilbud.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <MiniMoney label="Månedlig leje" value={state.rentalMonthlyRent} onChange={(n) => update({ rentalMonthlyRent: n })} unit="kr/md" placeholder="9.500" />
            <MiniMoney label="Depositum" value={state.rentalDeposit} onChange={(n) => update({ rentalDeposit: n })} unit="kr" placeholder="28.500" />
          </div>
        </section>
      )}

      {/* Andre ting vi bør vide */}
      <section className="space-y-2 pt-2 border-t" style={{ borderColor: V4.border }}>
        <label className="block pt-5 text-[13px]" style={{ color: V4.ink, fontWeight: 500 }}>
          Andre ting vi bør vide (valgfri)
        </label>
        <textarea
          value={state.notes || ''}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder='Fx "Fælles tagterrasse i bygningen", "Husdyr accepteret af EF", "Kommende ombygning af bad i 2026"'
          rows={3}
          className="w-full px-4 py-3 rounded-lg border bg-white text-[14px] focus:outline-none resize-y"
          style={{ borderColor: V4.border, color: V4.ink }}
        />
      </section>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.18em] uppercase" style={{ color: V4.soft, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function MiniMoney({ label, value, onChange, unit, placeholder }: { label: string; value: number; onChange: (n: number) => void; unit: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] block" style={{ color: V4.ink, fontWeight: 500 }}>{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={value || ''}
          onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-16 rounded-lg border bg-white text-[15px] tabular-nums focus:outline-none"
          style={{ borderColor: V4.border, color: V4.ink }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: V4.soft }}>{unit}</span>
      </div>
    </div>
  );
}
