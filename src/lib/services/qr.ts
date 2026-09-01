/**
 * QR-koder til breve.
 *
 * Bygget til TRYK, ikke til skærm. Det er en vigtig forskel, fordi et brev
 * bliver foldet, ligger i en kuvert, printes på en kontorprinter og skannes
 * skævt i dårligt lys af en telefon, der holdes i den ene hånd. En QR der
 * fungerer fint på en skærm, kan sagtens fejle på papir.
 *
 * Derfor:
 *
 * ── Fejlkorrektion 'Q' (25 %) frem for standard 'M' (15 %) ────────────────
 * Et brev foldes typisk to gange, og folden går ofte gennem koden. Q-niveau
 * kan miste en fjerdedel af koden og stadig læses. Prisen er en let tættere
 * kode, hvilket er ligegyldigt når den trykkes i 25 mm.
 *
 * ── SVG frem for PNG ──────────────────────────────────────────────────────
 * Vektor. En QR i SVG er skarp uanset om brevet trykkes i 300 eller 1200 dpi.
 * En PNG skaleret op giver udflydende kanter, og udflydende kanter er præcis
 * dét, en skanner falder over.
 *
 * ── Stilzone på 4 moduler ────────────────────────────────────────────────
 * Den hvide ramme om koden er ikke pynt — skanneren bruger den til at finde
 * koden. Standarden kræver 4 moduler, og det er nemt at komme til at beskære
 * den væk i et layout-program. Den er bagt ind i SVG'ens viewBox her.
 */
import QRCode from 'qrcode';

/** Brandets petroleum. Mørk nok til at skanne pålideligt på hvidt papir. */
export const QR_BRAND_COLOR = '#145d5f';

export interface QrOptions {
  /** Mørk farve. Sort er allersikrest; brandfarven er testet og fungerer. */
  color?: string;
  /** Baggrund. Skal være lys — og helst papirets egen hvide. */
  background?: string;
  /**
   * Fejlkorrektion. 'Q' er default og det rigtige til brev.
   * Hæv til 'H' hvis der lægges et logo oven i koden.
   */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Render en QR-kode som SVG-streng.
 *
 * SVG'en har ingen fast bredde/højde — kun en viewBox — så den fylder præcis
 * det, den placeres i. Det er med vilje: så kan samme kode bruges i et brev,
 * på en plakat og i en mail uden at blive genereret igen.
 */
export async function qrSvg(url: string, opts: QrOptions = {}): Promise<string> {
  const {
    color = QR_BRAND_COLOR,
    background = '#ffffff',
    errorCorrection = 'Q',
  } = opts;

  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: errorCorrection,
    margin: 4, // stilzone jf. standarden
    color: { dark: color, light: background },
  });

  // qrcode sætter width/height i px. Vi fjerner dem, så SVG'en skalerer frit
  // og kan sættes i millimeter i et trykklart layout.
  return svg.replace(/\s(width|height)="[^"]*"/g, '');
}

/**
 * Den mindste fornuftige trykstørrelse.
 *
 * Tommelfingerreglen for skanning er, at koden skal fylde mindst en tiendedel
 * af afstanden til telefonen. Et brev holdes typisk 25-30 cm væk, hvilket
 * giver 25-30 mm. Vi anbefaler 30 mm med margin til virkeligheden: dårligt
 * lys, rystende hånd og en billig printer.
 */
export const QR_MIN_PRINT_MM = 25;
export const QR_RECOMMENDED_PRINT_MM = 30;

/**
 * Byg linket til et brev.
 *
 * `kode` er den personlige kode pr. modtager. Den gør tre ting på én gang:
 * kobler besøget til det rigtige lead i stedet for at oprette en dublet,
 * gør det muligt at måle hvilke breve der virkede, og lader os udfylde
 * adressen på forhånd så modtageren slipper for første trin.
 *
 * Uden kode peges der bare på forsiden.
 */
export function letterUrl(base: string, kode?: string): string {
  const clean = base.replace(/\/+$/, '');
  return kode ? `${clean}/k/${kode}` : clean;
}
