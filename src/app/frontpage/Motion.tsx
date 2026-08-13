'use client';

/**
 * Motion — scroll-drevne effekter til frontpage.
 *
 * Designerens noter fra .fig'en:
 *   "Logo med baggrund er sticky ved scroll"
 *   "Tjek din pris knap bliver sticky ved scroll"
 *   "Blur-effekt ... skal bruges selektivt og med omtanke, så det understøtter
 *    oplevelsen uden at blive et gennemgående dekorativt lag."
 *
 * Derfor: rolige, korte reveals (fade + lille løft) — ikke svævende elementer
 * eller store bevægelser. Kun opacity/transform (GPU), one-shot så indhold
 * ikke "blinker" ved scroll op igen, og fuldt deaktiveret ved
 * prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';

/** Sætter .is-in på elementet når det kommer ind i viewporten (én gang). */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  /** ms — til at trappe fx kort ind efter hinanden */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sikkerhedsventil: uden IntersectionObserver (eller ved reduceret bevægelse)
    // vises indholdet med det samme — en marketingside må ALDRIG kunne ende
    // med usynlig tekst, fordi en observer ikke fyrer.
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.classList.add('is-in');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('is-in');
            obs.unobserve(el);
          }
        }
      },
      // Trigger lidt før elementet er helt inde — så det er færdigt når man ser det
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fp-reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** True når siden er scrollet forbi `offset` px. */
export function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > offset));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [offset]);
  return scrolled;
}

/**
 * Carousel — horisontal snap-scroll m. prik-indikator.
 * Designet bruger det på mobil til "Direkte salg" og "Erfaringer";
 * på desktop vises samme indhold som almindeligt grid.
 */
export function MobileCarousel({
  children,
  count,
  className = '',
}: {
  children: React.ReactNode;
  count: number;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el) return;
        const first = el.firstElementChild as HTMLElement | null;
        if (!first) return;
        const step = first.offsetWidth + 16; // kort + gap
        setActive(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))));
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  function goTo(i: number) {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    el.scrollTo({ left: i * (first.offsetWidth + 16), behavior: 'smooth' });
  }

  return (
    <div className={className}>
      <div
        ref={scrollerRef}
        className="fp-scroller flex gap-4 overflow-x-auto sm:overflow-visible sm:grid sm:grid-cols-3 sm:gap-5 -mx-6 px-6 sm:mx-0 sm:px-0 pb-1"
      >
        {children}
      </div>
      {/* Prikker — kun mobil, som i designet */}
      <div className="flex sm:hidden justify-center gap-2 pt-5">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Vis ${i + 1}`}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i === active ? 'var(--fp-green)' : '#c3cecb',
              transform: i === active ? 'scale(1.35)' : 'scale(1)',
              transitionDuration: '250ms',
            }}
          />
        ))}
      </div>
    </div>
  );
}
