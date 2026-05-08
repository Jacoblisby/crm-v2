'use client';

/**
 * /design-vote — afstemnings-side hvor en UX-designer (eller andre) kan
 * klikke gennem prototyperne og angive deres favorit.
 *
 * Indeholder:
 * - Alle 10 varianter som kort
 * - Radio-vælg pa hvert kort (en favorit)
 * - Kommentar-felt
 * - "Send mit valg" → mailto til Jacob med valg + kommentarer
 */
import { useState } from 'react';
import Link from 'next/link';
import { PrototypeBanner } from '@/lib/components/PrototypeBanner';

interface Variant {
  href: string;
  name: string;
  shortName: string;
  category: string;
  desc: string;
  highlights: string[];
  palette: string[];
}

const VARIANTS: Variant[] = [
  {
    href: '/salg',
    name: 'Current — vores eksisterende /salg',
    shortName: 'Current (slate-900)',
    category: 'Reference',
    desc: 'Slate-900 monokrom, Apple/Compass-vibe. 5 trin med per-rum stand-cards.',
    highlights: [
      '5-trins funnel',
      'Per-rum stand vurdering',
      'Closing-date slider',
      'EF social-proof',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-warm',
    name: 'A — Casavo Warm',
    shortName: 'Warm',
    category: 'Design-eksperiment',
    desc: 'Cream baggrund + sage-grøn + serif italic. Italiensk boutique, varm og imødekommende.',
    highlights: [
      'Cream + sage palette',
      'Serif display headlines',
      'Soft afrundede cards',
      'Vores flow uændret',
    ],
    palette: ['#fdfaf6', '#5a7a6e', '#1f2937'],
  },
  {
    href: '/salg-editorial',
    name: 'B — Editorial Confidence',
    shortName: 'Editorial',
    category: 'Design-eksperiment',
    desc: 'Off-white + deep navy + amber italic. Magazine-style, Stripe/Linear-vibe.',
    highlights: [
      'Magazine-style headlines',
      'Amber accent kun pa CTAs',
      'Pull-quote fra founder',
      'Mere whitespace',
    ],
    palette: ['#fafaf9', '#1e2a3a', '#d97706'],
  },
  {
    href: '/salg-opendoor',
    name: 'C — Opendoor (komplet kopi)',
    shortName: 'Opendoor',
    category: 'Komplet konkurrent-kopi',
    desc: '10 trin med Opendoor styling. Starter med "Hvornår vil du sælge?" + emoji-led condition cards.',
    highlights: [
      '10-trins flow (matcher Opendoor)',
      'Starter med timing',
      '5 emoji-cards pr rum',
      'Photo-upload prominent',
      'Transparent service-fee',
    ],
    palette: ['#143cd9', '#ff5d3a', '#ffffff'],
  },
  {
    href: '/salg-zillow',
    name: 'D — Zillow (komplet kopi)',
    shortName: 'Zillow',
    category: 'Komplet konkurrent-kopi',
    desc: 'Property-page first med Zestimate range bar, 4 tabs (Overblik/Salg/Skoler/Området), foto-galleri og comparable cards.',
    highlights: [
      'Info-first flow',
      'Zestimate range bar',
      '4 tabs med rigtigt indhold',
      'Skole-ratings + walk score',
      'Comparable cards med foto',
    ],
    palette: ['#006aff', '#0e1d35', '#ffffff'],
  },
  {
    href: '/salg-flow-opendoor',
    name: 'E — Opendoor flow + vores styling',
    shortName: 'Flow-Opendoor',
    category: 'Flow-eksperiment',
    desc: 'Opendoor 10-trins struktur men vores slate-900 design. Isolerer "er flow\'et bedre?".',
    highlights: [
      '10 trin som Opendoor',
      'Vores slate-900 styling',
      'Per-rum condition uden emoji',
      'Transparent breakdown',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-flow-zillow',
    name: 'F — Zillow flow + vores styling',
    shortName: 'Flow-Zillow',
    category: 'Flow-eksperiment',
    desc: 'Zillow info-first flow men vores slate-900 design. Isolerer "er info-first bedre?".',
    highlights: [
      'Info-first før form',
      'Vores slate-900 styling',
      'Vores hero + breakdown',
      '6-trins flow',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-onepage',
    name: 'G — Single-page scroll-flow',
    shortName: 'One-page',
    category: 'Strukturelt eksperiment',
    desc: 'Stripe checkout-stil. Alt på én scrollbar side med sticky live-summary på højre side på desktop.',
    highlights: [
      'Alt på én side',
      'Sticky live-estimat',
      'Ingen "næste-knap"-stress',
      'Frihed til at rette tidligere',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-map',
    name: 'H — Map-led flow',
    shortName: 'Map',
    category: 'Strukturelt eksperiment',
    desc: 'Compass/Redfin-stil. Kortet er anker hele vejen — sælger ser sig selv på kortet med pins for comparables og EF-grænse.',
    highlights: [
      'Map-anker hele vejen',
      'EF-polygon overlay',
      'Comparable pins med pris',
      'Sidebar form til højre',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    href: '/salg-hybrid',
    name: 'I — Hybrid: vores flow + Opendoor breakdown',
    shortName: 'Hybrid',
    category: 'Strukturelt eksperiment',
    desc: 'Vores 5-trins flow uændret, men estimat-side får Opendoor-style transparent fee-breakdown OVENPÅ vores eksisterende savings-blok.',
    highlights: [
      'Vores 5-trins flow',
      'Transparent fee-breakdown',
      'Vores savings-blok bevaret',
      'Inspections-garanti',
    ],
    palette: ['#0f172a', '#f8fafc', '#64748b'],
  },
];

export default function DesignVotePage() {
  const [pick, setPick] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [voter, setVoter] = useState('');

  const picked = VARIANTS.find((v) => v.href === pick);

  function submit() {
    if (!pick) {
      alert('Vælg en favorit først.');
      return;
    }
    const subject = `Design-afstemning: ${picked?.shortName}`;
    const body = [
      `Min favorit: ${picked?.name}`,
      `URL: https://crm.365ejendom.dk${picked?.href}`,
      ``,
      voter ? `Fra: ${voter}` : '',
      ``,
      `Kommentar:`,
      comment || '(ingen)',
    ]
      .filter((l) => l !== null)
      .join('\n');
    const mailto = `mailto:administration@365ejendom.dk?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PrototypeBanner />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* HEADER */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium">
            Design-afstemning
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Hvilken design + flow virker bedst?
          </h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Klik dig igennem hver prototype, og vælg den du synes virker bedst. Production
            /salg er uændret. Send dit valg via knappen nederst — vi bruger din feedback
            til at vælge retning.
          </p>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/design-preview"
              className="text-slate-700 hover:text-slate-900 underline"
            >
              ← Tilbage til oversigt
            </Link>
          </div>
        </div>

        {/* WHO ARE YOU */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <label className="block">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Hvem er du? <span className="text-slate-400 font-normal">(valgfri)</span>
            </div>
            <input
              type="text"
              value={voter}
              onChange={(e) => setVoter(e.target.value)}
              placeholder="Fx 'Anna, UX-designer' eller blot 'Anna'"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
        </div>

        {/* VARIANTS GRID */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
            Vælg din favorit ({VARIANTS.length} muligheder)
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VARIANTS.map((v) => {
              const selected = pick === v.href;
              return (
                <li key={v.href}>
                  <div
                    className={`bg-white border-2 rounded-2xl p-5 shadow-sm transition-all ${
                      selected
                        ? 'border-slate-900 shadow-lg ring-2 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {/* Header with category + palette */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                          {v.category}
                        </p>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                          {v.name}
                        </h3>
                      </div>
                      <div className="flex gap-1 shrink-0 mt-1">
                        {v.palette.map((c, i) => (
                          <span
                            key={i}
                            className="w-5 h-5 rounded-full border border-slate-200"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{v.desc}</p>

                    {/* Highlights */}
                    <ul className="space-y-1 mb-4">
                      {v.highlights.map((h) => (
                        <li
                          key={h}
                          className="text-xs text-slate-700 flex items-start gap-2"
                        >
                          <span className="text-slate-400 mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <a
                        href={v.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        Åbn prototype →
                      </a>
                      <button
                        type="button"
                        onClick={() => setPick(v.href)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          selected
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {selected ? '✓ Valgt' : 'Vælg som favorit'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* SELECTED + COMMENT + SUBMIT */}
        <div
          className={`bg-white border-2 rounded-2xl p-6 shadow-sm transition-all ${
            picked ? 'border-slate-900' : 'border-slate-200'
          }`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-3">
            Send dit valg
          </p>
          {picked ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Din favorit</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{picked.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPick(null)}
                className="text-xs text-slate-500 underline shrink-0"
              >
                Skift
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 mb-4 text-sm text-slate-500 text-center">
              Vælg en favorit ovenfor først.
            </div>
          )}

          <label className="block mb-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Kommentar <span className="text-slate-400 font-normal">(valgfri)</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Hvad var det der virkede? Hvad ville du ændre?"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={!pick}
            className="w-full sm:w-auto px-6 py-3 text-sm font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg"
          >
            Send mit valg →
          </button>
          <p className="text-xs text-slate-500 mt-3">
            Knappen åbner din mail-app med dit valg + kommentar pre-fyldt. Du kan rette
            før du sender.
          </p>
        </div>
      </div>
    </div>
  );
}
