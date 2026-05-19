'use client';

/**
 * TestimonialsEditorial — bryder 3-col-cards-pattern.
 * 1 hovedcitat stor + 5 mindre i unequal grid. Ingen border, kun bg-tint.
 */
import { useEffect, useRef, useState } from 'react';

interface Quote {
  text: string;
  name: string;
  loc: string;
  detail?: string;
}

const QUOTES: Quote[] = [
  {
    text: 'Mere transparent end nogen mægler vi har snakket med.',
    name: 'Anne & Søren',
    loc: 'Ringsted',
    detail: 'Solgt marts 2026 — overtagelse på 3 uger',
  },
  {
    text: 'Min mor var lige gået bort. 365 kom forbi, gav et tilbud, og tre uger senere var handlen lukket.',
    name: 'Mette K.',
    loc: 'Næstved',
  },
  {
    text: 'Ingen fremvisninger, ingen ventetid. Sparede 70.000 kr i salær.',
    name: 'Lars P.',
    loc: 'Roskilde',
  },
  {
    text: 'Jacob var lige til at tale med. Prisen lå tæt på vores forventninger.',
    name: 'Henning O.',
    loc: 'Næstved',
  },
  {
    text: 'Vi blev boende som lejere efter salget. Begge dele virkede.',
    name: 'Ulla & Mogens',
    loc: 'Næstved',
  },
  {
    text: 'Skilsmissen krævede salg på under en måned. De holdt deres dato.',
    name: 'Maria H.',
    loc: 'Kalundborg',
  },
];

export function TestimonialsEditorial() {
  const [hero, ...rest] = QUOTES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-24 sm:py-32 space-y-16">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-3">
          <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">sælgere fortæller</p>
        </div>
        <div className="lg:col-span-7">
          <Hero quote={hero} />
        </div>
      </div>

      {/* Unequal grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
        {rest.map((q, i) => (
          <Small key={q.name} quote={q} span={spanFor(i)} />
        ))}
      </div>
    </div>
  );
}

function spanFor(i: number) {
  // editorial unequal grid: indices 0..4 get [5, 4, 3, 5, 7] col-spans (out of 12)
  const spans = [5, 4, 3, 5, 7];
  return spans[i] ?? 4;
}

function Hero({ quote }: { quote: Quote }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold: 0.4 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <figure
      ref={ref}
      className="space-y-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transitionProperty: 'opacity, transform',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <blockquote
        className="font-display ink text-[clamp(32px,4.5vw,56px)] leading-[1.05] tracking-[-0.025em] text-balance"
        style={{
          fontWeight: 400,
          fontVariationSettings: "'opsz' 144, 'SOFT' 100",
        }}
      >
        <em
          style={{
            fontStyle: 'italic',
            fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 400",
          }}
        >
          &ldquo;{quote.text}&rdquo;
        </em>
      </blockquote>
      <figcaption className="flex items-baseline gap-3 pt-2">
        <span className="font-body text-[14px] ink" style={{ fontWeight: 500 }}>
          {quote.name}
        </span>
        <span className="font-body text-[13px] muted">·</span>
        <span className="font-body text-[13px] muted">{quote.loc}</span>
        {quote.detail && (
          <>
            <span className="font-body text-[13px] soft">·</span>
            <span className="font-body text-[12px] soft">{quote.detail}</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}

function Small({ quote, span }: { quote: Quote; span: number }) {
  return (
    <figure
      className="space-y-3 bg-cream p-7 sm:p-8"
      style={{
        gridColumn: `span ${Math.min(span, 12)} / span ${Math.min(span, 12)}`,
        borderRadius: '14px',
      }}
    >
      <blockquote className="font-display ink text-[18px] sm:text-[20px] leading-[1.35] text-balance" style={{ fontWeight: 400 }}>
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      <figcaption className="flex items-baseline gap-2 pt-2 border-t border-warm">
        <span className="font-body text-[13px] ink pt-3" style={{ fontWeight: 500 }}>
          {quote.name}
        </span>
        <span className="font-body text-[12px] muted pt-3">— {quote.loc}</span>
      </figcaption>
    </figure>
  );
}
