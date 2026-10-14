/**
 * Vagtens vagt: melder mailvagten sig ikke længere, siger CRM'et det selv.
 *
 * Mailvagten er en planlagt agent på Jacobs Mac og kører kun, når den er tændt.
 * Uden denne regel kunne den dø uden at nogen mærkede det. Reglen er med vilje
 * grov: alarm efter 6 timers tavshed i dagtimerne, højst én gang pr. 12 timer.
 */
export const TAVSHED_TIMER = 6;
export const ALARM_PAUSE_TIMER = 12;

/** Time på dagen i København (0-23). */
export function kbhTime(nu: Date): number {
  return Number(new Intl.DateTimeFormat('da-DK', { hour: '2-digit', hour12: false, timeZone: 'Europe/Copenhagen' }).format(nu)) % 24;
}

export function skalAlarmere(opts: {
  hjerteslagTimerSiden: number | null;
  sidsteAlarmTimerSiden: number | null;
  nu: Date;
}): boolean {
  const { hjerteslagTimerSiden: h, sidsteAlarmTimerSiden: a, nu } = opts;
  if (h == null) return false; // vagten er aldrig startet, så der er intet at miste
  if (h < TAVSHED_TIMER) return false;
  const t = kbhTime(nu);
  if (t < 8 || t >= 21) return false; // Macen sover om natten
  // Allerede alarmeret for denne tavshed (alarmen er nyere end sidste hjerteslag)
  if (a != null && a < ALARM_PAUSE_TIMER && a < h) return false;
  return true;
}
