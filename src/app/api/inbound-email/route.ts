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
import { eq, sql } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';
import { db } from '@/lib/db/client';
import { leadCommunications, leads } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface NormalizedEmail {
  fromEmail: string;
  fromName: string;
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
  if (!email.fromEmail) {
    return NextResponse.json({ error: 'no sender email' }, { status: 400 });
  }

  // Match til lead — først via In-Reply-To/References, så via from-email
  const leadId = await findLeadForEmail(email);
  if (!leadId) {
    // Gem stadig som unmatched så vi ikke mister beskeden
    console.warn(
      `[inbound-email] No lead match for ${email.fromEmail} — subject="${email.subject}". Payload kept in note table.`,
    );
    return NextResponse.json({
      ok: true,
      matched: false,
      from: email.fromEmail,
      subject: email.subject,
      note: 'No matching lead found',
    });
  }

  // Tag email-body — foretræk text over html (vi viser plain text i UI)
  const body = email.text || stripHtml(email.html || '') || '(intet indhold)';

  await db.insert(leadCommunications).values({
    leadId,
    type: 'email',
    direction: 'in',
    subject: email.subject || '(intet emne)',
    body: [
      `Fra: ${email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}`,
      ``,
      body,
    ].join('\n'),
    createdBy: 'inbound-webhook',
  });

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
  // Strategy 1: Match In-Reply-To/References mod tidligere udsendte mails
  const candidates = [email.inReplyTo, email.references]
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .flatMap((s) => extractMessageIds(s));

  for (const msgId of candidates) {
    // Resend's id kan være indlejret i Message-ID header som <resend-id@email.resend.com>
    // Vi sammenligner mod resendId-feltet (LIKE for fleksibilitet)
    const matches = await db
      .select({ leadId: leadCommunications.leadId })
      .from(leadCommunications)
      .where(sql`${leadCommunications.resendId} = ${msgId} OR ${leadCommunications.body} ILIKE ${`%${msgId}%`}`)
      .limit(1);
    if (matches[0]) return matches[0].leadId;
  }

  // Strategy 2: Match by from-email
  if (email.fromEmail) {
    const matches = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.email, email.fromEmail.toLowerCase()))
      .limit(1);
    if (matches[0]) return matches[0].id;

    // Try case-insensitive
    const ciMatches = await db
      .select({ id: leads.id })
      .from(leads)
      .where(sql`LOWER(${leads.email}) = LOWER(${email.fromEmail})`)
      .limit(1);
    if (ciMatches[0]) return ciMatches[0].id;
  }

  return null;
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
