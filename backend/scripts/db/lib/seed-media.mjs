import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import {
  SEED_ASSETS_ROOT,
  assetSlug,
  auctionSlug,
  listSeedImages,
  seedAuctionDocPath,
  seedAssetDocPath,
  seedEvaluationDocPath,
  seedOwnershipDocPath,
} from './seed-assets-paths.mjs';

const SEED_UPLOAD_DIRS = [
  'assets/images',
  'assets/ownership',
  'assets/documents',
  'auctions/documents',
  'evaluations/reports',
];

const DEFAULT_UPLOAD_DIR = 'uploads';

function uploadDir() {
  return path.resolve(process.cwd(), process.env.STORAGE_UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR);
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

function copySeedFile(sourcePath, relativeDest, logger = console) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing seed asset file: ${sourcePath}`);
  }

  const absoluteDest = path.join(uploadDir(), relativeDest);
  ensureDirectory(path.dirname(relativeDest));
  fs.copyFileSync(sourcePath, absoluteDest);
  const size = fs.statSync(absoluteDest).size;
  logger.log(`[seed] copied ${path.relative(SEED_ASSETS_ROOT, sourcePath)} -> ${relativeDest} (${size} bytes)`);
  return toApiUploadUrl(relativeDest);
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

function assertSeedAssetsPresent(logger = console) {
  if (!fs.existsSync(SEED_ASSETS_ROOT)) {
    throw new Error(
      `Seed assets folder not found at ${SEED_ASSETS_ROOT}. Run: npm run seed-assets:build`,
    );
  }

  logger.log(`[seed] using committed seed assets from ${SEED_ASSETS_ROOT}`);
}

function copyAssetImages(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);
  const sources = listSeedImages(category, slug);

  if (sources.length === 0) {
    throw new Error(
      `No seed images for "${assetSeed.title}" (slug: ${slug}). Run: npm run seed-assets:build`,
    );
  }

  const imageDir = `assets/images/${assetSeed.assetId}`;
  const urls = [];

  sources.forEach((sourcePath, index) => {
    const fileName = `${String(index + 1).padStart(2, '0')}.webp`;
    const relativeDest = `${imageDir}/${fileName}`;
    urls.push(copySeedFile(sourcePath, relativeDest, logger));
  });

  return urls;
}

function copyOwnershipDoc(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);
  const sourcePath = seedOwnershipDocPath(category, slug);
  const fileName = `${crypto.randomUUID()}.pdf`;
  return copySeedFile(sourcePath, `assets/ownership/${fileName}`, logger);
}

function copyAdditionalDocs(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);
  const docs = assetSeed.additionalDocs ?? [];

  return docs.map((doc) => {
    const docKey = doc.name.replace(/\.pdf$/i, '');
    const sourcePath = seedAssetDocPath(category, slug, docKey);
    const fileName = `${crypto.randomUUID()}.pdf`;
    const url = copySeedFile(sourcePath, `assets/documents/${fileName}`, logger);
    const absolutePath = path.join(uploadDir(), `assets/documents/${fileName}`);
    return {
      name: doc.name,
      url,
      size: fs.statSync(absolutePath).size,
    };
  });
}

function copyEvaluationReport(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);
  const sourcePath = seedEvaluationDocPath(category, slug);
  const fileName = `${crypto.randomUUID()}.pdf`;
  return copySeedFile(sourcePath, `evaluations/reports/${fileName}`, logger);
}

function copyAuctionDocuments(auctionSeed, logger = console) {
  const slug = auctionSlug(auctionSeed);
  const docs = auctionSeed.auctionDocuments ?? [];

  return docs.map((doc) => {
    const docKey = doc.name.replace(/\.pdf$/i, '');
    const sourcePath = seedAuctionDocPath(slug, docKey);
    const fileName = `${crypto.randomUUID()}.pdf`;
    const url = copySeedFile(sourcePath, `auctions/documents/${fileName}`, logger);
    const absolutePath = path.join(uploadDir(), `auctions/documents/${fileName}`);
    return {
      name: doc.name,
      url,
      size: fs.statSync(absolutePath).size,
    };
  });
}

export async function resolveSeedMedia(auctionSeeds, logger = console) {
  assertSeedAssetsPresent(logger);
  cleanSeedUploadDirs(logger);

  const resolvedAuctions = [];

  for (const auctionSeed of auctionSeeds) {
    const resolvedLotGroups = [];

    for (const lotGroup of auctionSeed.lotGroups) {
      const resolvedAssets = [];

      for (const assetSeed of lotGroup.assets) {
        const imageUrls = copyAssetImages(assetSeed, auctionSeed.category, logger);
        const ownershipDocumentUrl = copyOwnershipDoc(assetSeed, auctionSeed.category, logger);
        const additionalDocumentUrls = copyAdditionalDocs(assetSeed, auctionSeed.category, logger);
        const evaluationReportUrl = copyEvaluationReport(assetSeed, auctionSeed.category, logger);
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
    const documentFiles = copyAuctionDocuments(auctionSeed, logger);
    const auctionCoverImages = flatAssets[0]?.imageUrls?.slice(0, 3) ?? [];

    resolvedAuctions.push({
      ...auctionSeed,
      lotGroups: resolvedLotGroups,
      documentFiles,
      auctionCoverImages,
      coverImage: auctionCoverImages[0] ?? flatAssets[0]?.imageUrls?.[0] ?? null,
    });
  }

  logger.log('[seed] copied committed seed-assets into uploads (no network downloads)');
  return resolvedAuctions;
}
