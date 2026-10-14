/**
 * Kører med SLA-vagten hver time (samme Coolify-job). Se lib/mailvagt-watchdog.ts.
 * Sender direkte med Resend og skriver en event, så der højst alarmeres én gang pr. tavshed.
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';
import { skalAlarmere } from '@/lib/mailvagt-watchdog';

const timerSiden = (d: Date | undefined) => (d ? (Date.now() - d.getTime()) / 3_600_000 : null);

export async function runMailvagtWatchdog(): Promise<{ status: string; hjerteslagTimerSiden: number | null }> {
  const sidste = async (type: string) =>
    (await db.select({ tid: events.occurredAt }).from(events).where(eq(events.type, type)).orderBy(desc(events.occurredAt)).limit(1))[0]?.tid;
  const hjerteslagTimerSiden = timerSiden(await sidste('mailvagt.heartbeat'));
  const sidsteAlarmTimerSiden = timerSiden(await sidste('mailvagt.watchdog_alerted'));

  if (!skalAlarmere({ hjerteslagTimerSiden, sidsteAlarmTimerSiden, nu: new Date() })) {
    return { status: 'ok', hjerteslagTimerSiden };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: 'ingen-noegle', hjerteslagTimerSiden };
  const timer = Math.round(hjerteslagTimerSiden ?? 0);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || '365 Ejendomme <noreply@365ejendom.dk>',
      to: process.env.SLA_ALERT_EMAIL || 'jacob@faurholt.com',
      subject: `Mailvagten har ikke meldt sig i ${timer} timer`,
      text: `Mailvagten har ikke kørt i ${timer} timer. Enten er Macen slukket eller i dvale, eller også er vagten stoppet.\n\nImens bliver ingen testmails sendt, og en fejl i mailkæden ville ikke blive opdaget. Tænd Macen og åbn Claude, så tager vagten fat igen ved næste time.`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return { status: `fejlet-${res.status}`, hjerteslagTimerSiden };
  await db.insert(events).values({ actor: 'cron:mailvagt-watchdog', type: 'mailvagt.watchdog_alerted', payload: { timer } });
  return { status: 'alarmeret', hjerteslagTimerSiden };
}
