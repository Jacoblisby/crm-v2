'use client';

/**
 * KontaktV4 — "Hvor sender vi dit tilbud?" (01_Adresse trin 2, DINE OPLYSNINGER).
 * Designer-copy: email "Her sender vi estimatet", telefon "Kun hvis vi har brug
 * for at følge op". Backend kræver alle tre felter for at oprette lead.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { V4, TextInputV4 } from '../primitives';

export function KontaktV4() {
  const { state, update } = useFunnelV2();

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border p-6 sm:p-7 space-y-5" style={{ borderColor: V4.border }}>
        <TextInputV4
          label="Fulde navn"
          value={state.fullName}
          onChange={(v) => update({ fullName: v })}
          placeholder="Marie Jensen"
          autoComplete="name"
        />
        <div className="grid sm:grid-cols-2 gap-5">
          <TextInputV4
            label="Email"
            value={state.email}
            onChange={(v) => update({ email: v })}
            placeholder="navn@email.dk"
            type="email"
            autoComplete="email"
            inputMode="email"
            sub="Her sender vi estimatet"
          />
          <TextInputV4
            label="Telefon"
            value={state.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="+45 12 34 56 78"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            sub="Kun hvis vi har brug for at følge op"
          />
        </div>
      </div>

      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: V4.mintSoft }}>
        <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={V4.green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div className="space-y-1">
          <p className="text-[13px]" style={{ color: V4.ink, fontWeight: 500 }}>
            Dine oplysninger forbliver private.
          </p>
          <p className="text-[12.5px] leading-relaxed" style={{ color: V4.muted }}>
            Vi sælger ikke data videre. Vi ringer kun for at aftale besigtigelse. Hvis
            vores tilbud ikke giver mening for dig, hører du ikke fra os igen.
          </p>
        </div>
      </div>
    </div>
  );
}
