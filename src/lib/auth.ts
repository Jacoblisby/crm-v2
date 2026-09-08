/**
 * better-auth configuration.
 *
 * Setup: magic-link via Resend, whitelist af tilladte emails.
 * Internt værktøj — ingen public sign-up. Hvis du ikke er på listen, ingen adgang.
 *
 * Aktiveres når disse env-vars er sat:
 *   BETTER_AUTH_SECRET    — random 32-byte hex (openssl rand -hex 32)
 *   BETTER_AUTH_URL       — fx https://crm.365ejendom.dk
 *   RESEND_API_KEY        — fra resend.com dashboard
 *   ALLOWED_EMAILS        — komma-separeret whitelist
 *
 * ── To fejl der holdt login nede ─────────────────────────────────────────
 * 1. Adapteren fik en rå postgres.js-klient, som better-auth ikke understøtter.
 *    Resultatet var «NOT_TAGGED_CALL: Query not called as a tagged template
 *    literal» og 500 på hele /api/auth/*. Nu bruges drizzleAdapter oven på
 *    projektets egen db-klient — ingen ny driver, én forbindelse.
 * 2. Kommentaren her påstod, at better-auth selv oprettede sine tabeller ved
 *    første kald. Det gør det ikke. De fire tabeller står nu i schema.ts og
 *    oprettes af migrering 0008.
 */
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/client';
import { user, session, account, verification } from './db/schema';

const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Lazy: kun hvis db-klienten findes (build-tid kan ikke kontakte databasen)
export const auth = db
  ? betterAuth({
      database: drizzleAdapter(db, {
        provider: 'pg',
        // Tabellerne hedder det samme som better-auths standard, men skal
        // alligevel nævnes — ellers leder adapteren efter dem i flertal.
        schema: { user, session, account, verification },
      }),
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
      plugins: [
        magicLink({
          sendMagicLink: async ({ email, url }) => {
            // Whitelist-check: fail-closed
            if (!allowedEmails.includes(email.toLowerCase())) {
              console.warn(`[auth] afvist email udenfor whitelist: ${email}`);
              return; // Stille — fortæl ikke angriberen at email ikke findes
            }

            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
              console.error('[auth] RESEND_API_KEY mangler — kan ikke sende magic-link');
              return;
            }

            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'administration@365ejendom.dk',
                to: email,
                subject: 'Log ind på 365 Ejendomme CRM',
                html: `
                  <p>Klik på linket for at logge ind:</p>
                  <p><a href="${url}">${url}</a></p>
                  <p>Linket udløber om 5 minutter. Hvis du ikke har anmodet om dette, kan du ignorere mailen.</p>
                `,
              }),
            });

            if (!res.ok) {
              console.error('[auth] Resend-fejl:', res.status, await res.text());
            }
          },
        }),
      ],
    })
  : null;

export type Auth = NonNullable<typeof auth>;
