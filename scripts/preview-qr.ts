/**
 * Renderer et prøveark med QR-koden i de STØRRELSER den faktisk trykkes i.
 *
 *   npx tsx scripts/preview-qr.ts > /tmp/qr.html && open /tmp/qr.html
 *
 * Arket er sat i millimeter, så det kan printes 1:1 og skannes med en rigtig
 * telefon. Det er den eneste måde at vide, om koden virker — en QR der ser
 * fin ud på en skærm i 400 px, kan sagtens fejle når den trykkes i 25 mm.
 *
 * Angiv evt. en anden adresse:
 *   npx tsx scripts/preview-qr.ts https://saelg.365ejendom.dk
 */
import { qrSvg, QR_BRAND_COLOR, QR_MIN_PRINT_MM, QR_RECOMMENDED_PRINT_MM } from '../src/lib/services/qr';

const url = process.argv[2] || 'https://crm.365ejendom.dk/frontpage';

const stoerrelser = [
  { mm: 20, note: 'For lille — tages med for at vise grænsen' },
  { mm: QR_MIN_PRINT_MM, note: 'Minimum. Virker i godt lys, tæt på' },
  { mm: QR_RECOMMENDED_PRINT_MM, note: 'Anbefalet til brev' },
  { mm: 40, note: 'Rigelig. Til plakat eller forside' },
];

const main = async () => {
  const brand = await qrSvg(url);
  const sort = await qrSvg(url, { color: '#000000' });

  const kort = (svg: string, mm: number, note: string, farve: string) => `
    <figure style="margin:0;text-align:center;">
      <div style="width:${mm}mm;height:${mm}mm;margin:0 auto;">${svg}</div>
      <figcaption style="margin-top:4mm;font-size:9pt;color:#5c6b6a;line-height:1.4;">
        <strong style="color:#1c2b2b;">${mm} mm</strong> · ${farve}<br>${note}
      </figcaption>
    </figure>`;

  process.stdout.write(`<!DOCTYPE html>
<html lang="da"><head><meta charset="utf-8"><title>QR — prøveark</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#1c2b2b; margin:0; padding:18mm; background:#fff; }
  h1 { font-size:15pt; font-weight:600; margin:0 0 2mm; }
  p.lead { font-size:10pt; color:#5c6b6a; margin:0 0 10mm; line-height:1.5; }
  code { background:#f5f2f1; padding:1mm 2mm; border-radius:2px; font-size:9pt; }
  .raekke { display:flex; gap:12mm; align-items:flex-start; flex-wrap:wrap; margin-bottom:14mm; }
  h2 { font-size:10pt; font-weight:600; margin:0 0 6mm; padding-bottom:2mm; border-bottom:1px solid rgba(28,43,43,0.12); }
  .note { font-size:9pt; color:#5c6b6a; line-height:1.6; border-top:1px solid rgba(28,43,43,0.12); padding-top:5mm; }
</style></head><body>
  <h1>QR-kode — prøveark</h1>
  <p class="lead">
    Peger på <code>${url}</code><br>
    Print dette ark i 100 % (ikke "tilpas til side") og skan koderne med en telefon
    i den afstand, du ville holde et brev. Fejlkorrektion: Q (25 %).
  </p>

  <h2>Brandfarve ${QR_BRAND_COLOR}</h2>
  <div class="raekke">${stoerrelser.map((s) => kort(brand, s.mm, s.note, 'petroleum')).join('')}</div>

  <h2>Sort — sikreste kontrast</h2>
  <div class="raekke">${stoerrelser.map((s) => kort(sort, s.mm, s.note, 'sort')).join('')}</div>

  <p class="note">
    <strong>Hvis en størrelse fejler ved skanning:</strong> brug den næste op. Det er
    billigere at bruge 5 mm ekstra på papiret end at miste en modtager.<br>
    <strong>Den hvide ramme om koden må ikke beskæres væk</strong> — skanneren bruger den
    til at finde koden. Den er bygget ind i SVG'en.
  </p>
</body></html>`);
};

main();
