'use client';

import { useState } from 'react';
import {
  Check,
  ChefHat,
  ShowerHead,
  Sofa,
  Bed,
  Mountain,
  Ruler,
  DoorOpen,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { useFunnel } from '../FunnelContext';
import type { StandLevel } from '@/lib/services/price-engine';

/**
 * Step 2 — Sadan ser din bolig ud.
 *
 * Merger gamle Step2Photos + Step4Stand i en samlet boligbeskrivelse.
 * Inspireret af Opendoor: per-rum spm med "hvorfor spørger vi?"-forklaringer
 * for koekken og bad (de to dyreste rum at renovere).
 */

const STAND_OPTIONS: { level: StandLevel; title: string; desc: string }[] = [
  {
    level: 'nyrenoveret',
    title: 'Nyrenoveret',
    desc: 'Alt opdateret de seneste 2-3 år (køkken, bad, gulve, maling).',
  },
  {
    level: 'god',
    title: 'God stand',
    desc: 'Velholdt. Moderate opdateringer indenfor 5-10 år.',
  },
  {
    level: 'middel',
    title: 'Middel',
    desc: 'Funktionel, men ældre overflader. Kan flytte ind, men trænger en omgang.',
  },
  {
    level: 'trænger',
    title: 'Trænger til kærlighed',
    desc: 'Køkken og bad er ældre. Gulve, maling og evt. bad skal renoveres.',
  },
  {
    level: 'slidt',
    title: 'Slidt / til renovering',
    desc: 'Original eller meget slidt. Fuld istandsættelse er nødvendig.',
  },
];

interface OtherSlot {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const OTHER_PHOTO_SLOTS: OtherSlot[] = [
  { key: 'stue', label: 'Stue', Icon: Sofa },
  { key: 'sovevaerelse', label: 'Soveværelse', Icon: Bed },
  { key: 'altan', label: 'Altan/udsigt', Icon: Mountain },
  { key: 'plantegning', label: 'Plantegning', Icon: Ruler },
  { key: 'gang', label: 'Gang/entré', Icon: DoorOpen },
  { key: 'andet', label: 'Andet rum', Icon: Plus },
];

type PhotoMap = Record<string, { dataUrl: string; name: string; size: number }>;

const STORAGE_KEY = 'salg.photos.v1';

export function Step2Bolig() {
  const { state, update, next, prev } = useFunnel();
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
    } catch {}
  }

  async function onPhotoSelect(slotKey: string, file: File) {
    try {
      const compressed = await compressImage(file);
      persist({
        ...photos,
        [slotKey]: { dataUrl: compressed.dataUrl, name: file.name, size: compressed.bytes },
      });
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        persist({ ...photos, [slotKey]: { dataUrl, name: file.name, size: file.size } });
      };
      reader.readAsDataURL(file);
    }
  }

  function onPhotoRemove(slotKey: string) {
    const next = { ...photos };
    delete next[slotKey];
    persist(next);
  }

  // For koekken og bad: hvis der ikke er foto, gør alder paakraevet (giver
  // os fallback-data uden gaetvaerk fra prismodellen).
  const kitchenHasPhoto = !!photos['kokken'];
  const bathHasPhoto = !!photos['bad'];
  const kitchenAgeRequired = !kitchenHasPhoto;
  const bathAgeRequired = !bathHasPhoto;
  const kitchenValid = kitchenHasPhoto || (state.kitchenYear ?? 0) > 0;
  const bathValid = bathHasPhoto || (state.bathroomYear ?? 0) > 0;

  const formValid = !!state.stand && kitchenValid && bathValid;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">Sådan ser din bolig ud</h2>
        <p className="text-sm text-slate-600">
          Vælg den overordnede stand, og giv os lidt detaljer om køkken og bad. Det giver et
          mere præcist tilbud uden gætværk.
        </p>
      </div>

      {/* OVERALL STAND */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Boligens overordnede stand
        </h3>
        <div className="space-y-2">
          {STAND_OPTIONS.map((opt) => {
            const active = state.stand === opt.level;
            return (
              <button
                key={opt.level}
                type="button"
                onClick={() => update({ stand: opt.level })}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold ${
                        active ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {opt.title}
                    </div>
                    <div
                      className={`text-sm ${active ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {active && (
                    <Check className="w-4 h-4 text-white shrink-0" strokeWidth={3} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* KØKKEN */}
      <RoomSection
        slotKey="kokken"
        title="Køkken"
        Icon={ChefHat}
        photo={photos['kokken']}
        onSelect={(f) => onPhotoSelect('kokken', f)}
        onRemove={() => onPhotoRemove('kokken')}
        whyText="Renovering af et standard-køkken koster typisk 80-150.000 kr. Et 5-10 år gammelt køkken er stort set det samme som et nyt for vores prismodel."
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={
              <>
                Køkkenets alder {kitchenAgeRequired && <span className="text-slate-500">*</span>}
              </>
            }
            placeholder="2015"
            helperText={kitchenAgeRequired ? 'Året køkkenet sidst blev udskiftet' : 'Året køkkenet sidst blev udskiftet (valgfri når foto er uploadet)'}
            value={state.kitchenYear}
            onChange={(v) => update({ kitchenYear: v })}
            min={1900}
            max={2030}
          />
          <TextField
            label="Mærke (valgfri)"
            placeholder="HTH, Svane, IKEA…"
            value={state.kitchenBrand}
            onChange={(v) => update({ kitchenBrand: v })}
          />
        </div>
      </RoomSection>

      {/* BAD */}
      <RoomSection
        slotKey="bad"
        title="Badeværelse"
        Icon={ShowerHead}
        photo={photos['bad']}
        onSelect={(f) => onPhotoSelect('bad', f)}
        onRemove={() => onPhotoRemove('bad')}
        whyText="Bade er det dyreste rum at renovere (150-250.000 kr for total). Standen her flytter mest på vores tilbud."
      >
        <NumberField
          label={
            <>
              Badets alder {bathAgeRequired && <span className="text-slate-500">*</span>}
            </>
          }
          placeholder="2020"
          helperText={bathAgeRequired ? 'Året badet sidst blev renoveret' : 'Året badet sidst blev renoveret (valgfri når foto er uploadet)'}
          value={state.bathroomYear}
          onChange={(v) => update({ bathroomYear: v })}
          min={1900}
          max={2030}
        />
      </RoomSection>

      {/* ANDRE FOTOS */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Andre fotos (valgfri)
        </h3>
        <p className="text-xs text-slate-600">
          Stue, soveværelse, altan og plantegning hjælper os se den faktiske stand.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {OTHER_PHOTO_SLOTS.map((slot) => (
            <PhotoTile
              key={slot.key}
              slot={slot}
              photo={photos[slot.key]}
              onSelect={(f) => onPhotoSelect(slot.key, f)}
              onRemove={() => onPhotoRemove(slot.key)}
            />
          ))}
        </div>
      </section>

      {/* HVIDEVARER */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Hvidevarer der følger med
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ApplianceToggle
            label="Vask"
            value={state.applVaskemaskine}
            onChange={(v) => update({ applVaskemaskine: v })}
          />
          <ApplianceToggle
            label="Tørretumbler"
            value={state.applTorretumbler}
            onChange={(v) => update({ applTorretumbler: v })}
          />
          <ApplianceToggle
            label="Opvask"
            value={state.applOpvaskemaskine}
            onChange={(v) => update({ applOpvaskemaskine: v })}
          />
          <ApplianceToggle
            label="Køl/frys"
            value={state.applKoeleFryseskab}
            onChange={(v) => update({ applKoeleFryseskab: v })}
          />
          <ApplianceToggle
            label="Ovn"
            value={state.applOvn}
            onChange={(v) => update({ applOvn: v })}
          />
          <ApplianceToggle
            label="Komfur"
            value={state.applKomfur}
            onChange={(v) => update({ applKomfur: v })}
          />
          <ApplianceToggle
            label="Mikro"
            value={state.applMikroovn}
            onChange={(v) => update({ applMikroovn: v })}
          />
          <ApplianceToggle
            label="Emhætte"
            value={state.applEmhaette}
            onChange={(v) => update({ applEmhaette: v })}
          />
        </div>
      </section>

      {/* SÆRLIGE FORHOLD */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Særlige forhold
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <ApplianceToggle
            label="Altan/terrasse"
            value={state.hasAltan}
            onChange={(v) => update({ hasAltan: v })}
          />
          <ApplianceToggle
            label="Elevator i bygning"
            value={state.hasElevator}
            onChange={(v) => update({ hasElevator: v })}
          />
        </div>
      </section>

      {/* NOTE */}
      <section className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Andre ting vi bør vide (valgfri)
        </label>
        <textarea
          value={state.standNote}
          onChange={(e) => update({ standNote: e.target.value })}
          rows={3}
          placeholder='Fx "Fælles tagterrasse i bygningen", "Husdyr accepteret af EF", "Kommende ombygning af bad i 2026"'
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </section>

      {/* AKTUELT UDLEJET */}
      <section className="border-t border-slate-200 pt-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Er lejligheden udlejet i dag?
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update({ isRented: false })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium ${
              !state.isRented
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Nej, jeg bor selv eller står tom
          </button>
          <button
            type="button"
            onClick={() => update({ isRented: true })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium ${
              state.isRented
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Ja, har en lejer
          </button>
        </div>

        {state.isRented && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <p className="text-xs text-slate-700">
              Vi køber gerne udlejede lejligheder. Detaljerne her hjælper os med at vurdere
              kontrakten.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NumberField
                label="Månedlig leje"
                suffix="kr/md"
                placeholder="8.500"
                value={state.rentalMonthlyRent}
                onChange={(v) => update({ rentalMonthlyRent: v })}
              />
              <NumberField
                label="Depositum"
                suffix="kr"
                placeholder="25.500"
                value={state.rentalDeposit}
                onChange={(v) => update({ rentalDeposit: v })}
              />
              <NumberField
                label="Forudbetalt leje"
                suffix="kr"
                placeholder="0"
                value={state.rentalPrepaidRent}
                onChange={(v) => update({ rentalPrepaidRent: v })}
              />
            </div>
            <DateField
              label="Indflytningsdato"
              value={state.rentalStartDate}
              onChange={(v) => update({ rentalStartDate: v })}
            />
            <ApplianceToggle
              label="Lejekontrakten er uopsigelig"
              value={state.rentalUopsigelig}
              onChange={(v) => update({ rentalUopsigelig: v })}
            />
            {state.rentalUopsigelig && (
              <NumberField
                label="Antal måneder uopsigelighed tilbage"
                suffix="mdr"
                placeholder="6"
                value={state.rentalUopsigeligMaaneder}
                onChange={(v) => update({ rentalUopsigeligMaaneder: v })}
              />
            )}
            <label className="block w-full px-4 py-3 border border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-slate-500 hover:bg-white">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) update({ rentalContract: { name: f.name, size: f.size } });
                }}
              />
              <span className="text-sm text-slate-700">
                {state.rentalContract
                  ? `${state.rentalContract.name} (${(state.rentalContract.size / 1024).toFixed(0)} kB)`
                  : 'Vedhæft lejekontrakt. Gør tingene 10x hurtigere.'}
              </span>
            </label>
          </div>
        )}
      </section>

      <div className="flex justify-between gap-3 pt-2">
        <button
          onClick={prev}
          className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
        >
          ← Tilbage
        </button>
        <div className="flex flex-col items-end gap-1">
          {!formValid && (
            <span className="text-xs text-slate-600">
              {!state.stand
                ? 'Vælg overordnet stand'
                : 'Upload foto eller indtast alder for køkken og bad'}
            </span>
          )}
          <button
            onClick={next}
            disabled={!formValid}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
          >
            Fortsæt →
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomSection({
  slotKey,
  title,
  Icon,
  photo,
  onSelect,
  onRemove,
  whyText,
  children,
}: {
  slotKey: string;
  title: string;
  Icon: LucideIcon;
  photo: { dataUrl: string; name: string; size: number } | undefined;
  onSelect: (f: File) => void;
  onRemove: () => void;
  whyText: string;
  children: React.ReactNode;
}) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="text-xs text-slate-500 underline hover:text-slate-700"
        >
          {showWhy ? 'Skjul' : 'Hvorfor spørger vi?'}
        </button>
      </div>
      {showWhy && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
          {whyText}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PhotoTile
          slot={{ key: slotKey, label: title, Icon }}
          photo={photo}
          onSelect={onSelect}
          onRemove={onRemove}
        />
        <div className="space-y-3">{children}</div>
      </div>
    </section>
  );
}

function PhotoTile({
  slot,
  photo,
  onSelect,
  onRemove,
}: {
  slot: { key: string; label: string; Icon: LucideIcon };
  photo: { dataUrl: string; name: string; size: number } | undefined;
  onSelect: (f: File) => void;
  onRemove: () => void;
}) {
  if (photo) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.dataUrl}
          alt={slot.label}
          className="w-full h-full object-cover"
        />
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
  const Icon = slot.Icon;
  return (
    <label className="aspect-square rounded-lg border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-colors">
      <Icon className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate-700">{slot.label}</span>
      <span className="text-[10px] text-slate-400">Tap for at uploade</span>
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

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  helperText,
  min,
  max,
}: {
  label: React.ReactNode;
  value: number | null;
  onChange: (v: number) => void;
  placeholder?: string;
  suffix?: string;
  helperText?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
            {suffix}
          </span>
        )}
      </div>
      {helperText && <div className="text-xs text-slate-500 mt-1">{helperText}</div>}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-700 mb-1">{label}</div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    </label>
  );
}

function ApplianceToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2 ${
        value
          ? 'bg-slate-900 border-slate-900 text-white font-medium'
          : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
      }`}
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center ${
          value ? 'bg-white border-white' : 'border-slate-300'
        }`}
      >
        {value && <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />}
      </span>
      <span>{label}</span>
    </button>
  );
}

// === Image-resizing util (kopieret fra gamle Step2Photos) ===
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<{ dataUrl: string; bytes: number }> {
  const bitmap = await loadBitmap(file);
  const { width, height } = scaleToFit(bitmap.width, bitmap.height, MAX_DIMENSION);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] ?? '';
  const bytes = Math.floor((base64.length * 3) / 4);
  return { dataUrl, bytes };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image decode failed'));
    };
    img.src = url;
  });
}

function scaleToFit(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
