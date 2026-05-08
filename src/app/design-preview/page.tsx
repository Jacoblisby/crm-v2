/**
 * /design-preview — index over alle design-varianter af salgssiden.
 * Lokal-only sammenligning. Production /salg er uændret.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Variant {
  href: string;
  name: string;
  category: 'current' | 'design' | 'flow-and-design' | 'flow-only';
  desc: string;
  palette: string[];
  flow: string[];
}

const VARIANTS: Variant[] = [
  {
    href: '/salg',
    name: 'Current — Vores flow + vores design',
    category: 'current',
    desc: 'Slate-900 monokrom, Apple/Compass-vibe. Det vi har i dag.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      '1. Adresse + kontakt-info samlet',
      '2. Boligen — 5 sub-screens med per-rum stand-cards (køkken, bad, stue, sov, resten)',
      '3. Udgifter (fællesudgifter påkrævet)',
      '4. Lidt om dig (timing, grund, efter salget — sale-leaseback flag)',
      '5. Estimat med closing-date slider + EF social-proof + virtuelt møde',
    ],
  },
  // ===== DESIGN-EKSPERIMENTER (vores flow + andre stilarter) =====
  {
    href: '/salg-warm',
    name: 'A — Casavo Warm (vores flow + warm styling)',
    category: 'design',
    desc: 'Cream + sage-grøn + serif italic accent. Italiensk boutique, varm og imødekommende.',
    palette: ['#fdfaf6', '#5a7a6e', '#1f2937'],
    flow: [
      '1. Adresse + kontakt — serif "egentlig"-italic accent i hero',
      '2. Boligen — per-rum stand med blødere afrundede cards',
      '3. Udgifter — input-felter med cream baggrund',
      '4. Lidt om dig — chip-baseret som vores',
      '5. Estimat — sage-grøn CTA + kr i serif',
    ],
  },
  {
    href: '/salg-editorial',
    name: 'B — Editorial Confidence (vores flow + magazine styling)',
    category: 'design',
    desc: 'Off-white + deep navy + amber italic accent. Magazine-style, Stripe/Linear-vibe.',
    palette: ['#fafaf9', '#1e2a3a', '#d97706'],
    flow: [
      '1. Adresse + kontakt — № 01 magazine-headline med stort serif "Sælg din lejlighed. Uden mægler."',
      '2. Boligen — minimal cards, ingen rounded corners',
      '3. Udgifter — typografi-tung layout',
      '4. Lidt om dig — sparse navy buttons',
      '5. Estimat — pull-quote fra Jacob nederst',
    ],
  },
  // ===== FLOW + STYLING-EKSPERIMENTER (deres flow + deres styling) =====
  {
    href: '/salg-opendoor',
    name: 'C — Opendoor (deres flow + deres styling)',
    category: 'flow-and-design',
    desc: 'Bright tech-blå + chunky bold sans + emoji-led condition. Direkte iBuyer-DNA.',
    palette: ['#143cd9', '#ff5d3a', '#ffffff'],
    flow: [
      '1. Adresse — store input-felt med "Find boligen"-knap, ★4.8 social proof',
      '2. Verify property — auto-facts (m², værelser, byggeår) til bekræftelse + tip-banner',
      '3. Home features — 2-kolonne checkbox grid med emojis (altan, elevator, kælder, vaskemaskine osv.)',
      '4. Køkken-condition — 5 niveauer med emojis (✨/👍/🤷/🔧/🚧) + photo upload',
      '5. Bad-condition — samme format',
      '6. Andre rum — kompakt liste med dropdown-vurderinger',
      '7. Kontakt — navn/email/tlf + "hvornår sælge"',
      '8. Instant offer — transparent breakdown: markedspris −5% service-fee −reparations-estimat = dit tilbud',
    ],
  },
  {
    href: '/salg-zillow',
    name: 'D — Zillow (deres flow + deres styling)',
    category: 'flow-and-design',
    desc: 'Z-blå + photo-bg hero + data-rich. Established marketplace-feel.',
    palette: ['#006aff', '#0e1d35', '#ffffff'],
    flow: [
      '1. Søg — fullscreen blå gradient hero med stort search-input',
      '2. Property overview (passive INFO først!) — 365-estimat 1.380.000 kr + range + salgshistorik 2008/2018/2026 + 3 comparables-cards med foto-placeholders + "Få et kontant tilbud"-CTA nederst',
      '3. Quick condition — 5 chips på én linje + 4 toggle-features',
      '4. Photos — 8 valgfri slots i 2x4 grid',
      '5. Kontakt — 4 felter',
      '6. Tilbud — 1.245.000 kr + breakdown med service-fee + inspections-garanti',
    ],
  },
  // ===== FLOW-ONLY EKSPERIMENTER (deres flow + vores styling) =====
  {
    href: '/salg-flow-opendoor',
    name: 'E — Opendoor-flow + vores styling',
    category: 'flow-only',
    desc: 'Samme 8-trins flow som Opendoor men slate-900 monokrom. Isolerer "er deres flow bedre?"-spørgsmålet.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      '1. Adresse — vores rene slate-input',
      '2. Verify property — auto-facts som Opendoor men i vores card-style',
      '3. Home features — checkbox grid uden emojis, slate-900 active states',
      '4-6. Per-rum condition — 5 stand-cards (uden emojis) + valgfri foto under',
      '7. Kontakt — som vores Step 1 contact-block',
      '8. Tilbud — slate-900 dark hero + transparent service-fee breakdown',
    ],
  },
  {
    href: '/salg-flow-zillow',
    name: 'F — Zillow-flow + vores styling',
    category: 'flow-only',
    desc: 'Samme info-first flow som Zillow men slate-900 monokrom. Isolerer "er info-first bedre end form-first?"-spørgsmålet.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      '1. Søg — clean slate hero med adresse-input',
      '2. Property overview FIRST (Zillow-style) — 365-estimat 1.380.000 kr + range + history + comparables med slate-cards + "Få kontant tilbud"-CTA',
      '3. Quick condition — 5 chips + 4 toggles',
      '4. Photos — 2x4 grid',
      '5. Kontakt',
      '6. Tilbud — vores dark hero + breakdown',
    ],
  },
];

const CATEGORY_LABELS = {
  current: 'Reference',
  design: 'Design-eksperimenter (vores flow + andre stilarter)',
  'flow-and-design': 'Komplette ipdates fra konkurrenter (deres flow + deres styling)',
  'flow-only': 'Flow-eksperimenter (deres flow + vores styling)',
};

export default function DesignPreviewPage() {
  const grouped = VARIANTS.reduce<Record<string, Variant[]>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
            Lokal design-sammenligning
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Salgsside — design + flow-eksperimenter
          </h1>
          <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
            Sammenlign current implementering med 6 alternativer. Production /salg og CRM er
            uændret. Hver variant har klikbar full flow — gennemgå dem på din telefon.
          </p>
        </div>

        {(['current', 'design', 'flow-and-design', 'flow-only'] as const).map((cat) => (
          <section key={cat} className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul className="space-y-3">
              {grouped[cat]?.map((v) => (
                <li key={v.href}>
                  <Link
                    href={v.href}
                    className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-semibold text-slate-900">{v.name}</h3>
                          <span className="text-xs text-slate-500">{v.href}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {v.palette.map((c, i) => (
                          <span
                            key={i}
                            className="w-6 h-6 rounded-full border border-slate-200"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                    <ul className="space-y-1 pt-3 border-t border-slate-100">
                      {v.flow.map((step, i) => (
                        <li key={i} className="text-xs text-slate-600 leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
            Hvad du kan udlede fra at sammenligne
          </p>
          <ul className="space-y-1.5 text-sm text-slate-700">
            <li>• <strong>Current vs A/B</strong>: Er en anden visuel stil bedre? (samme flow, bare ny styling)</li>
            <li>• <strong>Current vs E (Opendoor-flow)</strong>: Skal vi adoptere Opendoor's 8-trins flow med separate room-condition-screens?</li>
            <li>• <strong>Current vs F (Zillow-flow)</strong>: Skal vi vise estimat FØR vi spørger om alt? (info-first vs form-first)</li>
            <li>• <strong>C vs E</strong>: Er forskellen mellem Opendoor-stil og vores stil meningsfuld (begge bruger Opendoor-flow)?</li>
            <li>• <strong>D vs F</strong>: Samme spørgsmål for Zillow.</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500 pt-4 border-t border-slate-200">
          Når du har valgt retning kan vi rulle den ud i den rigtige /salg.
        </p>
      </div>
    </div>
  );
}
