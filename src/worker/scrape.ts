/**
 * Scrape-worker — kører nightly via /api/cron/scrape.
 *
 * Flow:
 *  1. Insert ny `scrape_jobs` row (status=running)
 *  2. For hvert konfigureret postnr: fetch Boligsiden listing-URLs
 *  3. For hver URL: HTTP fetch listing-side, parse broker + basis-data
 *  4. UPSERT til on_market_candidates (sætter last_seen_at = now())
 *  5. Mark-sold: rows der var active men ikke set denne run + first_seen_at > 7d siden
 *  6. Update job-row med counts (success/failed)
 *
 * PDF-fetch + parse + afkast-recompute er separate workers (kommer i v2).
 */

import { eq, and, lt, sql, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates, scrapeJobs } from '@/lib/db/schema';
import type { ScrapeJob } from '@/lib/db/schema';
import { recomputeAllOnMarketAfkast } from '@/lib/services/recompute-on-market';

export const POSTAL_CODES = ['4700', '2630', '4000', '4100', '4400'];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

interface ListingDetail {
  slug: string;
  url: string;
  address: string;
  postalCode: string;
  city: string;
  kvm: number;
  rooms: number | null;
  yearBuilt: number | null;
  listPrice: number;
  monthlyExpense: number | null;
  description: string | null;
  primaryImage: string | null;
  images: string[];
  m2Pris: number | null;
  broker: string;
  caseUrl: string | null;
  daysOnMarket?: number | null;
  lat?: number | null;
  lon?: number | null;
  latestValuation?: number | null;
}

function classifyBrokerFromUrl(url: string | null): string {
  if (!url) return 'unknown';
  const u = url.toLowerCase();
  if (u.includes('edc.dk')) return 'edc';
  if (u.includes('nybolig.dk')) return 'nybolig';
  if (u.includes('home.dk')) return 'home';
  if (u.includes('realmaegler') || u.includes('realequity')) return 'realmaeglerne';
  if (u.includes('danbolig.dk')) return 'danbolig';
  if (u.includes('estate.dk')) return 'estate';
  if (u.includes('lokalbolig')) return 'lokalbolig';
  if (u.includes('boligone')) return 'boligone';
  if (u.includes('boligmaegler')) return 'boligmaegler';
  if (u.includes('brikk')) return 'brikk';
  if (u.includes('robinhus')) return 'robinhus';
  if (u.includes('gunde')) return 'gunde';
  if (u.includes('minkundeklub')) return 'minkundeklub';
  if (u.includes('paulvendelbo')) return 'paulvendelbo';
  if (u.includes('adamschnack')) return 'adamschnack';
  if (u.includes('jesperbendtsen')) return 'jesperbendtsen';
  if (u.includes('kf-bolig')) return 'kfbolig';
  if (u.includes('bedreboligsalg') || u.includes('bedre-boligsalg')) return 'bedreboligsalg';
  return 'other';
}

const SLUG_BROKER_MAP: Array<[RegExp, string]> = [
  [/danbolig/i, 'danbolig'],
  [/edc-/i, 'edc'],
  [/nybolig/i, 'nybolig'],
  [/^home-|-home-/i, 'home'],
  [/realmaeglerne/i, 'realmaeglerne'],
  [/lokalbolig/i, 'lokalbolig'],
  [/^estate-/i, 'estate'],
  [/boligone/i, 'boligone'],
  [/boligmaegler/i, 'boligmaegler'],
  [/bedre-boligsalg|bedreboligsalg/i, 'bedreboligsalg'],
  [/^gunde/i, 'gunde'],
  [/minkundeklub/i, 'minkundeklub'],
  [/paulvendelbo/i, 'paulvendelbo'],
  [/adamschnack/i, 'adamschnack'],
  [/^brikk-/i, 'brikk'],
  [/jesperbendtsen/i, 'jesperbendtsen'],
  [/kf-bolig|kfbolig/i, 'kfbolig'],
  [/robinhus/i, 'robinhus'],
];

interface ImageSource { url?: string; size?: { width?: number; height?: number } }
interface BoligsidenImage { imageSources?: ImageSource[] }

interface BoligsidenCase {
  caseID?: string;
  caseUrl?: string;
  defaultImage?: BoligsidenImage;
  descriptionBody?: string;
  descriptionTitle?: string;
  housingArea?: number;
  numberOfRooms?: number;
  priceCash?: number;
  monthlyExpense?: number;
  perAreaPrice?: number;
  yearBuilt?: number;
  daysOnMarket?: number;
  realtor?: { name?: string };
  images?: BoligsidenImage[];
  slugAddress?: string;
  slug?: string;
  address?: {
    cityName?: string;
    door?: string;
    floor?: string;
    houseNumber?: string;
    latestValuation?: number;
    livingArea?: number;
    road?: { name?: string };
    roadName?: string;
    coordinates?: { lat?: number; lon?: number };
    zipCode?: number;
    buildings?: Array<{ yearBuilt?: number; numberOfRooms?: number }>;
  };
}

function pickBestImage(img?: BoligsidenImage): string | null {
  const sources = img?.imageSources || [];
  if (sources.length === 0) return null;
  // Pick largest by area
  let best = sources[0];
  let bestArea = (best.size?.width || 0) * (best.size?.height || 0);
  for (const s of sources) {
    const area = (s.size?.width || 0) * (s.size?.height || 0);
    if (area > bestArea) { best = s; bestArea = area; }
  }
  return best.url || null;
}

async function fetchBoligsidenCondos(postnr: string): Promise<ListingDetail[]> {
  const all: ListingDetail[] = [];
  for (let page = 1; page <= 10; page++) {
    const params = new URLSearchParams({
      zipCodes: postnr,
      addressTypes: 'condo',
      per_page: '50',
      page: String(page),
    });
    const apiUrl = 'https://api.boligsiden.dk/search/cases?' + params.toString();
    const r = await fetch(apiUrl, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!r.ok) break;
    const data = await r.json() as { cases?: BoligsidenCase[]; totalHits?: number };
    const cases = data.cases || [];
    if (cases.length === 0) break;
    for (const c of cases) {
      const detail = parseBoligsidenCase(c);
      if (detail) all.push(detail);
    }
    if (cases.length < 50) break;
  }
  return all;
}

function parseBoligsidenCase(c: BoligsidenCase): ListingDetail | null {
  const slugAddress = c.slugAddress;
  if (!slugAddress) return null;
  const addr = c.address || {};
  const buildings = addr.buildings || [];
  const building = buildings[0] || {};
  const roadName = addr.road?.name || addr.roadName || '';
  const houseNumber = addr.houseNumber || '';
  const floor = addr.floor;
  const door = addr.door;
  let address = `${roadName} ${houseNumber}`.trim();
  if (floor) address += `, ${floor}.`;
  if (door) address += ` ${door}`;
  address = address.trim();

  const kvm = c.housingArea || addr.livingArea || 0;
  const listPrice = c.priceCash || 0;
  if (!address || !kvm || !listPrice) return null;

  const broker = classifyBrokerFromUrl(c.caseUrl || null);
  const images = (c.images || []).map(pickBestImage).filter((u): u is string => !!u);
  const primaryImage = pickBestImage(c.defaultImage) || images[0] || null;

  return {
    slug: slugAddress,
    url: `https://www.boligsiden.dk/adresse/${slugAddress}`,
    address,
    postalCode: String(addr.zipCode || ''),
    city: addr.cityName || '',
    kvm: Math.round(kvm),
    rooms: c.numberOfRooms ?? building.numberOfRooms ?? null,
    yearBuilt: building.yearBuilt ?? null,
    listPrice: Math.round(listPrice),
    monthlyExpense: c.monthlyExpense || null,
    description: c.descriptionBody || null,
    primaryImage,
    images,
    m2Pris: c.perAreaPrice || (kvm > 0 ? Math.round(listPrice / kvm) : null),
    broker,
    caseUrl: c.caseUrl || null,
    daysOnMarket: c.daysOnMarket ?? null,
    lat: addr.coordinates?.lat ?? null,
    lon: addr.coordinates?.lon ?? null,
    latestValuation: addr.latestValuation ?? null,
  };
}


export interface ScrapeRunResult {
  jobId: string;
  scraped: number;
  newListings: number;
  updated: number;
  markedSold: number;
  durationSeconds: number;
  recomputeUpdated: number;
  recomputeSkipped: number;
}

export async function runScrapeJob(opts: {
  postnrCodes?: string[];
  runKind?: 'cron' | 'manual';
} = {}): Promise<ScrapeRunResult> {
  const codes = opts.postnrCodes ?? POSTAL_CODES;
  const runKind = opts.runKind ?? 'cron';
  const start = Date.now();

  // 1. Insert running job
  const [job] = await db.insert(scrapeJobs).values({
    runKind,
    postnrCodes: codes,
    status: 'running',
  }).returning() as [ScrapeJob];

  let scraped = 0, newListings = 0, updated = 0, markedSold = 0;
  const errors: string[] = [];
  const seenSourceIds: string[] = [];

  try {
    for (const postnr of codes) {
      const details = await fetchBoligsidenCondos(postnr);
      for (const detail of details) {
        scraped++;
        seenSourceIds.push(detail.slug);

        // UPSERT via Drizzle builder API
        try {
          const inserted = await db
            .insert(onMarketCandidates)
            .values({
              source: 'boligsiden',
              sourceId: detail.slug,
              sourceUrl: detail.url,
              address: detail.address,
              postalCode: detail.postalCode,
              city: detail.city,
              kvm: detail.kvm,
              rooms: detail.rooms != null ? String(detail.rooms) : null,
              yearBuilt: detail.yearBuilt,
              listPrice: detail.listPrice,
              monthlyExpense: detail.monthlyExpense,
              description: detail.description,
              primaryImage: detail.primaryImage,
              images: detail.images,
              m2Pris: detail.m2Pris,
              brokerKind: detail.broker,
              caseUrl: detail.caseUrl,
              lastSeenAt: new Date(),
              firstSeenAt: new Date(),
              status: 'active',
            })
            .onConflictDoUpdate({
              target: [onMarketCandidates.source, onMarketCandidates.sourceId],
              set: {
                address: detail.address,
                listPrice: detail.listPrice,
                yearBuilt: detail.yearBuilt ?? undefined,
                monthlyExpense: detail.monthlyExpense ?? undefined,
                description: detail.description ?? undefined,
                primaryImage: detail.primaryImage ?? undefined,
                m2Pris: detail.m2Pris ?? undefined,
                brokerKind: detail.broker,
                caseUrl: detail.caseUrl,
                lastSeenAt: new Date(),
                soldAt: null,
                updatedAt: new Date(),
              },
            })
            .returning({ id: onMarketCandidates.id, scrapedAt: onMarketCandidates.scrapedAt });
          const row = inserted[0];
          // Distinguish insert vs update by checking if scraped_at == createdAt (=now() default = new row)
          // Simpler: track first_seen via SELECT
          if (row) {
            // Heuristic: if scrapedAt is within last 5 sec, this was a new INSERT (default now())
            const isNew = Date.now() - new Date(row.scrapedAt).getTime() < 5000;
            if (isNew) newListings++;
            else updated++;
          }
        } catch (insErr) {
          const m = insErr instanceof Error ? insErr.message : String(insErr);
          errors.push(`${detail.slug}: ${m.slice(0, 200)}`);
        }
      }
    }

    // Mark-sold: any active row for these postnr that wasn't seen in this run AND is older than 24h
    if (seenSourceIds.length > 0) {
      // Use Drizzle's notInArray operator + raw arrays for ANY/ALL postgres semantics
      const soldRows = await db
        .update(onMarketCandidates)
        .set({ status: 'sold', soldAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(onMarketCandidates.source, 'boligsiden'),
            eq(onMarketCandidates.status, 'active'),
            inArray(onMarketCandidates.postalCode, codes),
            notInArray(onMarketCandidates.sourceId, seenSourceIds),
            lt(onMarketCandidates.firstSeenAt, sql`now() - interval '24 hours'`),
          ),
        )
        .returning({ id: onMarketCandidates.id });
      markedSold = soldRows.length;
    }

    // 4. Recompute afkast for all on-market candidates med ny scrape-data
    // Saa nye listings far afkast straks + eksisterende fanger rate-aendringer.
    // Fejl her crasher ikke scrape-jobbet — vi har stadig nyttige scrape-resultater.
    let recomputeUpdated = 0;
    let recomputeSkipped = 0;
    try {
      const recompute = await recomputeAllOnMarketAfkast();
      recomputeUpdated = recompute.updated;
      recomputeSkipped = recompute.skipped;
    } catch (recomputeErr) {
      const m = recomputeErr instanceof Error ? recomputeErr.message : String(recomputeErr);
      errors.push(`recompute: ${m.slice(0, 200)}`);
    }

    // 5. Mark job success
    const durationSeconds = Math.round((Date.now() - start) / 1000);
    await db.update(scrapeJobs)
      .set({
        finishedAt: new Date(),
        status: 'success',
        listingsScraped: scraped,
        listingsNew: newListings,
        listingsUpdated: updated,
        listingsMarkedSold: markedSold,
        log: errors.length ? errors.slice(0, 50).join('\n') : null,
      })
      .where(eq(scrapeJobs.id, job.id));

    return {
      jobId: job.id,
      scraped,
      newListings,
      updated,
      markedSold,
      durationSeconds,
      recomputeUpdated,
      recomputeSkipped,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.update(scrapeJobs)
      .set({
        finishedAt: new Date(),
        status: 'failed',
        listingsScraped: scraped,
        listingsNew: newListings,
        listingsUpdated: updated,
        listingsMarkedSold: markedSold,
        error: msg,
      })
      .where(eq(scrapeJobs.id, job.id));
    throw err;
  }
}
