'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { leads, leadCommunications, properties } from '@/lib/db/schema';
import type { FunnelState } from './types';
import { computeEstimate, type StandLevel } from '@/lib/services/price-engine';

export interface SubmitResult {
  ok: boolean;
  leadId?: string;
  estimate?: Awaited<ReturnType<typeof computeEstimate>>;
  error?: string;
}

/**
 * Submit funnel: opretter lead i CRM med smart routing,
 * sender notification email til Jacob + bekræftelse til kunde,
 * gemmer fotos.
 */
export async function submitFunnelAction(
  state: FunnelState,
  photoDataUrls: string[],
): Promise<SubmitResult> {
  if (!state.fullName || !state.email || !state.phone) {
    return { ok: false, error: 'Mangler kontaktoplysninger' };
  }
  if (!state.postalCode || !state.kvm) {
    return { ok: false, error: 'Mangler adresse-data' };
  }
  if (!state.stand) {
    return { ok: false, error: 'Mangler stand-vurdering' };
  }

  // 1. Beregn estimat — defensive coercion mod undefined fra gammel client-state
  const num = (v: number | undefined | null) => (typeof v === 'number' ? v : 0);
  const waterCost = state.waterPaidViaAssoc
    ? num(state.waterAcontoYearly)
    : num(state.waterUsageLastYearKr);
  const heatCost = state.heatPaidViaAssoc
    ? num(state.heatAcontoYearly)
    : num(state.heatUsageLastYearKr);
  const driftTotal =
    num(state.costGrundvaerdi) +
    num(state.costFaellesudgifter) +
    num(state.costRottebekempelse) +
    num(state.costRenovation) +
    num(state.costForsikringer) +
    num(state.costFaelleslaan) +
    num(state.costAndreDrift) +
    waterCost +
    heatCost;

  const estimate = await computeEstimate({
    postalCode: state.postalCode,
    kvm: state.kvm,
    yearBuilt: state.yearBuilt,
    rooms: state.rooms,
    roadName: state.streetName,
    houseNumber: state.houseNumber,
    stand: state.stand as StandLevel,
    driftTotalYearly: driftTotal,
    currentListingPrice: state.currentListingPrice,
    haeftelseEf: num(state.ejerforeningHaeftelseKr),
  });

  // 2. Find eksisterende property hvis bfe matcher
  let propertyId: string | null = null;
  if (state.bfeNumber) {
    const existing = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.bfeNumber, String(state.bfeNumber)))
      .limit(1);
    if (existing[0]) {
      propertyId = existing[0].id;
    } else {
      // Opret ny property fra OIS-data så vi har den i systemet
      const [created] = await db
        .insert(properties)
        .values({
          bfeNumber: String(state.bfeNumber),
          address: state.fullAddress,
          postalCode: state.postalCode,
          city: state.city,
          kvm: state.kvm,
          rooms: state.rooms ? String(state.rooms) : null,
          yearBuilt: state.yearBuilt,
          energyClass: state.energyClass,
          importSource: 'boligberegner',
        })
        .returning({ id: properties.id });
      propertyId = created.id;
    }
  }

  // 3. Smart routing — bestem stage
  const photoCount = photoDataUrls.length;
  const hasFullData = photoCount >= 3 && driftTotal > 0;
  const stageSlug = hasFullData
    ? 'interesse'
    : photoCount >= 1 || driftTotal > 0
      ? 'interesse'
      : 'ny-lead';

  // 4. Opret lead
  const appliances = [
    state.applVaskemaskine && 'Vaskemaskine',
    state.applTorretumbler && 'Tørretumbler',
    state.applOpvaskemaskine && 'Opvaskemaskine',
    state.applKoeleFryseskab && 'Køle-/fryseskab',
    state.applOvn && 'Ovn',
    state.applKomfur && 'Komfur',
    state.applMikroovn && 'Mikroovn',
    state.applEmhaette && 'Emhætte',
  ].filter(Boolean) as string[];

  const notes = [
    `📐 BOLIGBEREGNER LEAD`,
    `Foreløbigt estimat: ${estimate.netForkortet.finalOffer.toLocaleString('da-DK')} kr (markedsestimat: ${estimate.marketEstimate.toLocaleString('da-DK')} kr)`,
    ``,
    `STAND: ${state.stand}`,
    state.kitchenYear ? `Køkken: ${state.kitchenYear}${state.kitchenBrand ? ' (' + state.kitchenBrand + ')' : ''}` : '',
    state.bathroomYear ? `Bad: ${state.bathroomYear}` : '',
    appliances.length > 0 ? `Hvidevarer: ${appliances.join(', ')}` : '',
    state.standNote ? `Note: ${state.standNote}` : '',
    ``,
    `UDGIFTER (kr/år):`,
    `· Fællesudg: ${state.costFaellesudgifter.toLocaleString('da-DK')}`,
    `· Grundskyld: ${state.costGrundvaerdi.toLocaleString('da-DK')}`,
    `· Fælleslån: ${state.costFaelleslaan.toLocaleString('da-DK')}`,
    `· Renovation: ${state.costRenovation.toLocaleString('da-DK')}`,
    `· Vand: ${waterCost.toLocaleString('da-DK')} (${state.waterPaidViaAssoc ? 'aconto via EF' : 'forbrug'})`,
    `· Varme: ${heatCost.toLocaleString('da-DK')} (${state.heatPaidViaAssoc ? 'aconto via EF' : 'forbrug'})`,
    `· TOTAL: ${driftTotal.toLocaleString('da-DK')} kr/år`,
    num(state.ejerforeningHaeftelseKr) > 0
      ? `· HÆFTELSE EF (engang): ${num(state.ejerforeningHaeftelseKr).toLocaleString('da-DK')} kr`
      : '',
    ``,
    `SÆRLIGE FORHOLD:`,
    state.hasAltan ? '✓ Altan' : '',
    state.hasElevator ? '✓ Elevator' : '',
    state.isRented
      ? `⚠️ AKTUELT UDLEJET — leje ${(state.rentalMonthlyRent ?? 0).toLocaleString('da-DK')} kr/md, depositum ${(state.rentalDeposit ?? 0).toLocaleString('da-DK')} kr, indflytning ${state.rentalStartDate || '?'}${state.rentalUopsigelig ? ` (UOPSIGELIG ${state.rentalUopsigeligMaaneder ?? 0} mdr endnu)` : ''}${state.rentalContract ? ` — kontrakt vedhæftet: ${state.rentalContract.name}` : ''}`
      : '',
    ``,
    `MEDIA:`,
    `· Fotos: ${photoCount}`,
    state.documents.length > 0 ? `· Dokumenter: ${state.documents.map((d) => d.name).join(', ')}` : '',
    ``,
    state.utmSource ? `Kilde: ${state.utmSource}/${state.utmMedium ?? ''}/${state.utmCampaign ?? ''}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const [lead] = await db
    .insert(leads)
    .values({
      fullName: state.fullName,
      email: state.email,
      phone: state.phone,
      propertyId,
      address: state.fullAddress,
      postalCode: state.postalCode,
      city: state.city,
      propertyType: 'Ejerlejlighed',
      kvm: state.kvm,
      rooms: state.rooms ? String(state.rooms) : null,
      yearBuilt: state.yearBuilt,
      stageSlug,
      stageChangedAt: new Date(),
      conditionRating: standToRating(state.stand as StandLevel),
      valuationDkk: estimate.marketEstimate,
      bidDkk: estimate.netForkortet.finalOffer,
      bidStatus: 'afgivet',
      priority: hasFullData ? 2 : 1,
      source: state.utmSource ?? 'boligberegner',
      notes,
    })
    .returning({ id: leads.id });

  // 5. Log estimat-udregningen som kommunikation
  await db.insert(leadCommunications).values({
    leadId: lead.id,
    type: 'note',
    direction: 'out',
    subject: 'Boligberegner-estimat genereret',
    body: [
      `Markedsestimat: ${estimate.marketEstimate.toLocaleString('da-DK')} kr`,
      `Median pr m²: ${estimate.medianPricePerSqm.toLocaleString('da-DK')} kr`,
      `Comparables: ${estimate.sampleSize} sammenlignelige boliger`,
      `Estimeret leje: ${estimate.estimatedRentMd.toLocaleString('da-DK')} kr/md`,
      `Refurb-estimat: ${estimate.refurbTotal.toLocaleString('da-DK')} kr`,
      `Drift/år: ${driftTotal.toLocaleString('da-DK')} kr`,
      `Bud@20% ROE: ${estimate.netForkortet.finalOffer.toLocaleString('da-DK')} kr`,
      `ROE Netto: ${estimate.afkast.roeNettoPct}%`,
      `CF/md: ${estimate.afkast.cfMd.toLocaleString('da-DK')} kr`,
    ].join('\n'),
    createdBy: 'boligberegner',
  });

  // 6. Send email til Jacob (admin) + kunde
  void sendNotificationEmails(lead.id, state, estimate, photoCount).catch((err) => {
    console.error('[boligberegner] email-fejl:', err);
  });

  return { ok: true, leadId: lead.id, estimate };
}

function standToRating(stand: StandLevel): number {
  const map: Record<StandLevel, number> = {
    nyrenoveret: 9,
    god: 7,
    middel: 5,
    trænger: 3,
    slidt: 2,
  };
  return map[stand] ?? 5;
}

async function sendNotificationEmails(
  leadId: string,
  state: FunnelState,
  estimate: Awaited<ReturnType<typeof computeEstimate>>,
  photoCount: number,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'administration@365ejendom.dk';
  const adminEmail = 'jacob@faurholt.com';
  if (!apiKey) return;

  const offer = estimate.netForkortet.finalOffer.toLocaleString('da-DK');
  const market = estimate.marketEstimate.toLocaleString('da-DK');

  // Email til Jacob (admin)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: adminEmail,
      subject: `📐 Ny boligberegner-lead: ${state.fullName} (${state.fullAddress})`,
      text: [
        `Ny lead fra boligberegneren:`,
        ``,
        `Navn: ${state.fullName}`,
        `Email: ${state.email}`,
        `Telefon: ${state.phone}`,
        ``,
        `Adresse: ${state.fullAddress}`,
        `m²: ${state.kvm} · Værelser: ${state.rooms ?? '?'} · Byggeår: ${state.yearBuilt ?? '?'}`,
        `Stand: ${state.stand}${state.standNote ? ` (${state.standNote})` : ''}`,
        `Fotos: ${photoCount}`,
        ``,
        `Markedsestimat: ${market} kr`,
        `Vores tilbud: ${offer} kr`,
        `ROE Netto: ${estimate.afkast.roeNettoPct}%`,
        ``,
        `→ Åbn lead: https://crm.365ejendom.dk/leads/${leadId}`,
      ].join('\n'),
    }),
  });

  // Email til kunde — bekræftelse + estimat
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: state.email,
      subject: `Dit foreløbige tilbud: ${offer} kr — ${state.fullAddress}`,
      text: [
        `Hej ${state.fullName.split(' ')[0]},`,
        ``,
        `Tak for at bruge vores boligberegner. Her er dit foreløbige tilbud:`,
        ``,
        `┌─────────────────────────────────────────┐`,
        `│ Vurderet markedsværdi:  ${market} kr`,
        `│ Vores tilbud:           ${offer} kr`,
        `└─────────────────────────────────────────┘`,
        ``,
        `Tilbuddet er foreløbigt og bygger på ${estimate.sampleSize} sammenlignelige`,
        `handler i ${state.postalCode} ${state.city} samt dine oplysninger.`,
        ``,
        `Næste skridt:`,
        `Jacob ringer dig op indenfor 24 timer for at aftale en gratis,`,
        `uforpligtende besigtigelse. Efter besigtigelsen giver vi et endeligt`,
        `bindende tilbud.`,
        ``,
        `Hvis du vil ringe direkte: +45 89 87 66 34`,
        `Eller skriv: jacob@faurholt.com`,
        ``,
        `Mvh.`,
        `Jacob, 365 Ejendomme`,
      ].join('\n'),
    }),
  });
}
