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
  category: 'current' | 'design' | 'flow-and-design' | 'flow-only' | 'flow-experiments';
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
  // ===== STRUKTURELLE EKSPERIMENTER (alternative flow-paradigmer) =====
  {
    href: '/salg-onepage',
    name: 'G — Single-page scroll-flow (Stripe checkout-stil)',
    category: 'flow-experiments',
    desc: 'Alt på én scrollbar side. Ingen "næste-knap"-stress. Sticky live-summary på højre side på desktop.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      'Sektion 01: Adresse + kontakt (autocomplete, auto-facts, navn/email/tlf)',
      'Sektion 02: Boligen overall stand (5 chips på én række)',
      'Sektion 03: Faste udgifter (4 number-inputs i grid)',
      'Sektion 04: Lidt om dig (3 chip-rows: tidshorisont, grund, efter salget)',
      'Sektion 05: Estimat med dark hero + email-CTA',
      'Sticky summary på højre: live tilbud + adresse + kvm + stand + drift',
    ],
  },
  {
    href: '/salg-map',
    name: 'H — Map-led flow (Compass / Redfin-stil)',
    category: 'flow-experiments',
    desc: 'Kortet er anker hele vejen. Property-pin viser din bolig, comparables som pins, EF-grænse som polygon. Sidebar-form til højre på desktop, bottom-sheet på mobile.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      '1. Adresse + kort med pins (din bolig + comparables + EF-grænse)',
      '2. Boligen — overall stand i sidebar',
      '3. Udgifter — 3 number-inputs',
      '4. Tilbud — dark hero + EF-comparables-tabel',
      'Kortet persisterer hele vejen — sælger ser sig selv på kortet',
    ],
  },
  {
    href: '/salg-hybrid',
    name: 'I — Hybrid: vores flow + Opendoor transparent breakdown',
    category: 'flow-experiments',
    desc: 'Vores 5-trins flow uændret, men estimat-siden tilføjer Opendoor-style fee-breakdown OVENPÅ vores eksisterende "hvad du sparer"-blok. Sælger ser både hvordan vi får til prisen + hvorfor det stadig er en god deal.',
    palette: ['#0f172a', '#f8fafc', '#64748b'],
    flow: [
      '1-4. Som vores nuværende flow (Adresse+kontakt, Boligen, Udgifter, Om dig)',
      '5. Tilbud:',
      '   • Dark hero med 1.245.000 kr',
      '   • Opendoor-breakdown: Markedspris −5% gebyr −66k reparation = tilbud',
      '   • Vores eksisterende savings-blok: mæglersalær, markedsafslag, drift',
      '   • "Svarer til at sælge for X" sammenligning',
      '   • Inspections-garanti',
    ],
  },
];

const CATEGORY_LABELS = {
  current: 'Reference',
  design: 'Design-eksperimenter (vores flow + andre stilarter)',
  'flow-and-design': 'Komplette kopier fra konkurrenter (deres flow + deres styling)',
  'flow-only': 'Flow-eksperimenter (deres flow + vores styling)',
  'flow-experiments': 'Strukturelle eksperimenter (alternative flow-paradigmer)',
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
            Sammenlign current implementering med 9 alternativer. Production /salg og CRM er
            uændret. Hver variant har klikbar full flow — gennemgå dem på din telefon.
          </p>
          <div className="pt-2">
            <Link
              href="/design-vote"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
            >
              📋 Stem på din favorit →
            </Link>
            <p className="text-xs text-slate-500 mt-2">
              Klikbar afstemnings-side — godt til at dele med UX-designer eller team.
            </p>
          </div>
        </div>

        {(['current', 'design', 'flow-and-design', 'flow-only', 'flow-experiments'] as const).map((cat) => (
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
            <li>• <strong>Current vs E (Opendoor-flow)</strong>: Skal vi adoptere 8-trins flow med separate room-condition-screens?</li>
            <li>• <strong>Current vs F (Zillow-flow)</strong>: Skal vi vise estimat FØR vi spørger om alt? (info-first vs form-first)</li>
            <li>• <strong>Current vs G (one-page)</strong>: Skal alt være på én side? (lavere navigations-friktion vs længere visuelt løb)</li>
            <li>• <strong>Current vs H (map-led)</strong>: Er kort-anker hele vejen mere overbevisende? (territorium-følelse vs form-fokus)</li>
            <li>• <strong>Current vs I (hybrid)</strong>: Skal vi vise transparent fee-breakdown på toppen af savings-blokken?</li>
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
