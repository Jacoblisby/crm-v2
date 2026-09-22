/**
 * POST /api/inbound-email
 *
 * Webhook for indkomne emails. Primaert fra Resend (email.received event),
 * men accepterer ogsaa Postmark format eller en generisk JSON-payload.
 *
 * Auth (en af to):
 *   1. Resend svix-signature header (verificeret mod RESEND_WEBHOOK_SECRET)
 *   2. Bearer ${INBOUND_EMAIL_SECRET} (til manuel test fra curl)
 *
 * Matching-strategi:
 *   1. In-Reply-To / References → find tidligere udsendt
 *      lead_communications.resendId
 *   2. Fallback: matcher from-email mod leads.email
 *
 * Gemmer som lead_communications med direction='in', type='email'.
 * Lead detail page viser den automatisk.
 */
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db/client';
import { leadCommunications, leads } from '@/lib/db/schema';
import { gemMailHeaders } from '@/lib/mail-traad';
import { leadIdFraAdresser } from '@/lib/svaradresse';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface NormalizedEmail {
  fromEmail: string;
  fromName: string;
  /** Modtageradresser — svaradressen bærer leadets id (reply+<id>@…). */
  to: string[];
  /** Resends id for den modtagne mail; bruges til at hente teksten. */
  emailId: string | null;
  subject: string;
  text: string;
  html: string | null;
  inReplyTo: string | null;
  references: string | null;
  messageId: string | null;
  rawPayload: unknown;
}

export async function POST(req: NextRequest) {
  // Vi laeser rawBody en gang — bruges baade til signatur-verifikation og JSON-parse
  const rawBody = await req.text();

  // Auth — to muligheder:
  //   1. Resend svix-signature (verificeret mod RESEND_WEBHOOK_SECRET)
  //   2. Bearer-token fallback (til manuel test fra curl)
  const resendSecret = process.env.RESEND_WEBHOOK_SECRET;
  const bearerSecret = process.env.INBOUND_EMAIL_SECRET || process.env.CRON_SECRET;

  const hasSvixHeaders =
    !!req.headers.get('svix-id') &&
    !!req.headers.get('svix-timestamp') &&
    !!req.headers.get('svix-signature');

  let authed = false;
  if (hasSvixHeaders && resendSecret) {
    authed = verifySvixSignature(req, rawBody, resendSecret);
    if (!authed) {
      return NextResponse.json({ error: 'invalid svix signature' }, { status: 401 });
    }
  } else if (bearerSecret && req.headers.get('authorization') === `Bearer ${bearerSecret}`) {
    authed = true;
  }

  if (!authed) {
    // Uden denne linje var en forkert webhook-hemmelighed usynlig: Resend
    // fik 401, og loggen sagde ingenting.
    console.warn(
      `[inbound-email] 401 — ${hasSvixHeaders ? (resendSecret ? 'svix-signaturen passer ikke til RESEND_WEBHOOK_SECRET' : 'RESEND_WEBHOOK_SECRET er ikke sat') : 'ingen svix-signatur og intet gyldigt Bearer-token'}`,
    );
    return NextResponse.json(
      { error: 'unauthorized — need svix signature or Bearer token' },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const email = normalizePayload(payload);

  // Resends webhook indeholder kun metadata — ikke tekst eller headers.
  // Hent resten, ellers gemmes svaret som «(intet indhold)».
  if (email.emailId && !email.text && !email.html) {
    await hentFuldMail(email);
  }

  if (!email.fromEmail) {
    return NextResponse.json({ error: 'no sender email' }, { status: 400 });
  }

  // Videresendt af os selv (fx et kundesvar, der landede i administration@):
  // leadet findes ud fra den oprindelige afsender i den videresendte tekst.
  const videresendtAf = pakUdVideresendt(email);

  // Match til lead — først via In-Reply-To/References, så via from-email
  const leadId = await findLeadForEmail(email);
  if (!leadId) {
    console.warn(
      `[inbound-email] Intet lead — fra ${email.fromEmail} til ${email.to.join(', ') || '?'}, emne «${email.subject}»`,
    );
    return NextResponse.json({
      ok: true,
      matched: false,
      from: email.fromEmail,
      subject: email.subject,
      note: 'No matching lead found',
    });
  }

  console.log(`[inbound-email] Svar fra ${email.fromEmail} → lead ${leadId} («${email.subject}»)`);

  // Tag email-body — foretræk text over html (vi viser plain text i UI)
  const body = email.text || stripHtml(email.html || '') || '(intet indhold)';

  const [gemt] = await db
    .insert(leadCommunications)
    .values({
      leadId,
      type: 'email',
      direction: 'in',
      subject: email.subject || '(intet emne)',
      body: [
        `Fra: ${email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}`,
        ...(videresendtAf ? [`(videresendt af ${videresendtAf})`] : []),
        ``,
        body,
      ].join('\n'),
      createdBy: 'inbound-webhook',
    })
    .returning({ id: leadCommunications.id });

  // Message-ID gemmes, så vores svar kan lægge sig i samme tråd hos kunden.
  // En mail vi selv har videresendt, har vores egen Message-ID — den er
  // ikke kundens tråd, så den springes over.
  if (gemt && !videresendtAf) {
    await gemMailHeaders(gemt.id, email.messageId, email.references).catch((e) =>
      console.warn('[inbound-email] Kunne ikke gemme Message-ID:', e),
    );
  }

  return NextResponse.json({
    ok: true,
    matched: true,
    leadId,
    from: email.fromEmail,
    subject: email.subject,
  });
}

// ============================
// Svix signature verification (Resend webhooks)
// ============================
function verifySvixSignature(req: NextRequest, rawBody: string, secret: string): boolean {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Secret format: "whsec_<base64>"
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');

  // Sign string: "{svixId}.{svixTimestamp}.{rawBody}"
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const computed = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // svix-signature header format: "v1,<base64> v1,<base64>" (may include multiple, space-separated)
  const signatures = svixSignature.split(' ').map((s) => s.replace(/^v\d+,/, ''));

  for (const sig of signatures) {
    try {
      const sigBytes = Buffer.from(sig, 'base64');
      const computedBytes = Buffer.from(computed, 'base64');
      if (sigBytes.length === computedBytes.length && timingSafeEqual(sigBytes, computedBytes)) {
        return true;
      }
    } catch {
      // ignore malformed signature parts
    }
  }
  return false;
}

// ============================
// Payload normalization
// ============================
function normalizePayload(payload: unknown): NormalizedEmail {
  if (typeof payload !== 'object' || payload === null) {
    return emptyEmail(payload);
  }
  const p = payload as Record<string, unknown>;

  // Resend webhook event format
  const resendEvent = tryResendEvent(p);
  if (resendEvent) return resendEvent;

  // Try Postmark format
  const postmark = tryPostmark(p);
  if (postmark) return postmark;

  // Try Resend inbound (legacy data envelope)
  const resend = tryResend(p);
  if (resend) return resend;

  // Generic fallback — accept any reasonable shape
  return tryGeneric(p);
}

function tryResendEvent(p: Record<string, unknown>): NormalizedEmail | null {
  // Resend webhook event: { type: "email.received", data: { from, subject, text, html, headers? } }
  if (p.type !== 'email.received') return null;
  const data = (p.data || {}) as Record<string, unknown>;
  const fromRaw = (data.from || '') as unknown;
  let fromEmail = '';
  let fromName = '';
  if (typeof fromRaw === 'string') {
    fromEmail = extractEmail(fromRaw);
    fromName = extractName(fromRaw);
  } else if (typeof fromRaw === 'object' && fromRaw !== null) {
    const f = fromRaw as Record<string, unknown>;
    fromEmail = String(f.email || '').toLowerCase().trim();
    fromName = String(f.name || '').trim();
  }
  const headers = (data.headers || {}) as Record<string, string>;
  return {
    fromEmail,
    fromName,
    to: somListe(data.to),
    emailId: typeof data.email_id === 'string' ? data.email_id : null,
    subject: typeof data.subject === 'string' ? data.subject : '',
    text: typeof data.text === 'string' ? data.text : '',
    html: typeof data.html === 'string' ? data.html : null,
    inReplyTo: headers['in-reply-to'] || headers['In-Reply-To'] || null,
    references: headers['references'] || headers['References'] || null,
    messageId: headers['message-id'] || headers['Message-ID'] || null,
    rawPayload: p,
  };
}

function tryPostmark(p: Record<string, unknown>): NormalizedEmail | null {
  // Postmark sender 'From', 'FromName', 'Subject', 'TextBody', 'HtmlBody', 'Headers' array
  if (typeof p.From !== 'string' || typeof p.Subject !== 'string') return null;
  const headers = Array.isArray(p.Headers) ? (p.Headers as Array<{ Name: string; Value: string }>) : [];
  const findHeader = (name: string) =>
    headers.find((h) => h.Name?.toLowerCase() === name.toLowerCase())?.Value ?? null;

  return {
    fromEmail: extractEmail(p.From),
    fromName: typeof p.FromName === 'string' ? p.FromName : extractName(p.From),
    to: somListe(p.To),
    emailId: null,
    subject: p.Subject,
    text: typeof p.TextBody === 'string' ? p.TextBody : '',
    html: typeof p.HtmlBody === 'string' ? p.HtmlBody : null,
    inReplyTo: findHeader('In-Reply-To'),
    references: findHeader('References'),
    messageId: typeof p.MessageID === 'string' ? p.MessageID : findHeader('Message-ID'),
    rawPayload: p,
  };
}

function tryResend(p: Record<string, unknown>): NormalizedEmail | null {
  // Resend inbound: { type: 'email.inbound', data: { from, subject, text, html, headers } }
  if (p.type === 'email.inbound' && typeof p.data === 'object' && p.data !== null) {
    const d = p.data as Record<string, unknown>;
    const headers = (d.headers as Record<string, string> | undefined) ?? {};
    const fromStr = typeof d.from === 'string' ? d.from : '';
    return {
      fromEmail: extractEmail(fromStr),
      fromName: extractName(fromStr),
      to: somListe(d.to),
      emailId: null,
      subject: typeof d.subject === 'string' ? d.subject : '',
      text: typeof d.text === 'string' ? d.text : '',
      html: typeof d.html === 'string' ? d.html : null,
      inReplyTo: headers['in-reply-to'] || headers['In-Reply-To'] || null,
      references: headers['references'] || headers['References'] || null,
      messageId: headers['message-id'] || headers['Message-ID'] || null,
      rawPayload: p,
    };
  }
  return null;
}

function tryGeneric(p: Record<string, unknown>): NormalizedEmail {
  const fromStr = (p.from || p.From || p.sender || '') as string;
  return {
    fromEmail: extractEmail(fromStr),
    fromName: extractName(fromStr),
    to: somListe(p.to ?? p.To),
    emailId: null,
    subject: (p.subject || p.Subject || '') as string,
    text: (p.text || p.body || p.TextBody || '') as string,
    html: (p.html || p.HtmlBody || null) as string | null,
    inReplyTo: (p.inReplyTo || p['in-reply-to'] || p['In-Reply-To'] || null) as string | null,
    references: (p.references || p.References || null) as string | null,
    messageId: (p.messageId || p['message-id'] || p['Message-ID'] || null) as string | null,
    rawPayload: p,
  };
}

function emptyEmail(raw: unknown): NormalizedEmail {
  return {
    fromEmail: '',
    fromName: '',
    to: [],
    emailId: null,
    subject: '',
    text: '',
    html: null,
    inReplyTo: null,
    references: null,
    messageId: null,
    rawPayload: raw,
  };
}

// ============================
// Lead matching
// ============================
async function findLeadForEmail(email: NormalizedEmail): Promise<string | null> {
  // 1. Svaradressen: reply+<lead-id>@… — entydigt, uanset afsender.
  const fraAdresse = leadIdFraAdresser(email.to);
  if (fraAdresse) {
    const [l] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, fraAdresse), isNull(leads.deletedAt)))
      .limit(1);
    if (l) return l.id;
  }

  // 2. Trådhenvisning mod en mail vi selv har sendt.
  const candidates = [email.inReplyTo, email.references]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .flatMap((s) => extractMessageIds(s));
  for (const msgId of candidates) {
    const matches = await db
      .select({ leadId: leadCommunications.leadId })
      .from(leadCommunications)
      .innerJoin(leads, eq(leads.id, leadCommunications.leadId))
      .where(
        and(
          isNull(leads.deletedAt),
          sql`(${leadCommunications.resendId} = ${msgId} OR ${leadCommunications.body} ILIKE ${`%${msgId}%`})`,
        ),
      )
      .limit(1);
    if (matches[0]) return matches[0].leadId;
  }

  // 3. Afsenderens mail. Kun aktive leads, og har flere samme mail, det
  //    lead vi senest har skrevet til — ellers det senest opdaterede.
  //    Før tog vi det første, databasen fandt, også slettede.
  if (email.fromEmail) {
    const [senest] = await db
      .select({ id: leads.id })
      .from(leads)
      .leftJoin(
        leadCommunications,
        and(eq(leadCommunications.leadId, leads.id), eq(leadCommunications.direction, 'out')),
      )
      .where(and(isNull(leads.deletedAt), sql`LOWER(${leads.email}) = LOWER(${email.fromEmail})`))
      .orderBy(desc(sql`COALESCE(${leadCommunications.createdAt}, ${leads.updatedAt})`))
      .limit(1);
    if (senest) return senest.id;
  }

  return null;
}

const EGNE_DOMAENER = /@(365ejendom\.dk|reply\.365ejendom\.dk|faurholt\.com|herlufshave\.(dk|com)|sommerhaven?\.(dk|com))$/i;

/**
 * Er mailen videresendt af en af os, findes den oprindelige afsender i den
 * videresendte tekst («Fra: Navn <mail>» / «From: …»). Afsender og emne
 * skrives om til kundens, og vi returnerer hvem der videresendte.
 */
function pakUdVideresendt(email: NormalizedEmail): string | null {
  if (!EGNE_DOMAENER.test(email.fromEmail)) return null;
  if (leadIdFraAdresser(email.to)) return null;
  const tekst = email.text || stripHtml(email.html || '');
  for (const m of tekst.matchAll(/^\s*\*?(?:Fra|From|Von)\s*:\*?\s*(.+)$/gim)) {
    const linje = m[1];
    const mail = (linje.match(/<([^>\s]+@[^>\s]+)>/) ?? linje.match(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/))?.[1];
    if (!mail || EGNE_DOMAENER.test(mail)) continue;
    const af = email.fromEmail;
    email.fromEmail = mail.toLowerCase();
    email.fromName = linje.replace(/<[^>]*>/, '').replace(mail, '').replace(/["\[\]]/g, '').trim();
    email.subject = email.subject.replace(/^\s*((fw|fwd|vs|wg)\s*:\s*)+/i, '').trim();
    // Behold kun kundens mail: alt efter videresendelses-hovedet (første
    // tomme linje efter «Fra:»-linjen).
    const efter = tekst.slice((m.index ?? 0) + m[0].length);
    const tom = efter.search(/\n\s*\n/);
    if (tom >= 0) {
      email.text = efter.slice(tom).trim();
      email.html = null;
    }
    return af;
  }
  return null;
}

/** Tekst, html og headers til en modtaget mail — webhooket har dem ikke. */
async function hentFuldMail(email: NormalizedEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !email.emailId) return;
  try {
    const res = await fetch(`https://api.resend.com/emails/receiving/${email.emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn(`[inbound-email] Kunne ikke hente mail ${email.emailId}: HTTP ${res.status}`);
      return;
    }
    const d = (await res.json()) as {
      text?: string | null;
      html?: string | null;
      to?: unknown;
      headers?: Record<string, string>;
    };
    email.text = d.text ?? '';
    email.html = d.html ?? null;
    if (email.to.length === 0) email.to = somListe(d.to);
    const h = d.headers ?? {};
    email.inReplyTo ??= h['in-reply-to'] ?? h['In-Reply-To'] ?? null;
    email.references ??= h['references'] ?? h['References'] ?? null;
    email.messageId ??= h['message-id'] ?? h['Message-ID'] ?? h['Message-Id'] ?? null;
  } catch (err) {
    console.warn(`[inbound-email] Fejl ved hentning af mail ${email.emailId}:`, err);
  }
}

function somListe(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(typeof x === 'object' && x ? (x as { email?: string }).email ?? '' : x)).filter(Boolean);
  if (typeof v === 'string' && v) return v.split(',').map((x) => x.trim());
  return [];
}

// ============================
// Helpers
// ============================
function extractEmail(s: string): string {
  if (!s) return '';
  // "John Doe <john@example.com>" → "john@example.com"
  const m = s.match(/<([^>]+)>/);
  if (m) return m[1].toLowerCase().trim();
  return s.toLowerCase().trim();
}

function extractName(s: string): string {
  if (!s) return '';
  const m = s.match(/^(.+?)\s*<[^>]+>$/);
  return m ? m[1].trim().replace(/^"|"$/g, '') : '';
}

function extractMessageIds(s: string): string[] {
  // Headers kan indeholde flere <id@host> separeret af mellemrum
  const matches = s.match(/<([^>]+)>/g);
  if (!matches) return [s.trim()];
  return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
