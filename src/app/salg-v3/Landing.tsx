'use client';

/**
 * Landing v3 — editorial layout.
 *
 * Sektioner:
 *   1. Hero — asymmetric, large Fraunces display, magnetic address-pill
 *   2. Stats — drillable timeline strip (ikke "hero-metric"-template)
 *   3. Saadan virker det — sticky scroll narrative (Stripe-pattern)
 *   4. Testimonials — 1 stor + 4 smaa unequal grid
 *   5. Final CTA — minimalt, store typografi
 */
import { AddressPillV3 } from './components/AddressPillV3';
import { StickyHowItWorks } from './components/StickyHowItWorks';
import { StatsTimeline } from './components/StatsTimeline';
import { TestimonialsEditorial } from './components/TestimonialsEditorial';

export function Landing() {
  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 pt-16 sm:pt-24 pb-24 sm:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-end">
          {/* Venstre — type-tung */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-body tracking-tight bg-teal-tint accent" style={{ fontWeight: 500 }}>
              <span className="w-1 h-1 rounded-full accent" style={{ background: 'currentColor' }} />
              <span className="lowercase">drevet siden 2024 — 87 boliger købt</span>
            </div>

            <h1
              className="font-display ink text-[clamp(56px,9vw,112px)] leading-[0.92] tracking-[-0.035em] text-balance"
              style={{ fontWeight: 400 }}
            >
              Sælg din bolig{' '}
              <em
                className="accent"
                style={{
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                  fontStyle: 'italic',
                }}
              >
                kontant.
              </em>
            </h1>

            <p className="font-body text-[17px] sm:text-[19px] muted leading-[1.55] max-w-lg text-balance">
              Foreløbigt tilbud på fem minutter. Du vælger overtagelsesdato fra fjorten dage til seks måneder. Ingen mæglersalær, ingen fremvisninger.
            </p>

            <AddressPillV3 />
          </div>

          {/* Højre — editorial billede + caption */}
          <div className="lg:col-span-5">
            <figure className="space-y-3">
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep shadow-lift" style={{ borderRadius: '14px' }}>
                <img
                  src="/salg-photos/hero/danish-apartment-1.png"
                  alt="Ejerlejlighed indrettet stue"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <figcaption className="font-body text-[12px] soft tracking-tight px-1">
                Lejlighed solgt af 365 ejendomme, marts 2026 — Næstved
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* STATS — drillable timeline */}
      <section className="border-t border-warm bg-cream-deep">
        <StatsTimeline />
      </section>

      {/* SAADAN VIRKER DET — sticky narrative */}
      <StickyHowItWorks />

      {/* TESTIMONIALS — editorial */}
      <section className="border-t border-warm">
        <TestimonialsEditorial />
      </section>

      {/* FINAL CTA — stor type */}
      <section className="border-t border-warm">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-14 py-32 sm:py-40 text-center space-y-10">
          <h2
            className="font-display ink text-[clamp(48px,8vw,96px)] leading-[0.96] tracking-[-0.03em] text-balance"
            style={{ fontWeight: 400 }}
          >
            Klar til at se hvad{' '}
            <em
              className="accent"
              style={{
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'wght' 500",
                fontStyle: 'italic',
              }}
            >
              din bolig
            </em>{' '}
            er værd?
          </h2>
          <p className="font-body text-[17px] muted max-w-md mx-auto">
            Indtast din adresse og kom i gang. Ingen forpligtelse, intet at miste.
          </p>
          <a
            href="#salg-v3-address"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('salg-v3-address')?.focus();
              document.getElementById('salg-v3-address')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-3 px-7 py-4 rounded-full font-body text-[15px] active:scale-[0.97] transition-transform shadow-card cta-v3"
            style={{
              background: 'var(--ink)',
              color: 'var(--cream)',
              fontWeight: 500,
            }}
          >
            Start dit pristjek
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
