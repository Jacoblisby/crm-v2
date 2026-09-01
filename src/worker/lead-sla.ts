/**
 * SLA-vagt for boligberegner-leads.
 *
 * BAGGRUNDEN: estimat-skærmen og kvitteringsmailen lover begge, at "en mægler
 * kontakter dig inden for 24 timer". Intet i systemet holdt øje med, om det
 * skete. `pipeline_stages.sla_days` findes, men bruges udelukkende til at
 * TEGNE "SLA: 3 dage" i pipeline-UI'et — ingen kode læser det. Overses
 * admin-mailen, sidder sælgeren og venter forgæves.
 *
 * Jobbet finder leads hvor løftet er ved at briste, og sender én samlet
 * påmindelse. Det sender ALDRIG noget til sælgeren — det er en intern vagt.
 *
 * ── Hvad tæller som kontakt? ──────────────────────────────────────────────
 * Den automatiske kvitteringsmail logges selv som `type:'email',
 * direction:'out'` med `createdBy:'boligberegner'`. Talte vi den med, ville
 * vagten aldrig gå i gang: hvert eneste lead ville se "kontaktet" ud i det
 * sekund det blev oprettet. Derfor tæller kun udgående kommunikation, hvor
 * createdBy er noget ANDET end 'boligberegner' — altså et menneske der har
 * ringet, skrevet eller noteret. Et indgående svar fra sælgeren tæller heller
 * ikke: at de skriver, betyder ikke at vi har svaret.
 *
 * ── Hvorfor ikke bare alarmere hver time? ─────────────────────────────────
 * Så ville det samme lead fylde indbakken 24 gange i døgnet, og påmindelsen
 * ville hurtigt blive noget man scroller forbi. Hver alarm skriver derfor en
 * `events`-række (`lead.sla_alerted`), og leads der allerede har en, springes
 * over. Én påmindelse pr. lead, og så er den ude af vejen.
 */
import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadCommunications, events } from '@/lib/db/schema';

/**
 * Hvor mange timer må der gå, før vi rykker?
 *
 * 18 og ikke 24: løftet er "inden for 24 timer", så påmindelsen skal komme
 * mens der stadig er tid til at nå det. En alarm der først lyder, når løftet
 * ER brudt, hjælper ingen.
 */
export const SLA_HOURS = 18;

const ALERT_EVENT = 'lead.sla_alerted';

export interface SlaBreach {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  hoursWaiting: number;
}

export interface SlaJobResult {
  checked: number;
  breaching: number;
  alerted: number;
  emailStatus: 'sendt' | 'fejlet' | 'ingen-modtager' | 'intet-at-sende';
  detail?: string;
  leads: SlaBreach[];
}

/**
 * Find boligberegner-leads der har ventet for længe uden menneskelig kontakt
 * og ikke allerede er rykket for.
 */
export function slaBreachQuery(hours = SLA_HOURS) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select({
      id: leads.id,
      fullName: leads.fullName,
      email: leads.email,
      phone: leads.phone,
      address: leads.address,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(
      and(
        // Kun leads fra boligberegneren — det er dem løftet blev givet til
        sql`${leads.source} LIKE 'boligberegner%'`,
        isNull(leads.deletedAt),
        lt(leads.createdAt, cutoff),
        // Endnu ikke rørt: står stadig i første stadie
        eq(leads.stageSlug, 'ny-lead'),
        // Ingen menneskelig udgående kontakt. 'boligberegner' er automatikkens
        // egen kvitteringsmail og må ikke tælle med.
        sql`NOT EXISTS (
          SELECT 1 FROM ${leadCommunications} lc
          WHERE lc.lead_id = ${leads.id}
            AND lc.direction = 'out'
            AND (lc.created_by IS NULL OR lc.created_by <> 'boligberegner')
        )`,
        // Ikke allerede rykket for
        sql`NOT EXISTS (
          SELECT 1 FROM ${events} ev
          WHERE ev.lead_id = ${leads.id}
            AND ev.type = ${ALERT_EVENT}
        )`,
      ),
    )
    .orderBy(leads.createdAt);
}

export async function findSlaBreaches(hours = SLA_HOURS): Promise<SlaBreach[]> {
  const rows = await slaBreachQuery(hours);

  const now = Date.now();
  return rows.map((r) => ({
    ...r,
    hoursWaiting: Math.floor((now - r.createdAt.getTime()) / 3_600_000),
  }));
}

/** Simpel HTML-escape — navne og adresser kommer fra brugerinput. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Eksporteret så påmindelsen kan ses uden at vente på en rigtig SLA-brist. */
export function alertHtml(breaches: SlaBreach[], baseUrl: string): string {
  const rows = breaches
    .map(
      (b) => `
      <tr>
        <td style="padding:12px 10px 12px 0;border-top:1px solid rgba(28,43,43,0.12);font-size:14px;color:#1c2b2b;">
          <strong>${esc(b.fullName || 'Uden navn')}</strong><br>
          <span style="color:#8a9695;font-size:12px;">${esc(b.address || 'Ingen adresse')}</span><br>
          <span style="color:#5c6b6a;font-size:12px;">${esc(b.email || '—')} · ${esc(b.phone || '—')}</span>
        </td>
        <td style="padding:12px 0;border-top:1px solid rgba(28,43,43,0.12);text-align:right;vertical-align:top;white-space:nowrap;">
          <span style="font-size:15px;font-weight:700;color:#a3452e;">${b.hoursWaiting} t.</span><br>
          <a href="${baseUrl}/leads/${b.id}" style="font-size:12px;color:#145d5f;">Åbn lead →</a>
        </td>
      </tr>`,
    )
    .join('');

  const antal = breaches.length;
  return `<!DOCTYPE html>
<html lang="da"><body style="margin:0;padding:24px 12px;background:#f5f2f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;width:100%;background:#ffffff;border-radius:14px;">
  <tr><td style="padding:26px 28px 0;">
    <div style="font-size:19px;font-weight:600;color:#1c2b2b;">
      ${antal} ${antal === 1 ? 'sælger venter' : 'sælgere venter'} stadig på svar
    </div>
    <p style="margin:8px 0 0;font-size:13.5px;line-height:1.6;color:#5c6b6a;">
      De har brugt boligberegneren og fået at vide, at en mægler kontakter dem
      inden for 24 timer. Der er ikke logget kontakt på dem endnu.
    </p>
  </td></tr>
  <tr><td style="padding:16px 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
      ${rows}
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 28px;">
    <p style="margin:0;padding-top:14px;border-top:1px solid rgba(28,43,43,0.12);font-size:11.5px;line-height:1.6;color:#8a9695;">
      Du får kun én påmindelse pr. lead. Ring, skriv eller læg en note på leadet,
      så forsvinder det herfra. Vagten kigger efter leads der har ventet over
      ${SLA_HOURS} timer.
    </p>
  </td></tr>
</table>
</body></html>`;
}

/**
 * Kør vagten: find, alarmér, og markér så vi ikke rykker for de samme igen.
 */
export async function runLeadSlaJob(opts: { hours?: number; dryRun?: boolean } = {}): Promise<SlaJobResult> {
  const hours = opts.hours ?? SLA_HOURS;
  const breaches = await findSlaBreaches(hours);

  const base: SlaJobResult = {
    checked: breaches.length,
    breaching: breaches.length,
    alerted: 0,
    emailStatus: 'intet-at-sende',
    leads: breaches,
  };

  if (breaches.length === 0) return base;
  if (opts.dryRun) return { ...base, emailStatus: 'intet-at-sende', detail: 'dry-run' };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SLA_ALERT_EMAIL || 'jacob@faurholt.com';
  const from = process.env.RESEND_FROM || '365 Ejendomme <noreply@365ejendom.dk>';
  const baseUrl = process.env.APP_BASE_URL || 'https://crm.365ejendom.dk';

  if (!apiKey) {
    return { ...base, emailStatus: 'ingen-modtager', detail: 'RESEND_API_KEY ikke sat' };
  }

  let emailStatus: SlaJobResult['emailStatus'] = 'sendt';
  let detail: string | undefined;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        subject: `⏰ ${breaches.length} ${breaches.length === 1 ? 'sælger venter' : 'sælgere venter'} på svar`,
        html: alertHtml(breaches, baseUrl),
      }),
    });
    if (!res.ok) {
      emailStatus = 'fejlet';
      detail = `Resend ${res.status}: ${(await res.text()).slice(0, 200)}`;
    }
  } catch (err) {
    emailStatus = 'fejlet';
    detail = err instanceof Error ? err.message : String(err);
  }

  // Markér KUN hvis mailen faktisk kom afsted. Markerede vi ved fejl, ville
  // leadet aldrig blive rykket for igen — og så var vagten værre end ingen.
  let alerted = 0;
  if (emailStatus === 'sendt') {
    await db.insert(events).values(
      breaches.map((b) => ({
        actor: 'cron:lead-sla',
        type: ALERT_EVENT,
        leadId: b.id,
        payload: { hoursWaiting: b.hoursWaiting, notified: to },
      })),
    );
    alerted = breaches.length;
  }

  return { ...base, alerted, emailStatus, detail };
}
