'use client';

/**
 * KontaktV4 — "Hvor sender vi dit tilbud?" (Figma: 01_Adresse strin 2).
 * Hvidt card: Fulde navn (full-width), Email + Telefon side om side m. hints.
 */
import { useFunnelV2 } from '../../salg-v2/FunnelV2Context';
import { Card, FieldV4 } from '../primitives';

export function KontaktV4() {
  const { state, update } = useFunnelV2();

  return (
    <Card className="p-6 sm:p-8">
      <div className="space-y-6">
        <FieldV4
          label="Fulde navn"
          value={state.fullName}
          onChange={(v) => update({ fullName: v })}
          placeholder="Dit navn"
          autoComplete="name"
        />
        <div className="grid sm:grid-cols-2 gap-6">
          <FieldV4
            label="Email"
            value={state.email}
            onChange={(v) => update({ email: v })}
            placeholder="navn@email.dk"
            type="email"
            autoComplete="email"
            hint="Her sender vi estimatet"
          />
          <FieldV4
            label="Telefon"
            value={state.phone}
            onChange={(v) => update({ phone: v })}
            placeholder="+45 12 34 56 78"
            type="tel"
            autoComplete="tel"
            hint="Kun hvis vi har brug for at følge op"
          />
        </div>
      </div>
    </Card>
  );
}
