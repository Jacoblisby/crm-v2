'use client';

/**
 * Kontakt — v2 styled fallback. Mellem Bekraeft og Hvornaar.
 * canProceed = email OR phone (mindst en kontakt-vej).
 */
import { useFunnelV2 } from '../FunnelV2Context';
import { EASE_OUT } from '../components/primitives';

const ACCENT = '#244949';

export function Kontakt() {
  const { state, update } = useFunnelV2();

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#EAE7DE] p-6 sm:p-7 space-y-4">
        <div>
          <label className="text-[13px] font-medium text-[#14181A] block mb-1.5">
            Fulde navn
          </label>
          <input
            type="text"
            value={state.fullName || ''}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Marie Hansen"
            autoComplete="name"
            className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA] focus:border-stone-400"
            style={{ transition: `border-color 180ms ${EASE_OUT}` }}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-medium text-[#14181A] block mb-1.5">Email</label>
            <input
              type="email"
              value={state.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="marie@example.dk"
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA] focus:border-stone-400"
              style={{ transition: `border-color 180ms ${EASE_OUT}` }}
            />
            <p className="text-[12px] text-[#5A6166] mt-1">Vi sender estimatet hertil</p>
          </div>
          <div>
            <label className="text-[13px] font-medium text-[#14181A] block mb-1.5">Telefon</label>
            <input
              type="tel"
              value={state.phone || ''}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+45 12 34 56 78"
              autoComplete="tel"
              inputMode="tel"
              className="w-full px-4 py-3 rounded-xl border bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#244949] border-[#E5E2DA] focus:border-stone-400"
              style={{ transition: `border-color 180ms ${EASE_OUT}` }}
            />
            <p className="text-[12px] text-[#5A6166] mt-1">Jacob ringer dig op</p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: '#F8F2E5', border: '1px solid #EAE7DE' }}
      >
        <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-[#14181A]">
            Dine oplysninger forbliver private.
          </p>
          <p className="text-[12.5px] text-[#5A6166] leading-relaxed">
            Vi sælger ikke data videre. Vi ringer kun for at aftale besigtigelse. Hvis vores tilbud ikke giver mening for dig, hører du ikke fra os igen.
          </p>
        </div>
      </div>
    </div>
  );
}
