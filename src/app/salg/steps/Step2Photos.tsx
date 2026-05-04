'use client';

import { useState } from 'react';
import { useFunnel } from '../FunnelContext';

interface PhotoSlot {
  key: string;
  label: string;
  emoji: string;
  required?: boolean;
}

const SLOTS: PhotoSlot[] = [
  { key: 'stue', label: 'Stue', emoji: '🛋️', required: true },
  { key: 'kokken', label: 'Køkken', emoji: '🍳' },
  { key: 'bad', label: 'Bad', emoji: '🚿' },
  { key: 'sovevaerelse', label: 'Soveværelse', emoji: '🛏️' },
  { key: 'altan', label: 'Altan/udsigt', emoji: '🏞️' },
  { key: 'plantegning', label: 'Plantegning', emoji: '📐' },
  { key: 'gang', label: 'Gang/entré', emoji: '🚪' },
  { key: 'andet', label: 'Andet rum', emoji: '➕' },
];

// Bruger File-objekter i memory + dataURL preview
// Filer sendes ved submit (step 6) som multipart
type PhotoMap = Record<string, { dataUrl: string; name: string; size: number }>;

const STORAGE_KEY = 'salg.photos.v1';

export function Step2Photos() {
  const { next, prev } = useFunnel();
  const [photos, setPhotos] = useState<PhotoMap>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  function persist(p: PhotoMap) {
    setPhotos(p);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch (e) {
      // Quota exceeded — fotos er for store til sessionStorage
      // Det er OK, de eksisterer stadig i React-state indtil submit
    }
  }

  function onSelect(slotKey: string, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      persist({ ...photos, [slotKey]: { dataUrl, name: file.name, size: file.size } });
    };
    reader.readAsDataURL(file);
  }

  function onRemove(slotKey: string) {
    const next = { ...photos };
    delete next[slotKey];
    persist(next);
  }

  const count = Object.keys(photos).length;
  const canContinue = count >= 1;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Upload fotos af din lejlighed</h2>
        <p className="text-sm text-slate-500">
          Minimum 1 foto for at få estimat. Vi anbefaler 4+ — så er vores tilbud{' '}
          <strong>op til 70.000 kr højere</strong> fordi vi ser den faktiske stand.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SLOTS.map((slot) => (
          <PhotoTile
            key={slot.key}
            slot={slot}
            photo={photos[slot.key]}
            onSelect={(f) => onSelect(slot.key, f)}
            onRemove={() => onRemove(slot.key)}
          />
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 flex items-center justify-between">
        <span>
          {count}/8 fotos uploadet{' '}
          {count < 4 && (
            <span className="text-amber-700">— flere fotos = bedre estimat</span>
          )}
        </span>
        {count >= 4 && <span className="text-emerald-600 font-medium">✓ Solid data</span>}
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
        >
          ← Tilbage
        </button>
        <button
          onClick={next}
          disabled={!canContinue}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium"
        >
          Fortsæt →
        </button>
      </div>
    </div>
  );
}

function PhotoTile({
  slot,
  photo,
  onSelect,
  onRemove,
}: {
  slot: PhotoSlot;
  photo: PhotoMap[string] | undefined;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  if (photo) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
        <img src={photo.dataUrl} alt={slot.label} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2">
          {slot.label}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600"
        >
          ✕
        </button>
      </div>
    );
  }
  return (
    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
      <span className="text-3xl">{slot.emoji}</span>
      <span className="text-xs font-medium text-slate-700">{slot.label}</span>
      <span className="text-[10px] text-slate-400">+ Tap for at uploade</span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
        }}
      />
    </label>
  );
}
