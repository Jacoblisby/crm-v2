'use client';

import { useFunnel } from '../FunnelContext';

export function Step5Contact() {
  const { state, update, next, prev } = useFunnel();

  const valid =
    state.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email) &&
    state.phone.replace(/\D/g, '').length >= 8;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Næsten færdig — hvor sender vi dit estimat?</h2>
        <p className="text-sm text-slate-500">
          Du modtager dit foreløbige tilbud på email + SMS. Vi ringer indenfor 24 timer for at
          aftale en gratis besigtigelse.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          label="Fulde navn"
          value={state.fullName}
          onChange={(v) => update({ fullName: v })}
          placeholder="Jens Hansen"
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          value={state.email}
          onChange={(v) => update({ email: v })}
          placeholder="jens@example.dk"
          autoComplete="email"
        />
        <Input
          label="Telefon"
          type="tel"
          value={state.phone}
          onChange={(v) => update({ phone: v })}
          placeholder="20 12 34 56"
          autoComplete="tel"
        />
      </div>

      <div className="text-xs text-slate-500 leading-relaxed">
        Ved at fortsætte accepterer du vores{' '}
        <a href="https://365ejendom.dk/privatlivspolitik" className="underline">
          privatlivspolitik
        </a>
        . Vi videregiver IKKE dine data til tredjepart. Du kan altid bede om at få dem slettet ved
        at skrive til{' '}
        <a href="mailto:administration@365ejendom.dk" className="underline">
          administration@365ejendom.dk
        </a>
        .
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          disabled={!valid}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium"
        >
          Vis mit estimat →
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-3 text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </label>
  );
}
