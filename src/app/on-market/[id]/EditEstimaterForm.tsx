'use client';

import { useState, useTransition } from 'react';
import { updateEstimaterAction } from './actions';

interface Props {
  id: string;
  currentLeje: number;
  currentRefurb: {
    gulv: number;
    maling: number;
    rengoring: number;
    andre: number;
  };
}

export function EditEstimaterForm({ id, currentLeje, currentRefurb }: Props) {
  const [leje, setLeje] = useState(currentLeje);
  const [gulv, setGulv] = useState(currentRefurb.gulv);
  const [maling, setMaling] = useState(currentRefurb.maling);
  const [rengoring, setRengoring] = useState(currentRefurb.rengoring);
  const [andre, setAndre] = useState(currentRefurb.andre);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const refurbTotal = gulv + maling + rengoring + andre;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const r = await updateEstimaterAction({
        id,
        estimeretLejeMd: leje,
        refurbGulv: gulv,
        refurbMaling: maling,
        refurbRengoring: rengoring,
        refurbAndre: andre,
      });
      if (r.ok) {
        setMsg(`Gemt — nyt bud: ${r.afk?.budAt20PctRoe?.toLocaleString('da-DK') ?? 'n/a'} kr · ROE: ${r.afk?.roeNettoPct}%`);
      } else {
        setMsg(`Fejl: ${r.error}`);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
    >
      <h2 className="font-semibold">Dine estimater (recompute afkast)</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <Field
          label="Estimeret leje/md"
          value={leje}
          onChange={setLeje}
          unit="kr"
        />
        <Field
          label="Gulv slibning"
          value={gulv}
          onChange={setGulv}
          unit="kr"
        />
        <Field label="Maling" value={maling} onChange={setMaling} unit="kr" />
        <Field
          label="Rengøring"
          value={rengoring}
          onChange={setRengoring}
          unit="kr"
        />
        <Field label="Andet (refurb)" value={andre} onChange={setAndre} unit="kr" />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Gemmer…' : 'Gem & recompute'}
        </button>
        <span className="text-xs text-slate-500">
          Total istandsættelse: {refurbTotal.toLocaleString('da-DK')} kr
        </span>
        {msg && <span className="text-xs text-emerald-700">{msg}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-slate-600">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
        />
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </label>
  );
}
