'use client';

/**
 * Kundens billeder fra beregneren. Et klik åbner billedet i fuld størrelse;
 * piletaster bladrer, Esc lukker.
 */
import { useEffect, useState } from 'react';

export function FotoGalleri({ fotos }: { fotos: { id: string; name: string | null }[] }) {
  const [aaben, setAaben] = useState<number | null>(null);

  useEffect(() => {
    if (aaben == null) return;
    function tast(e: KeyboardEvent) {
      if (e.key === 'Escape') setAaben(null);
      if (e.key === 'ArrowRight') setAaben((i) => (i == null ? i : (i + 1) % fotos.length));
      if (e.key === 'ArrowLeft') setAaben((i) => (i == null ? i : (i - 1 + fotos.length) % fotos.length));
    }
    window.addEventListener('keydown', tast);
    return () => window.removeEventListener('keydown', tast);
  }, [aaben, fotos.length]);

  if (fotos.length === 0) return null;
  const src = (id: string) => `https://saelg.365ejendom.dk/salg-v4/foto/${id}`;

  return (
    <section className="bg-white border border-slate-200 rounded-lg">
      <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">Kundens billeder</h3>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{fotos.length} fra beregneren</span>
      </div>
      <div className="px-4 pb-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setAaben(i)}
            className="aspect-square rounded overflow-hidden bg-slate-100 hover:opacity-90 active:scale-[0.98] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            title={f.name ?? undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(f.id)} alt={f.name ?? `Billede ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {aaben != null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
          onClick={() => setAaben(null)}
          role="dialog"
          aria-label="Billede i fuld størrelse"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src(fotos[aaben].id)}
            alt={fotos[aaben].name ?? `Billede ${aaben + 1}`}
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute top-3 left-4 text-sm text-white/80 tabular-nums">
            {aaben + 1} / {fotos.length}
          </div>
          <button type="button" onClick={() => setAaben(null)} className="absolute top-2 right-3 text-white/80 hover:text-white text-2xl px-2" aria-label="Luk">
            ×
          </button>
          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAaben((aaben - 1 + fotos.length) % fotos.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl px-3 py-6"
                aria-label="Forrige"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAaben((aaben + 1) % fotos.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-3xl px-3 py-6"
                aria-label="Næste"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
