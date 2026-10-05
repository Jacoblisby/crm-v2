/**
 * Det, der ikke stemmer eller er værd at vide, før man ringer eller skriver:
 * en udlejet lejlighed, en ejer der er et selskab, en seneste handel der var
 * en familieoverdragelse. Bruges både på lead-kortet og i opkaldsmanuset, så
 * de to aldrig siger forskelligt.
 */
import type { BeregnerSvar } from '@/lib/beregner';
import type { BbrLejlighed } from '@/lib/bbr-lejlighed';

export interface VaerdAtVide {
  tekst: string;
  alvor: 'advarsel' | 'info';
}

export function vaerdAtVide(
  lead: { fullName: string | null; kvm: number | null; rooms: string | null },
  svar: BeregnerSvar,
  bbr: BbrLejlighed | null,
): VaerdAtVide[] {
  const saelgerKvm = svar.saelgerKvm ?? lead.kvm;
  const saelgerVaer = svar.saelgerVaerelser ?? (lead.rooms ? Number(lead.rooms) : null);

  const noter: VaerdAtVide[] = [];
  if (bbr?.ejer?.type === 'Selskab')
    noter.push({ tekst: `Ejeren er et selskab ifølge Resights. ${lead.fullName ?? 'Indsenderen'} er måske lejer, administrator eller selskabets ejer. Afklar før bud.`, alvor: 'advarsel' });
  if (bbr?.bbr.udlejning === 'Udlejet' && !svar.udlejning)
    noter.push({ tekst: 'BBR siger lejligheden er udlejet, men sælger har ikke angivet et lejeforhold.', alvor: 'advarsel' });
  if (svar.udlejning && bbr?.bbr.udlejning === 'Benyttet af ejeren')
    noter.push({ tekst: 'Sælger angiver et lejeforhold, men BBR siger ejeren selv bor der.', alvor: 'advarsel' });
  if (bbr && saelgerKvm && Math.abs(saelgerKvm - bbr.bbr.kvm) >= 2)
    noter.push({ tekst: `Sælger har ${saelgerKvm} kvm, BBR har ${bbr.bbr.kvm} kvm. Buddet er regnet på sælgers tal.`, alvor: 'advarsel' });
  if (bbr?.bbr.vaerelser && saelgerVaer && Math.round(saelgerVaer) !== bbr.bbr.vaerelser)
    noter.push({ tekst: `Sælger har ${saelgerVaer} værelser, BBR har ${bbr.bbr.vaerelser}.`, alvor: 'info' });
  if (bbr?.handel && !bbr.handel.fri)
    noter.push({ tekst: `Seneste handel (${bbr.handel.dato.slice(0, 4)}) var «${bbr.handel.metode}». Prisen er ikke en markedspris.`, alvor: 'info' });
  if (svar.udgifter.senere)
    noter.push({ tekst: 'Sælger har ikke udfyldt udgifterne. Buddet er regnet uden drift. Indhent ved besigtigelse.', alvor: 'advarsel' });
  if (svar.saleLeaseback) noter.push({ tekst: 'Vil blive boende som lejer (sale-leaseback).', alvor: 'info' });
  if (bbr?.ejer?.reklamebeskyttet === 'Ja') noter.push({ tekst: 'Ejeren er reklamebeskyttet.', alvor: 'info' });
  return noter;
}
