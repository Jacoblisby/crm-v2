/**
 * Besigtigelser: forslag til tid, udkast til booking-mail og kalenderlink.
 *
 * Jacobs regler (21.09.2026):
 *   · Besigtigelser torsdag fra kl. 12 og fredag — aldrig weekend.
 *   · Fredag ikke efter kl. 15.
 *   · Internt afsættes 1 time pr. besigtigelse plus transport. Kunden får at
 *     vide, at det tager 10–15 minutter.
 *
 * Torsdag starter 13.30, fordi «Payables meeting» ligger 12–13. Fredag slutter
 * 14.30, så sidste besigtigelse er færdig i god tid før kl. 15.
 *
 * Planen laves af alle ventende beregner-leads på én gang, i fast rækkefølge,
 * så samme lead altid får samme forslag, og to leads aldrig får samme tid.
 * Tider fra booking-mails, der allerede er sendt, er låst.
 *
 * Planlæggeren kan ikke se kalenderen. Et enkeltstående møde den dag rettes
 * i udkastet, før det sendes.
 */
import type { BeregnerSvar } from '@/lib/beregner';

// ─── Regler ───────────────────────────────────────────────────────────────

const VARIGHED_MIN = 60;
const MINDST_VARSEL_TIMER = 20;

type Zone = 'sydvest' | 'nord';

const DAGE: { ugedag: number; start: [number, number]; slut: [number, number]; zone: Zone }[] = [
  { ugedag: 4, start: [13, 30], slut: [20, 0], zone: 'sydvest' }, // torsdag
  { ugedag: 5, start: [8, 0], slut: [14, 30], zone: 'nord' }, // fredag — færdig før 15
];

/**
 * Postnumre vi køber i, med et omtrentligt midtpunkt og en plads i ruten.
 * Ruten kører torsdag sydvest (Faxe → Næstved → Ringsted → Slagelse →
 * Kalundborg) og fredag nord (Roskilde → Taastrup → Holbæk).
 */
const POSTNR: Record<string, { lat: number; lon: number; zone: Zone; orden: number; by: string }> = {
  '4640': { lat: 55.26, lon: 12.12, zone: 'sydvest', orden: 0, by: 'Faxe' },
  '4700': { lat: 55.23, lon: 11.76, zone: 'sydvest', orden: 1, by: 'Næstved' },
  '4100': { lat: 55.45, lon: 11.78, zone: 'sydvest', orden: 2, by: 'Ringsted' },
  '4200': { lat: 55.4, lon: 11.35, zone: 'sydvest', orden: 3, by: 'Slagelse' },
  '4400': { lat: 55.68, lon: 11.09, zone: 'sydvest', orden: 4, by: 'Kalundborg' },
  '4000': { lat: 55.64, lon: 12.08, zone: 'nord', orden: 0, by: 'Roskilde' },
  '2630': { lat: 55.65, lon: 12.3, zone: 'nord', orden: 1, by: 'Taastrup' },
  '4300': { lat: 55.72, lon: 11.71, zone: 'nord', orden: 2, by: 'Holbæk' },
};

/** Køretid i minutter: fugleflugt × 1,3 ved 80 km/t, plus 5 min til parkering. */
function koeretid(a: string | null, b: string | null): number {
  if (a && b && a === b) return 15;
  const pa = a ? POSTNR[a] : undefined;
  const pb = b ? POSTNR[b] : undefined;
  if (!pa || !pb) return 60;
  const R = 6371;
  const dLat = ((pb.lat - pa.lat) * Math.PI) / 180;
  const dLon = ((pb.lon - pa.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((pa.lat * Math.PI) / 180) * Math.cos((pb.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h));
  return Math.ceil(((km * 1.3) / 80) * 60) + 5;
}

// ─── Tid i København ──────────────────────────────────────────────────────
// Serveren kører i UTC. Alle regler er lokal tid, inkl. skift til vintertid.

const TZ = 'Europe/Copenhagen';

function kbhDele(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  const ugedag = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute, ugedag };
}

/** Et tidspunkt i københavnsk vægur-tid som Date. */
function kbh(y: number, m: number, d: number, hh: number, mm: number): Date {
  const gaet = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const v = kbhDele(gaet);
  const forskydning = Date.UTC(v.y, v.m - 1, v.d, v.hh, v.mm) - gaet.getTime();
  return new Date(gaet.getTime() - forskydning);
}

const plusMin = (d: Date, min: number) => new Date(d.getTime() + min * 60_000);
const rundOp15 = (d: Date) => new Date(Math.ceil(d.getTime() / (15 * 60_000)) * 15 * 60_000);

export function tidTekst(d: Date): string {
  const dag = new Intl.DateTimeFormat('da-DK', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const { hh, mm } = kbhDele(d);
  return `${dag} kl. ${hh}.${String(mm).padStart(2, '0')}`;
}

// ─── Planen ───────────────────────────────────────────────────────────────

export interface Ventende {
  id: string;
  postnr: string | null;
  oprettet: Date;
}
export interface Laast {
  id: string;
  postnr: string | null;
  start: Date;
}

/**
 * Forslag til tid for hvert ventende lead. Låste tider (booking-mail sendt)
 * respekteres; de ventende lægges i rute-rækkefølge på den dag, deres
 * postnummer hører til — denne uge, ellers næste.
 */
export function planlaeg(ventende: Ventende[], laaste: Laast[], nu = new Date()): Map<string, Date> {
  const plan = new Map<string, Date>();
  const tidligst = plusMin(nu, MINDST_VARSEL_TIMER * 60);
  const optaget: { start: Date; slut: Date; postnr: string | null }[] = laaste.map((l) => ({
    start: l.start,
    slut: plusMin(l.start, VARIGHED_MIN),
    postnr: l.postnr,
  }));

  const orden = (pn: string | null) => (pn && POSTNR[pn] ? POSTNR[pn].orden : 9);
  const sorteret = [...ventende].sort(
    (a, b) => orden(a.postnr) - orden(b.postnr) || a.oprettet.getTime() - b.oprettet.getTime(),
  );

  for (const lead of sorteret) {
    const zone: Zone = (lead.postnr && POSTNR[lead.postnr]?.zone) || 'sydvest';
    const regel = DAGE.find((d) => d.zone === zone)!;

    for (let uge = 0; uge < 6 && !plan.has(lead.id); uge++) {
      // Næste dag med rigtig ugedag, «uge» uger frem
      const i = kbhDele(nu);
      const iDag = kbh(i.y, i.m, i.d, 0, 0);
      const dageFrem = ((regel.ugedag - i.ugedag + 7) % 7) + 7 * uge;
      const dagen = kbhDele(plusMin(iDag, dageFrem * 24 * 60 + 12 * 60));
      const dagStart = kbh(dagen.y, dagen.m, dagen.d, regel.start[0], regel.start[1]);
      const dagSlut = kbh(dagen.y, dagen.m, dagen.d, regel.slut[0], regel.slut[1]);

      const idag = optaget
        .filter((o) => o.start >= dagStart && o.start < dagSlut)
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      // Tidligste start efter det seneste, der ligger før, og uden at
      // kollidere med noget senere — med køretid begge veje.
      let t = rundOp15(dagStart < tidligst ? tidligst : dagStart);
      for (let forsoeg = 0; forsoeg < 40; forsoeg++) {
        const slut = plusMin(t, VARIGHED_MIN);
        const konflikt = idag.find(
          (o) =>
            !(plusMin(slut, koeretid(lead.postnr, o.postnr)) <= o.start ||
              t >= plusMin(o.slut, koeretid(o.postnr, lead.postnr))),
        );
        if (!konflikt) break;
        t = rundOp15(plusMin(konflikt.slut, koeretid(konflikt.postnr, lead.postnr)));
      }
      if (plusMin(t, VARIGHED_MIN) <= dagSlut && t >= dagStart) {
        plan.set(lead.id, t);
        optaget.push({ start: t, slut: plusMin(t, VARIGHED_MIN), postnr: lead.postnr });
      }
    }
  }
  return plan;
}

// ─── Booking-mailen ───────────────────────────────────────────────────────

/** Emnet genkendes, så en sendt booking-mail låser sin tid. */
export const BOOKING_EMNE = 'hvornår passer det, vi kigger forbi?';

const kortAdresse = (a: string | null) => (a ? a.split(',')[0].trim() : 'din bolig');
const fornavn = (n: string | null) => {
  const f = (n ?? '').trim().split(/\s+/)[0] ?? '';
  return f ? f[0].toUpperCase() + f.slice(1) : '';
};

/** «køkkenet trænger», ikke «køkken trænger». */
const BESTEMT: Record<string, string> = {
  Køkken: 'køkkenet',
  Badeværelse: 'badeværelset',
  Bad: 'badet',
  Stue: 'stuen',
  Soveværelse: 'soveværelset',
  'Øvrige rum': 'de øvrige rum',
};

/**
 * En eller to sætninger ud fra kundens egne svar — det, der gør mailen til
 * et svar på det, de skrev, og ikke en standardmail.
 */
export function personligLinje(svar: BeregnerSvar | null): string {
  if (!svar) return '';
  const s: string[] = [];
  if (svar.saleLeaseback) {
    s.push('Du skrev, at du gerne vil blive boende som lejer efter salget. Det kan i mange tilfælde lade sig gøre, og når vi ses, gennemgår vi både pris, husleje og vilkår med dig, før du beslutter noget.');
  } else if (svar.forhold.some((f) => f.tekst.startsWith('EF har renoveringsplaner'))) {
    s.push('Du nævnte, at ejerforeningen har renoveringsplaner. Tag gerne det materiale med, I har fået om dem — det har betydning for buddet.');
  } else if (svar.stand.note) {
    const n = svar.stand.note.trim().replace(/[.!]+$/, '');
    s.push(`Du skrev: «${n}» — det kigger vi på, mens vi er der.`);
  } else {
    const skal = svar.stand.rum.find((r) => r.valg === 'Skal renoveres' || r.stand === 'slidt' || r.stand === 'trænger');
    if (skal) s.push(`Du skrev, at ${BESTEMT[skal.navn] ?? skal.navn.toLowerCase()} trænger til en renovering — det kigger vi på, mens vi er der.`);
  }
  if (svar.udgifter.senere) {
    s.push('Du nåede ikke at udfylde udgifterne; har du den seneste opkrævning fra ejerforeningen og din ejendomsskattebillet ved hånden, kan vi give dig buddet hurtigere.');
  }
  return s.join(' ');
}

export function bookingUdkast(
  lead: { fullName: string | null; address: string | null },
  svar: BeregnerSvar | null,
  tid: Date | null,
): { subject: string; body: string } {
  const navn = fornavn(lead.fullName);
  const tidLinje = tid
    ? `Passer det ${tidTekst(tid)}? Ellers skriv, hvornår det passer dig.`
    : 'Hvornår passer det dig? Vi kommer gerne torsdag eftermiddag eller fredag formiddag.';
  const personlig = personligLinje(svar);
  const body = [
    `Hej${navn ? ` ${navn}` : ''}`,
    '',
    'Tak fordi du tjekkede din lejlighed hos os.',
    '',
    'Vi har gennemgået dine oplysninger og de seneste handler i din ejerforening. For at give dig et endeligt kontantbud mangler vi kun at se lejligheden. Det tager 10–15 minutter, det er gratis og forpligter dig ikke til noget.',
    '',
    tidLinje,
    ...(personlig ? ['', personlig] : []),
    '',
    'Efter besigtigelsen sender vi dig et skriftligt kontantbud. Du bestemmer selv, om du vil tage imod det, og hvornår vi i så fald overtager.',
    '',
    'Svar bare på denne mail, eller ring direkte til mig på 61 78 90 71.',
    '',
    'Venlig hilsen',
    'Jacob Fast Lisby',
    '365 Ejendomme',
  ].join('\n');
  return { subject: `Din lejlighed på ${kortAdresse(lead.address)} — ${BOOKING_EMNE}`, body };
}

// ─── Læs tiden tilbage fra en sendt mail ──────────────────────────────────

const MAANED: Record<string, number> = {
  januar: 1, februar: 2, marts: 3, april: 4, maj: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, december: 12,
};

/** «Passer det torsdag 24. september kl. 13.30?» → Date. null hvis tiden er rettet væk. */
export function tidFraMail(body: string | null, sendt: Date): Date | null {
  const m = body?.match(/Passer det \S+ (\d{1,2})\. (\p{L}+) kl\. (\d{1,2})[.:](\d{2})/u);
  if (!m) return null;
  const maaned = MAANED[m[2].toLowerCase()];
  if (!maaned) return null;
  const s = kbhDele(sendt);
  // Sendt i december om en januar-dato → næste år
  const aar = maaned < s.m - 6 ? s.y + 1 : s.y;
  return kbh(aar, maaned, Number(m[1]), Number(m[3]), Number(m[4]));
}

// ─── Kalenderlink ─────────────────────────────────────────────────────────

/** Google Kalender med begivenheden udfyldt — ét klik, så står den der. */
export function kalenderLink(input: {
  leadId: string;
  navn: string | null;
  adresse: string | null;
  telefon: string | null;
  email: string | null;
  start: Date;
}): string {
  const fmt = (d: Date) => {
    const p = kbhDele(d);
    const z = (n: number) => String(n).padStart(2, '0');
    return `${p.y}${z(p.m)}${z(p.d)}T${z(p.hh)}${z(p.mm)}00`;
  };
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Besigtigelse: ${input.navn ?? 'lead'} · ${kortAdresse(input.adresse)}`,
    dates: `${fmt(input.start)}/${fmt(plusMin(input.start, VARIGHED_MIN))}`,
    ctz: TZ,
    location: input.adresse ?? '',
    details: [
      input.telefon ? `Telefon: ${input.telefon}` : '',
      input.email ? `Mail: ${input.email}` : '',
      `CRM: https://crm.365ejendom.dk/leads/${input.leadId}`,
      '',
      'Kunden har fået at vide, at det tager 10–15 minutter. Afsat 1 time inkl. transport.',
    ]
      .filter((l) => l !== null)
      .join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export const postnrFra = (pn: string | null, adresse: string | null) =>
  pn || adresse?.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/)?.[1] || null;
