/**
 * Svaradresse pr. lead: reply+<lead-id>@reply.365ejendom.dk
 *
 * Resend tager imod mail til alle adresser på modtagedomænet, så leadets id
 * kan stå i selve adressen. Når kunden svarer, ved /api/inbound-email
 * præcis hvilket lead svaret hører til — uanset hvem der svarer, og fra
 * hvilken mail.
 *
 * Før blev svaret koblet på afsenderens mail. Det gik galt, så snart flere
 * leads havde samme mail (Jacobs egen stod på 16 test-leads): svaret landede
 * på det første lead med den mail, også slettede.
 */
const STANDARD = 'reply@reply.365ejendom.dk';

export function svaradresse(leadId: string): string {
  const base = process.env.INBOUND_REPLY_TO || STANDARD;
  const at = base.lastIndexOf('@');
  if (at < 0) return base;
  // Evt. eksisterende +tag skrælles af, så der kun står ét id.
  const lokal = base.slice(0, at).split('+')[0];
  return `${lokal}+${leadId}${base.slice(at)}`;
}

const UUID = /\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i;

/** Leadets id fra modtageradresserne, hvis svaret gik til en svaradresse. */
export function leadIdFraAdresser(adresser: string[]): string | null {
  for (const a of adresser) {
    const m = a.match(UUID);
    if (m) return m[1].toLowerCase();
  }
  return null;
}
