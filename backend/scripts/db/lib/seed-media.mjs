import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { env } from '../../../src/config/env.config.js';
import { buildMinimalPdf } from './minimal-pdf.mjs';

const SEED_UPLOAD_DIRS = [
  'assets/images',
  'assets/photos',
  'assets/ownership',
  'assets/documents',
  'auctions/documents',
  'auctions/images',
  'evaluations/photos',
  'evaluations/reports',
];

const IMAGE_COUNT_MIN = 5;
const IMAGE_COUNT_MAX = 10;
const DOWNLOAD_TIMEOUT_MS = 15_000;
const DOWNLOAD_CONCURRENCY = 6;
const WIKIMEDIA_USER_AGENT = 'EnderassSeedBot/1.0 (local development seed)';

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function uploadDir() {
  return path.resolve(process.cwd(), env.storage.uploadDir);
}

function toApiUploadUrl(relativePath) {
  return `/api/uploads/${relativePath.replace(/\\/g, '/')}`;
}

function uploadRelativePath(storedUrl) {
  const marker = '/uploads/';
  const index = storedUrl.indexOf(marker);
  if (index === -1) {
    throw new Error(`Seed upload path is missing /uploads/ marker: ${storedUrl}`);
  }
  return storedUrl.slice(index + marker.length);
}

function ensureDirectory(relativeDir) {
  const absoluteDir = path.join(uploadDir(), relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }
  return absoluteDir;
}

function writeFileAtRelativePath(relativePath, buffer, logger = console) {
  const absolutePath = path.join(uploadDir(), relativePath);
  ensureDirectory(path.dirname(relativePath));
  fs.writeFileSync(absolutePath, buffer);
  logger.log(`[seed] wrote upload file: ${relativePath} (${buffer.length} bytes)`);
  return toApiUploadUrl(relativePath);
}

function writePdf(relativePath, title, logger = console) {
  return writeFileAtRelativePath(relativePath, buildMinimalPdf(title), logger);
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

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': WIKIMEDIA_USER_AGENT,
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 1024) {
      throw new Error(`Response too small (${buffer.length} bytes) for ${url}`);
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchWikimediaImages(query, limit) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: String(Math.min(limit * 3, 30)),
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });

  const response = await fetchWithTimeout(
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
  );
  const payload = JSON.parse(response.toString('utf8'));
  const pages = Object.values(payload?.query?.pages ?? {});

  const images = [];
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl && !info?.url) {
      continue;
    }

    const mime = info.mime ?? '';
    if (!mime.startsWith('image/')) {
      continue;
    }

    images.push({
      url: info.thumburl ?? info.url,
      ext: mime === 'image/png' ? '.png' : '.jpg',
    });

    if (images.length >= limit) {
      break;
    }
  }

  return images;
}

async function downloadPicsumFallback(seed, index) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(`${seed}-${index}`)}/1200/800.jpg`;
  const buffer = await fetchWithTimeout(url);
  return { buffer, ext: '.jpg' };
}

async function downloadImageCandidates(queries, assetId, count, logger = console) {
  const seenUrls = new Set();
  const candidates = [];

  for (const query of queries) {
    if (candidates.length >= count) {
      break;
    }

    try {
      const results = await searchWikimediaImages(query, count - candidates.length);
      for (const result of results) {
        if (seenUrls.has(result.url)) {
          continue;
        }
        seenUrls.add(result.url);
        candidates.push(result);
        if (candidates.length >= count) {
          break;
        }
      }
    } catch (error) {
      logger.log(`[seed] wikimedia search failed for "${query}": ${error.message}`);
    }
  }

  const downloaded = await mapWithConcurrency(
    Array.from({ length: count }, (_, index) => index),
    DOWNLOAD_CONCURRENCY,
    async (index) => {
      const candidate = candidates[index];

      try {
        let buffer;
        let ext = candidate?.ext ?? '.jpg';

        if (candidate?.url) {
          buffer = await fetchWithTimeout(candidate.url);
        } else {
          const fallback = await downloadPicsumFallback(assetId, index);
          buffer = fallback.buffer;
          ext = fallback.ext;
        }

        const fileName = `${crypto.randomUUID()}${ext}`;
        return writeFileAtRelativePath(`assets/images/${fileName}`, buffer, logger);
      } catch (error) {
        logger.log(`[seed] image download failed for asset ${assetId} #${index + 1}: ${error.message}`);
        try {
          const fallback = await downloadPicsumFallback(assetId, index);
          const fallbackName = `${crypto.randomUUID()}${fallback.ext}`;
          return writeFileAtRelativePath(`assets/images/${fallbackName}`, fallback.buffer, logger);
        } catch (fallbackError) {
          logger.log(`[seed] fallback image failed for asset ${assetId}: ${fallbackError.message}`);
          return null;
        }
      }
    },
  );

  return downloaded.filter(Boolean);
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

function buildAuctionCoverImages(flatAssets, logger = console) {
  const coverCount = Math.min(3, flatAssets[0]?.resolvedImageUrls?.length ?? 0);
  const covers = [];

  for (let index = 0; index < coverCount; index += 1) {
    const sourceUrl = flatAssets[0].resolvedImageUrls[index];
    const relativeSource = uploadRelativePath(sourceUrl);
    const absoluteSource = path.join(uploadDir(), relativeSource);
    const fileName = `${crypto.randomUUID()}${path.extname(relativeSource) || '.jpg'}`;
    const relativeTarget = `auctions/images/${fileName}`;

    if (fs.existsSync(absoluteSource)) {
      const buffer = fs.readFileSync(absoluteSource);
      covers.push(writeFileAtRelativePath(relativeTarget, buffer, logger));
    }
  }

  return covers;
}

export async function resolveSeedMedia(auctionSeeds, logger = console) {
  cleanSeedUploadDirs(logger);

  const resolvedAuctions = [];

  for (const auctionSeed of auctionSeeds) {
    const resolvedLotGroups = [];

    for (const lotGroup of auctionSeed.lotGroups) {
      const resolvedAssets = [];

      for (const assetSeed of lotGroup.assets) {
        const count = imageCountForAsset(assetSeed);
        const imageUrls = await downloadImageCandidates(
          assetSeed.imageQueries ?? [assetSeed.title, auctionSeed.category],
          assetSeed.assetId,
          count,
          logger,
        );

        const ownershipDocumentUrl = buildOwnershipDoc(assetSeed, logger);
        const additionalDocumentUrls = buildAdditionalDocs(assetSeed, logger);
        const evaluationReportUrl = buildEvaluationReport(assetSeed, logger);
        const evaluationPhotoUrls = imageUrls.slice(0, Math.min(4, imageUrls.length));

        resolvedAssets.push({
          ...assetSeed,
          imageUrls,
          resolvedImageUrls: imageUrls,
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
    const auctionCoverImages = buildAuctionCoverImages(flatAssets, logger);

    resolvedAuctions.push({
      ...auctionSeed,
      lotGroups: resolvedLotGroups,
      documentFiles,
      auctionCoverImages,
      coverImage: auctionCoverImages[0] ?? flatAssets[0]?.imageUrls?.[0] ?? null,
    });
  }

  return resolvedAuctions;
}
