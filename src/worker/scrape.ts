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

import { eq, and, lt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { onMarketCandidates, scrapeJobs } from '@/lib/db/schema';
import type { ScrapeJob } from '@/lib/db/schema';

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

interface BoligsidenCase {
  caseID?: string;
  caseUrl?: string;
  defaultImage?: { url?: string; thumbnail?: string };
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
  images?: Array<{ url?: string; thumbnail?: string }>;
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
  const images = (c.images || []).map((i) => i.url || i.thumbnail).filter(Boolean) as string[];
  const primaryImage = c.defaultImage?.url || c.defaultImage?.thumbnail || images[0] || null;

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

        // UPSERT
        const result = await db.execute(sql`
          INSERT INTO on_market_candidates
            (source, source_id, source_url, address, postal_code, city, kvm, rooms, year_built, list_price,
             monthly_expense, description, primary_image, images, m2_pris, broker_kind, case_url,
             last_seen_at, first_seen_at, status)
          VALUES
            ('boligsiden', ${detail.slug}, ${detail.url}, ${detail.address}, ${detail.postalCode}, ${detail.city},
             ${detail.kvm}, ${detail.rooms}, ${detail.yearBuilt}, ${detail.listPrice},
             ${detail.monthlyExpense}, ${detail.description}, ${detail.primaryImage},
             ${JSON.stringify(detail.images)}::jsonb, ${detail.m2Pris}, ${detail.broker}, ${detail.caseUrl},
             now(), now(), 'active')
          ON CONFLICT (source, source_id) DO UPDATE SET
            address = EXCLUDED.address,
            list_price = EXCLUDED.list_price,
            year_built = COALESCE(on_market_candidates.year_built, EXCLUDED.year_built),
            monthly_expense = COALESCE(on_market_candidates.monthly_expense, EXCLUDED.monthly_expense),
            description = COALESCE(on_market_candidates.description, EXCLUDED.description),
            primary_image = COALESCE(on_market_candidates.primary_image, EXCLUDED.primary_image),
            images = CASE WHEN jsonb_array_length(on_market_candidates.images) = 0
                          THEN EXCLUDED.images ELSE on_market_candidates.images END,
            m2_pris = COALESCE(on_market_candidates.m2_pris, EXCLUDED.m2_pris),
            broker_kind = EXCLUDED.broker_kind,
            case_url = EXCLUDED.case_url,
            last_seen_at = now(),
            status = CASE WHEN on_market_candidates.status = 'sold' THEN 'active'
                          ELSE on_market_candidates.status END,
            sold_at = NULL,
            updated_at = now()
          RETURNING (xmax = 0) AS inserted
        `);
        const row = (result as unknown as { rows: Array<{ inserted: boolean }> }).rows?.[0];
        if (row?.inserted) newListings++;
        else updated++;
      }
    }

    // Mark-sold: any active row for these postnr that wasn't seen in this run AND is older than 24h
    if (seenSourceIds.length > 0) {
      const soldResult = await db.execute(sql`
        UPDATE on_market_candidates
        SET status = 'sold', sold_at = now(), updated_at = now()
        WHERE source = 'boligsiden'
          AND status = 'active'
          AND postal_code = ANY(${codes})
          AND source_id != ALL(${seenSourceIds})
          AND first_seen_at < now() - interval '24 hours'
        RETURNING id
      `);
      markedSold = (soldResult as unknown as { rows: Array<unknown> }).rows?.length ?? 0;
    }

    // 4. Mark job success
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

    return { jobId: job.id, scraped, newListings, updated, markedSold, durationSeconds };
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
