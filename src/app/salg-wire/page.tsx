'use client';

/**
 * /salg-wire — wireframe-version af hele salg-flowet.
 *
 * To modes:
 *   - "clickable" (default): klik dig gennem som en rigtig funnel,
 *     next/prev knapper, stage-rail viser hvor du er
 *   - "stacked": alle 14 screens vist vertikalt for overblik
 *
 * INGEN DESIGN. Kun layout + flow.
 */
import { useState } from 'react';

const SCREENS = [
  {
    n: 1,
    stage: 'forside',
    name: 'Landing',
    render: () => <Landing />,
  },
  {
    n: 2,
    stage: 'adresse',
    name: 'Bekræft boligens detaljer',
    render: () => <Bekraeft />,
  },
  {
    n: 3,
    stage: 'adresse',
    name: 'Hvor sender vi dit tilbud? (kontakt)',
    render: () => <Kontakt />,
  },
  {
    n: 4,
    stage: 'adresse',
    name: 'Hvornår vil du flytte?',
    render: () => <Hvornaar />,
  },
  {
    n: 5,
    stage: 'boligen',
    name: 'Køkken (1/3)',
    render: () => <Room label="Køkken" hasYear />,
  },
  {
    n: 6,
    stage: 'boligen',
    name: 'Badeværelse (2/3)',
    render: () => <Room label="Badeværelse" hasYear />,
  },
  {
    n: 7,
    stage: 'boligen',
    name: 'Øvrige rum (3/3) — stue + sov',
    render: () => <RoomsOvrige />,
  },
  {
    n: 8,
    stage: 'boligen',
    name: 'Sidste detaljer (4/4)',
    render: () => <SidsteDetaljer />,
  },
  {
    n: 9,
    stage: 'udgifter',
    name: 'Boligens udgifter',
    render: () => <Udgifter />,
  },
  {
    n: 10,
    stage: 'lidt om dig',
    name: 'Hvad skal du efter salget?',
    render: () => <EfterSalg />,
  },
  {
    n: 11,
    stage: 'lidt om dig',
    name: 'Hvad leder du efter? (conditional)',
    render: () => <NyBolig />,
  },
  {
    n: 12,
    stage: 'estimat',
    name: 'Foreløbigt tilbud',
    render: () => <Estimat />,
  },
];

const STAGES = ['adresse', 'boligen', 'udgifter', 'lidt om dig', 'estimat'];

export default function SalgWirePage() {
  const [mode, setMode] = useState<'clickable' | 'stacked'>('clickable');
  const [idx, setIdx] = useState(0);

  const screen = SCREENS[Math.min(idx, SCREENS.length - 1)];

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#fff',
        color: '#000',
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '40px 24px',
        lineHeight: 1.5,
      }}
    >
      <header style={{ borderBottom: '2px solid #000', paddingBottom: 24, marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666', margin: 0 }}>
              wireframe — flow + layout only
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 600, margin: '8px 0 0', letterSpacing: '-0.01em' }}>
              /salg flow
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 0, border: '1px solid #000' }}>
            <button
              type="button"
              onClick={() => setMode('clickable')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                background: mode === 'clickable' ? '#000' : '#fff',
                color: mode === 'clickable' ? '#fff' : '#000',
                border: 0,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              clickable
            </button>
            <button
              type="button"
              onClick={() => setMode('stacked')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                background: mode === 'stacked' ? '#000' : '#fff',
                color: mode === 'stacked' ? '#fff' : '#000',
                border: 0,
                borderLeft: '1px solid #000',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              stacked
            </button>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#444', margin: '12px 0 0', maxWidth: 540 }}>
          14 screens. Ingen farver, ingen typografi-valg, ingen shadows. Brug det her til at vurdere flow + informationshierarki uden at aestetikken kommer i vejen.
        </p>
        <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
          Stage rail (vises øverst i hver funnel-screen):
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {STAGES.map((s) => (
              <span key={s} style={{ padding: '4px 10px', border: '1px solid #ccc', fontSize: 11, textTransform: 'uppercase' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </header>

      {mode === 'clickable' ? (
        <ClickableFlow idx={idx} setIdx={setIdx} screen={screen} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
          {SCREENS.map((s) => (
            <section
              key={s.n}
              style={{ borderTop: '1px dashed #aaa', paddingTop: 24 }}
            >
              <ScreenHeader n={s.n} stage={s.stage} name={s.name} totalStages={s.stage} />
              <div style={{ marginTop: 20 }}>{s.render()}</div>
            </section>
          ))}
        </div>
      )}

      <footer style={{ borderTop: '2px solid #000', marginTop: 80, paddingTop: 24, fontSize: 12, color: '#666' }}>
        End of flow. 14 screens. Conditional: screen 13 (NyBolig) vises kun hvis &quot;Vil leje en anden bolig&quot; valgt på screen 12.
      </footer>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────

function ClickableFlow({
  idx,
  setIdx,
  screen,
}: {
  idx: number;
  setIdx: (n: number) => void;
  screen: typeof SCREENS[number];
}) {
  function next() {
    if (idx < SCREENS.length - 1) {
      setIdx(idx + 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  function prev() {
    if (idx > 0) {
      setIdx(idx - 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  return (
    <div>
      {/* Position-indicator + nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, fontSize: 12, color: '#666' }}>
        <span>
          screen <strong style={{ color: '#000' }}>{idx + 1}</strong> af {SCREENS.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={prev}
            disabled={idx === 0}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              background: idx === 0 ? '#eee' : '#fff',
              color: idx === 0 ? '#999' : '#000',
              border: '1px solid #000',
              cursor: idx === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← forrige
          </button>
          <button
            type="button"
            onClick={next}
            disabled={idx === SCREENS.length - 1}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              background: idx === SCREENS.length - 1 ? '#eee' : '#000',
              color: idx === SCREENS.length - 1 ? '#999' : '#fff',
              border: '1px solid #000',
              cursor: idx === SCREENS.length - 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            næste →
          </button>
        </div>
      </div>

      {/* Quick-jump screen-selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, flexWrap: 'wrap', fontSize: 11 }}>
        {SCREENS.map((s, i) => (
          <button
            key={s.n}
            type="button"
            onClick={() => {
              setIdx(i);
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            style={{
              padding: '4px 8px',
              background: i === idx ? '#000' : '#fff',
              color: i === idx ? '#fff' : '#000',
              border: '1px solid #ccc',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
            }}
          >
            {String(s.n).padStart(2, '0')}
          </button>
        ))}
      </div>

      <ScreenHeader n={screen.n} stage={screen.stage} name={screen.name} totalStages={screen.stage} />
      <div style={{ marginTop: 24 }}>{screen.render()}</div>

      {/* Bottom nav too */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #ddd', fontSize: 13 }}>
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          style={{
            padding: '8px 18px',
            background: idx === 0 ? '#eee' : '#fff',
            color: idx === 0 ? '#999' : '#000',
            border: '1px solid #000',
            cursor: idx === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          ← forrige
        </button>
        <button
          type="button"
          onClick={next}
          disabled={idx === SCREENS.length - 1}
          style={{
            padding: '8px 18px',
            background: idx === SCREENS.length - 1 ? '#eee' : '#000',
            color: idx === SCREENS.length - 1 ? '#999' : '#fff',
            border: '1px solid #000',
            cursor: idx === SCREENS.length - 1 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          næste →
        </button>
      </div>
    </div>
  );
}

function ScreenHeader({ n, stage, name }: { n: number; stage: string; name: string; totalStages: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
        {String(n).padStart(2, '0')}
      </span>
      <div>
        <p style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#888', margin: 0 }}>
          stage: {stage}
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '4px 0 0' }}>{name}</h2>
      </div>
    </div>
  );
}

function StageRail({ active }: { active: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
      {STAGES.map((s) => {
        const idx = STAGES.indexOf(s);
        const activeIdx = STAGES.indexOf(active);
        const isDone = idx < activeIdx;
        const isCurrent = idx === activeIdx;
        return (
          <div key={s} style={{ borderTop: `2px solid ${isCurrent || isDone ? '#000' : '#ccc'}`, paddingTop: 6 }}>
            <span style={{ fontSize: 10, color: isCurrent ? '#000' : '#888', textTransform: 'uppercase' }}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopBar({ address }: { address?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd', marginBottom: 16, fontSize: 12 }}>
      <span>[ 365 ejendomme logo ]</span>
      {address && <span style={{ color: '#666' }}>📍 Bogensevej 53, 1. th, 4700 Næstved</span>}
      <span style={{ color: '#666' }}>📞 tel · gem</span>
    </div>
  );
}

function FunnelBottom({ disabled, last }: { disabled?: boolean; last?: boolean }) {
  return (
    <div style={{ borderTop: '1px solid #ddd', marginTop: 24, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span>← forrige</span>
      <span style={{ padding: '6px 16px', border: '1px solid #000', background: disabled ? '#eee' : '#000', color: disabled ? '#888' : '#fff' }}>
        {last ? 'se mit estimat →' : 'næste →'}
      </span>
    </div>
  );
}

function Box({ label, h = 100, w = '100%' }: { label: string; h?: number; w?: string | number }) {
  return (
    <div
      style={{
        border: '1px dashed #999',
        height: h,
        width: w,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: 12,
        background: '#fafafa',
      }}
    >
      [ {label} ]
    </div>
  );
}

function Input({ placeholder, w }: { placeholder: string; w?: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      readOnly
      style={{
        border: '1px solid #999',
        padding: '8px 12px',
        fontSize: 14,
        width: w ?? '100%',
        fontFamily: 'inherit',
        background: '#fff',
      }}
    />
  );
}

function Chip({ children, sel }: { children: React.ReactNode; sel?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 14px',
        border: '1px solid #000',
        background: sel ? '#000' : '#fff',
        color: sel ? '#fff' : '#000',
        fontSize: 13,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </span>
  );
}

// ─── Screen renderings ────────────────────────────────────────────────────

function Landing() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ddd', marginBottom: 32, fontSize: 12 }}>
        <span>[ 365 ejendomme logo ]</span>
        <span style={{ color: '#666' }}>nav: Sådan virker / Solgte / FAQ / Kontakt · tel</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 32, alignItems: 'center' }}>
        <div>
          <Chip>87 boliger købt siden 2020</Chip>
          <h1 style={{ fontSize: 48, lineHeight: 1.05, margin: '16px 0', fontWeight: 700 }}>
            Sælg din bolig kontant.
          </h1>
          <p style={{ fontSize: 16, color: '#444', maxWidth: 480 }}>
            Få et foreløbigt tilbud på 5 minutter. Du vælger overtagelsesdato — når det passer dig.
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <Input placeholder="📍 Indtast din adresse" />
            <button style={{ padding: '8px 18px', background: '#000', color: '#fff', border: 0, fontSize: 14 }}>
              Få tilbud →
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
            Ingen forpligtelse · 5 min · Privat
          </p>
        </div>
        <Box label="hero lifestyle photo (4:5)" h={400} />
      </div>

      <section style={{ marginTop: 64, borderTop: '1px solid #ddd', paddingTop: 32 }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>365 i tal</p>
        <h2 style={{ fontSize: 28, fontWeight: 600 }}>Vi har handlet siden 2020</h2>
        <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Drillable månedlig timeline 2020-2026 — bruger hover/click på måneder for at se aktivitet.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 16 }}>
          {[
            ['87', 'handler i alt (mar 20 – maj 26)'],
            ['218', 'lejemål under forvaltning'],
            ['2,5 mio', 'kr sparet i salærer'],
            ['bliv boende', 'nyd friværdien bekymringsfrit'],
          ].map(([n, l]) => (
            <div key={l} style={{ borderLeft: '1px solid #ccc', paddingLeft: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 64, borderTop: '1px solid #ddd', paddingTop: 32 }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>sådan virker det</p>
        <h2 style={{ fontSize: 28, fontWeight: 600 }}>Fra adresse til afsluttet salg på et par uger.</h2>
        <ol style={{ marginTop: 16, paddingLeft: 0, listStyle: 'none' }}>
          {[
            ['01', 'Du indtaster adressen', 'OIS-data og sammenlignelige handler hentes automatisk.'],
            ['02', 'Vi tager kontakt', 'Vedr. uforpligtende prisverificerings-besøg.'],
            ['03', 'Gratis besigtigelse og kontraktoplæg', 'Vi måler op og giver et bindende tilbud.'],
            ['04', 'Du vælger overtagelse', 'Når det passer dig — eller bliv boende og nyd friværdien bekymringsfrit.'],
          ].map(([n, t, d]) => (
            <li key={n} style={{ borderTop: '1px solid #ddd', padding: '16px 0', display: 'grid', gridTemplateColumns: '40px 1fr', gap: 16 }}>
              <span style={{ fontFamily: 'monospace', color: '#888' }}>{n}</span>
              <div>
                <strong>{t}</strong>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ marginTop: 64, borderTop: '1px solid #ddd', paddingTop: 32 }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>sælgere fortæller</p>
        <h2 style={{ fontSize: 28, fontWeight: 600 }}>3 testimonials</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ border: '1px solid #ddd', padding: 16 }}>
              <p style={{ fontSize: 13, fontStyle: 'italic' }}>&ldquo;Citat-tekst...&rdquo;</p>
              <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>— Navn, by</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 64, borderTop: '1px solid #ddd', paddingTop: 32, textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700 }}>Klar til at se hvad din bolig er værd?</h2>
        <button style={{ marginTop: 24, padding: '12px 32px', background: '#000', color: '#fff', border: 0, fontSize: 14 }}>
          Start dit pristjek →
        </button>
      </section>

      <footer style={{ marginTop: 64, borderTop: '1px solid #ddd', paddingTop: 16, fontSize: 11, color: '#888' }}>
        © 365 ejendomme · Privatliv · Cookies · CVR
      </footer>
    </div>
  );
}

function Bekraeft() {
  return (
    <div>
      <TopBar address />
      <StageRail active="adresse" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>ADRESSE BEKRÆFTET</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Bekræft boligens detaljer</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Disse oplysninger er fra OIS og BBR. Tjek og ret hvis noget er ændret.</p>
        </div>
        <div style={{ border: '1px solid #ccc' }}>
          <div style={{ padding: 16, background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888', margin: 0 }}>Fra OIS &amp; BBR</p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>Bogensevej 53, 1. th, 4700 Næstved</p>
            <span style={{ fontSize: 12, textDecoration: 'underline', float: 'right', marginTop: -20 }}>Ret detaljer</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              ['Boligtype', 'Ejerlejlighed'],
              ['Boligareal', '90 m²'],
              ['Antal værelser', '3 stk'],
              ['Byggeår', '1973'],
              ['Etage', '1.'],
              ['Elevator', 'Nej'],
              ['Altan/terrasse', 'Nej'],
              ['Energimærke', 'D'],
            ].map(([k, v]) => (
              <li key={k} style={{ padding: '12px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <FunnelBottom />
    </div>
  );
}

function Kontakt() {
  return (
    <div>
      <TopBar address />
      <StageRail active="adresse" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>KONTAKT</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Hvor sender vi dit tilbud?</h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Du modtager estimat på email. Vi kontakter dig kun for at aftale en gratis besigtigelse.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Fulde navn</label>
            <Input placeholder="Marie Hansen" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Email</label>
              <Input placeholder="marie@example.dk" />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Vi sender estimatet hertil</p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Telefon</label>
              <Input placeholder="+45 12 34 56 78" />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Hvis vi har brug for at supplere</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#888', borderTop: '1px solid #eee', paddingTop: 8 }}>
            <strong>Required for next:</strong> navn + (email eller telefon).
          </p>
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function Hvornaar() {
  return (
    <div>
      <TopBar address />
      <StageRail active="adresse" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>TIDSPLAN</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Hvornår vil du flytte?</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Påvirker ikke tilbuddet — hjælper os med at planlægge.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Hurtigst muligt', 'Inden for 1 måned'],
            ['1–3 måneder', 'Vi har lidt fleksibilitet'],
            ['3–6 måneder', 'Planlagt, men ikke hastværk'],
            ['6+ måneder', 'Jeg skal have tid og ro til at finde noget nyt'],
            ['Ved ikke endnu', 'Jeg vil gerne lære mere om hvad jeg kan sælge for'],
          ].map(([t, s]) => (
            <div key={t} style={{ border: '1px solid #999', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{t}</strong>
                <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>{s}</p>
              </div>
              <span style={{ width: 18, height: 18, border: '1px solid #999', borderRadius: '50%' }} />
            </div>
          ))}
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function Room({ label, hasYear }: { label: string; hasYear?: boolean }) {
  return (
    <div>
      <TopBar address />
      <StageRail active="boligen" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>BOLIGENS STAND</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>{label}</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Vælg det niveau der bedst beskriver {label.toLowerCase()}.</p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 12, color: '#888' }}>{label.toUpperCase()} (X/3)</p>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['Nyrenoveret', 'God stand', 'Trænger', 'Skal renoveres'].map((t) => (
              <div key={t} style={{ border: '1px solid #999' }}>
                <Box label={`${label} — ${t}`} h={120} />
                <div style={{ padding: 12 }}>
                  <strong style={{ fontSize: 14 }}>{t}</strong>
                  <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>4-linjers beskrivelse</p>
                </div>
              </div>
            ))}
          </div>
          {hasYear && (
            <div style={{ marginTop: 16, maxWidth: 280 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>{label}-årgang</label>
              <Input placeholder="2015" />
              <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>valgfri</p>
            </div>
          )}
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function RoomsOvrige() {
  return (
    <div>
      <TopBar address />
      <StageRail active="boligen" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>BOLIGENS STAND</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Øvrige rum</h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Stue, sov, gang, entré — én samlet vurdering. Primært malings- og slid-niveau (gulv + vægge).
          </p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 12, color: '#888' }}>ØVRIGE RUM (3/3)</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              ['Nyrenoveret', 'Klar til indflytning'],
              ['God stand', 'Velholdt'],
              ['Trænger', 'Skal males'],
              ['Skal renoveres', 'Total omgang'],
            ].map(([t, s]) => (
              <div key={t} style={{ border: '1px solid #999', padding: 14 }}>
                <strong style={{ fontSize: 14 }}>{t}</strong>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{s}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#888', borderTop: '1px solid #eee', paddingTop: 8 }}>
            <strong>Required for next:</strong> stand valgt.
          </p>
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function SidsteDetaljer() {
  return (
    <div>
      <TopBar address />
      <StageRail active="boligen" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>DETALJER OM BOLIGEN</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Sidste detaljer</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Hvidevarer, fotos, særlige forhold. Alt er valgfrit.</p>
          <p style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 12, color: '#888' }}>RESTEN (4/4)</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>hvidevarer der følger med</p>
            <div style={{ marginTop: 8 }}>
              {['Vask', 'Tørretumbler', 'Opvask', 'Køl/frys', 'Ovn', 'Komfur', 'Mikro', 'Emhætte'].map((h, i) => (
                <Chip key={h} sel={i < 3}>{h}</Chip>
              ))}
            </div>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>andre fotos (valgfri)</p>
            <div style={{ border: '1px dashed #999', padding: 24, textAlign: 'center', fontSize: 13, color: '#666', marginTop: 8 }}>
              📎 Tap for at vedhæfte op til 10 billeder
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>Altan, plantegning, entré, andet rum, eller hvad du vil</p>
            </div>
          </section>
          <section>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Andre ting vi bør vide (valgfri)</label>
            <textarea
              placeholder="Fx fælles tagterrasse, husdyr accepteret af EF..."
              readOnly
              rows={3}
              style={{ width: '100%', border: '1px solid #999', padding: 8, fontSize: 13, fontFamily: 'inherit', marginTop: 4 }}
            />
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>særlige forhold</p>
            <p style={{ fontSize: 13, color: '#666', margin: '4px 0' }}>Boligens specielle ting</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Altan', 'Elevator', 'Solceller', 'Aktuelt udlejet'].map((t) => (
                <div key={t} style={{ border: '1px solid #999', padding: 12, fontSize: 13 }}>☐ {t}</div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: '16px 0 4px' }}>Forhold der kan påvirke prisen</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Renoveringsplaner', 'Tinglyste servitutter'].map((t) => (
                <div key={t} style={{ border: '1px solid #999', padding: 12, fontSize: 12 }}>☐ {t}</div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#666', margin: '16px 0 4px', borderTop: '1px solid #eee', paddingTop: 16 }}>
              <strong>Conditional reveal</strong> hvis &quot;Aktuelt udlejet&quot; valgt:
            </p>
            <div style={{ border: '1px solid #ccc', padding: 16, background: '#fafafa' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>udlejning</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Månedlig leje · Depositum · Forudbetalt leje · Startdato · Uopsigelig? · Upload kontrakt</p>
            </div>
          </section>
        </div>
      </div>
      <FunnelBottom />
    </div>
  );
}

function Udgifter() {
  return (
    <div>
      <TopBar address />
      <StageRail active="udgifter" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>FASTE UDGIFTER</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Boligens udgifter</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Alle beløb er årlige (kr/år).</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>kerne-udgifter — påkrævet (kr/år)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              {[
                ['Fællesudg. til EF *', '24.000', 'Månedlig opkrævning × 12. Står på BetalingsService-aftalen.'],
                ['Grundskyld', '4.500', 'Ejendomsskat. Står på kommunens årsopgørelse eller skat.dk.'],
                ['Renovation', '1.800', 'Skraldegebyr. Ofte inkl. i fællesudg. — så skriv 0.'],
                ['Grundfond', '2.400', 'EFs opsparing til vedligehold. Står i årsregnskabet.'],
              ].map(([l, p, h]) => (
                <div key={l}>
                  <label style={{ fontSize: 11, fontWeight: 600 }}>{l}</label>
                  <Input placeholder={`${p} kr/år`} />
                  <p style={{ fontSize: 10.5, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{h}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>øvrige udgifter</p>
            <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>Bruger tilføjer linjer dynamisk via + knap. Kategorier: Ejendomsforsikring · Ydelse på fælleslån · Administration · Antenne · Internet · Vedligeholdelseskonto · Andet.</p>
            <div style={{ border: '1px dashed #999', padding: 16, textAlign: 'center', fontSize: 13, color: '#666' }}>+ tilføj udgift</div>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>vand</p>
            <p style={{ fontSize: 13 }}>Ja/Nej acontobeløb? + samlet årlig regning</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>Hele 2025. Årsopgørelse fra vandværket.</p>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>varme</p>
            <p style={{ fontSize: 13 }}>Ja/Nej acontobeløb? + samlet årlig regning</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>Hele 2025. Årsopgørelse fra fjernvarme/varmeværket.</p>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>hæftelse til ejerforening</p>
            <p style={{ fontSize: 13 }}>Tinglyst engangs-sikkerhed (kr)</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>0 hvis du intet skylder. Tjek tingbogen.dk.</p>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>fælleslån i ejerforeningen</p>
            <p style={{ fontSize: 13 }}>Ja/Nej + din andel (kr) hvis ja</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>Står på EFs årsopgørelse. Påvirker dit netto-provenu direkte.</p>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>gæld til ejerforening (ny)</p>
            <p style={{ fontSize: 13 }}>Ja/Nej + beløb (kr) hvis ja</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>Skyldige bidrag. Står på EFs seneste opkrævning.</p>
          </section>
          <section>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>realkreditlån</p>
            <p style={{ fontSize: 13 }}>Restgæld (kr)</p>
            <p style={{ fontSize: 10.5, color: '#888', marginTop: 2 }}>Ca-tal er fint. Står på seneste lånekontoudtog fra Nordea Kredit, Realkredit Danmark m.fl.</p>
          </section>
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function EfterSalg() {
  return (
    <div>
      <TopBar address />
      <StageRail active="lidt om dig" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>DIN SITUATION</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Hvad skal du efter salget?</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Flytter ud helt', 'Jeg har et andet sted at bo.', false],
            ['Vil blive boende', 'Du bliver boende og nyder friværdien bekymringsfrit.', true],
            ['Vil leje en anden bolig', 'Vi har +20 lejemål klar til udlejning indenfor de næste 3 mdr.', false],
            ['Ved ikke endnu', 'Vi tager den snak senere.', false],
          ].map(([t, s, hl]) => (
            <div key={t as string} style={{ border: '1px solid #999', padding: 16 }}>
              <strong>{t}</strong> {hl && <em style={{ fontSize: 11, color: '#888' }}>· populært</em>}
              <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{s}</p>
            </div>
          ))}
          <p style={{ fontSize: 12, color: '#888', marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>
            <strong>Conditional:</strong> Hvis &quot;Vil leje en anden bolig&quot; → screen 11 (NyBolig) tilføjes.
          </p>
        </div>
      </div>
      <FunnelBottom disabled />
    </div>
  );
}

function NyBolig() {
  return (
    <div>
      <TopBar address />
      <StageRail active="lidt om dig" />
      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 32, alignItems: 'flex-start' }}>
        <div>
          <Chip>DIN NYE BOLIG</Chip>
          <h1 style={{ fontSize: 32, margin: '16px 0', fontWeight: 600 }}>Hvad leder du efter?</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Vises kun hvis &quot;Vil leje en anden bolig&quot; valgt.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Områder</label>
            <div style={{ marginTop: 4 }}>
              {['Næstved', 'Ringsted', 'Roskilde', 'Kalundborg', 'Taastrup', 'København S', 'Andet'].map((o, i) => (
                <Chip key={o} sel={i === 0}>{o}</Chip>
              ))}
            </div>
          </section>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Antal værelser (min)</label>
              <Input placeholder="2" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Boligareal (min m²)</label>
              <Input placeholder="60" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Max månedlig husleje</label>
            <Input placeholder="9.500 kr/md" />
          </div>
          <section>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Skal-have</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              {['Altan', 'Have', 'Elevator', 'Husdyr tilladt', 'Tæt på togstation', 'Tæt på skole', 'Møbleret', 'Parkering'].map((t) => (
                <div key={t} style={{ border: '1px solid #999', padding: 10, fontSize: 13 }}>☐ {t}</div>
              ))}
            </div>
          </section>
          <section>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Hvornår skal du bo i den nye bolig?</label>
            <div style={{ marginTop: 4 }}>
              {['Samtidig med salget', 'Inden for 1 mdr', '1–3 mdr efter', 'Senere', 'Fleksibel'].map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          </section>
        </div>
      </div>
      <FunnelBottom />
    </div>
  );
}

function Estimat() {
  return (
    <div>
      <TopBar address />
      <StageRail active="estimat" />
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>dit foreløbige tilbud</p>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Bogensevej 53, 1. th, 4700 Næstved</h1>
        </header>

        <div style={{ border: '2px solid #000', padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#666' }}>vores tilbud kontant</p>
          <p style={{ fontSize: 56, fontWeight: 700, margin: '8px 0' }}>1.071.000 kr</p>
          <p style={{ fontSize: 12, color: '#888' }}>Bindende tilbud gives efter besigtigelse.</p>
        </div>

        <section style={{ border: '1px solid #999', padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>overtagelse</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Hvornår vil du overtage?</p>
          <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
            Slider: 14 dage ← → 6 mdr · snapper til 4 punkter · price animerer live
          </p>
          <Box label="drag slider track + handle" h={50} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 8 }}>
            <span>14 dage (+15.000)</span>
            <span>1 mdr</span>
            <span>3 mdr (standard)</span>
            <span>6 mdr (−10.000)</span>
          </div>
        </section>

        <section style={{ border: '1px solid #999', padding: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#888' }}>sammenligning</p>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Hvad du faktisk får i hånden.</p>
          <Box label="split-bar: 365 tilbud (88%) | væk via mægler (12%)" h={60} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {[
              ['Mæglersalær', '70.000 kr'],
              ['Markedsafslag', '76.020 kr'],
              ['Drift i salgsperioden', '~ kr'],
            ].map(([t, v]) => (
              <div key={t} style={{ border: '1px solid #ddd', padding: 12 }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#888' }}>{t}</p>
                <p style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: '2px solid #000', padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Næste skridt</h3>
          <p style={{ fontSize: 13, color: '#666', margin: '8px 0' }}>Vi ringer dig op inden 24 timer for at aftale gratis besigtigelse.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <button style={{ padding: '8px 18px', background: '#000', color: '#fff', border: 0 }}>Ring direkte</button>
            <button style={{ padding: '8px 18px', background: '#fff', color: '#000', border: '1px solid #000' }}>Eller skriv</button>
          </div>
        </section>

        <section style={{ border: '1px solid #ddd', padding: 12 }}>
          <p style={{ fontSize: 13 }}>📹 Vil du møde os virtuelt først? — Book virtuelt møde-knap</p>
        </section>

        <section style={{ border: '1px solid #ddd', padding: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Bygger på 3 tinglyste handler · 1 i samme ejerforening</p>
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Collapsible — 3 comparable rows m. adresse, kvm, pris, kr/m², dato</p>
        </section>

        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 12 }}>
          Disclaimer: Tilbuddet er foreløbigt. Email-bekræftelse sendes.
        </p>

        <a href="#" style={{ fontSize: 12, color: '#666', textAlign: 'center', textDecoration: 'underline' }}>
          Beregn et nyt estimat
        </a>
      </div>
    </div>
  );
}
