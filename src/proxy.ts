/**
 * Adgangskontrol for hele CRM'et.
 *
 * Filen hedder proxy.ts og ikke middleware.ts: Next 16 har afløst
 * middleware-konventionen med proxy. Samme API, nyt navn.
 *
 * BAGGRUNDEN: indtil nu var alt offentligt. En ren `curl` uden cookies mod
 * /pipeline gav hele listen over leads, og /leads/<uuid> gav navn, mailadresse
 * og telefonnummer på navngivne personer. Better Auth var konfigureret med
 * magic-link og whitelist, men intet kaldte det — der var hverken middleware,
 * login-side eller sessionstjek nogen steder.
 *
 * ── Hvorfor en allowlist og ikke en blocklist ────────────────────────────
 * Med en blocklist er en ny rute offentlig, indtil nogen husker at spærre
 * den. Med en allowlist er en ny rute lukket, indtil nogen aktivt åbner den.
 * Den forskel er præcis dét, der gik galt: /leads blev bygget og var åben,
 * fordi ingen liste sagde noget om den.
 *
 * ── Hvorfor den fejler lukket ────────────────────────────────────────────
 * Mangler BETTER_AUTH_SECRET, kan sessioner ikke verificeres. Så lukkes der
 * i stedet for at lukke op. Det kan spærre jer selv ude, hvis en variabel
 * ikke er sat — men alternativet er, at et hul lukker sig selv op igen, og
 * det er præcis den fejl vi retter her.
 *
 * ── Hvad denne kontrol IKKE er ───────────────────────────────────────────
 * Denne kontrol ser kun på, om der ligger en gyldig, signeret session-cookie.
 * Det stopper anonyme besøg, hvilket er hullet. Men det slår ikke op i
 * databasen, så en session der er tilbagekaldt inde i sit gyldighedsvindue
 * slipper igennem her. Den egentlige verifikation hører hjemme i siderne;
 * se noten nederst.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Ruter der bevidst er offentlige.
 *
 * Sælgersiderne SKAL være åbne — det er dem fremmede møder. Cron-endpoints
 * beskytter sig selv med CRON_SECRET i en Authorization-header og kan ikke
 * bruge en cookie, fordi de kaldes af en maskine.
 */
const OFFENTLIGE_PRAEFIKSER = [
  '/frontpage',      // dækker også /frontpage-v2
  '/salg',           // dækker /salg-v4 og alle prototyperne
  '/k/',             // korte brevkoder, når de bygges
  '/api/auth',       // login-flowet selv
  '/api/cron',       // beskyttet af CRON_SECRET, ikke af cookie
  '/login',
];

/** Filer Next.js selv serverer, og som aldrig indeholder persondata. */
const AKTIVER =
  /^\/(_next\/|favicon\.ico|robots\.txt|sitemap\.xml|frontpage\/|.*\.(?:png|jpe?g|svg|webp|avif|ico|woff2?|css|js|map)$)/;

function erOffentlig(sti: string): boolean {
  if (AKTIVER.test(sti)) return true;
  return OFFENTLIGE_PRAEFIKSER.some((p) => sti === p || sti.startsWith(p));
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (erOffentlig(pathname)) return NextResponse.next();

  // Fail closed: uden en hemmelighed kan intet verificeres, og så lukkes der.
  if (!process.env.BETTER_AUTH_SECRET) {
    return new NextResponse(
      'Adgangskontrol er ikke konfigureret. Sæt BETTER_AUTH_SECRET, BETTER_AUTH_URL ' +
        'og ALLOWED_EMAILS, og deploy igen. CRM’et er lukket indtil da.',
      { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  }

  const session = getSessionCookie(req);
  if (session) return NextResponse.next();

  // API-kald skal have et svar de kan forstå, ikke en HTML-omdirigering.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'ikke logget ind' }, { status: 401 });
  }

  const login = new URL('/login', req.url);
  login.searchParams.set('videre', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  /**
   * Kør på alt undtagen Next.js' egne interne stier. Selve udvælgelsen sker
   * i `erOffentlig` ovenfor, så reglerne står ét sted og kan læses samlet.
   */
  matcher: ['/((?!_next/static|_next/image).*)'],
};
