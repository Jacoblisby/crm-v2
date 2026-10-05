/**
 * Mails til hvert trin i pipelinen.
 *
 * Én fil med alle tekster, så sproget er det samme hele vejen igennem, og
 * en rettelse ét sted slår igennem overalt. Ingen af dem sendes af sig
 * selv: CRM'et laver udkastet, Jacob læser det og trykker send.
 *
 * Reglerne bag teksterne:
 *   · Kunden skal kunne svare med ét ord.
 *   · Vi beder aldrig om noget, kunden skal forberede.
 *   · Overtagelse og beløb nævnes først, når buddet faktisk ligger.
 *   · Et nej skal være lige så let at give som et ja — ellers får vi
 *     tavshed i stedet, og så ved vi ingenting.
 */
import type { BeregnerSvar } from '@/lib/beregner';
import { BOOKING_EMNE, personligLinje, tidTekst } from '@/lib/besigtigelse';

/** Hvor længe et skriftligt bud står ved magt. Jacobs valg, 5.10.2026. */
export const BUD_GYLDIGHED_DAGE = 30;

/** Antal opfølgninger på en booking, før leadet parkeres. Dag 3, 8 og 15. */
export const OPFOELGNINGER = [3, 8, 15] as const;

export type Maaltype =
  | 'booking'
  | 'opfoelgning1'
  | 'opfoelgning2'
  | 'opfoelgning3'
  | 'bekraeftelse'
  | 'paamindelse'
  | 'tak-for-besoeget'
  | 'bud'
  | 'bud-opfoelgning'
  | 'maanedlig'
  | 'kvartal'
  | 'handlen';

export interface Mail {
  type: Maaltype;
  subject: string;
  body: string;
  /** Hvad Jacob skal vide, før han trykker send. */
  note?: string;
}

export interface MailLead {
  fullName: string | null;
  address: string | null;
  bidDkk?: number | null;
}

const HILSEN = ['Venlig hilsen', 'Jacob Fast Lisby', '365 Ejendomme'];
const TLF = '61 78 90 71';

export const kortAdresse = (a: string | null) => (a ? a.split(',')[0].trim() : 'din bolig');

const fornavn = (n: string | null) => {
  const f = (n ?? '').trim().split(/\s+/)[0] ?? '';
  return f ? ` ${f.charAt(0).toUpperCase()}${f.slice(1)}` : '';
};

const kr = (n: number) => `${Math.round(n).toLocaleString('da-DK')} kr.`;

const byg = (lead: MailLead, linjer: (string | null)[]): string =>
  [`Hej${fornavn(lead.fullName)}`, '', ...linjer.filter((l): l is string => l !== null), '', ...HILSEN].join('\n');

/** Emnet på hele tråden. Bruges også til at genkende en sendt booking-mail. */
export { BOOKING_EMNE };
export const emne = (lead: MailLead) => `Din lejlighed på ${kortAdresse(lead.address)} — ${BOOKING_EMNE}`;

// ─── 1. Ny lead ───────────────────────────────────────────────────────────

export function booking(lead: MailLead, svar: BeregnerSvar | null, tid: Date | null): Mail {
  const personlig = personligLinje(svar);
  return {
    type: 'booking',
    subject: emne(lead),
    body: byg(lead, [
      `Tak for dine oplysninger om ${kortAdresse(lead.address)}.`,
      '',
      'Vi har kigget på dem sammen med de seneste handler i din ejerforening, og vi er klar med et kontantbud. Vi mangler kun at se lejligheden, før vi kan gøre det endeligt.',
      '',
      'Besøget tager 10–15 minutter. Vi ser på stand og indretning. Du skal ikke gøre rent eller forberede noget, og du forpligter dig ikke til noget.',
      '',
      tid
        ? `Passer det ${tidTekst(tid)}? Ellers skriv et tidspunkt, der passer dig bedre.`
        : 'Hvornår passer det dig? Vi kommer gerne torsdag mellem kl. 10 og 17 eller fredag mellem kl. 10 og 15.',
      ...(personlig ? ['', personlig] : []),
      '',
      'Bagefter får du buddet skriftligt, så du kan tage stilling i ro og mag. Ingen mægler, intet salær og ingen fremvisninger.',
      '',
      `Svar på denne mail, eller ring til mig på ${TLF}.`,
    ]),
  };
}

// ─── 2. Besigtigelse foreslået: tre opfølgninger ─────────────────────────

export function opfoelgning1(lead: MailLead, nyTid: Date | null): Mail {
  return {
    type: 'opfoelgning1',
    subject: emne(lead),
    note: 'Første opfølgning (dag 3). Foreslår en ny tid, fordi folk svarer lettere på et konkret tidspunkt end på et åbent spørgsmål.',
    body: byg(lead, [
      `Jeg skrev til dig for et par dage siden om at kigge forbi ${kortAdresse(lead.address)}. Måske passede tidspunktet skidt.`,
      '',
      nyTid
        ? `Passer ${tidTekst(nyTid)} bedre? Ellers skriv, hvad der passer dig. Vi kører i området hver uge.`
        : 'Skriv, hvad der passer dig. Vi kører i området hver uge.',
    ]),
  };
}

export function opfoelgning2(lead: MailLead): Mail {
  return {
    type: 'opfoelgning2',
    subject: emne(lead),
    note: 'Anden opfølgning (dag 8). Kort og uden pres.',
    body: byg(lead, [
      'Jeg skriver igen med et konkret forslag. Vi kan komme forbi en hverdag og bruge et kvarter på at se lejligheden, og dagen efter har du et skriftligt bud.',
      '',
      'Har du lyst, så skriv et tidspunkt. Passer det ikke nu, er det også fint.',
    ]),
  };
}

export function opfoelgning3(lead: MailLead): Mail {
  return {
    type: 'opfoelgning3',
    subject: emne(lead),
    note: 'Sidste opfølgning (dag 15). Efter denne parkeres leadet i «Vil ikke sælge nu» og dukker op igen om tre måneder.',
    body: byg(lead, [
      'Jeg har ikke hørt fra dig, og det er helt i orden. Timingen er måske ikke rigtig lige nu.',
      '',
      'Skal jeg lukke sagen, eller må jeg vende tilbage om tre måneder? Et enkelt ord er nok.',
    ]),
  };
}

// ─── 3. Besigtigelse aftalt ──────────────────────────────────────────────

export function bekraeftelse(lead: MailLead, tid: Date): Mail {
  return {
    type: 'bekraeftelse',
    subject: emne(lead),
    note: 'Bekræftelse af den aftalte tid. Send den, så kunden har tidspunktet på skrift.',
    body: byg(lead, [
      `Vi ses ${tidTekst(tid)} på ${kortAdresse(lead.address)}.`,
      '',
      'Jeg kommer selv. Vi bruger 10–15 minutter på at se stand og indretning, og du skal ikke forberede noget.',
      '',
      `Skulle det skride, så ring eller skriv til mig på ${TLF}.`,
    ]),
  };
}

export function paamindelse(lead: MailLead, tid: Date): Mail {
  return {
    type: 'paamindelse',
    subject: emne(lead),
    note: 'Påmindelse dagen før. Den fanger de aftaler, der ellers ville blive glemt.',
    body: byg(lead, [
      `Vi ses i morgen ${tidTekst(tid).replace(/^\S+ /, '').replace(/^\d+\. \S+ /, '')} på ${kortAdresse(lead.address)}. Passer det stadig?`,
    ]),
  };
}

// ─── 4. Besigtigelse afholdt ─────────────────────────────────────────────

export function takForBesoeget(lead: MailLead): Mail {
  return {
    type: 'tak-for-besoeget',
    subject: emne(lead),
    note: 'Send samme dag. Den fortæller kunden, hvornår buddet kommer, så der ikke går tavshed i den.',
    body: byg(lead, [
      'Tak fordi jeg måtte se lejligheden.',
      '',
      'Jeg regner den igennem og sender dig et skriftligt kontantbud senest i morgen eftermiddag.',
    ]),
  };
}

// ─── 5. Bud afgivet ──────────────────────────────────────────────────────

export function budMail(lead: MailLead, bud: number, gyldigTil: Date): Mail {
  const dato = new Intl.DateTimeFormat('da-DK', {
    timeZone: 'Europe/Copenhagen',
    day: 'numeric',
    month: 'long',
  }).format(gyldigTil);
  return {
    type: 'bud',
    subject: `Kontantbud på ${kortAdresse(lead.address)}`,
    note: `Tjek beløbet mod lead-kortet, før du sender. Buddet gælder ${BUD_GYLDIGHED_DAGE} dage, altså til ${dato}.`,
    body: byg(lead, [
      `Her er vores kontantbud på ${kortAdresse(lead.address)}: ${kr(bud)}`,
      '',
      'Buddet er kontant og uden bank- eller advokatforbehold. Vi betaler tinglysning og vores egen rådgiver, og du betaler ingen mægler og intet salær.',
      '',
      `Buddet gælder til den ${dato}. Vil du tale det igennem, eller er der noget, jeg skal regne om, så ring til mig på ${TLF}.`,
    ]),
  };
}

export function budOpfoelgning(lead: MailLead): Mail {
  return {
    type: 'bud-opfoelgning',
    subject: `Kontantbud på ${kortAdresse(lead.address)}`,
    note: 'Opfølgning på buddet efter tre dage.',
    body: byg(lead, [
      'Jeg følger op på buddet, jeg sendte dig.',
      '',
      'Er der noget, der er uklart, eller noget du gerne vil have regnet anderledes? Så siger du bare til. Er svaret nej tak, er det også i orden. Så ved jeg det.',
    ]),
  };
}

// ─── 6 og 7. De to parkeringsspor ────────────────────────────────────────

export function maanedlig(lead: MailLead, handler: string | null): Mail {
  return {
    type: 'maanedlig',
    subject: `Din lejlighed på ${kortAdresse(lead.address)}`,
    note: 'Månedlig kontakt til et lead, vi ikke blev enige med om prisen. Indsæt gerne de nyeste handler fra foreningssiden.',
    body: byg(lead, [
      'Jeg skriver igen, nu hvor der er gået en måned.',
      ...(handler ? ['', handler] : []),
      '',
      'Er du i tanker om det igen, kan vi give dig et opdateret bud. Ellers hører du fra mig om en måneds tid.',
    ]),
  };
}

export function kvartal(lead: MailLead): Mail {
  return {
    type: 'kvartal',
    subject: `Din lejlighed på ${kortAdresse(lead.address)}`,
    note: 'Kvartalsvis kontakt til et lead, der ikke vil sælge lige nu. Den beder ikke om noget.',
    body: byg(lead, [
      'Jeg skriver bare kort, fordi tidspunktet ikke var det rigtige, sidst vi var i kontakt. Vi køber stadig i din ejerforening, og du kan få et nyt bud på en dag, hvis det bliver aktuelt.',
      '',
      'Du skal ikke gøre noget ved denne mail.',
    ]),
  };
}

// ─── 8. Købt ─────────────────────────────────────────────────────────────

export const HANDLEN_EMNE = 'Sådan foregår handlen';

export function handlen(lead: MailLead): Mail {
  return {
    type: 'handlen',
    subject: `${HANDLEN_EMNE}, ${kortAdresse(lead.address)}`,
    note: 'Send når I er blevet enige. Den fjerner den usikkerhed, de fleste sælgere har lige efter et ja.',
    body: byg(lead, [
      'Godt vi blev enige. Herfra går det sådan her:',
      '',
      '1. Vores rådgiver sender købsaftalen til din underskrift, typisk inden for to hverdage.',
      '2. Vi sørger for tinglysning og refusionsopgørelse.',
      '3. På overtagelsesdagen aflæser vi målere, og du afleverer nøglerne.',
      '',
      `Du hører fra rådgiveren i denne uge. Spørgsmål undervejs: ring til mig på ${TLF}.`,
    ]),
  };
}
