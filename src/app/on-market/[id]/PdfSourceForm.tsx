'use client';

/**
 * PdfSourceForm — kombineret URL-input + drag-and-drop PDF upload.
 *
 * URL-flow: bruges af cron til realmaeglerne. Manuel hvis PDFen ligger paa en
 * direkte URL.
 *
 * Drag-and-drop flow: bruges naar URL-fetching fejler (PDF bag login,
 * Cloudflare, non-deterministisk URL). Brugeren downloader PDFen lokalt og
 * smider den i feltet. Parser direkte server-side.
 */
import { useState, useTransition, useRef, DragEvent } from 'react';
import { setPdfUrlAction, uploadPdfAction } from './actions';

interface Props {
  id: string;
  currentUrl: string | null;
  caseUrl: string | null;
  brokerKind: string | null;
  pdfStatus: string | null;
}

interface ParseSummary {
  foundFields: number;
  totalFields: number;
  driftTotal: number;
  declaredTotal: number;
  empty: boolean;
}

export function PdfSourceForm({ id, currentUrl, caseUrl, brokerKind, pdfStatus }: Props) {
  const [url, setUrl] = useState(currentUrl ?? '');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'ok' | 'warn' | 'err'>('ok');
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function showMsg(text: string, type: 'ok' | 'warn' | 'err' = 'ok') {
    setMsg(text);
    setMsgType(type);
  }

  function onSubmitUrl(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setParseSummary(null);
    startTransition(async () => {
      const r = await setPdfUrlAction({ id, pdfUrl: url || null });
      if (r.ok) {
        if (url && r.parseResult) {
          if (r.parseResult.parsed) {
            showMsg('Gemt + parsed', 'ok');
          } else if (r.parseResult.failed) {
            showMsg('Gemt — parsing fejlede. Prøv at uploade PDFen direkte.', 'warn');
          } else {
            showMsg('Gemt — parser ikke kørt', 'warn');
          }
        } else {
          showMsg(url ? 'Gemt' : 'Ryddet');
        }
      } else {
        showMsg(`Fejl: ${r.error}`, 'err');
      }
    });
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showMsg('Filen skal være en PDF', 'err');
      return;
    }
    setMsg(null);
    setParseSummary(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      fd.append('file', file);
      const r = await uploadPdfAction(fd);
      if (r.ok) {
        setParseSummary({
          foundFields: r.foundFields,
          totalFields: r.totalFields,
          driftTotal: r.driftTotal,
          declaredTotal: r.declaredTotal,
          empty: r.empty,
        });
        if (r.empty) {
          showMsg(
            `PDF læst men ingen ejerudgifter fundet. Indtast manuelt i feltet under.`,
            'warn',
          );
        } else if (r.declaredTotal > 0) {
          // Vi har mæglerens total — sammenlign for sanity-check
          const diff = Math.abs(r.driftTotal - r.declaredTotal);
          const diffPct = (diff / r.declaredTotal) * 100;
          if (diffPct < 5) {
            showMsg(
              `Parsed ${r.foundFields}/${r.totalFields} felter — drift ${r.driftTotal.toLocaleString('da-DK')} kr/år ≈ mæglerens total ${r.declaredTotal.toLocaleString('da-DK')} kr (✓)`,
              'ok',
            );
          } else {
            showMsg(
              `Parsed ${r.foundFields}/${r.totalFields} felter — vores ${r.driftTotal.toLocaleString('da-DK')} kr/år vs. mæglerens ${r.declaredTotal.toLocaleString('da-DK')} kr (afvigelse ${diffPct.toFixed(0)}%) — tjek felterne under`,
              'warn',
            );
          }
        } else {
          showMsg(
            `Parsed ${r.foundFields}/${r.totalFields} felter — drift ${r.driftTotal.toLocaleString('da-DK')} kr/år`,
            'ok',
          );
        }
      } else {
        showMsg(r.error, 'err');
      }
    });
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  const msgColor =
    msgType === 'err'
      ? 'text-red-700'
      : msgType === 'warn'
        ? 'text-amber-700'
        : 'text-emerald-700';

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Salgsopstilling</h2>
        <div className="flex items-center gap-2">
          {pdfStatus && (
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {pdfStatus}
            </span>
          )}
          {currentUrl && (
            <a
              href={currentUrl}
              target="_blank"
              className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            >
              📄 Åbn ↗
            </a>
          )}
        </div>
      </div>

      {/* Drag-and-drop upload — primaer flow naar URL-fetch fejler */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-amber-600 bg-amber-100'
            : pending
              ? 'border-slate-300 bg-slate-50'
              : 'border-amber-300 hover:border-amber-500 hover:bg-amber-100/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFileChange}
          disabled={pending}
          className="sr-only"
        />
        <div className="flex flex-col items-center gap-1.5 text-slate-700">
          <span className="text-2xl">{pending ? '⏳' : '📄'}</span>
          <span className="font-medium">
            {pending ? 'Parser PDF…' : 'Træk PDF her eller klik for at vælge'}
          </span>
          <span className="text-xs text-slate-500">
            Parser server-side. Bruges når URL-fetching fejler eller du har
            PDFen lokalt.
          </span>
        </div>
      </label>

      {/* URL-input — bevares for cron-flow + manuel URL */}
      <div className="border-t border-amber-200 pt-3 space-y-1">
        <p className="text-xs text-slate-600">
          Eller indsæt direkte PDF-URL{' '}
          {brokerKind === 'realmaeglerne'
            ? '(cron henter automatisk for realmaeglerne)'
            : caseUrl
              ? (
                <a
                  href={caseUrl}
                  target="_blank"
                  className="text-blue-700 hover:underline"
                >
                  · find på mæglerens side ↗
                </a>
              )
              : null}
        </p>
        <form onSubmit={onSubmitUrl} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/salgsopstilling.pdf"
            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm font-mono"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            Gem URL
          </button>
        </form>
      </div>

      {msg && (
        <p className={`text-xs ${msgColor} flex items-start gap-1.5`}>
          <span>
            {msgType === 'err' ? '⚠️' : msgType === 'warn' ? 'ℹ️' : '✓'}
          </span>
          <span>{msg}</span>
        </p>
      )}

      {parseSummary && !parseSummary.empty && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-900 space-y-0.5">
          <div>
            {parseSummary.foundFields}/{parseSummary.totalFields} felter
            udfyldt · Drift{' '}
            <strong>{parseSummary.driftTotal.toLocaleString('da-DK')} kr/år</strong>
            {parseSummary.declaredTotal > 0 && (
              <>
                {' '}vs. mægler-total{' '}
                <strong>{parseSummary.declaredTotal.toLocaleString('da-DK')} kr</strong>
              </>
            )}
            .
          </div>
          <div className="text-emerald-700">
            Tjek felterne under og ret tal der er forkerte.
          </div>
        </div>
      )}
    </div>
  );
}
