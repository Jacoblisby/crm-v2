'use client';

/**
 * Billeder i beregneren. Kunden vælger op til 10 billeder; hvert billede
 * gøres mindre i browseren (højst 1600 px, JPEG) og sendes med det samme,
 * så indsendelsen til sidst ikke venter på store filer.
 *
 * Id'erne gemmes i funnel-state (photoIds), og submit-action kobler dem på
 * leadet. Forhåndsvisningen hentes fra /salg-v4/foto/<id>, så den også
 * overlever, at kunden genindlæser siden.
 */
import { useRef, useState } from 'react';
import { V4 } from './primitives';
import { uploadFotoAction, sletFotoAction } from './foto-action';

const MAKS = 10;
const MAKS_SIDE = 1600;

async function goerMindre(fil: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const bmp = await createImageBitmap(fil, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const skala = Math.min(1, MAKS_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * skala);
  const h = Math.round(bmp.height * skala);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return { dataUrl: c.toDataURL('image/jpeg', 0.82), width: w, height: h };
}

interface Igang {
  noegle: string;
  url: string;
  fejl?: string;
}

export function FotoUpload({ ids, onChange }: { ids: string[]; onChange: (ids: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [igang, setIgang] = useState<Igang[]>([]);
  // Seneste liste, så parallelle uploads ikke overskriver hinanden.
  const seneste = useRef(ids);
  seneste.current = ids;

  const plads = MAKS - ids.length - igang.filter((i) => !i.fejl).length;

  async function vaelg(filer: FileList | null) {
    if (!filer) return;
    const valgte = Array.from(filer).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)).slice(0, Math.max(0, plads));
    for (const fil of valgte) {
      const noegle = `${fil.name}-${fil.size}-${Math.random()}`;
      const url = URL.createObjectURL(fil);
      setIgang((l) => [...l, { noegle, url }]);
      try {
        const lille = await goerMindre(fil);
        const r = await uploadFotoAction({ ...lille, name: fil.name });
        if (!r.ok) throw new Error(r.error);
        const ny = [...seneste.current, r.id];
        seneste.current = ny;
        onChange(ny);
        setIgang((l) => l.filter((i) => i.noegle !== noegle));
        URL.revokeObjectURL(url);
      } catch (e) {
        const fejl = e instanceof Error && e.message ? e.message : 'Billedet kunne ikke sendes.';
        setIgang((l) => l.map((i) => (i.noegle === noegle ? { ...i, fejl: fejl.includes('decode') || fejl.includes('source') ? 'Formatet kan ikke læses. Prøv et andet billede.' : fejl } : i)));
      }
    }
    if (input.current) input.current.value = '';
  }

  function fjern(id: string) {
    onChange(ids.filter((i) => i !== id));
    void sletFotoAction(id);
  }

  const harNoget = ids.length > 0 || igang.length > 0;

  return (
    <div className="space-y-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => vaelg(e.target.files)}
        aria-label="Vælg billeder"
      />

      {harNoget && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ids.map((id, n) => (
            <div key={id} className="relative aspect-square rounded-md overflow-hidden" style={{ background: V4.beige }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/salg-v4/foto/${id}`} alt={`Billede ${n + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => fjern(id)}
                aria-label={`Fjern billede ${n + 1}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[13px] leading-none active:scale-95 transition-transform"
                style={{ background: 'rgba(15,71,73,0.82)' }}
              >
                ×
              </button>
            </div>
          ))}
          {igang.map((i) => (
            <div key={i.noegle} className="relative aspect-square rounded-md overflow-hidden" style={{ background: V4.beige }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.url} alt="" className="w-full h-full object-cover" style={{ opacity: i.fejl ? 0.25 : 0.55 }} />
              <div className="absolute inset-0 flex items-center justify-center p-1.5 text-center">
                {i.fejl ? (
                  <button
                    type="button"
                    onClick={() => setIgang((l) => l.filter((x) => x.noegle !== i.noegle))}
                    className="text-[11px] leading-tight"
                    style={{ color: V4.ink, fontWeight: 500 }}
                  >
                    {i.fejl}
                    <span className="block mt-0.5 underline">Luk</span>
                  </button>
                ) : (
                  <span className="text-[11px]" style={{ color: V4.ink, fontWeight: 500 }}>Sender…</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {plads > 0 && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="w-full py-7 rounded-md border border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-[#faf9f7] active:scale-[0.99]"
          style={{ borderColor: '#c9cfcc', paddingTop: harNoget ? 16 : undefined, paddingBottom: harNoget ? 16 : undefined }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={V4.soft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-[13.5px]" style={{ color: V4.ink, fontWeight: 500 }}>
            {harNoget ? `Tilføj flere (${ids.length} af ${MAKS})` : `Tryk for at vedhæfte op til ${MAKS} billeder`}
          </span>
          {!harNoget && (
            <span className="text-[12px]" style={{ color: V4.soft }}>
              Køkken, bad, altan, plantegning eller andet du vil have os til at se
            </span>
          )}
        </button>
      )}
    </div>
  );
}
