/**
 * Kvitteringsmailen til sælger.
 *
 * Ligger i sit eget modul af to grunde:
 *   1. Den var før låst inde i submit-action.ts bag 'use server' og kunne
 *      derfor kun ses ved at oprette et rigtigt lead og sende en rigtig mail.
 *      Som ren funktion kan den renderes til en fil og åbnes i en browser.
 *   2. Skærm og mail deler tal fra offer-example.ts — så skal de også dele
 *      sted, ellers driver de fra hinanden.
 *
 * Designet følger flowets palet (V4 / Figma), ikke Tailwinds standard-slate
 * som skabelonen brugte før: petroleum #145d5f, mint #cce0dc, rose #e8dfde,
 * beige #f5f2f1 og VARME neutraler. De kolde blågrå toner (#64748b, #0f172a,
 * #e2e8f0) er væk — de slog brandet ihjel.
 *
 * Mail-klienter er upålidelige med flexbox, grid og eksterne fonte, så alt
 * er tabeller, inline styles og en system-font-stak.
 */
import {
  OFFER_EXAMPLE,
  OFFER_EXAMPLE_NET,
  OFFER_EXAMPLE_GAIN,
  NO_AUTO_OFFER,
  fmtKr,
} from './offer-example';

/** Paletten, spejlet fra V4 så mail og skærm ikke kan komme til at afvige. */
const C = {
  green: '#145d5f',
  greenDeep: '#0f4749',
  mint: '#cce0dc',
  rose: '#e8dfde',
  beige: '#f5f2f1',
  ink: '#1c2b2b',
  muted: '#5c6b6a',
  soft: '#8a9695',
  rule: 'rgba(28,43,43,0.12)',
  ruleStrong: 'rgba(28,43,43,0.26)',
  white: '#ffffff',
} as const;

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface CustomerEmailInput {
  firstName: string;
  fullAddress: string;
  phone: string;
  /** Lokale handler i området — vises kun hvis der er nogen. */
  comparables: { address: string; kvm: number | null; price: number; date?: string | null }[];
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Én række i regneeksemplet. Highlight-kolonnen er rose, som på skærmen. */
function row(
  label: string,
  sub: string,
  maegler: string,
  os: string,
  opts: { total?: boolean; osErIngen?: boolean } = {},
): string {
  const { total = false, osErIngen = false } = opts;
  const rule = total ? `2px solid ${C.ruleStrong}` : `1px solid ${C.rule}`;
  const labelSize = total ? 15 : 14;
  const numSize = total ? 16 : 14;
  const osSize = total ? 20 : 14;
  return `
      <tr>
        <td style="padding:14px 10px 14px 0;border-top:${rule};font-family:${FONT};font-size:${labelSize}px;color:${C.ink};font-weight:${total ? 700 : 600};vertical-align:top;">
          ${escapeHtml(label)}
          <div style="margin-top:3px;font-size:11.5px;font-weight:400;color:${C.soft};line-height:1.45;">${escapeHtml(sub)}</div>
        </td>
        <td style="padding:14px 8px;border-top:${rule};font-family:${FONT};font-size:${numSize}px;color:${C.soft};font-weight:${total ? 600 : 500};text-align:right;vertical-align:top;white-space:nowrap;">
          ${maegler}
        </td>
        <td style="padding:14px 14px;border-top:${rule};background:${C.rose};font-family:${FONT};font-size:${osSize}px;color:${osErIngen || total ? C.greenDeep : C.ink};font-weight:${total || osErIngen ? 700 : 500};text-align:right;vertical-align:top;white-space:nowrap;">
          ${os}
        </td>
      </tr>`;
}

export function customerEmailHtml(input: CustomerEmailInput): string {
  const { firstName, fullAddress, phone, comparables } = input;

  const compsHtml = comparables
    .slice(0, 5)
    .map(
      (c) => `
        <tr>
          <td style="padding:9px 0;border-top:1px solid ${C.rule};font-family:${FONT};font-size:13px;color:${C.ink};">
            ${escapeHtml(c.address)}${c.kvm ? `<span style="color:${C.soft};"> · ${c.kvm} m²</span>` : ''}
          </td>
          <td style="padding:9px 0;border-top:1px solid ${C.rule};font-family:${FONT};font-size:13px;color:${C.ink};font-weight:600;text-align:right;white-space:nowrap;">
            ${fmtKr(c.price)} kr${c.date ? `<span style="color:${C.soft};font-weight:400;"> · ${escapeHtml(c.date.slice(0, 7))}</span>` : ''}
          </td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vi er i gang med din bolig</title>
</head>
<body style="margin:0;padding:0;background:${C.beige};font-family:${FONT};color:${C.ink};-webkit-font-smoothing:antialiased;">
<div style="padding:28px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;width:100%;background:${C.white};border-radius:14px;overflow:hidden;">

  <!-- Logo -->
  <tr><td style="padding:26px 32px 0;">
    <span style="font-family:${FONT};font-size:21px;font-weight:600;color:${C.green};letter-spacing:-0.01em;">365</span>
    <span style="font-family:${FONT};font-size:10px;font-weight:600;color:${C.ink};letter-spacing:0.2em;"> EJENDOM</span>
  </td></tr>

  <!-- Hilsen -->
  <tr><td style="padding:22px 32px 0;">
    <p style="margin:0;font-family:${FONT};font-size:15px;color:${C.ink};">Hej ${escapeHtml(firstName)},</p>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.muted}">
      Tak fordi du brugte vores boligberegner. Vi har modtaget dine oplysninger om
      <strong style="color:${C.ink};">${escapeHtml(fullAddress)}</strong>.
    </p>
  </td></tr>

  <!-- Besked: ingen auto-pris -->
  <tr><td style="padding:22px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.mint};border-radius:12px;">
      <tr><td style="padding:26px 26px;text-align:center;">
        <div style="font-family:${FONT};font-size:19px;line-height:1.35;font-weight:600;color:${C.ink};">
          ${escapeHtml(NO_AUTO_OFFER.heading)}
        </div>
        <div style="margin-top:10px;font-family:${FONT};font-size:13.5px;line-height:1.6;color:${C.muted};">
          ${escapeHtml(NO_AUTO_OFFER.body)}
        </div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(28,43,43,0.15);font-family:${FONT};font-size:13px;font-weight:600;color:${C.ink};">
          Du hører fra os inden for 24 timer
        </div>
        <div style="margin-top:2px;font-family:${FONT};font-size:12.5px;color:${C.muted};">
          Vi har dine oplysninger — du behøver ikke gøre mere.
        </div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Regneeksempel -->
  <tr><td style="padding:30px 32px 0;text-align:center;">
    <div style="font-family:${FONT};font-size:10.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${C.soft};">
      Regneeksempel
    </div>
    <h2 style="margin:8px 0 0;font-family:${FONT};font-size:21px;font-weight:600;color:${C.ink};">
      Vores pris vs. ejendomsmægler
    </h2>
    <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
      Sådan ser forskellen ud på en bolig til ${fmtKr(OFFER_EXAMPLE.listPrice)} kr.
      Tallene er et eksempel og altså ikke et tilbud på din bolig.
    </p>
  </td></tr>

  <tr><td style="padding:18px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      <tr>
        <td style="width:44%;"></td>
        <td style="width:28%;padding:0 8px 8px;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:${C.soft};text-align:right;">Ejendomsmægler</td>
        <td style="width:28%;padding:10px 14px 8px;background:${C.rose};font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:${C.greenDeep};text-align:right;">365 Ejendomme</td>
      </tr>
      ${row('Pris på boligen', 'Det beløb, boligen sættes til salg for.', `${fmtKr(OFFER_EXAMPLE.listPrice)} kr`, `${fmtKr(OFFER_EXAMPLE.ourOffer)} kr`)}
      ${row('Mæglersalær', 'Typisk 5–7 % af salgsprisen.', `− ${fmtKr(OFFER_EXAMPLE.brokerFee)} kr`, 'Ingen', { osErIngen: true })}
      ${row('Markedsafslag', 'Slutprisen ligger ofte 6–8 % under listeprisen.', `− ${fmtKr(OFFER_EXAMPLE.marketDiscount)} kr`, 'Ingen', { osErIngen: true })}
      ${row('Drift i salgsperioden', 'Ca. 3 måneders ejerudgifter imens.', `− ${fmtKr(OFFER_EXAMPLE.ownershipCosts)} kr`, 'Ingen', { osErIngen: true })}
      ${row('Tilbage til dig', 'Det du reelt står med bagefter.', `${fmtKr(OFFER_EXAMPLE_NET)} kr`, `${fmtKr(OFFER_EXAMPLE.ourOffer)} kr`, { total: true })}
    </table>
  </td></tr>

  <!-- Gevinsten: grøn, fordi rose er sammenligningens farve og grøn er konklusionens -->
  <tr><td style="padding:18px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.mint};border-radius:12px;">
      <tr><td style="padding:24px 26px;text-align:center;">
        <div style="font-family:${FONT};font-size:27px;font-weight:700;color:${C.greenDeep};line-height:1;">
          + ${fmtKr(OFFER_EXAMPLE_GAIN)} kr.
        </div>
        <div style="margin-top:8px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.ink};">
          mere til dig i eksemplet
        </div>
        <div style="margin-top:10px;font-family:${FONT};font-size:12.5px;line-height:1.6;color:#41625f;">
          Mæglerens pris er højere på papiret — men efter salær, markedsafslag og ventetid
          står du med mindre. Oveni slipper du for fremvisninger, bankforbehold og cirka
          tre måneders salgsperiode.
        </div>
      </td></tr>
    </table>
  </td></tr>

  ${
    compsHtml
      ? `<!-- Lokale handler -->
  <tr><td style="padding:30px 32px 0;">
    <div style="font-family:${FONT};font-size:10.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${C.soft};padding-bottom:4px;">
      Lokale handler i dit område
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${compsHtml}
    </table>
    <p style="margin:10px 0 0;font-family:${FONT};font-size:11.5px;color:${C.soft};line-height:1.5;">
      Mægleren tager udgangspunkt i offentlige boligdata og tinglyste handler som disse.
    </p>
  </td></tr>`
      : ''
  }

  <!-- Næste skridt -->
  <tr><td style="padding:30px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.green};border-radius:12px;">
      <tr><td style="padding:26px;">
        <div style="font-family:${FONT};font-size:16px;font-weight:600;color:${C.white};">Næste skridt</div>
        <p style="margin:8px 0 16px;font-family:${FONT};font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.82);">
          En af vores mæglere kontakter dig inden for 24 timer på
          <strong style="color:${C.white};">${escapeHtml(phone)}</strong> med et estimat på boligen,
          og vi kan samtidig aftale en gratis, uforpligtende besigtigelse. Efter besigtigelsen
          giver vi et endeligt bindende tilbud.
        </p>
        <a href="tel:+4561789071" style="display:inline-block;padding:12px 22px;background:#b5f0ee;border-radius:8px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.greenDeep};text-decoration:none;">
          Ring +45 61 78 90 71
        </a>
        <p style="margin:14px 0 0;font-family:${FONT};font-size:12.5px;color:rgba(255,255,255,0.75);">
          Eller skriv til
          <a href="mailto:administration@365ejendom.dk" style="color:${C.white};text-decoration:underline;">administration@365ejendom.dk</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Hvad du får -->
  <tr><td style="padding:26px 32px 0;">
    <div style="font-family:${FONT};font-size:10.5px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${C.soft};padding-bottom:8px;">
      Når du sælger til os
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${[
        'Kontant betaling — ingen bankforbehold',
        'Ingen mæglersalær og ingen fremvisninger',
        'I mange tilfælde mulighed for at blive boende som lejer',
      ]
        .map(
          (t) => `
      <tr>
        <td style="padding:5px 10px 5px 0;width:18px;vertical-align:top;font-family:${FONT};font-size:13px;color:${C.green};font-weight:700;">✓</td>
        <td style="padding:5px 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${C.muted};">${t}</td>
      </tr>`,
        )
        .join('')}
    </table>
  </td></tr>

  <!-- Bemærk -->
  <tr><td style="padding:24px 32px 0;">
    <p style="margin:0;padding-top:16px;border-top:1px solid ${C.rule};font-family:${FONT};font-size:11.5px;line-height:1.6;color:${C.soft};">
      <strong style="color:${C.muted};">Bemærk:</strong> Regneeksemplet ovenfor er en illustration af,
      hvordan vi regner — ikke et tilbud på din bolig. Dit estimat kommer fra en mægler inden for 24 timer.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:22px 32px 30px;">
    <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.6;color:${C.soft};">
      365ejendom · Boligselskabet Sommerhave ApS · Næstved · CVR 41763736<br>
      <a href="https://365ejendom.dk/privatlivspolitik" style="color:${C.soft};">Privatlivspolitik</a>
    </p>
  </td></tr>

</table>
</div>
</body>
</html>`;
}
