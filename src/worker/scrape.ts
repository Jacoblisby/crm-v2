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

interface ListingSummary {
  slug: string;
  url: string;
  caseId?: string;
}

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

async function fetchBoligsidenList(postnr: string): Promise<ListingSummary[]> {
  // Use Boligsiden's public API to list cases by zip code
  const all: ListingSummary[] = [];
  let page = 1;
  while (page <= 10) {
    const apiUrl = `https://api.boligsiden.dk/search/cases?zipCodes=${postnr}&addressTypes=condominium&per_page=50&page=${page}`;
    const r = await fetch(apiUrl, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!r.ok) break;
    const data = await r.json() as { cases?: Array<{ slug?: string; slugAddress?: string; caseID?: string }>; totalHits?: number };
    const cases = data.cases || [];
    if (cases.length === 0) break;
    for (const c of cases) {
      const slug = c.slugAddress || c.slug;
      if (!slug) continue;
      // Boligsiden URL slug uses just the address part, before the underscore
      const urlSlug = slug.split('_')[0];
      all.push({
        slug: urlSlug,
        url: `https://www.boligsiden.dk/adresse/${urlSlug}`,
        caseId: c.caseID,
      });
    }
    if (cases.length < 50) break;
    page++;
  }
  return all;
}

function classifyBroker(html: string): { broker: string; caseUrl: string | null } {
  const efm = html.match(/\/ejendomsmaegler\/([a-z0-9-]+)/i);
  let broker = 'unknown';
  if (efm) {
    const slug = efm[1].toLowerCase();
    for (const [pat, name] of SLUG_BROKER_MAP) {
      if (pat.test(slug)) {
        broker = name;
        break;
      }
    }
    if (broker === 'unknown') broker = 'unknown_efm';
  }
  // The actual broker case URL is hidden behind viderestilling/<uuid>.
  // We capture what we can find directly.
  const caseUrlMatch = html.match(/https?:\/\/(?:www\.)?(?:edc\.dk\/sag\/\?sagsnr=\d+|home\.dk\/sag\/\d+|nybolig\.dk\/services\/redirect\/case\/[^"'<>\s]+|realmaeglerne\.dk\/[^"'<>\s]+sagsnr=[^"'<>\s]+)/i);
  return { broker, caseUrl: caseUrlMatch?.[0] || null };
}

async function fetchListingDetail(url: string): Promise<ListingDetail | null> {
  try {
    const slug = url.split('/').pop() || '';
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return null;
    const html = await r.text();
    const { broker, caseUrl } = classifyBroker(html);

    // Extract structured data from JSON-LD
    const jsonLdMatch = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
    let address = '', postalCode = '', city = '', primaryImage: string | null = null;
    let kvm = 0, rooms: number | null = null, listPrice = 0;
    for (const block of jsonLdMatch) {
      const jsonStr = block.replace(/<script[^>]+>/, '').replace(/<\/script>/, '');
      try {
        const data = JSON.parse(jsonStr);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const t = item['@type'];
          if (t === 'Apartment' || t === 'SingleFamilyResidence' || t === 'House' || t === 'Residence') {
            const addr = item.Address || item.address;
            if (addr) {
              address = addr.streetAddress || address;
              postalCode = addr.postalCode || postalCode;
              city = addr.addressLocality || city;
            }
            if (item.floorSize?.value) kvm = Math.round(item.floorSize.value);
            else if (typeof item.floorSize === 'number') kvm = Math.round(item.floorSize);
            if (item.numberOfRooms) rooms = Number(item.numberOfRooms);
            if (item.image && !primaryImage) primaryImage = item.image;
          } else if (t === 'Product' && item.offers) {
            const price = item.offers.price || item.offers.priceSpecification?.price;
            if (price) listPrice = Math.round(price);
          }
        }
      } catch {
        // ignore
      }
    }

    // Extract description from meta or json-ld
    let description: string | null = null;
    const ldDesc = html.match(/"description":"((?:[^"\\]|\\.)+)"/);
    if (ldDesc) {
      description = ldDesc[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').slice(0, 5000);
    }

    // Fallback price from HTML
    if (!listPrice) {
      const priceMatch = html.match(/"priceCash":(\d+)/);
      if (priceMatch) listPrice = Number(priceMatch[1]);
    }

    if (!address || !kvm || !listPrice) return null;

    return {
      slug,
      url,
      address,
      postalCode,
      city,
      kvm,
      rooms,
      yearBuilt: null,
      listPrice,
      monthlyExpense: null,
      description,
      primaryImage,
      images: primaryImage ? [primaryImage] : [],
      m2Pris: kvm > 0 ? Math.round(listPrice / kvm) : null,
      broker,
      caseUrl,
    };
  } catch {
    return null;
  }
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
      const summaries = await fetchBoligsidenList(postnr);
      for (const sum of summaries) {
        scraped++;
        seenSourceIds.push(sum.slug);
        const detail = await fetchListingDetail(sum.url);
        if (!detail) continue;

        // UPSERT
        const result = await db.execute(sql`
          INSERT INTO on_market_candidates
            (source, source_id, source_url, address, postal_code, city, kvm, rooms, list_price,
             description, primary_image, images, m2_pris, broker_kind, case_url, last_seen_at, first_seen_at, status)
          VALUES
            ('boligsiden', ${detail.slug}, ${detail.url}, ${detail.address}, ${detail.postalCode}, ${detail.city},
             ${detail.kvm}, ${detail.rooms}, ${detail.listPrice}, ${detail.description}, ${detail.primaryImage},
             ${JSON.stringify(detail.images)}::jsonb, ${detail.m2Pris}, ${detail.broker}, ${detail.caseUrl},
             now(), now(), 'active')
          ON CONFLICT (source, source_id) DO UPDATE SET
            address = EXCLUDED.address,
            list_price = EXCLUDED.list_price,
            description = COALESCE(on_market_candidates.description, EXCLUDED.description),
            primary_image = COALESCE(on_market_candidates.primary_image, EXCLUDED.primary_image),
            images = CASE WHEN jsonb_array_length(on_market_candidates.images) = 0
                          THEN EXCLUDED.images ELSE on_market_candidates.images END,
            m2_pris = COALESCE(on_market_candidates.m2_pris, EXCLUDED.m2_pris),
            broker_kind = COALESCE(on_market_candidates.broker_kind, EXCLUDED.broker_kind),
            case_url = COALESCE(on_market_candidates.case_url, EXCLUDED.case_url),
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
