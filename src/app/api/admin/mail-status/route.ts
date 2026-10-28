/**
 * /api/admin/mail-status — facit til mailvagten.
 *
 * Vagten (en planlagt agent) sender testmails hele vejen rundt og spørger her,
 * hvad CRM'et faktisk har modtaget og gemt. Uden dette endpoint kan man kun se,
 * at en mail forlod Gmail, ikke at den nåede ind i CRM'et.
 *
 * Auth: Bearer ${MAILVAGT_SECRET}. Er hemmeligheden ikke sat, svarer endpointet 503.
 * Svarer kun med tal, tidspunkter og ja/nej. Aldrig navne, adresser eller mailtekst.
 *
 *   GET    ?token=<t>               status + om testmails med <t> er nået frem
 *   POST   ?action=send-test&token  send en testmail ud gennem samme vej som kundemails
 *   POST   ?action=heartbeat        vagten melder: jeg har kørt
 *   DELETE ?token=<t>               ryd testmails med <t> (kun emner der starter med [mailvagt])
 */
import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { events, leadCommunications, leads } from '@/lib/db/schema';
import { TEST_EMNE } from '@/lib/mailvagt';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const TOKEN = /^[a-z0-9-]{6,40}$/i;
const TESTMODTAGER = process.env.SLA_ALERT_EMAIL || 'jacob@faurholt.com';

function ok(req: NextRequest): boolean | 'ikke-sat' {
  const secret = process.env.MAILVAGT_SECRET;
  if (!secret) return 'ikke-sat';
  const givet = (req.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const a = Buffer.from(givet);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function afvis(req: NextRequest): NextResponse | null {
  const r = ok(req);
  if (r === 'ikke-sat') return NextResponse.json({ error: 'MAILVAGT_SECRET er ikke sat' }, { status: 503 });
  if (!r) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return null;
}

const timer = (d: Date | string | null | undefined) =>
  d ? Math.round(((Date.now() - new Date(d).getTime()) / 3_600_000) * 10) / 10 : null;

async function uplacerede(token: string | null) {
  // Tabellen oprettes først, når den første mail ikke kan placeres.
  const findes = (await db.execute(sql`SELECT to_regclass('public.inbound_uplaceret') AS t`)) as unknown as { t: string | null }[];
  if (!findes[0]?.t) return { aabne: 0, aeldsteTimer: null as number | null, token: null as null | { emne: string | null; til: string | null; minutterEfter: number }[] };
  const r = (await db.execute(sql`
    SELECT count(*)::int AS n, min(oprettet) AS aeldste
    FROM inbound_uplaceret WHERE placeret_paa IS NULL AND (emne IS NULL OR emne NOT LIKE ${'%' + TEST_EMNE + '%'})
  `)) as unknown as { n: number; aeldste: string | null }[];
  let fundet: { emne: string | null; til: string | null; minutterEfter: number }[] | null = null;
  if (token) {
    const t = (await db.execute(sql`
      SELECT emne, til, oprettet FROM inbound_uplaceret WHERE emne LIKE ${`%${TEST_EMNE}%${token}%`} ORDER BY oprettet
    `)) as unknown as { emne: string | null; til: string | null; oprettet: string }[];
    fundet = t.map((x) => ({ emne: x.emne, til: x.til, minutterEfter: Math.round((Date.now() - new Date(x.oprettet).getTime()) / 60000) }));
  }
  return { aabne: r[0]?.n ?? 0, aeldsteTimer: timer(r[0]?.aeldste), token: fundet };
}

/** Resend: domæne, seneste leveringer og kvote. Fejler stille, så resten af svaret altid kommer. */
async function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { noegle: false };
  const h = { Authorization: `Bearer ${key}` };
  const ud: Record<string, unknown> = { noegle: true };
  try {
    const d = await fetch('https://api.resend.com/domains', { headers: h, signal: AbortSignal.timeout(8000) });
    ud.domaenerHttp = d.status;
    if (d.ok) {
      const j = (await d.json()) as { data?: { id: string; name: string; status: string }[] };
      ud.domaener = await Promise.all(
        (j.data ?? []).map(async (x) => {
          // Enkeltopslaget har open/click-tracking og TLS-indstillingen
          const det = await fetch(`https://api.resend.com/domains/${x.id}`, { headers: h, signal: AbortSignal.timeout(8000) })
            .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
            .catch(() => null);
          return {
            navn: x.name,
            status: x.status,
            openTracking: det?.open_tracking ?? null,
            clickTracking: det?.click_tracking ?? null,
            tls: det?.tls ?? null,
            region: det?.region ?? null,
          };
        }),
      );
    }
  } catch (e) {
    ud.domaenerFejl = e instanceof Error ? e.message : String(e);
  }
  try {
    const m = await fetch('https://api.resend.com/emails?limit=100', { headers: h, signal: AbortSignal.timeout(8000) });
    ud.mailsHttp = m.status;
    ud.kvote = {
      dag: m.headers.get('x-resend-daily-quota'),
      maaned: m.headers.get('x-resend-monthly-quota'),
    };
    if (m.ok) {
      const j = (await m.json()) as { data?: { last_event?: string; created_at?: string }[] };
      const sidste24 = (j.data ?? []).filter((x) => x.created_at && Date.now() - new Date(x.created_at).getTime() < 86_400_000);
      const pr: Record<string, number> = {};
      for (const x of sidste24) pr[x.last_event ?? 'ukendt'] = (pr[x.last_event ?? 'ukendt'] ?? 0) + 1;
      ud.sidste24t = { antal: sidste24.length, pr };
      // Alle de seneste (op til 100): levering, afvisning, klager
      const alle: Record<string, number> = {};
      for (const x of j.data ?? []) alle[x.last_event ?? 'ukendt'] = (alle[x.last_event ?? 'ukendt'] ?? 0) + 1;
      const ældste = (j.data ?? []).map((x) => x.created_at).filter(Boolean).sort()[0] ?? null;
      ud.seneste100 = { antal: (j.data ?? []).length, pr: alle, ældste };
    }
  } catch (e) {
    ud.mailsFejl = e instanceof Error ? e.message : String(e);
  }
  return ud;
}

export async function GET(req: NextRequest) {
  const nej = afvis(req);
  if (nej) return nej;
  const token = req.nextUrl.searchParams.get('token');
  if (token && !TOKEN.test(token)) return NextResponse.json({ error: 'ugyldigt token' }, { status: 400 });

  // ?emailId=<resend-id>: leveringsstatus for én udgående mail. Kun status og modtagerens domæne.
  const emailId = req.nextUrl.searchParams.get('emailId');
  if (emailId) {
    if (!/^[0-9a-f-]{36}$/i.test(emailId)) return NextResponse.json({ error: 'ugyldigt emailId' }, { status: 400 });
    const key = process.env.RESEND_API_KEY;
    if (!key) return NextResponse.json({ error: 'RESEND_API_KEY er ikke sat' }, { status: 500 });
    const r = await fetch(`https://api.resend.com/emails/${emailId}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return NextResponse.json({ ok: false, status: r.status });
    const m = (await r.json()) as { last_event?: string; created_at?: string; to?: string[] | string; from?: string };
    const til = Array.isArray(m.to) ? m.to[0] : m.to;
    return NextResponse.json({ ok: true, lastEvent: m.last_event ?? null, oprettet: m.created_at ?? null, tilDomaene: til?.split('@')[1] ?? null, fraDomaene: m.from?.split('@')[1]?.replace('>', '') ?? null });
  }

  const doegn = new Date(Date.now() - 86_400_000);
  const [ind, ud, ubesvarede, hjerteslag, ejer] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int`, sidst: sql<Date | null>`max(${leadCommunications.createdAt})` })
      .from(leadCommunications).where(and(eq(leadCommunications.direction, 'in'), eq(leadCommunications.type, 'email'), gt(leadCommunications.createdAt, doegn))),
    db.select({ n: sql<number>`count(*)::int`, sidst: sql<Date | null>`max(${leadCommunications.createdAt})`, utenId: sql<number>`count(*) filter (where ${leadCommunications.resendId} is null)::int` })
      .from(leadCommunications).where(and(eq(leadCommunications.direction, 'out'), eq(leadCommunications.type, 'email'), gt(leadCommunications.createdAt, doegn))),
    // Kundesvar der har ligget over 24 timer uden et udgående svar bagefter
    db.execute(sql`
      SELECT count(*)::int AS n, max(extract(epoch FROM (now() - i.sidst)) / 3600)::float AS aeldste_timer
      FROM (
        SELECT lc.lead_id, max(lc.created_at) FILTER (WHERE lc.direction = 'in' AND lc.type = 'email') AS sidst_ind,
               max(lc.created_at) FILTER (WHERE lc.direction = 'out') AS sidst_ud,
               max(lc.created_at) FILTER (WHERE lc.direction = 'in' AND lc.type = 'email') AS sidst
        FROM lead_communications lc JOIN leads l ON l.id = lc.lead_id
        WHERE l.deleted_at IS NULL GROUP BY lc.lead_id
      ) i
      WHERE i.sidst_ind IS NOT NULL AND (i.sidst_ud IS NULL OR i.sidst_ud < i.sidst_ind) AND i.sidst_ind < now() - interval '24 hours'
        AND i.sidst_ind > now() - interval '30 days'
    `),
    db.select({ tid: events.occurredAt }).from(events).where(eq(events.type, 'mailvagt.heartbeat')).orderBy(desc(events.occurredAt)).limit(1),
    db.select({ n: sql<number>`count(*)::int` }).from(leads).where(isNull(leads.deletedAt)),
  ]);
  const ub = (ubesvarede as unknown as { n: number; aeldste_timer: number | null }[])[0];

  return NextResponse.json({
    nu: new Date().toISOString(),
    app: { leads: ejer[0]?.n ?? 0 },
    indgaaende: { sidste24t: ind[0]?.n ?? 0, sidstTimerSiden: timer(ind[0]?.sidst) },
    udgaaende: { sidste24t: ud[0]?.n ?? 0, sidstTimerSiden: timer(ud[0]?.sidst), udenResendId: ud[0]?.utenId ?? 0 },
    ubesvarede: { antal: ub?.n ?? 0, aeldsteTimer: ub?.aeldste_timer != null ? Math.round(ub.aeldste_timer) : null },
    uplacerede: await uplacerede(token),
    hjerteslagTimerSiden: timer(hjerteslag[0]?.tid),
    resend: await resend(),
    env: {
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_WEBHOOK_SECRET: !!process.env.RESEND_WEBHOOK_SECRET,
      INBOUND_REPLY_TO: process.env.INBOUND_REPLY_TO ?? null,
      EMAIL_FROM: process.env.EMAIL_FROM ?? null,
      CRON_SECRET: !!process.env.CRON_SECRET,
    },
  });
}

export async function POST(req: NextRequest) {
  const nej = afvis(req);
  if (nej) return nej;
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'heartbeat') {
    await db.insert(events).values({ actor: 'mailvagt', type: 'mailvagt.heartbeat', payload: {} });
    return NextResponse.json({ ok: true });
  }

  if (action === 'send-test') {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    if (!TOKEN.test(token)) return NextResponse.json({ error: 'ugyldigt token' }, { status: 400 });
    const key = process.env.RESEND_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: 'RESEND_API_KEY er ikke sat' }, { status: 500 });
    const from = process.env.EMAIL_FROM || 'administration@365ejendom.dk';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: TESTMODTAGER,
        subject: `${TEST_EMNE} ud ${token}`,
        text: `Testmail fra mailvagten. Den skal ende i indbakken, ikke i spam. Token ${token}.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const tekst = await res.text();
    let id: string | null = null;
    try { id = (JSON.parse(tekst) as { id?: string }).id ?? null; } catch {}
    return NextResponse.json({ ok: res.ok, status: res.status, resendId: id, from, fejl: res.ok ? undefined : tekst.slice(0, 300) }, { status: res.ok ? 200 : 502 });
  }

  return NextResponse.json({ error: 'ukendt action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const nej = afvis(req);
  if (nej) return nej;
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!TOKEN.test(token)) return NextResponse.json({ error: 'ugyldigt token' }, { status: 400 });
  const findes = (await db.execute(sql`SELECT to_regclass('public.inbound_uplaceret') AS t`)) as unknown as { t: string | null }[];
  if (!findes[0]?.t) return NextResponse.json({ ok: true, slettet: 0 });
  const r = (await db.execute(sql`
    DELETE FROM inbound_uplaceret WHERE emne LIKE ${`%${TEST_EMNE}%${token}%`} RETURNING id
  `)) as unknown as unknown[];
  return NextResponse.json({ ok: true, slettet: r.length });
}
