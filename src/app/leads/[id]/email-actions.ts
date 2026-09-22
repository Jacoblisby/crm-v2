'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadCommunications } from '@/lib/db/schema';
import { svaradresse } from '@/lib/svaradresse';
import { traadFor } from '@/lib/mail-traad';

interface SendLeadEmailInput {
  leadId: string;
  subject: string;
  body: string;
  /** Kundens mail vi svarer på — så svaret lander i samme tråd hos kunden. */
  svarPaaId?: string | null;
}

interface SendLeadEmailResult {
  ok: boolean;
  error?: string;
  resendId?: string;
}

export async function sendLeadEmailAction(
  input: SendLeadEmailInput,
): Promise<SendLeadEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'administration@365ejendom.dk';
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY mangler' };

  const subject = input.subject?.trim();
  const body = input.body?.trim();
  if (!subject || !body) return { ok: false, error: 'Subject og body er påkrævet' };

  // Hent lead for email + name
  const rows = await db
    .select({ email: leads.email, fullName: leads.fullName })
    .from(leads)
    .where(eq(leads.id, input.leadId))
    .limit(1);
  const lead = rows[0];
  if (!lead) return { ok: false, error: 'Lead ikke fundet' };
  if (!lead.email) return { ok: false, error: 'Lead har ingen email' };

  // Svar i tråd: In-Reply-To/References peger på kundens mail.
  const traad = input.svarPaaId ? await traadFor(input.svarPaaId, input.leadId).catch(() => null) : null;
  const headers: Record<string, string> = {};
  if (traad?.inReplyTo) headers['In-Reply-To'] = traad.inReplyTo;
  if (traad?.references) headers['References'] = traad.references;

  // Send via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: lead.email,
      // Svaradressen bærer leadets id, så kundens svar lander på netop
      // dette lead — se src/lib/svaradresse.ts.
      reply_to: svaradresse(input.leadId),
      subject,
      text: body,
      ...(Object.keys(headers).length ? { headers } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, error: `Resend fejl ${res.status}: ${errText.slice(0, 200)}` };
  }
  const data = (await res.json().catch(() => null)) as { id?: string } | null;
  const resendId = data?.id ?? null;

  // Log som lead_communication
  await db.insert(leadCommunications).values({
    leadId: input.leadId,
    type: 'email',
    direction: 'out',
    subject,
    body,
    resendId,
    createdBy: 'jacob@faurholt.com',
  });

  revalidatePath(`/leads/${input.leadId}`);
  return { ok: true, resendId: resendId ?? undefined };
}
