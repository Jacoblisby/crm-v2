'use client';

/**
 * StickyHowItWorks — fire steps stacker oven paa hinanden under scroll.
 * Hver step laaser i viewporten via position:sticky. Tekstvaegt animerer
 * via variable font naar man scroller forbi en step.
 *
 * Stripe/Apple-pattern. Brydeer "4 lige store row"-cliche'en.
 */
import { useEffect, useRef, useState } from 'react';

interface Step {
  n: string;
  title: string;
  body: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    n: '01',
    title: 'Du indtaster adressen',
    body: 'OIS-data, BBR og tinglyste handler i området hentes automatisk. Du behøver ikke kende kvm.',
    detail: 'Vi krydsrefererer med vores egne handler — typisk har vi købt i samme ejerforening tidligere.',
  },
  {
    n: '02',
    title: 'Jacob ringer inden et døgn',
    body: 'Kort snak. Vi forstår din situation og bolig. Du forpligter ikke til noget.',
    detail: 'Ingen aggressiv opfølgning. Hvis vores tilbud ikke giver mening for dig, hører du ikke fra os igen.',
  },
  {
    n: '03',
    title: 'Gratis besigtigelse',
    body: 'Vi kommer forbi inden for en uge. Måler op, fotograferer, bekræfter tilstanden.',
    detail: 'Falder vores tilbud mere end 5% under det foreløbige, kan du trække dig uden konsekvens.',
  },
  {
    n: '04',
    title: 'Du vælger overtagelse',
    body: 'Fjorten dage til seks måneder. Kontant på konto. Ingen bank-forbehold.',
    detail: 'Hurtigere overtagelse giver bonus. Længere overtagelse gør tilbuddet en smule lavere.',
  },
];

export function StickyHowItWorks() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Tracking which step is currently sticky-locked via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const stepEls = container.querySelectorAll<HTMLElement>('[data-step]');
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to top that's still intersecting
        let candidate = -1;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number(e.target.getAttribute('data-step'));
            if (idx > candidate) candidate = idx;
          }
        });
        if (candidate >= 0) setActiveIdx(candidate);
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0,
      },
    );
    stepEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="border-t border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-20 sm:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 mb-12">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start space-y-3">
            <p className="font-body text-[12px] tracking-[0.2em] uppercase soft">processen</p>
            <h2 className="font-display ink text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-[-0.025em] text-balance" style={{ fontWeight: 400 }}>
              Fra adresse til{' '}
              <em
                className="accent"
                style={{
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                  fontStyle: 'italic',
                }}
              >
                kontant på konto
              </em>{' '}
              på et par uger.
            </h2>
            <p className="font-body text-[15px] muted leading-[1.6] max-w-md pt-2">
              Fire skridt. Du beslutter farten — vi følger med.
            </p>
          </div>

          {/* Steps */}
          <div className="lg:col-span-7 space-y-32">
            {STEPS.map((s, i) => {
              const isActive = i === activeIdx;
              return (
                <article
                  key={s.n}
                  data-step={i}
                  className="space-y-5"
                  style={{
                    opacity: isActive ? 1 : 0.42,
                    transitionProperty: 'opacity',
                    transitionDuration: '500ms',
                    transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-display font-tabular ink text-[44px] sm:text-[56px] leading-none"
                      style={{
                        fontWeight: isActive ? 500 : 300,
                        fontVariationSettings: isActive
                          ? "'opsz' 144, 'SOFT' 30, 'wght' 500"
                          : "'opsz' 144, 'SOFT' 30, 'wght' 300",
                        transitionProperty: 'font-variation-settings, font-weight',
                        transitionDuration: '500ms',
                        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                      }}
                    >
                      {s.n}
                    </span>
                    <h3 className="font-display ink text-[24px] sm:text-[32px] leading-[1.1] tracking-[-0.02em]" style={{ fontWeight: 400 }}>
                      {s.title}
                    </h3>
                  </div>
                  <p className="font-body text-[16px] sm:text-[17px] ink-soft leading-[1.55] max-w-xl">
                    {s.body}
                  </p>
                  <p className="font-body text-[13.5px] muted leading-[1.6] max-w-xl border-l pl-4" style={{ borderColor: 'var(--teal)' }}>
                    {s.detail}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
