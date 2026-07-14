const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const API_TIMEOUT_MS = 15_000;
const REQUEST_DELAY_MS = 400;

const searchCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'EnderassAuctionSeed/1.0 (https://enderass.et; dev-seed)',
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search Wikimedia Commons for images matching a specific asset query.
 * Returns stable 1280px thumb URLs suitable for download.
 */
export async function searchCommonsImages(query, limit = 3) {
  const cacheKey = `${query}::${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(Math.max(limit, 1), 10)),
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1280',
  });

  const payload = await fetchJson(`${COMMONS_API}?${params}`);
  const pages = payload?.query?.pages ?? {};
  const urls = [];

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    const mime = info?.mime ?? '';
    if (!info?.thumburl && !info?.url) {
      continue;
    }
    if (mime && !mime.startsWith('image/')) {
      continue;
    }
    urls.push(info.thumburl ?? info.url);
  }

  searchCache.set(cacheKey, urls);
  return urls;
}

/**
 * Resolve model-specific image URLs using each catalog imageQuery separately
 * so every photo targets a distinct view of the exact asset type.
 */
export async function resolveAssetImageUrls(assetSeed, logger = console) {
  const queries = assetSeed.imageQueries ?? [];
  const targetCount = Math.max(
    5,
    Math.min(10, assetSeed.imageCount ?? (queries.length || 7)),
  );

  if (queries.length === 0) {
    return [];
  }

  const urls = [];
  const seen = new Set();

  for (const query of queries) {
    if (urls.length >= targetCount) {
      break;
    }

    try {
      const results = await searchCommonsImages(query, 2);
      for (const url of results) {
        if (urls.length >= targetCount) {
          break;
        }
        if (!seen.has(url)) {
          seen.add(url);
          urls.push(url);
        }
      }
      logger.log(`[seed] commons "${query}": ${results.length} candidate(s)`);
    } catch (error) {
      logger.log(`[seed] commons search failed for "${query}": ${error.message}`);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  if (urls.length < targetCount) {
    const fallbackQuery = simplifyAssetTitle(assetSeed.title);
    try {
      const results = await searchCommonsImages(fallbackQuery, targetCount - urls.length + 2);
      for (const url of results) {
        if (urls.length >= targetCount) {
          break;
        }
        if (!seen.has(url)) {
          seen.add(url);
          urls.push(url);
        }
      }
    } catch (error) {
      logger.log(`[seed] commons fallback failed for "${fallbackQuery}": ${error.message}`);
    }
  }

  return urls;
}

function simplifyAssetTitle(title) {
  return String(title)
    .replace(/^\d{4}\s+/, '')
    .replace(/\s+\([^)]*\)\s*$/, '')
    .replace(/\s+\d[\d,.]*\s*(m²|m3|ha|kVA|km|hp|tons?)\b.*$/i, '')
    .trim();
}

export function clearCommonsSearchCache() {
  searchCache.clear();
}
