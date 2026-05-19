'use client';

/**
 * KontaktV3 — kontaktoplysninger lige efter Bekraeft.
 * Strategisk placering: bruger har lige bekraeftet "ja det er min bolig"
 * (maximal commit-vilje). At samle kontakt her betyder vi har lead selv
 * hvis flow afbrydes senere.
 *
 * canProceed = email ELLER phone (mindst en kontakt-vej).
 * Fulde navn = valgfri men anbefalet.
 */
import { useFunnelV3 } from '../FunnelV3Context';

export function KontaktV3() {
  const { state, update } = useFunnelV3();

  return (
    <div className="space-y-6">
      <div className="bg-paper rounded-[14px] p-6 sm:p-8 shadow-soft space-y-5">
        <div>
          <label className="font-body text-[13px] ink-soft block mb-1.5" style={{ fontWeight: 500 }}>
            Fulde navn{' '}
            <em className="font-body text-[11px] soft" style={{ fontStyle: 'italic', fontWeight: 400 }}>
              valgfri
            </em>
          </label>
          <input
            type="text"
            value={state.fullName || ''}
            onChange={(e) => update({ fullName: e.target.value })}
            placeholder="Marie Hansen"
            autoComplete="name"
            className="w-full px-4 py-3 rounded-[10px] bg-cream font-body ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
            style={{
              border: '1px solid var(--border)',
              transition: 'border-color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-[13px] ink-soft block mb-1.5" style={{ fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={state.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="marie@example.dk"
              autoComplete="email"
              inputMode="email"
              className="w-full px-4 py-3 rounded-[10px] bg-cream font-body ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
              style={{
                border: '1px solid var(--border)',
                transition: 'border-color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            />
            <p className="font-body text-[12px] muted mt-1.5">Vi sender estimatet hertil</p>
          </div>
          <div>
            <label className="font-body text-[13px] ink-soft block mb-1.5" style={{ fontWeight: 500 }}>
              Telefon
            </label>
            <input
              type="tel"
              value={state.phone || ''}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+45 12 34 56 78"
              autoComplete="tel"
              inputMode="tel"
              className="w-full px-4 py-3 rounded-[10px] bg-cream font-body ink text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--teal)]"
              style={{
                border: '1px solid var(--border)',
                transition: 'border-color 180ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            />
            <p className="font-body text-[12px] muted mt-1.5">Jacob ringer dig op</p>
          </div>
        </div>
      </div>

      <div
        className="rounded-[12px] p-5 flex items-start gap-3 bg-teal-tint"
        style={{ border: '1px solid oklch(0.86 0.02 200)' }}
      >
        <svg className="w-4 h-4 mt-0.5 shrink-0 accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div className="space-y-1">
          <p
            className="font-body text-[13.5px] ink leading-[1.55]"
            style={{ fontWeight: 500 }}
          >
            Dine oplysninger forbliver{' '}
            <em
              className="accent"
              style={{
                fontStyle: 'italic',
                fontVariationSettings: "'opsz' 30, 'SOFT' 30",
              }}
            >
              private
            </em>
            .
          </p>
          <p className="font-body text-[12.5px] muted leading-[1.55]">
            Vi sælger ikke data videre. Vi ringer kun for at aftale besigtigelse. Hvis vores tilbud ikke giver mening for dig, hører du ikke fra os igen.
          </p>
        </div>
      </div>
    </div>
  );
}
