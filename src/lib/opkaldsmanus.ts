/**
 * Opkaldsmanus til et lead, der netop har brugt boligberegneren.
 *
 * Manuset er ikke et skema, der læses op. Det er en rækkefølge med et mål
 * for hvert trin, nogle ord der kan bruges, og spørgsmål der er valgt ud fra,
 * hvad netop denne kunde har svaret. Har hun skrevet, at hun skal leje bagefter,
 * spørger manuset til det. Har BBR et andet kvadratmeter-tal end hendes, står
 * det som et spørgsmål, ikke som en rettelse.
 *
 * Reglerne, der gælder hele vejen:
 *   · Spørg først, forklar bagefter.
 *   · Intet beløb, medmindre kunden selv spørger. Det endelige bud kommer
 *     efter besigtigelsen.
 *   · Overtagelse nævnes ikke, før buddet ligger.
 *   · Et nej er et svar. Det logges, og vi skriver ikke igen før tiden.
 *
 * Telefonnummeret er givet med hintet «Kun hvis vi har brug for at følge
 * op», så opkaldet handler om kundens egen forespørgsel.
 */
import type { BeregnerSvar } from '@/lib/beregner';
import type { BbrLejlighed } from '@/lib/bbr-lejlighed';
import { vaerdAtVide, type VaerdAtVide } from '@/lib/vaerd-at-vide';

export interface ManusInput {
  lead: {
    fullName: string | null;
    phone: string | null;
    address: string | null;
    kvm: number | null;
    rooms: string | null;
    bidDkk: number | null;
    createdAt: Date;
  };
  svar: BeregnerSvar | null;
  bbr: BbrLejlighed | null;
  /** Ledig tid efter reglerne, hvis planlæggeren har en. */
  tidsforslag: string | null;
  /** Antal lejligheder vi selv har købt i samme ejerforening. */
  voresKoeb: number;
}

export interface ManusTrin {
  titel: string;
  varighed: string;
  /** Mål med trinnet i én sætning. */
  maal: string;
  sig?: string[];
  spoerg?: string[];
  husk?: string[];
}

export interface Manus {
  fornavn: string;
  fakta: [string, string][];
  paapas: VaerdAtVide[];
  trin: ManusTrin[];
  indvendinger: { kunden: string; svar: string }[];
  ikkeTruffet: { regel: string; telefonsvarer: string; sms: string };
}

const fornavnAf = (n: string | null) => {
  const f = (n ?? '').trim().split(/\s+/)[0] ?? '';
  return f ? `${f.charAt(0).toUpperCase()}${f.slice(1)}` : '';
};

const kortAdresse = (a: string | null) => (a ? a.split(',')[0].trim() : 'din lejlighed');

/** Hendes tidshorisont som en halvsætning, der kan stå efter «du vil videre». */
const TID_SOM_SAETNING: Record<string, string> = {
  'Hurtigst muligt': 'hurtigst muligt',
  '1–3 måneder': 'inden for 1–3 måneder',
  '3–6 måneder': 'inden for 3–6 måneder',
  '6+ måneder': 'på længere sigt',
};

export function byggManus({ lead, svar, bbr, tidsforslag, voresKoeb }: ManusInput): Manus {
  const fornavn = fornavnAf(lead.fullName);
  const adresse = kortAdresse(lead.address);
  const paapas = svar ? vaerdAtVide(lead, svar, bbr) : [];

  const behov = (spoergsmaal: string) => svar?.behov.find((b) => b.label === spoergsmaal)?.vaerdi ?? null;
  const tid = behov('Hvornår vil du flytte?');
  const efter = behov('Hvad skal du efter salget?');

  // ── Før du ringer ──────────────────────────────────────────────────────
  const fakta: [string, string][] = [];
  fakta.push(['Navn', lead.fullName ?? '—']);
  fakta.push(['Bolig', [lead.address, lead.kvm ? `${lead.kvm} kvm` : null].filter(Boolean).join(' · ') || '—']);
  if (tid) fakta.push(['Vil flytte', tid]);
  if (efter) fakta.push(['Efter salget', efter]);
  if (svar) {
    const rum = svar.stand.rum.filter((r) => r.valg).map((r) => `${r.navn}: ${r.valg}`);
    if (rum.length) fakta.push(['Stand, i hendes ord', rum.join(' · ')]);
  }
  if (bbr?.forening) {
    fakta.push([
      'Ejerforening',
      voresKoeb > 0
        ? `${bbr.forening} · vi har selv købt ${voresKoeb} ${voresKoeb === 1 ? 'lejlighed' : 'lejligheder'} her`
        : bbr.forening,
    ]);
  }
  const bud = svar?.tilbud.bud ?? lead.bidDkk;
  if (bud) fakta.push(['Bud fra beregneren (siges kun, hvis hun spørger)', `${Math.round(bud).toLocaleString('da-DK')} kr., foreløbigt`]);

  // ── Spørgene, valgt efter hvad hun har svaret ──────────────────────────
  const spoerg: string[] = ['Hvad fik dig til at tjekke prisen på lejligheden?'];

  if (tid && TID_SOM_SAETNING[tid]) {
    spoerg.push(`Du skrev, at du vil videre ${TID_SOM_SAETNING[tid]}. Hvad ligger bag det?`);
  } else {
    spoerg.push('Hvornår har du tænkt dig at komme videre?');
  }

  if (efter === 'Flytter ud helt') {
    spoerg.push('Du skriver, at du flytter ud. Skal du købe noget nyt, eller har du allerede fundet noget?');
  } else if (efter === 'Vil leje en anden bolig') {
    spoerg.push('Du vil leje en anden bolig bagefter. Ved du allerede hvor, eller skal jeg hjælpe med at finde noget? Vi udlejer selv lejligheder.');
  } else if (svar?.saleLeaseback || efter === 'Vil blive boende som lejer') {
    spoerg.push('Du skrev, at du gerne vil blive boende som lejer. Hvor længe forestiller du dig det, og hvad er vigtigt for dig i det?');
  } else {
    spoerg.push('Hvad skal du efter salget?');
  }

  // Ting, der ikke stemmer, stilles som spørgsmål og ikke som rettelser.
  if (bbr?.ejer?.type === 'Selskab')
    spoerg.push('Er lejligheden ejet i et selskab? Hvem er ejer, og er det dig, der bestemmer?');
  if ((bbr?.bbr.udlejning === 'Udlejet' && !svar?.udlejning) || svar?.udlejning)
    spoerg.push('Er lejligheden udlejet i dag? Hvad betaler lejeren, og hvornår kan den stå tom?');
  if (bbr && svar?.saelgerKvm && Math.abs(svar.saelgerKvm - bbr.bbr.kvm) >= 2)
    spoerg.push(`Jeg har ${bbr.bbr.kvm} kvm fra BBR, og du skrev ${svar.saelgerKvm}. Hvilket tal passer?`);
  if (svar?.forhold.some((f) => f.tekst.startsWith('EF har renoveringsplaner')))
    spoerg.push('Du skrev, at ejerforeningen har renoveringsplaner. Er der besluttet noget, og hvad skal du selv bidrage med?');
  if (svar?.udgifter.efGaeld)
    spoerg.push('Ejerforeningen har et fælleslån. Ved du, hvor meget af restgælden der er din andel?');
  if (svar?.udgifter.senere)
    spoerg.push('Du nåede ikke at udfylde udgifterne. Hvad er fællesudgiften om måneden, og har du den seneste opkrævning?');

  spoerg.push('Har du talt med en mægler eller fået en vurdering?');
  spoerg.push('Er der andre, der skal være med til at beslutte det?');

  const trin: ManusTrin[] = [
    {
      titel: 'Åbning',
      varighed: '10 sek.',
      maal: 'Sig, hvem du er og hvorfor du ringer, og spørg, om det passer.',
      sig: [
        `Hej ${fornavn || 'der'}, det er Jacob fra 365 Ejendomme. Du har lige været inde og tjekke prisen på din lejlighed på ${adresse}. Har du et par minutter, eller ringer jeg på et dårligt tidspunkt?`,
      ],
      husk: [
        'Passer det dårligt: «Hvornår må jeg ringe tilbage?» Skriv tidspunktet i noten, og ring præcis da.',
      ],
    },
    {
      titel: 'Hvorfor jeg ringer',
      varighed: '15 sek.',
      maal: 'Tag presset af. Du ringer for at forstå, ikke for at sælge.',
      sig: [
        'Jeg ringer ikke for at presse dig til noget. Jeg vil høre, om du har spørgsmål til det, du så, og forstå din situation lidt bedre, så jeg kan give dig det rigtige bud.',
      ],
    },
    {
      titel: 'Lyt først',
      varighed: '2–4 min.',
      maal: 'Find ud af, hvorfor hun spurgte nu, hvad hun skal bagefter, og hvem der ellers beslutter.',
      spoerg,
      husk: [
        'Det er en menu, ikke en tjekliste. Vælg de tre–fire spørgsmål, der passer til samtalen, og lad resten ligge.',
        'Spørg ét ting ad gangen og vent på svaret, også når der bliver stille.',
        'Skriv det vigtigste i noten, mens hun taler.',
      ],
    },
    {
      titel: 'Sådan fungerer det hos os',
      varighed: '30 sek.',
      maal: 'Fortæl kort, hvad der sker, og hvad det koster hende. Ikke mere.',
      sig: [
        'Sådan fungerer det hos os: Jeg kommer forbi og ser lejligheden. Det tager 10–15 minutter, og du skal ikke forberede noget. Bagefter får du et skriftligt kontantbud, uden bank- og advokatforbehold. Du betaler ingen mægler og intet salær, og der kommer ingen fremvisninger. Du bestemmer selv, om du vil tage imod det.',
      ],
      husk: [
        'Nævn ikke et beløb, medmindre hun spørger. Svar: «Beregneren giver et udgangspunkt. Det rigtige bud giver jeg, når jeg har set lejligheden, for stand og udgifter flytter prisen.»',
        'Nævn ikke overtagelsesdato. Det hører til, når buddet ligger.',
      ],
    },
    {
      titel: 'Aftal besigtigelsen',
      varighed: '30 sek.',
      maal: 'Få en konkret tid. Et forslag er lettere at sige ja til end et åbent spørgsmål.',
      sig: [
        tidsforslag
          ? `Passer det ${tidsforslag}? Ellers kan jeg torsdag mellem kl. 10 og 17 eller fredag mellem kl. 10 og 15.`
          : 'Jeg kan torsdag mellem kl. 10 og 17 eller fredag mellem kl. 10 og 15. Hvad passer dig bedst?',
      ],
      husk: [
        'Gentag dag, tid og adresse, når hun har sagt ja.',
        'Tryk «Aftalt besigtigelse» nedenfor og skriv tiden ind. Så lægger CRM’et en bekræftelses-mail klar til dig.',
      ],
    },
    {
      titel: 'Afslutning',
      varighed: '15 sek.',
      maal: 'Slut varmt og med et klart næste skridt.',
      sig: [
        `Tak for snakken, ${fornavn || 'og tak for din tid'}. Jeg sender en kort bekræftelse på mail, så du har tiden på skrift. Skriv eller ring, hvis der er noget, inden vi ses.`,
      ],
      husk: [
        'Sagde hun ikke ja: «Må jeg sende dig en mail med et par forslag, så du kan se på det i ro og mag?» Tryk så «Ring igen» med en dato.',
      ],
    },
  ];

  const indvendinger = [
    {
      kunden: '«Jeg vil bare vide, hvad den er værd.»',
      svar: 'Det forstår jeg godt. Beregneren giver et estimat. For at give dig et rigtigt bud skal jeg se lejligheden, men det forpligter dig ikke til noget.',
    },
    {
      kunden: '«Det er for lavt.» / «Det er mindre end en mægler siger.»',
      svar: 'Hvad havde du forestillet dig? (Lyt.) Vores bud ligger ofte under en mæglerpris, det skal jeg ikke skjule. Til gengæld er der ingen salgsomkostninger, ingen forbehold, ingen fremvisninger, og du ved præcis, hvad du får. Det skal du veje. Lad mig se den, så regner jeg på din lejlighed og ikke på et gennemsnit.',
    },
    {
      kunden: '«Jeg vil prøve en mægler først.»',
      svar: 'Det er helt i orden, mange gør det. Lad mig give dig et bud først, så har du noget at holde op imod. Det koster ikke noget og forpligter ikke.',
    },
    {
      kunden: '«Jeg har ikke travlt.» / «Jeg ved ikke, om jeg vil sælge.»',
      svar: 'Det er helt fint. Må jeg skrive til dig om en måned eller to, så du ikke skal huske os? (Ja: tryk «Ikke aktuelt nu».)',
    },
    {
      kunden: '«Hvem er I?»',
      svar:
        voresKoeb > 0
          ? `Vi er et lokalt ejendomsselskab. Vi ejer og udlejer selv lejligheder, og vi har faktisk købt ${voresKoeb} ${voresKoeb === 1 ? 'lejlighed' : 'lejligheder'} i din ejerforening. Du kan se mere på 365ejendom.dk.`
          : 'Vi er et lokalt ejendomsselskab. Vi ejer og udlejer selv lejligheder, og vi køber for egen regning. Du kan se mere på 365ejendom.dk.',
    },
    {
      kunden: '«Hvad bruger I mine oplysninger til?»',
      svar: 'Kun til at give dig et bud. Dem ser kun jeg og mit team. Du kan læse mere i privatlivspolitikken på 365ejendom.dk.',
    },
    {
      kunden: '«Jeg vil ikke kontaktes.» / «Ring ikke igen.»',
      svar: 'Det er selvfølgelig i orden, og undskyld forstyrrelsen. Du hører ikke fra mig igen. (Tryk «Vil ikke kontaktes». Skriv ikke til dem igen.)',
    },
  ];

  const ikkeTruffet = {
    regel:
      'Ring højst tre gange, fordelt på tre dage og på forskellige tidspunkter. Første gang samme dag som hun har brugt beregneren. Efter første forsøg: send booking-mailen, hvis den ikke er sendt.',
    telefonsvarer: `Hej ${fornavn || 'der'}, det er Jacob fra 365 Ejendomme. Du har lige været inde og tjekke prisen på din lejlighed på ${adresse}. Jeg ringer ikke for at presse dig til noget, men jeg kan gerne komme forbi og give dig et rigtigt kontantbud. Du kan ringe tilbage på 61 78 90 71 eller svare på den mail, jeg sender. Hav en god dag.`,
    sms: `Hej ${fornavn || 'der'}, det er Jacob fra 365 Ejendomme. Jeg prøvede at ringe angående din lejlighed på ${adresse}. Du kan svare her, så finder vi et tidspunkt. Mvh Jacob`,
  };

  return { fornavn, fakta, paapas, trin, indvendinger, ikkeTruffet };
}
