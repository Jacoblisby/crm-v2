/**
 * Deler en indgående mail i det kunden skrev nu, og den citerede tråd under.
 * Genkender Gmail/Apple («Den … skrev:», «On … wrote:»), Outlook
 * («Fra: … Sendt: …»), «-----Original Message-----» og «>»-citater.
 */
const MOENSTRE: RegExp[] = [
  // Navnet kan stå efter «skrev», og Gmail bryder lange linjer.
  /^\s*(Den|On|Le|Am|El)\s[^\n]{4,300}?\b(skrev|wrote|a écrit|schrieb|escribió)\b[\s\S]{0,200}?:\s*$/im,
  /^\s*-{2,}\s*(Original Message|Oprindelig meddelelse|Videresendt meddelelse|Forwarded message)/im,
  /^\s*_{8,}\s*$/m,
  /^\s*(Fra|From)\s*:.+\n\s*(Sendt|Sent|Dato|Date)\s*:/im,
  /^\s*>/m,
];

export function delCiteret(tekst: string): { nyt: string; citeret: string } {
  let foerst = tekst.length;
  for (const m of MOENSTRE) {
    const r = m.exec(tekst);
    if (r && r.index > 0 && r.index < foerst) foerst = r.index;
  }
  const nyt = tekst.slice(0, foerst).trimEnd();
  if (!nyt) return { nyt: tekst, citeret: '' };
  return { nyt, citeret: tekst.slice(foerst).trim() };
}
