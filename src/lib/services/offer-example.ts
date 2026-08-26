/**
 * Priseksempel til sælger-flowet.
 *
 * Vi viser ikke længere et auto-beregnet tilbud til sælgeren — en mægler
 * vender tilbage med estimatet i stedet. Men konceptet ("kontant til os"
 * kontra "listepris hos mægler") skal stadig kunne forstås, og derfor
 * regner vi det igennem på en rund bolig til 1.000.000 kr.
 *
 * Tallene ligger HER og ikke i skærmen, fordi de bruges to steder — på
 * /salg-v4's estimat-skærm og i kvitteringsmailen. Stod de begge steder,
 * ville de før eller siden komme til at sige noget forskelligt.
 *
 * Posterne er de samme tre, som prismotoren selv trækker fra
 * (netForkortet), så eksemplet afspejler den rigtige model:
 *   - mæglersalær         : samme faste 70.000 kr som i modellen
 *   - markedsafslag       : 7 % — midt i det typiske spænd på 6-8 %
 *   - drift i salgsperioden: ca. 3 måneders ejerudgifter
 */
export const OFFER_EXAMPLE = {
  /** Listepris hos mægler — det runde udgangspunkt. */
  listPrice: 1_000_000,
  /** Mæglersalær, som sælger ikke betaler hos os. */
  brokerFee: 70_000,
  /** Slutprisen ligger typisk 6-8 % under listeprisen. */
  marketDiscount: 70_000,
  /** Ejerudgifter mens boligen står til salg (ca. 3 mdr.). */
  ownershipCosts: 6_000,
  /**
   * Vores bud i eksemplet.
   *
   * Bemærk sammenhængen: markedsafslaget siger, at boligen realistisk
   * SÆLGES for 930.000 og ikke for de 1.000.000, den er sat til. Vores bud
   * er derfor ikke en overbetaling — det er den pris, boligen reelt er
   * værd. Sælgeren beholder blot salær og drift, som ellers forsvandt.
   *
   * Det er dét, der gør argumentet ærligt: vi vinder ikke ved at byde
   * lavt, men ved at eje og udleje boligen bagefter.
   */
  ourOffer: 930_000,
} as const;

/** Hvad sælger reelt står tilbage med efter et mæglersalg. 854.000 kr. */
export const OFFER_EXAMPLE_NET =
  OFFER_EXAMPLE.listPrice -
  OFFER_EXAMPLE.brokerFee -
  OFFER_EXAMPLE.marketDiscount -
  OFFER_EXAMPLE.ownershipCosts;

/**
 * Hvor meget MERE sælger står med ved at sælge kontant til os frem for at
 * gå mæglervejen. 930.000 − 854.000 = 76.000 kr. Det er hele pointen med
 * eksemplet, og derfor det tal, der skal fremhæves.
 */
export const OFFER_EXAMPLE_GAIN = OFFER_EXAMPLE.ourOffer - OFFER_EXAMPLE_NET;

/** Ensartet kr-formattering på tværs af skærm og mail. */
export const fmtKr = (n: number) => n.toLocaleString('da-DK');

/** Den besked sælger møder i stedet for et tal — samme ordlyd begge steder. */
export const NO_AUTO_OFFER = {
  heading: 'Vi kunne desværre ikke beregne et tilbud automatisk',
  body:
    'Ud fra de oplysninger vi har om boligen, kan vi ikke nå frem til et tilbud, vi tør stå på mål for. En af vores mæglere gennemgår den manuelt og kontakter dig med et estimat inden for 24 timer.',
} as const;
