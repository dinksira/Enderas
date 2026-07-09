import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { env } from '../../../src/config/env.config.js';
import { buildMinimalPdf } from './minimal-pdf.mjs';

/** Only PDF seed artifacts are written to disk; images use remote Unsplash URLs. */
const SEED_UPLOAD_DIRS = [
  'assets/ownership',
  'assets/documents',
  'auctions/documents',
  'evaluations/reports',
];

const IMAGE_COUNT_MIN = 5;
const IMAGE_COUNT_MAX = 10;
const UNSPLASH_API = 'https://api.unsplash.com';
const API_TIMEOUT_MS = 12_000;

const CATEGORY_QUERIES = Object.freeze({
  vehicles: 'luxury car automobile',
  machinery: 'construction excavator industrial equipment',
  buildings: 'modern architecture building interior',
  land: 'farmland landscape aerial field',
});

const CURATED_UNSPLASH_PHOTOS = Object.freeze({
  vehicles: [
    'photo-1492144534655-ae79c964c9d7',
    'photo-1503376780353-7e6692767b70',
    'photo-1549317661-bd32c8ce0db2',
    'photo-1552519507-da3b142c6e3d',
    'photo-1583121274602-3e2820c50d8d',
    'photo-1618843479313-40f8afb4b4d8',
    'photo-1619767886558-efdc259cde1a',
    'photo-1621007947412-aaf19d4a3dcf',
  ],
  machinery: [
    'photo-1581091226825-a6a2a5aee158',
    'photo-1504307651254-35680f356dfd',
    'photo-1589939705384-5185137a7f0f',
    'photo-1590644365607-65151d5f72be',
    'photo-1621905252507-b35492cc74b4',
    'photo-1565008576549-5756a22d8705',
    'photo-1541888946425-d81bb19240f5',
    'photo-1503387762-592deb58ef4e',
  ],
  buildings: [
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600585154340-be6161a56a0c',
    'photo-1600607687939-ce8a6c25118c',
    'photo-1600566753190-17f0baa2a6c3',
    'photo-1600047509807-ba8f88d28fc7',
    'photo-1560448204-e02f11c57d0b',
    'photo-1613490493576-7fde63acd811',
    'photo-1512917774080-9991f1c4c750',
  ],
  land: [
    'photo-1500382017468-9049fed747f7',
    'photo-1625246333195-78d9c38ad449',
    'photo-1574944985070-8f3ebc6b79c2',
    'photo-1464226184884-fa280b87c399',
    'photo-1500595046743-cd271d1d9eec',
    'photo-1416879595882-3373a0480b5b',
    'photo-1592982537447-6a4d4f8a0a0a',
    'photo-1625246333195-78d9c38ad449',
  ],
});

const unsplashUrlCache = new Map();

function uploadDir() {
  return path.resolve(process.cwd(), env.storage.uploadDir);
}

function toApiUploadUrl(relativePath) {
  return `/api/uploads/${relativePath.replace(/\\/g, '/')}`;
}

function ensureDirectory(relativeDir) {
  const absoluteDir = path.join(uploadDir(), relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }
}

function writePdf(relativePath, title, logger = console) {
  const absolutePath = path.join(uploadDir(), relativePath);
  ensureDirectory(path.dirname(relativePath));
  const pdf = buildMinimalPdf(title);
  fs.writeFileSync(absolutePath, pdf);
  logger.log(`[seed] wrote upload file: ${relativePath} (${pdf.length} bytes)`);
  return toApiUploadUrl(relativePath);
}

function removeDirectoryContents(relativeDir) {
  const absoluteDir = path.join(uploadDir(), relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return;
  }

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const entryPath = path.join(absoluteDir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

export function cleanSeedUploadDirs(logger = console) {
  for (const relativeDir of SEED_UPLOAD_DIRS) {
    removeDirectoryContents(relativeDir);
    logger.log(`[seed] cleaned upload dir: ${relativeDir}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getUnsplashAccessKey() {
  return process.env.UNSPLASH_ACCESS_KEY || env.unsplash?.accessKey || '';
}

function simplifySearchQuery(title) {
  return String(title)
    .replace(/^\d{4}\s+/, '')
    .replace(/\s+\([^)]*\)\s*$/, '')
    .replace(/\s+\d[\d,.]*\s*(m²|m3|ha|kVA|km|hp|tons?)\b.*$/i, '')
    .trim();
}

function buildSearchQuery(assetSeed, category) {
  const simplified = simplifySearchQuery(assetSeed.title);
  const extra = assetSeed.imageQueries?.[0];
  return extra || simplified || CATEGORY_QUERIES[category] || CATEGORY_QUERIES.machinery;
}

function unsplashCdnUrl(photoIdOrUrl) {
  if (photoIdOrUrl.startsWith('http')) {
    return photoIdOrUrl.includes('?')
      ? photoIdOrUrl
      : `${photoIdOrUrl}?auto=format&fit=crop&w=1200&q=80`;
  }

  const slug = photoIdOrUrl.startsWith('photo-') ? photoIdOrUrl : `photo-${photoIdOrUrl}`;
  return `https://images.unsplash.com/${slug}?auto=format&fit=crop&w=1200&q=80`;
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function curatedUnsplashUrls(category, count, seedKey) {
  const pool = CURATED_UNSPLASH_PHOTOS[category] ?? CURATED_UNSPLASH_PHOTOS.machinery;
  const offset = Math.abs(hashString(seedKey)) % pool.length;
  const urls = [];

  for (let index = 0; index < count; index += 1) {
    urls.push(unsplashCdnUrl(pool[(offset + index) % pool.length]));
  }

  return urls;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'EnderassSeedBot/1.0',
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

async function fetchUnsplashPhotoUrls(query, count, accessKey) {
  const params = new URLSearchParams({
    query,
    count: String(Math.min(Math.max(count, 1), 30)),
    orientation: 'landscape',
    content_filter: 'high',
  });

  const payload = await fetchJson(`${UNSPLASH_API}/photos/random?${params}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  });

  const results = Array.isArray(payload) ? payload : [payload];
  return results
    .map((photo) => unsplashCdnUrl(photo.urls?.regular ?? photo.urls?.full ?? ''))
    .filter(Boolean);
}

async function resolveUnsplashImageUrls(query, category, count, seedKey, logger = console) {
  const cacheKey = `${category}::${query}`;
  if (unsplashUrlCache.has(cacheKey)) {
    return pickUrlCount(unsplashUrlCache.get(cacheKey), count, seedKey);
  }

  const accessKey = getUnsplashAccessKey();
  let pool = [];

  if (accessKey) {
    try {
      pool = await fetchUnsplashPhotoUrls(query, Math.max(count, 8), accessKey);
      logger.log(`[seed] unsplash urls for "${query}": ${pool.length}`);
      await sleep(200);
    } catch (error) {
      logger.log(`[seed] unsplash API failed for "${query}": ${error.message}`);
    }
  }

  if (pool.length === 0) {
    pool = curatedUnsplashUrls(category, Math.max(count, 8), seedKey);
    logger.log(`[seed] unsplash curated urls for "${query}": ${pool.length}`);
  }

  unsplashUrlCache.set(cacheKey, pool);
  return pickUrlCount(pool, count, seedKey);
}

function pickUrlCount(pool, count, seedKey) {
  if (pool.length === 0) {
    return [];
  }

  const offset = Math.abs(hashString(seedKey)) % pool.length;
  const urls = [];
  for (let index = 0; index < count; index += 1) {
    urls.push(pool[(offset + index) % pool.length]);
  }
  return urls;
}

function imageCountForAsset(assetSeed) {
  if (Array.isArray(assetSeed.imageQueries) && assetSeed.imageQueries.length > 0) {
    const preferred = assetSeed.imageCount ?? 7;
    return Math.max(IMAGE_COUNT_MIN, Math.min(IMAGE_COUNT_MAX, preferred));
  }
  return 0;
}

function buildAdditionalDocs(assetSeed, logger = console) {
  const docs = assetSeed.additionalDocs ?? [];
  return docs.map((doc) => {
    const fileName = `${crypto.randomUUID()}.pdf`;
    const relativePath = `assets/documents/${fileName}`;
    const url = writePdf(relativePath, doc.title, logger);
    return {
      name: doc.name,
      url,
      size: fs.statSync(path.join(uploadDir(), relativePath)).size,
    };
  });
}

function buildEvaluationReport(assetSeed, logger = console) {
  const fileName = `${crypto.randomUUID()}.pdf`;
  const relativePath = `evaluations/reports/${fileName}`;
  return writePdf(relativePath, `Evaluation Report - ${assetSeed.title}`, logger);
}

function buildOwnershipDoc(assetSeed, logger = console) {
  const fileName = `${crypto.randomUUID()}.pdf`;
  const relativePath = `assets/ownership/${fileName}`;
  const title = assetSeed.ownershipDocTitle ?? `Ownership Document - ${assetSeed.title}`;
  return writePdf(relativePath, title, logger);
}

function buildAuctionDocuments(auctionSeed, logger = console) {
  const docs = auctionSeed.auctionDocuments ?? [
    { name: 'auction-catalog.pdf', title: `${auctionSeed.title} - Catalog` },
    { name: 'terms-and-conditions.pdf', title: `${auctionSeed.title} - Terms` },
    { name: 'inspection-schedule.pdf', title: `${auctionSeed.title} - Inspection Schedule` },
  ];

  return docs.map((doc) => {
    const fileName = `${crypto.randomUUID()}.pdf`;
    const relativePath = `auctions/documents/${fileName}`;
    const url = writePdf(relativePath, doc.title, logger);
    return {
      name: doc.name,
      url,
      size: fs.statSync(path.join(uploadDir(), relativePath)).size,
    };
  });
}

export async function resolveSeedMedia(auctionSeeds, logger = console) {
  unsplashUrlCache.clear();
  cleanSeedUploadDirs(logger);

  const resolvedAuctions = [];

  for (const auctionSeed of auctionSeeds) {
    const resolvedLotGroups = [];

    for (const lotGroup of auctionSeed.lotGroups) {
      const resolvedAssets = [];

      for (const assetSeed of lotGroup.assets) {
        const count = imageCountForAsset(assetSeed);
        const query = buildSearchQuery(assetSeed, auctionSeed.category);
        const imageUrls = await resolveUnsplashImageUrls(
          query,
          auctionSeed.category,
          count,
          assetSeed.assetId,
          logger,
        );

        const ownershipDocumentUrl = buildOwnershipDoc(assetSeed, logger);
        const additionalDocumentUrls = buildAdditionalDocs(assetSeed, logger);
        const evaluationReportUrl = buildEvaluationReport(assetSeed, logger);
        const evaluationPhotoUrls = imageUrls.slice(0, Math.min(4, imageUrls.length));

        resolvedAssets.push({
          ...assetSeed,
          imageUrls,
          ownershipDocumentUrl,
          additionalDocumentUrls,
          evaluationReportUrl,
          evaluationPhotoUrls,
        });
      }

      resolvedLotGroups.push({
        ...lotGroup,
        assets: resolvedAssets,
      });
    }

    const flatAssets = resolvedLotGroups.flatMap((group) => group.assets);
    const documentFiles = buildAuctionDocuments(auctionSeed, logger);
    const auctionCoverImages = flatAssets[0]?.imageUrls?.slice(0, 3) ?? [];

    resolvedAuctions.push({
      ...auctionSeed,
      lotGroups: resolvedLotGroups,
      documentFiles,
      auctionCoverImages,
      coverImage: auctionCoverImages[0] ?? flatAssets[0]?.imageUrls?.[0] ?? null,
    });
  }

  logger.log('[seed] resolved remote Unsplash image URLs (no image downloads)');
  return resolvedAuctions;
}
