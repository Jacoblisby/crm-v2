/**
 * Domæne-routing. To domæner, to overflader, én app.
 *
 *   saelg.365ejendom.dk   frontend til kunderne — forside og boligberegner
 *   crm.365ejendom.dk     backend til os — leads, pipeline, foreninger
 *
 * ── Denne fil indeholder INTET login ─────────────────────────────────────
 * En tidligere udgave af proxy.ts krævede login på CRM'et. Den blev fjernet
 * efter Jacobs beslutning (f579bc5), og det er ikke rullet tilbage her.
 * Denne fil afgør kun HVILKET domæne der må vise hvad. Alle der kan nå
 * crm.365ejendom.dk kan stadig se alt der.
 *
 * ── Hvorfor det er nødvendigt ────────────────────────────────────────────
 * Uden det peger begge domæner på samme app, og saelg.365ejendom.dk/pipeline
 * ville vise vores leads. Adressen kommer på 1.161 trykte breve, så den bliver
 * besøgt af folk der roder rundt. To domæner er kun to overflader, hvis noget
 * håndhæver skellet.
 *
 * Opdelingen går begge veje:
 *   · en kunde på saelg kan ikke nå CRM'et  → 404
 *   · en sælgerside kaldt på crm            → omdirigeres til saelg
 *
 * Uden den anden halvdel ville der være to adresser på samme side, og et
 * trykt brev kunne ende med at pege på det interne værktøj.
 */
import { NextRequest, NextResponse } from 'next/server';

const SAELG = 'saelg.365ejendom.dk';
const CRM = 'crm.365ejendom.dk';

/** Det kunderne må se. Alt andet findes ikke på sælgerdomænet. */
const KUNDESIDER = [
  '/frontpage',
  '/salg',            // dækker /salg-v4 og prototyperne
  '/tjek-din-pris',
  '/k/',              // brevkoder, når de bygges
];

/** Teknik der skal virke begge steder, ellers kan siderne ikke rendere. */
const ALTID_TILLADT = /^\/(_next\/|favicon\.ico|robots\.txt|sitemap\.xml|monitoring|frontpage\/|.*\.(?:png|jpe?g|svg|webp|avif|ico|woff2?|css|js|map)$)/;

export function proxy(req: NextRequest) {
  const vaert = req.headers.get('host')?.split(':')[0] ?? '';

  // ── crm → saelg ────────────────────────────────────────────────────────
  // Sælgersiderne hører ikke hjemme på backend-domænet. Uden det her ville
  // der være to adresser på samme side, og et brev eller en QR-kode kunne
  // ende med at pege på det interne værktøj.
  //
  // Midlertidig omdirigering (307), ikke permanent: browsere cacher en 301
  // for evigt, og opsætningen er en dag gammel. Skift til 308, når det har
  // stået et stykke tid.
  if (vaert === CRM) {
    const { pathname, search } = req.nextUrl;
    const erSaelgerside = ['/frontpage', '/salg', '/tjek-din-pris', '/k/'].some(
      (p) => pathname === p || pathname.startsWith(p),
    );
    if (erSaelgerside) {
      // /frontpage er roden på sælgerdomænet, /salg-v4 hedder /tjek-din-pris.
      const maal =
        pathname === '/frontpage' ? '/' : pathname === '/salg-v4' ? '/tjek-din-pris' : pathname;
      return NextResponse.redirect(`https://${SAELG}${maal}${search}`, 307);
    }
    return NextResponse.next();
  }

  if (vaert !== SAELG) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === '/' || ALTID_TILLADT.test(pathname)) return NextResponse.next();

  // Server actions ligger på de sider de hører til, og skal kunne kaldes —
  // ellers kan boligberegneren ikke indsende.
  if (req.method === 'POST') return NextResponse.next();

  const erKundeside = KUNDESIDER.some((p) => pathname === p || pathname.startsWith(p));
  if (erKundeside) return NextResponse.next();

  // Ikke en fejl, men et «findes ikke her». CRM'et ligger på sit eget domæne.
  return NextResponse.rewrite(new URL('/404', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
