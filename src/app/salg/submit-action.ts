'use server';

import { eq, and, isNull, ne } from 'drizzle-orm';
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
  // Vand og varme er aconto/forbrug — IKKE en del af drift, da vi viderefakturerer
  // til lejer. Vi gemmer beløbene som info i lead-noten, men de indgår ikke i ROE-beregningen.
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
    num(state.costAndreDrift);

  // Haeftelse + andel af EF-restgaeld traekkes begge fra laaneprovenuet ved
  // overdragelse — saa engine'n behandler dem som ét samlet "haeft"-beloeb.
  const totalHaeft =
    num(state.ejerforeningHaeftelseKr) + num(state.ejerforeningGaeldRestgaeld);

  // Closing-date adjustment (matcher logikken i Step7Estimate.tsx)
  const closingAdjustment =
    state.chosenOvertagelseMaaneder === 0.5
      ? 15_000
      : state.chosenOvertagelseMaaneder === 6
        ? -10_000
        : 0;

  const estimate = await computeEstimate({
    postalCode: state.postalCode,
    kvm: state.kvm,
    yearBuilt: state.yearBuilt,
    rooms: state.rooms,
    roadName: state.streetName,
    houseNumber: state.houseNumber,
    latitude: state.latitude,
    longitude: state.longitude,
    stand: state.stand as StandLevel,
    driftTotalYearly: driftTotal,
    currentListingPrice: state.currentListingPrice,
    haeftelseEf: totalHaeft,
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

  const adjustedFinalOffer = estimate.netForkortet.finalOffer + closingAdjustment;
  const overtagelseLabel =
    state.chosenOvertagelseMaaneder === 0.5
      ? '14 dage (fast-track)'
      : state.chosenOvertagelseMaaneder === 1
        ? '1 mdr'
        : state.chosenOvertagelseMaaneder === 3
          ? '3 mdr (standard)'
          : '6 mdr (lang)';

  const notes = [
    `📐 BOLIGBEREGNER LEAD`,
    `Tilbud til sælger: ${adjustedFinalOffer.toLocaleString('da-DK')} kr (model-base: ${estimate.netForkortet.finalOffer.toLocaleString('da-DK')} kr ${closingAdjustment >= 0 ? '+' : ''}${closingAdjustment.toLocaleString('da-DK')} kr overtagelse-justering)`,
    `Markedsestimat: ${estimate.marketEstimate.toLocaleString('da-DK')} kr · Overtagelse: ${overtagelseLabel}`,
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
    state.hasEjerforeningGaeld
      ? `· EF-GÆLD: ydelse ${num(state.costFaelleslaan).toLocaleString('da-DK')} kr/år, andel af restgæld ${num(state.ejerforeningGaeldRestgaeld).toLocaleString('da-DK')} kr (engang)${state.faelleslaanCanPrepay ? `, kan indfries før tid: ${state.faelleslaanCanPrepay === 'ja' ? 'JA' : state.faelleslaanCanPrepay === 'nej' ? 'NEJ' : 'Ved ikke'}` : ''}`
      : '',
    num(state.ejerforeningHaeftelseKr) > 0
      ? `· HÆFTELSE EF jf. tinglysning (engang, separat fra gæld): ${num(state.ejerforeningHaeftelseKr).toLocaleString('da-DK')} kr`
      : '',
    totalHaeft > 0
      ? `· SUM trukket fra låneprovenu (hæftelse + restgæld): ${totalHaeft.toLocaleString('da-DK')} kr`
      : '',
    ``,
    `SÆRLIGE FORHOLD:`,
    state.hasAltan ? '✓ Altan' : '',
    state.hasElevator ? '✓ Elevator' : '',
    state.isRented
      ? `⚠️ AKTUELT UDLEJET — leje ${(state.rentalMonthlyRent ?? 0).toLocaleString('da-DK')} kr/md, depositum ${(state.rentalDeposit ?? 0).toLocaleString('da-DK')} kr, indflytning ${state.rentalStartDate || '?'}${state.rentalUopsigelig ? ` (UOPSIGELIG ${state.rentalUopsigeligMaaneder ?? 0} mdr endnu)` : ''}${state.rentalContract ? ` — kontrakt vedhæftet: ${state.rentalContract.name}` : ''}`
      : '',
    ``,
    `BEHOVSAFDÆKNING:`,
    state.sellTimeframe ? `· Tidshorisont: ${labelTimeframe(state.sellTimeframe)}` : '',
    state.sellReason ? `· Grund: ${labelReason(state.sellReason)}` : '',
    state.afterSale ? `· Efter salget: ${labelAfterSale(state.afterSale)}` : '',
    state.afterSale === 'blive_boende_lejer' ? `· 🏠 SALE-LEASEBACK INTERESSE` : '',
    state.isOver65 ? `· Fyldt 65: ${labelYesNo(state.isOver65)}` : '',
    state.receivesBoligstotte
      ? `· Folkepension/boligstøtte: ${labelYesNo(state.receivesBoligstotte)}`
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

  // Match mod eksisterende leads — hvis sælger allerede er i pipeline
  // (fx via mægler-listen) skal vi opdatere det eksisterende lead, ikke
  // oprette en ny duplikat. Match-strategi:
  //   1. Same propertyId (BFE-match)
  //   2. Ellers same normaliserede adresse + ikke i terminal stage
  function normalizeAddr(s: string): string {
    return s
      .toLowerCase()
      .replace(/[,.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const targetAddrKey = normalizeAddr(state.fullAddress);
  const candidates = await db
    .select({ lead: leads })
    .from(leads)
    .where(and(isNull(leads.deletedAt), ne(leads.stageSlug, 'koebt'), ne(leads.stageSlug, 'arkiveret'), ne(leads.stageSlug, 'tabt')));
  const existingLead = candidates.find((c) => {
    if (propertyId && c.lead.propertyId === propertyId) return true;
    if (c.lead.address && normalizeAddr(c.lead.address) === targetAddrKey) return true;
    return false;
  })?.lead;

  let leadId: string;
  if (existingLead) {
    // OPDATER eksisterende lead med sælgers nye data + fortsat boligberegner-source
    await db
      .update(leads)
      .set({
        fullName: state.fullName,
        email: state.email,
        phone: state.phone,
        propertyId: propertyId ?? existingLead.propertyId,
        address: state.fullAddress,
        postalCode: state.postalCode,
        city: state.city,
        kvm: state.kvm,
        rooms: state.rooms ? String(state.rooms) : null,
        yearBuilt: state.yearBuilt,
        stageSlug: 'interesse', // sælger har aktivt henvendt sig — bump til interesse
        stageChangedAt: new Date(),
        conditionRating: standToRating(state.stand as StandLevel),
        valuationDkk: estimate.marketEstimate,
        bidDkk: adjustedFinalOffer,
        bidStatus: 'afgivet',
        priority: hasFullData ? 2 : 1,
        source: 'boligberegner-merged', // marker at det er merged fra eksisterende
        notes: `${existingLead.notes ?? ''}\n\n[merged from boligberegner ${new Date().toISOString().slice(0, 10)}]\n${notes}`.trim(),
        afkastInputs: {
          rentMd: estimate.estimatedRentMd,
          driftTotal,
          refurbTotal: estimate.refurbTotal,
          haeftelseEf: totalHaeft,
          ejerforeningHaeftelseKr: num(state.ejerforeningHaeftelseKr),
          ejerforeningGaeldRestgaeld: num(state.ejerforeningGaeldRestgaeld),
          hasEjerforeningGaeld: state.hasEjerforeningGaeld,
          listePris: estimate.marketEstimate,
          medianPricePerSqm: estimate.medianPricePerSqm,
          sampleSize: estimate.sampleSize,
          sameEfCount: estimate.sameEfCount,
          rentSource: estimate.rentSource,
          rentSampleSize: estimate.rentSampleSize,
          costFaellesudgifter: num(state.costFaellesudgifter),
          costGrundvaerdi: num(state.costGrundvaerdi),
          costFaelleslaan: num(state.costFaelleslaan),
          costRenovation: num(state.costRenovation),
          costForsikringer: num(state.costForsikringer),
          costRottebekempelse: num(state.costRottebekempelse),
          costAndreDrift: num(state.costAndreDrift),
          waterCost,
          waterPaidViaAssoc: state.waterPaidViaAssoc,
          heatCost,
          heatPaidViaAssoc: state.heatPaidViaAssoc,
          faelleslaanCanPrepay: state.faelleslaanCanPrepay,
        },
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existingLead.id));
    leadId = existingLead.id;
  } else {
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
      bidDkk: adjustedFinalOffer,
      bidStatus: 'afgivet',
      priority: hasFullData ? 2 : 1,
      source: state.utmSource ?? 'boligberegner',
      notes,
      // Snapshot af alle afkast-inputs så vi kan re-køre kalkulationen i CRM
      afkastInputs: {
        rentMd: estimate.estimatedRentMd,
        driftTotal,
        refurbTotal: estimate.refurbTotal,
        haeftelseEf: totalHaeft,
        ejerforeningHaeftelseKr: num(state.ejerforeningHaeftelseKr),
        ejerforeningGaeldRestgaeld: num(state.ejerforeningGaeldRestgaeld),
        hasEjerforeningGaeld: state.hasEjerforeningGaeld,
        listePris: estimate.marketEstimate,
        medianPricePerSqm: estimate.medianPricePerSqm,
        sampleSize: estimate.sampleSize,
        sameEfCount: estimate.sameEfCount,
        rentSource: estimate.rentSource,
        rentSampleSize: estimate.rentSampleSize,
        // Udspecificerede udgifter — så debug-siden kan vise dem
        costFaellesudgifter: num(state.costFaellesudgifter),
        costGrundvaerdi: num(state.costGrundvaerdi),
        costFaelleslaan: num(state.costFaelleslaan),
        costRenovation: num(state.costRenovation),
        costForsikringer: num(state.costForsikringer),
        costRottebekempelse: num(state.costRottebekempelse),
        costAndreDrift: num(state.costAndreDrift),
        waterCost,
        waterPaidViaAssoc: state.waterPaidViaAssoc,
        heatCost,
        heatPaidViaAssoc: state.heatPaidViaAssoc,
        faelleslaanCanPrepay: state.faelleslaanCanPrepay,
      },
    })
    .returning({ id: leads.id });
    leadId = lead.id;
  }

  // 5. Log estimat-udregningen som kommunikation
  await db.insert(leadCommunications).values({
    leadId: leadId,
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
  void sendNotificationEmails(leadId, state, estimate, photoCount).catch((err) => {
    console.error('[boligberegner] email-fejl:', err);
  });

  return { ok: true, leadId, estimate };
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
  if (!apiKey) {
    await logEmailEvent(leadId, 'admin', adminEmail, 'skipped', 'RESEND_API_KEY ikke sat');
    await logEmailEvent(leadId, 'kunde', state.email, 'skipped', 'RESEND_API_KEY ikke sat');
    return;
  }

  const offer = estimate.netForkortet.finalOffer.toLocaleString('da-DK');
  const market = estimate.marketEstimate.toLocaleString('da-DK');

  const adminSubject = `📐 Ny lead: ${state.fullName} · ${state.fullAddress} · tilbud ${offer} kr`;
  const adminResult = await sendResendEmail(apiKey, {
    from,
    to: adminEmail,
    subject: adminSubject,
    text: [
      `Ny boligberegner-lead — håndtér i CRM:`,
      ``,
      `→ https://crm.365ejendom.dk/leads/${leadId}?tab=afkast`,
      ``,
      `Hurtig info:`,
      `· ${state.fullName} (${state.email}, ${state.phone})`,
      `· ${state.fullAddress}`,
      `· ${state.kvm} m² · ${state.rooms ?? '?'} værelser · byggeår ${state.yearBuilt ?? '?'}`,
      `· Stand: ${state.stand}${state.standNote ? ` (${state.standNote})` : ''}`,
      `· Markedsestimat: ${market} kr · Tilbud@20% ROE: ${offer} kr`,
      `· ${estimate.sampleSize} comparables, ${estimate.sameEfCount} i samme EF`,
      state.hasEjerforeningGaeld
        ? `· EF-gæld: ${(state.costFaelleslaan ?? 0).toLocaleString('da-DK')} kr/år · andel ${(state.ejerforeningGaeldRestgaeld ?? 0).toLocaleString('da-DK')} kr`
        : '',
      (state.ejerforeningHaeftelseKr ?? 0) > 0
        ? `· EF-hæftelse jf. tinglysning: ${(state.ejerforeningHaeftelseKr ?? 0).toLocaleString('da-DK')} kr`
        : '',
      ``,
      `Behovsafdækning:`,
      `· Tidshorisont: ${state.sellTimeframe ? labelTimeframe(state.sellTimeframe) : '—'}`,
      `· Grund: ${state.sellReason ? labelReason(state.sellReason) : '—'}`,
      `· Efter salget: ${state.afterSale ? labelAfterSale(state.afterSale) : '—'}`,
      state.afterSale === 'blive_boende_lejer' ? `· 🏠 SALE-LEASEBACK INTERESSE` : '',
      state.isOver65 ? `· Fyldt 65: ${labelYesNo(state.isOver65)}` : '',
      state.receivesBoligstotte
        ? `· Folkepension/boligstøtte: ${labelYesNo(state.receivesBoligstotte)}`
        : '',
    ].filter((l) => l !== '').join('\n'),
  });
  await logEmailEvent(
    leadId,
    'admin',
    adminEmail,
    adminResult.ok ? 'sendt' : 'fejlet',
    adminResult.ok ? `Resend id: ${adminResult.id}` : adminResult.error,
    adminSubject,
  );

  const customerSubject = `Dit foreløbige tilbud: ${offer} kr — ${state.fullAddress}`;
  const html = customerEmailHtml(state, estimate, photoCount);
  const customerResult = await sendResendEmail(apiKey, {
    from,
    to: state.email,
    reply_to: 'administration@365ejendom.dk',
    subject: customerSubject,
    html,
  });
  await logEmailEvent(
    leadId,
    'kunde',
    state.email,
    customerResult.ok ? 'sendt' : 'fejlet',
    customerResult.ok ? `Resend id: ${customerResult.id}` : customerResult.error,
    customerSubject,
  );
}

interface ResendPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  reply_to?: string;
}

type ResendResult = { ok: true; id: string } | { ok: false; error: string };

async function sendResendEmail(apiKey: string, payload: ResendPayload): Promise<ResendResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${body.message ?? 'ukendt fejl'}` };
    }
    return { ok: true, id: body.id ?? 'ukendt' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function logEmailEvent(
  leadId: string,
  recipient: 'admin' | 'kunde',
  toAddress: string,
  status: 'sendt' | 'fejlet' | 'skipped',
  detail: string,
  subject?: string,
) {
  try {
    const icon = status === 'sendt' ? '✅' : status === 'fejlet' ? '❌' : '⚠️';
    const role = recipient === 'admin' ? 'Admin (Jacob)' : 'Kunde';
    await db.insert(leadCommunications).values({
      leadId,
      type: 'email',
      direction: 'out',
      subject: subject ?? `Boligberegner-mail til ${role}`,
      body: [
        `${icon} ${status.toUpperCase()} — ${role}: ${toAddress}`,
        detail,
      ].join('\n'),
      createdBy: 'boligberegner',
    });
  } catch (err) {
    // Logging må aldrig crashe submit-flowet
    console.error('[boligberegner] kunne ikke logge email-event:', err);
  }
}

function customerEmailHtml(
  state: FunnelState,
  estimate: Awaited<ReturnType<typeof computeEstimate>>,
  photoCount: number,
): string {
  const firstName = state.fullName.split(' ')[0] || 'der';
  const fmt = (n: number) => n.toLocaleString('da-DK');
  const offer = fmt(estimate.netForkortet.finalOffer);
  const market = fmt(estimate.marketEstimate);
  const discount = fmt(estimate.netForkortet.minusMarketDiscount);
  const broker = fmt(estimate.netForkortet.minusBrokerSavings);
  const ownership = fmt(estimate.netForkortet.minusOwnershipCosts);
  const ourMargin = estimate.netForkortet.minusOurMargin;
  // Filter comparables til ±8% af ækvivalent mægler-pris — kun dem der reelt
  // er sammenlignelige med vores tilbud netto.
  const equivalentBrokerPrice =
    estimate.netForkortet.finalOffer +
    estimate.netForkortet.minusBrokerSavings +
    estimate.netForkortet.minusMarketDiscount +
    estimate.netForkortet.minusOwnershipCosts;
  const compsHtml = estimate.comparables
    .filter((c) => !c.isCurrentListing)
    .filter((c) => {
      const ratio = c.price / equivalentBrokerPrice;
      return ratio >= 0.92 && ratio <= 1.08;
    })
    .slice(0, 5)
    .map(
      (c) => `
        <tr>
          <td style="padding:6px 0;font-size:13px;">
            <strong>${escapeHtml(c.address)}</strong> · ${c.kvm}m²
            ${c.weight >= 3 ? '<span style="background:#0f172a;color:white;padding:2px 6px;border-radius:4px;font-size:11px;margin-left:6px;">Samme EF</span>' : ''}
          </td>
          <td style="padding:6px 0;text-align:right;font-size:13px;">
            <strong>${fmt(c.price)} kr</strong>
            <span style="color:#64748b;font-size:11px;">· ${c.date?.slice(0, 7) ?? ''}</span>
          </td>
        </tr>
      `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dit foreløbige tilbud</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:white;">

  <!-- Header -->
  <div style="padding:20px;border-bottom:1px solid #e2e8f0;">
    <div style="font-size:14px;color:#64748b;font-weight:bold;">365 EJENDOMME</div>
  </div>

  <!-- Hero -->
  <div style="padding:32px 24px 16px;text-align:center;">
    <p style="margin:0;color:#64748b;font-size:14px;">Hej ${escapeHtml(firstName)},</p>
    <p style="margin:8px 0 0;color:#475569;font-size:15px;line-height:1.5;">
      Tak fordi du brugte vores boligberegner. Her er dit foreløbige tilbud baseret på
      <strong>${estimate.sampleSize} sammenlignelige tinglyste handler</strong>${estimate.sameEfCount > 0 ? `, heraf <strong>${estimate.sameEfCount} i din ejerforening</strong>` : ''}:
    </p>
  </div>

  <!-- Price hero -->
  <div style="margin:0 24px 24px;padding:32px 20px;background:#0f172a;border-radius:12px;text-align:center;">
    <div style="color:#94a3b8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Vi byder</div>
    <div style="color:#ffffff;font-size:48px;font-weight:bold;margin:8px 0;letter-spacing:-1px;">${offer} kr</div>
    <div style="color:#cbd5e1;font-size:13px;">${escapeHtml(state.fullAddress)}</div>
    <div style="color:#94a3b8;font-size:12px;margin-top:8px;font-style:italic;">Bindende tilbud gives efter gratis besigtigelse</div>
  </div>

  <!-- Hvad du sparer -->
  <div style="margin:0 24px 24px;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
    <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">
      Hvad du sparer ved at sælge til os
    </h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;vertical-align:top;width:24px;"><span style="color:#0f172a;font-size:16px;font-weight:bold;">✓</span></td><td style="padding:8px 0;font-size:13px;"><strong>Mæglersalær</strong> <span style="color:#0f172a;float:right;font-weight:600;">${broker} kr</span><br><span style="color:#94a3b8;font-size:11px;">Vi tager intet salær. Du beholder ~70.000 kr.</span></td></tr>
      <tr><td style="padding:8px 0;vertical-align:top;"><span style="color:#0f172a;font-size:16px;font-weight:bold;">✓</span></td><td style="padding:8px 0;font-size:13px;"><strong>Markedsafslag</strong> <span style="color:#0f172a;float:right;font-weight:600;">${discount} kr</span><br><span style="color:#94a3b8;font-size:11px;">Slutprisen via mægler er typisk 6% under listeprisen.</span></td></tr>
      <tr><td style="padding:8px 0;vertical-align:top;"><span style="color:#0f172a;font-size:16px;font-weight:bold;">✓</span></td><td style="padding:8px 0;font-size:13px;"><strong>Drift i salgsperioden</strong> <span style="color:#0f172a;float:right;font-weight:600;">${ownership} kr</span><br><span style="color:#94a3b8;font-size:11px;">Du betaler ikke ejerudgifter mens boligen står til salg (3 mdr).</span></td></tr>
    </table>
    <div style="margin:12px 0 0;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-size:13px;color:#0f172a;font-weight:600;">Vores tilbud svarer til at sælge for</td><td style="text-align:right;font-size:16px;color:#0f172a;font-weight:bold;">${fmt(estimate.netForkortet.finalOffer + estimate.netForkortet.minusBrokerSavings + estimate.netForkortet.minusMarketDiscount + estimate.netForkortet.minusOwnershipCosts)} kr</td></tr>
      </table>
      <p style="margin:4px 0 0;font-size:11px;color:#475569;">
        …hvis du var gået via mægler. Vores ${offer} kr kontant plus de tre poster du sparer ovenfor.
      </p>
    </div>
    <p style="margin:12px 0 0;padding-top:12px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;">
      Vi betaler kontant. Ingen ventetid, mæglersalær eller bank-forbehold.
    </p>
  </div>

  ${compsHtml ? `
  <!-- Comparables -->
  <div style="margin:0 24px 24px;">
    <div style="font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
      Sammenlignelige handler vi brugte
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${compsHtml}
    </table>
    <div style="font-size:11px;color:#94a3b8;margin-top:8px;font-style:italic;">
      ${estimate.sampleSize} handler total · vi vægter samme ejerforening højest · data fra Vurderingsstyrelsen
    </div>
  </div>
  ` : ''}

  <!-- Next steps -->
  <div style="margin:0 24px 24px;padding:20px;background:#0f172a;border-radius:8px;color:white;">
    <div style="font-size:14px;font-weight:bold;margin-bottom:6px;">Næste skridt</div>
    <p style="margin:0 0 12px;font-size:13px;color:#cbd5e1;line-height:1.5;">
      Jeg ringer dig op indenfor 24 timer på <strong style="color:white;">${escapeHtml(state.phone)}</strong> for at aftale en gratis, uforpligtende besigtigelse. Efter besigtigelsen giver jeg et endeligt bindende tilbud.
    </p>
    <p style="margin:0;font-size:13px;color:#cbd5e1;">
      Ring direkte: <a href="tel:+4561789071" style="color:#ffffff;text-decoration:none;font-weight:600;">+45 61 78 90 71</a><br>
      Email: <a href="mailto:administration@365ejendom.dk" style="color:#ffffff;text-decoration:none;font-weight:600;">administration@365ejendom.dk</a>
    </p>
  </div>

  <!-- Trust signals -->
  <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
      Hvad du får når du sælger til os
    </div>
    <div style="font-size:12px;color:#475569;line-height:1.6;">
      Kontant betaling, ingen bank-forbehold<br>
      Vi har købt 87+ ejerlejligheder siden 2024<br>
      Du sparer typisk 70.000 kr i mæglersalær<br>
      Du vælger selv overtagelsesdato (14 dage til 6 mdr — som det passer dig)
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
      Bedste hilsner,<br>
      <strong style="color:#475569;">Jacob Lisby</strong> · 365 Ejendomme
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#cbd5e1;">
      Du modtog denne email fordi du brugte vores boligberegner. Vi gemmer ikke dine data uden samtykke. Skriv til
      <a href="mailto:administration@365ejendom.dk" style="color:#94a3b8;">administration@365ejendom.dk</a>
      hvis du vil have dem slettet.
    </p>
  </div>

</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function labelTimeframe(v: NonNullable<FunnelState['sellTimeframe']>): string {
  return {
    under1: 'Under 1 mdr',
    '1to3': '1-3 mdr',
    '3to6': '3-6 mdr',
    '6plus': '6+ mdr',
    unsure: 'Ved ikke endnu',
  }[v];
}
function labelReason(v: NonNullable<FunnelState['sellReason']>): string {
  return {
    flytter: 'Flytter',
    arv: 'Arv / dødsbo',
    skilsmisse: 'Skilsmisse',
    okonomi: 'Økonomi',
    investering: 'Investering',
    andet: 'Andet',
  }[v];
}
function labelAfterSale(v: NonNullable<FunnelState['afterSale']>): string {
  return {
    flytter_ud: 'Flytter ud helt',
    lejer_andet: 'Vil leje noget andet',
    blive_boende_lejer: 'Vil blive boende som lejer (sale-leaseback)',
    ved_ikke: 'Ved ikke endnu',
  }[v];
}
function labelYesNo(v: NonNullable<FunnelState['isOver65']>): string {
  return { ja: 'Ja', nej: 'Nej', usikker: 'Vil ikke svare / usikker' }[v];
}
