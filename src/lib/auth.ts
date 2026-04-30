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
 * better-auth opretter selv sine egne tabeller (user, session, verification, account)
 * ved første kald — ingen separat migration behøves.
 */
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import postgres from 'postgres';

const allowedEmails = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const databaseUrl = process.env.DATABASE_URL;

// Lazy: opret kun hvis DATABASE_URL findes (build-tid kan ikke kontakte DB)
const dbInstance = databaseUrl ? postgres(databaseUrl, { max: 5 }) : null;

export const auth = dbInstance
  ? betterAuth({
      database: dbInstance,
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
