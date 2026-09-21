/**
 * Beregnerens svar — i ét format, uanset hvornår leadet kom ind.
 *
 * Boligberegneren spørger om langt mere, end leads-tabellen har kolonner til:
 * stand pr. rum, hvidevarer, røgfri, udgiftsposter, særlige forhold,
 * behovsafdækning. Indtil 21.09.2026 blev alt det kun gemt som én fritekst i
 * `notes`, og lead-kortet viste det derfor ikke.
 *
 * Nu gemmer submit et struktureret øjebliksbillede i `afkastInputs.beregner`
 * (ingen migrering nødvendig — kolonnen er allerede jsonb). Ældre leads har
 * kun noteteksten; den har et fast format, og `fraNote` læser den tilbage
 * til samme form. Kortet ved derfor ikke, hvor dataene kom fra.
 */
import type { FunnelState } from '@/app/salg/types';

export type StandNiveau = 'nyrenoveret' | 'god' | 'middel' | 'trænger' | 'slidt';

export interface Rum {
  navn: string;
  stand: StandNiveau | null;
  aargang: number | null;
  maerke: string | null;
}

export interface Post {
  navn: string;
  kr: number;
}

export interface BeregnerSvar {
  /** Hvor svarene er læst fra. «note» = rekonstrueret fra fritekst (ældre leads). */
  kilde: 'snapshot' | 'note';
  tilbud: {
    bud: number | null;
    markedsestimat: number | null;
    overtagelse: string | null;
  };
  /** Det sælger valgte på «Bekræft boligens detaljer». */
  boligtype: string | null;
  energimaerke: string | null;
  /** Sælgers egne tal fra bekræft-skærmen — kan afvige fra BBR. */
  saelgerKvm: number | null;
  saelgerVaerelser: number | null;
  saelgerByggeaar: number | null;
  stand: {
    samlet: StandNiveau | null;
    rum: Rum[];
    hvidevarer: string[];
    roegfri: string | null;
    note: string | null;
    oekonomiNote: string | null;
  };
  udgifter: {
    /** Sælger krydsede «udfylder senere» af. */
    senere: boolean;
    poster: Post[];
    vand: { kr: number; viaEF: boolean } | null;
    varme: { kr: number; viaEF: boolean } | null;
    total: number | null;
    efGaeld: { ydelse: number; restgaeld: number; kanIndfries: string | null } | null;
    haeftelse: number | null;
  };
  forhold: { tekst: string; advarsel: boolean }[];
  udlejning: string | null;
  behov: { label: string; vaerdi: string }[];
  saleLeaseback: boolean;
  soegerLejebolig: string | null;
  media: { fotos: number; dokumenter: string[] };
}

// ─── Etiketter — samme ordlyd som beregneren og lead-noten ────────────────

export const STAND_LABEL: Record<StandNiveau, string> = {
  nyrenoveret: 'Nyrenoveret',
  god: 'God',
  middel: 'Middel',
  trænger: 'Trænger',
  slidt: 'Slidt',
};

const TIDSHORISONT: Record<NonNullable<FunnelState['sellTimeframe']>, string> = {
  under1: 'Under 1 mdr',
  '1to3': '1-3 mdr',
  '3to6': '3-6 mdr',
  '6plus': '6+ mdr',
  unsure: 'Ved ikke endnu',
};
const GRUND: Record<NonNullable<FunnelState['sellReason']>, string> = {
  flytter: 'Flytter',
  arv: 'Arv / dødsbo',
  skilsmisse: 'Skilsmisse',
  okonomi: 'Økonomi',
  investering: 'Investering',
  andet: 'Andet',
};
const EFTER_SALGET: Record<NonNullable<FunnelState['afterSale']>, string> = {
  flytter_ud: 'Flytter ud helt',
  lejer_andet: 'Vil leje noget andet',
  blive_boende_lejer: 'Vil blive boende som lejer (sale-leaseback)',
  ved_ikke: 'Ved ikke endnu',
};
const JA_NEJ: Record<NonNullable<FunnelState['isOver65']>, string> = {
  ja: 'Ja',
  nej: 'Nej',
  usikker: 'Vil ikke svare / usikker',
};
const ANTAL_EJERE: Record<NonNullable<FunnelState['ownerCount']>, string> = {
  '1': '1',
  '2': '2',
  '3plus': '3 eller flere',
};
const BOET_DER: Record<NonNullable<FunnelState['livedHere']>, string> = {
  under1: 'Under 1 år',
  '1to3': '1-3 år',
  '3to10': '3-10 år',
  '10plus': 'Over 10 år',
};

export const labelTidshorisont = (v: NonNullable<FunnelState['sellTimeframe']>) => TIDSHORISONT[v];
export const labelGrund = (v: NonNullable<FunnelState['sellReason']>) => GRUND[v];
export const labelEfterSalget = (v: NonNullable<FunnelState['afterSale']>) => EFTER_SALGET[v];
export const labelJaNej = (v: NonNullable<FunnelState['isOver65']>) => JA_NEJ[v];

const OVERTAGELSE: Record<FunnelState['chosenOvertagelseMaaneder'], string> = {
  0.5: '14 dage (fast-track)',
  1: '1 mdr',
  3: '3 mdr (standard)',
  6: '6 mdr (lang)',
};
export const labelOvertagelse = (v: FunnelState['chosenOvertagelseMaaneder']) => OVERTAGELSE[v] ?? `${v} mdr`;

// ─── Fra beregnerens state (nye leads) ────────────────────────────────────

/**
 * Felter som kun findes i v2/v4-flowet. v4 sender sin state direkte ind i
 * submit, så de er der i praksis — de er bare ikke med i v1-typen.
 */
export interface V4Ekstra {
  bekraeftBoligtype?: string;
  smokeFree?: 'Ja' | 'Nej' | null;
  econNotes?: string;
  notes?: string;
  costsLater?: boolean;
  costGrundfond?: number;
  additionalDrift?: { category: string; customLabel?: string; amount: number }[];
}

export function svarFraState(
  s: FunnelState & V4Ekstra,
  tilbud: { bud: number; markedsestimat: number },
): BeregnerSvar {
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

  const hvidevarer = [
    s.applVaskemaskine && 'Vaskemaskine',
    s.applTorretumbler && 'Tørretumbler',
    s.applOpvaskemaskine && 'Opvaskemaskine',
    s.applKoeleFryseskab && 'Køle-/fryseskab',
    s.applOvn && 'Ovn',
    s.applKomfur && 'Komfur',
    s.applMikroovn && 'Mikroovn',
    s.applEmhaette && 'Emhætte',
  ].filter(Boolean) as string[];

  // Udgiftsposterne som sælger tastede dem. v4 har en dynamisk liste med
  // egne navne («Administration», «Antenne», «Andet: vicevært»); den lægges
  // ellers sammen i «Andre driftsomkostninger» og navnene går tabt.
  const poster: Post[] = [
    { navn: 'Fællesudgifter', kr: n(s.costFaellesudgifter) },
    { navn: 'Grundskyld', kr: n(s.costGrundvaerdi) },
    { navn: 'Renovation', kr: n(s.costRenovation) },
  ];
  if (s.additionalDrift?.length) {
    for (const p of s.additionalDrift) {
      const navn = p.category === 'Andet' && p.customLabel ? `Andet: ${p.customLabel}` : p.category;
      poster.push({ navn, kr: n(p.amount) });
    }
    if (n(s.costGrundfond) > 0) poster.push({ navn: 'Grundfond', kr: n(s.costGrundfond) });
  } else {
    poster.push(
      { navn: 'Fælleslån-ydelse', kr: n(s.costFaelleslaan) },
      { navn: 'Bygningsforsikring', kr: n(s.costForsikringer) },
      { navn: 'Rottebekæmpelse', kr: n(s.costRottebekempelse) },
      { navn: 'Andre driftsomkostninger', kr: n(s.costAndreDrift) },
    );
  }

  const forhold: BeregnerSvar['forhold'] = [];
  if (s.hasAltan) forhold.push({ tekst: 'Altan/terrasse', advarsel: false });
  if (s.hasElevator) forhold.push({ tekst: 'Elevator', advarsel: false });
  if (s.hasSolarPanels) forhold.push({ tekst: 'Solceller/solfanger', advarsel: false });
  if (s.hasTinglysteServitutter) forhold.push({ tekst: 'Tinglyste servitutter', advarsel: true });
  if (s.hasRenovationPlans)
    forhold.push({
      tekst: `EF har renoveringsplaner${s.renovationPlansNote ? `: ${s.renovationPlansNote}` : ''}`,
      advarsel: true,
    });

  const behov: BeregnerSvar['behov'] = [];
  if (s.sellTimeframe) behov.push({ label: 'Tidshorisont', vaerdi: TIDSHORISONT[s.sellTimeframe] });
  if (s.sellReason) behov.push({ label: 'Grund', vaerdi: GRUND[s.sellReason] });
  if (s.afterSale) behov.push({ label: 'Efter salget', vaerdi: EFTER_SALGET[s.afterSale] });
  if (s.ownerCount) behov.push({ label: 'Antal ejere', vaerdi: ANTAL_EJERE[s.ownerCount] });
  if (s.livedHere) behov.push({ label: 'Boet der', vaerdi: BOET_DER[s.livedHere] });
  if (s.isOver65) behov.push({ label: 'Fyldt 65', vaerdi: JA_NEJ[s.isOver65] });
  if (s.receivesBoligstotte) behov.push({ label: 'Folkepension/boligstøtte', vaerdi: JA_NEJ[s.receivesBoligstotte] });

  const vand = s.waterPaidViaAssoc ? n(s.waterAcontoYearly) : n(s.waterUsageLastYearKr);
  const varme = s.heatPaidViaAssoc ? n(s.heatAcontoYearly) : n(s.heatUsageLastYearKr);

  return {
    kilde: 'snapshot',
    tilbud: {
      bud: tilbud.bud,
      markedsestimat: tilbud.markedsestimat,
      overtagelse: labelOvertagelse(s.chosenOvertagelseMaaneder),
    },
    boligtype: s.bekraeftBoligtype || 'Ejerlejlighed',
    energimaerke: s.energyClass || null,
    saelgerKvm: s.kvm,
    saelgerVaerelser: s.rooms,
    saelgerByggeaar: s.yearBuilt,
    stand: {
      samlet: (s.stand as StandNiveau) ?? null,
      rum: [
        { navn: 'Køkken', stand: s.kitchenStand as StandNiveau, aargang: s.kitchenYear, maerke: s.kitchenBrand || null },
        { navn: 'Bad', stand: s.bathroomStand as StandNiveau, aargang: s.bathroomYear, maerke: null },
        { navn: 'Stue', stand: s.livingRoomStand as StandNiveau, aargang: null, maerke: null },
        { navn: 'Soveværelse', stand: s.bedroomStand as StandNiveau, aargang: null, maerke: null },
      ],
      hvidevarer,
      roegfri: s.smokeFree ?? null,
      // standNote i v4 er en sammenkædning af notes/røgfri/økonomi/senere.
      // Her gemmes delene hver for sig; kun sælgers egen fritekst som note.
      note: (s.notes ?? '').trim() || null,
      oekonomiNote: (s.econNotes ?? '').trim() || null,
    },
    udgifter: {
      senere: !!s.costsLater,
      poster,
      vand: { kr: vand, viaEF: !!s.waterPaidViaAssoc },
      varme: { kr: varme, viaEF: !!s.heatPaidViaAssoc },
      total: poster.reduce((sum, p) => sum + p.kr, 0),
      efGaeld: s.hasEjerforeningGaeld
        ? {
            ydelse: n(s.costFaelleslaan),
            restgaeld: n(s.ejerforeningGaeldRestgaeld),
            kanIndfries: s.faelleslaanCanPrepay
              ? { ja: 'Ja', nej: 'Nej', vedikke: 'Ved ikke' }[s.faelleslaanCanPrepay]
              : null,
          }
        : null,
      haeftelse: n(s.ejerforeningHaeftelseKr) > 0 ? n(s.ejerforeningHaeftelseKr) : null,
    },
    forhold,
    udlejning: s.isRented
      ? [
          `Leje ${n(s.rentalMonthlyRent).toLocaleString('da-DK')} kr/md`,
          `depositum ${n(s.rentalDeposit).toLocaleString('da-DK')} kr`,
          s.rentalStartDate ? `indflytning ${s.rentalStartDate}` : '',
          s.rentalUopsigelig ? `uopsigelig ${n(s.rentalUopsigeligMaaneder)} mdr endnu` : '',
          s.rentalContract ? `kontrakt vedhæftet: ${s.rentalContract.name}` : '',
        ]
          .filter(Boolean)
          .join(' · ')
      : null,
    behov,
    saleLeaseback: s.afterSale === 'blive_boende_lejer',
    soegerLejebolig:
      s.afterSale === 'lejer_andet' && (s.rentalSearchCity || s.rentalSearchType)
        ? `${s.rentalSearchType || '?'} i ${s.rentalSearchCity || '?'}`
        : null,
    media: { fotos: s.photoIds?.length ?? 0, dokumenter: (s.documents ?? []).map((d) => d.name) },
  };
}

// ─── Fra noteteksten (leads fra før 21.09.2026) ──────────────────────────

const kr = (s: string | undefined) => (s ? Number(s.replace(/\./g, '').replace(/[^\d-]/g, '')) || 0 : 0);
const STAND_ORD = new Set<StandNiveau>(['nyrenoveret', 'god', 'middel', 'trænger', 'slidt']);
const somStand = (s: string | undefined): StandNiveau | null =>
  s && STAND_ORD.has(s as StandNiveau) ? (s as StandNiveau) : null;

interface AfkastUdgifter {
  costFaellesudgifter?: number;
  costGrundvaerdi?: number;
  costFaelleslaan?: number;
  costRenovation?: number;
  costForsikringer?: number;
  costRottebekempelse?: number;
  costAndreDrift?: number;
  driftTotal?: number;
}

/**
 * Læs noteteksten tilbage. Et lead der er flettet flere gange, har flere
 * «📐 BOLIGBEREGNER LEAD»-blokke; den sidste er den seneste indsendelse.
 */
export function fraNote(notes: string | null, afkast?: AfkastUdgifter | null): BeregnerSvar | null {
  if (!notes || !notes.includes('BOLIGBEREGNER LEAD')) return null;
  const blok = notes.slice(notes.lastIndexOf('📐 BOLIGBEREGNER LEAD'));
  const linjer = blok.split('\n').map((l) => l.trim()).filter(Boolean);

  const find = (re: RegExp) => {
    for (const l of linjer) {
      const m = l.match(re);
      if (m) return m;
    }
    return null;
  };
  // Linjer mellem to overskrifter, fx alt under «SÆRLIGE FORHOLD:»
  const afsnit = (fra: string, til: string[]) => {
    const i = linjer.findIndex((l) => l.startsWith(fra));
    if (i < 0) return [];
    const ud: string[] = [];
    for (const l of linjer.slice(i + 1)) {
      if (til.some((t) => l.startsWith(t))) break;
      ud.push(l);
    }
    return ud;
  };

  const rumLinje = (navn: string): Rum => {
    const m = find(new RegExp(`^· ${navn}: (\\S+)(?: \\(årgang (\\d{4})\\))?\\s*(.*)$`));
    return {
      navn,
      stand: somStand(m?.[1]),
      aargang: m?.[2] ? Number(m[2]) : null,
      maerke: m?.[3]?.trim() || null,
    };
  };

  // «Note: Havedør skal skiftes · Røgfri: Ja · UDGIFTER: sælger udfylder senere …»
  const noteDele = (find(/^Note: (.*)$/)?.[1] ?? '').split(' · ').map((d) => d.trim()).filter(Boolean);
  const roegfri = noteDele.find((d) => d.startsWith('Røgfri:'))?.replace('Røgfri:', '').trim() ?? null;
  const oekonomi = noteDele.find((d) => d.startsWith('Økonomiske forhold:'))?.replace('Økonomiske forhold:', '').trim() ?? null;
  const senere = noteDele.some((d) => d.startsWith('UDGIFTER: sælger udfylder senere'));
  const fritekst = noteDele
    .filter((d) => !d.startsWith('Røgfri:') && !d.startsWith('Økonomiske forhold:') && !d.startsWith('UDGIFTER:'))
    .join(' · ');

  // Udgiftsposter: afkastInputs er struktureret og har flere poster end
  // noten (forsikring, rottebekæmpelse, andre) — brug den, når den findes.
  const poster: Post[] = afkast
    ? [
        { navn: 'Fællesudgifter', kr: afkast.costFaellesudgifter ?? 0 },
        { navn: 'Grundskyld', kr: afkast.costGrundvaerdi ?? 0 },
        { navn: 'Renovation', kr: afkast.costRenovation ?? 0 },
        { navn: 'Fælleslån-ydelse', kr: afkast.costFaelleslaan ?? 0 },
        { navn: 'Bygningsforsikring', kr: afkast.costForsikringer ?? 0 },
        { navn: 'Rottebekæmpelse', kr: afkast.costRottebekempelse ?? 0 },
        { navn: 'Andre driftsomkostninger', kr: afkast.costAndreDrift ?? 0 },
      ]
    : [
        { navn: 'Fællesudgifter', kr: kr(find(/^· Fællesudg: (.*)$/)?.[1]) },
        { navn: 'Grundskyld', kr: kr(find(/^· Grundskyld: (.*)$/)?.[1]) },
        { navn: 'Fælleslån-ydelse', kr: kr(find(/^· Fælleslån: (.*)$/)?.[1]) },
        { navn: 'Renovation', kr: kr(find(/^· Renovation: (.*)$/)?.[1]) },
      ];

  const vand = find(/^· Vand: ([\d.]+) \((.*)\)$/);
  const varme = find(/^· Varme: ([\d.]+) \((.*)\)$/);
  const ef = find(/^· EF-GÆLD: ydelse ([\d.]+) kr\/år, andel af restgæld ([\d.]+) kr.*?(?:kan indfries før tid: (\S+))?$/);
  const haeft = find(/^· HÆFTELSE EF.*?: ([\d.]+) kr$/);

  const forhold: BeregnerSvar['forhold'] = [];
  let udlejning: string | null = null;
  for (const l of afsnit('SÆRLIGE FORHOLD:', ['BEHOVSAFDÆKNING:', 'MEDIA:'])) {
    if (l.startsWith('⚠️ AKTUELT UDLEJET')) {
      udlejning = l.replace('⚠️ AKTUELT UDLEJET — ', '').replace('⚠️ AKTUELT UDLEJET', '').trim();
    } else if (l.startsWith('✓')) {
      forhold.push({ tekst: l.replace('✓', '').trim(), advarsel: false });
    } else if (l.startsWith('⚠️')) {
      forhold.push({ tekst: l.replace('⚠️', '').trim(), advarsel: true });
    }
  }

  const behov: BeregnerSvar['behov'] = [];
  let saleLeaseback = false;
  let soegerLejebolig: string | null = null;
  for (const l of afsnit('BEHOVSAFDÆKNING:', ['MEDIA:'])) {
    if (l.includes('SALE-LEASEBACK')) saleLeaseback = true;
    else if (l.includes('SØGER LEJEBOLIG:')) soegerLejebolig = l.split('SØGER LEJEBOLIG:')[1].trim();
    else {
      const m = l.match(/^· ([^:]+): (.*)$/);
      if (m) behov.push({ label: m[1], vaerdi: m[2] });
    }
  }

  const tilbud = find(/^Tilbud til sælger: ([\d.]+) kr/);
  const marked = find(/^Markedsestimat: ([\d.]+) kr · Overtagelse: (.*)$/);
  const hvidevarer = find(/^Hvidevarer: (.*)$/)?.[1].split(', ').map((h) => h.trim()) ?? [];
  const dokumenter = find(/^· Dokumenter: (.*)$/)?.[1].split(', ') ?? [];
  const total = find(/^· TOTAL: ([\d.]+) kr\/år$/);

  return {
    kilde: 'note',
    tilbud: {
      bud: tilbud ? kr(tilbud[1]) : null,
      markedsestimat: marked ? kr(marked[1]) : null,
      overtagelse: marked?.[2] ?? null,
    },
    // Ældre leads gemte ikke boligtype eller energimærke — de var altid
    // «Ejerlejlighed» i databasen, uanset hvad sælger valgte.
    boligtype: null,
    energimaerke: null,
    saelgerKvm: null,
    saelgerVaerelser: null,
    saelgerByggeaar: null,
    stand: {
      samlet: somStand(find(/^STAND .*?: (\S+)$/)?.[1]),
      rum: [rumLinje('Køkken'), rumLinje('Bad'), rumLinje('Stue'), rumLinje('Soveværelse')],
      hvidevarer,
      roegfri,
      note: fritekst || null,
      oekonomiNote: oekonomi,
    },
    udgifter: {
      senere,
      poster,
      vand: vand ? { kr: kr(vand[1]), viaEF: vand[2].includes('EF') } : null,
      varme: varme ? { kr: kr(varme[1]), viaEF: varme[2].includes('EF') } : null,
      total: afkast?.driftTotal ?? (total ? kr(total[1]) : null),
      efGaeld: ef ? { ydelse: kr(ef[1]), restgaeld: kr(ef[2]), kanIndfries: ef[3] ?? null } : null,
      haeftelse: haeft ? kr(haeft[1]) : null,
    },
    forhold,
    udlejning,
    behov,
    saleLeaseback,
    soegerLejebolig,
    media: { fotos: kr(find(/^· Fotos: (\d+)$/)?.[1]), dokumenter },
  };
}

/** Beregnerens svar for et lead — struktureret hvis muligt, ellers fra noten. */
export function beregnerSvar(lead: {
  notes: string | null;
  afkastInputs: unknown;
}): BeregnerSvar | null {
  const a = lead.afkastInputs as ({ beregner?: BeregnerSvar } & AfkastUdgifter) | null;
  if (a?.beregner) return a.beregner;
  return fraNote(lead.notes, a);
}
