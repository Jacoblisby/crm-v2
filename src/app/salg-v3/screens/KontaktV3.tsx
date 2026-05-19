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
            Fulde navn
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
            <p className="font-body text-[12px] muted mt-1.5">Hvis vi har brug for at supplere</p>
          </div>
        </div>
      </div>

      <div className="bg-paper rounded-[14px] p-6 sm:p-8 shadow-soft space-y-5">
        <div>
          <label className="font-body text-[13px] ink-soft block mb-3" style={{ fontWeight: 500 }}>
            Hvor mange ejer boligen sammen?
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: '1', label: 'Kun mig' },
              { v: '2', label: '2 ejere' },
              { v: '3plus', label: '3 eller flere' },
            ].map((o) => {
              const sel = state.ownerCount === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => update({ ownerCount: o.v as typeof state.ownerCount })}
                  className="px-4 py-2.5 rounded-full font-body text-[13.5px] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
                  style={{
                    background: sel ? 'var(--ink)' : 'var(--paper)',
                    color: sel ? 'var(--cream)' : 'var(--ink)',
                    border: `1px solid ${sel ? 'var(--ink)' : 'var(--border)'}`,
                    fontWeight: 500,
                    transitionProperty: 'transform, background-color, color, border-color',
                    transitionDuration: '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="font-body text-[12px] muted mt-2">
            Påvirker juridik — ægtefælle eller arvinger-samtykke ved salg.
          </p>
        </div>

        <div>
          <label className="font-body text-[13px] ink-soft block mb-3" style={{ fontWeight: 500 }}>
            Hvor længe har du boet der?
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'under1', label: 'Under 1 år' },
              { v: '1to3', label: '1–3 år' },
              { v: '3to10', label: '3–10 år' },
              { v: '10plus', label: '10+ år' },
            ].map((o) => {
              const sel = state.livedHere === o.v;
              return (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => update({ livedHere: o.v as typeof state.livedHere })}
                  className="px-4 py-2.5 rounded-full font-body text-[13.5px] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--teal)]"
                  style={{
                    background: sel ? 'var(--ink)' : 'var(--paper)',
                    color: sel ? 'var(--cream)' : 'var(--ink)',
                    border: `1px solid ${sel ? 'var(--ink)' : 'var(--border)'}`,
                    fontWeight: 500,
                    transitionProperty: 'transform, background-color, color, border-color',
                    transitionDuration: '200ms',
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <p className="font-body text-[12px] muted mt-2">
            Påvirker skat hvis under 2 år ved udlejning (parcelhusreglen).
          </p>
        </div>
      </div>

    </div>
  );
}
