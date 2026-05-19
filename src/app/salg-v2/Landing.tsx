'use client';

/**
 * Landing v2 — Opendoor-style fra handoff.
 * Sektioner: Hero (m. AddressPill) → Stats band → Sådan virker det → Testimonials → Final CTA → Footer
 *
 * Design-eng fixes:
 *   - active:scale på CTA-button (final)
 *   - @media (hover: hover) gate på hover:scale
 *   - prefers-reduced-motion handling
 *   - Custom ease-out for shadow-transitions
 */
import { AddressPill } from './components/AddressPill';
import { StatIcon } from './components/icons';
import { EASE_OUT } from './components/primitives';

const ACCENT = '#244949';

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — header sits absolute over hero via SalgHeader */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 pt-24 sm:pt-32 pb-24 sm:pb-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7 space-y-7">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium tracking-tight"
            style={{ background: '#F5EFE6', color: ACCENT }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
            87 boliger købt siden 2024
          </div>

          <h1
            className="text-[44px] sm:text-[64px] lg:text-[84px] font-medium tracking-[-0.03em] leading-[0.95] text-balance text-[#14181A]"
          >
            Sælg din bolig <span style={{ color: ACCENT }}>uden mægler.</span>
          </h1>

          <p className="text-[17px] sm:text-[19px] text-balance max-w-xl leading-[1.55] text-[#5A6166]">
            Få et kontant tilbud på 5 minutter. Ingen fremvisninger, ingen salær, du vælger overtagelsesdato.
          </p>

          <AddressPill />

          {/* Trust strip */}
          <div className="pt-8 flex items-center gap-7 flex-wrap">
            {[
              ['87+', 'boliger købt'],
              ['24 t', 'svartid'],
              ['0 kr', 'i mæglersalær'],
            ].map(([n, l]) => (
              <div key={n} className="flex items-baseline gap-2">
                <div className="text-[22px] font-semibold tracking-tight text-[#14181A]">{n}</div>
                <div className="text-[13px] text-[#5A6166]">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: visual */}
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] rounded-[28px] overflow-hidden bg-stone-100">
            <img
              src="/salg-photos/hero/danish-apartment-1.png"
              alt="Lejlighed interior"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats / band */}
      <section className="border-y border-[#E5E2DA] bg-[#F5EFE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-16 sm:py-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-end">
            <div className="lg:col-span-4 space-y-3">
              <div className="inline-flex items-center gap-2">
                <div className="h-px w-8" style={{ background: ACCENT }} />
                <span className="text-[11px] font-mono tracking-[0.18em] uppercase" style={{ color: ACCENT }}>
                  365 i tal
                </span>
              </div>
              <h2 className="text-[28px] sm:text-[32px] font-medium tracking-[-0.02em] leading-[1.05] text-balance text-[#14181A]">
                Vi har handlet boliger siden 2024.
              </h2>
              <p className="text-[14px] leading-relaxed max-w-sm text-[#5A6166]">
                Lokalt forankret på Sjælland med en voksende portefølje af velholdte ejerlejligheder.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(36,73,73,0.18)' }}>
                {[
                  ['218', 'lejemål under forvaltning', '+12 i 2026', 'building'],
                  ['2,5 mio', 'kr sparet i salærer', 'siden 2024', 'savings'],
                  ['14 dage', 'hurtigste overtagelse', 'rekord', 'clock'],
                  ['5 %', 'tilbageleverings­garanti', 'risikofrit', 'shield'],
                ].map(([n, l, sub, ic]) => (
                  <div key={n + ic} className="px-0 sm:px-5 lg:px-6 first:pl-0 py-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <StatIcon name={ic} color={ACCENT} />
                      <span className="text-[10.5px] font-mono tracking-[0.12em] uppercase text-[#9C988C]">{sub}</span>
                    </div>
                    <div
                      className="font-medium tracking-[-0.025em] leading-[0.95] tabular-nums"
                      style={{ color: ACCENT, fontSize: 'clamp(38px, 5vw, 56px)' }}
                    >
                      {n}
                    </div>
                    <div className="text-[13px] leading-[1.35] pr-2 text-[#14181A]">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-24 sm:py-32">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-4">
            <p className="text-[13px] font-medium" style={{ color: ACCENT }}>Sådan virker det</p>
            <h2 className="text-[36px] sm:text-[48px] font-medium tracking-tight leading-[1.05] text-[#14181A]">
              Fra adresse til afsluttet salg på et par uger.
            </h2>
          </div>
          <div className="lg:col-span-8 space-y-1">
            {[
              ['01', 'Du indtaster adressen', 'Vi henter automatisk OIS-data, sammenlignelige handler og beregner et foreløbigt tilbud.'],
              ['02', 'Jacob ringer inden 24 timer', 'Hurtig snak, kun for at forstå bolig og din situation. Ingen pres.'],
              ['03', 'Gratis besigtigelse', 'Vi kigger forbi, måler op og bekræfter tilbud — eller justerer hvis nødvendigt.'],
              ['04', 'Du vælger overtagelse', '14 dage til 6 måneder. Kontant betaling på din konto.'],
            ].map(([n, t, d]) => (
              <div key={n} className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 py-7 border-t border-[#E5E2DA]">
                <div className="text-[13px] font-mono text-[#9C988C]">{n}</div>
                <div className="space-y-2">
                  <h3 className="text-[20px] sm:text-[22px] font-medium tracking-tight text-[#14181A]">{t}</h3>
                  <p className="text-[15px] leading-relaxed max-w-xl text-[#5A6166]">{d}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-[#E5E2DA]" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-[#E5E2DA] bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-24 sm:py-32 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-[13px] font-medium" style={{ color: ACCENT }}>Sælgere fortæller</p>
            <h2 className="text-[36px] sm:text-[48px] font-medium tracking-tight leading-[1.05] text-[#14181A]">
              &quot;Mere transparent end nogen mægler vi har snakket med.&quot;
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: 'Mette K.', l: 'Solgt i Næstved', q: 'Vi havde brug for at sælge hurtigt efter min mors bortgang. 365 kom forbi, gav et tilbud, og 3 uger senere var handlen lukket.', i: 'MK' },
              { n: 'Lars P.', l: 'Solgt i Roskilde', q: 'Ingen fremvisninger, ingen ventetid. Vi sparede 70.000 kr i mæglersalær og fik den overtagelsesdato vi ønskede.', i: 'LP' },
              { n: 'Anne & Søren', l: 'Solgt i Ringsted', q: 'Jacob var lige til at tale med, og prisen lå tæt på vores forventninger. Helt ærligt forløb.', i: 'AS' },
            ].map((t) => (
              <figure key={t.n} className="bg-white rounded-3xl p-8 border border-stone-100 flex flex-col gap-6">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill={ACCENT} aria-hidden="true">
                  <path d="M6 17c-1.66 0-3-1.34-3-3 0-3.31 2.69-6 6-6V5c-4.97 0-9 4.03-9 9 0 3.31 2.69 6 6 6 1.66 0 3-1.34 3-3s-1.34-3-3-3zm12 0c-1.66 0-3-1.34-3-3 0-3.31 2.69-6 6-6V5c-4.97 0-9 4.03-9 9 0 3.31 2.69 6 6 6 1.66 0 3-1.34 3-3s-1.34-3-3-3z" opacity=".3" />
                </svg>
                <blockquote className="text-[16px] leading-[1.55] flex-1 text-[#14181A]">{t.q}</blockquote>
                <figcaption className="flex items-center gap-3 pt-2 border-t border-[#E5E2DA]">
                  <div className="w-10 h-10 rounded-full bg-[#D6E4E4] flex items-center justify-center text-[#244949] font-semibold text-sm">
                    {t.i}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#14181A]">{t.n}</div>
                    <div className="text-[12px] text-[#5A6166]">{t.l}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-24 sm:py-32 text-center space-y-8">
        <h2 className="text-[44px] sm:text-[64px] font-medium tracking-[-0.02em] leading-[1] max-w-3xl mx-auto text-balance text-[#14181A]">
          Klar til at se hvad din bolig er værd?
        </h2>
        <p className="text-[17px] max-w-xl mx-auto text-[#5A6166]">
          Indtast din adresse og kom i gang. Ingen forpligtelse, intet at miste.
        </p>
        <a
          href="#address-input"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('address-input')?.focus();
            document.getElementById('address-input')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-3 px-8 py-5 rounded-full text-white font-medium text-[16px] active:scale-[0.97] touch-manipulation focus:outline-none focus-visible:ring-4 focus-visible:ring-[#244949]/40 cta-hero"
          style={{
            background: ACCENT,
            transition: `transform 180ms ${EASE_OUT}, background-color 180ms ${EASE_OUT}`,
          }}
        >
          Start dit pristjek
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
        <style>{`
          @media (hover: hover) and (pointer: fine) {
            .cta-hero:hover { transform: scale(1.02); }
          }
        `}</style>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E2DA] salg-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 py-10 flex flex-col sm:flex-row gap-4 justify-between text-[13px] text-[#5A6166]">
          <div>© 365 ejendomme · Boligselskabet Sommerhave ApS · Næstved · CVR 41763736</div>
          <div className="flex gap-6">
            <a href="https://365ejendom.dk/privatlivspolitik" className="hover:opacity-70">Privatliv</a>
            <a href="mailto:jacob@365ejendom.dk" className="hover:opacity-70">jacob@365ejendom.dk</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
