/**
 * Build committed seed-assets from current uploads (or download manifest).
 * Converts images to compressed WebP and writes PDFs with stable filenames.
 *
 * Run: npm run seed-assets:build
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import { SEED_AUCTION_CATALOG } from '../data/auctions.mjs';
import {
  SEED_ASSETS_ROOT,
  assetSlug,
  auctionSlug,
  ensureSeedDirs,
  seedAuctionDocPath,
  seedAssetDocPath,
  seedCategoryDir,
  seedEvaluationDocPath,
  seedImageFileName,
  seedOwnershipDocPath,
} from './seed-assets-paths.mjs';
import {
  buildAdditionalDocumentPdf,
  buildAuctionCatalogPdf,
  buildAuctionDocumentPdf,
  buildEvaluationReportPdf,
  buildOwnershipDocumentPdf,
} from './seed-pdf.mjs';

const WEBP_QUALITY = 78;
const WEBP_MAX_WIDTH = 1280;
const DEFAULT_UPLOAD_DIR = 'uploads';

function uploadDir() {
  return path.resolve(process.cwd(), process.env.STORAGE_UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR);
}

function flattenAssets(auction) {
  return auction.lotGroups.flatMap((group) => group.assets);
}

function listUploadImages(assetId) {
  const dir = path.join(uploadDir(), 'assets/images', assetId);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name))
    .sort()
    .map((name) => path.join(dir, name));
}

async function convertToWebp(sourcePath, destPath) {
  await sharp(sourcePath)
    .rotate()
    .resize({ width: WEBP_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(destPath);
}

async function buildAssetImages(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);
  const sources = listUploadImages(assetSeed.assetId);
  const categoryDir = seedCategoryDir(category);

  for (const existing of fs.readdirSync(categoryDir)) {
    if (existing.startsWith(`${slug}-`) && existing.endsWith('.webp')) {
      fs.unlinkSync(path.join(categoryDir, existing));
    }
  }

  if (sources.length === 0) {
    logger.log(`[seed-assets:build] WARN no upload images for ${assetSeed.title}`);
    return 0;
  }

  let written = 0;
  for (let index = 0; index < sources.length; index += 1) {
    const destPath = path.join(categoryDir, seedImageFileName(slug, index + 1));
    await convertToWebp(sources[index], destPath);
    const size = fs.statSync(destPath).size;
    logger.log(`[seed-assets:build] ${path.basename(destPath)} (${size} bytes)`);
    written += 1;
  }

  return written;
}

function writePdf(destPath, pdfBuffer, logger = console) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, pdfBuffer);
  logger.log(`[seed-assets:build] ${path.relative(SEED_ASSETS_ROOT, destPath)} (${pdfBuffer.length} bytes)`);
}

function buildAssetDocuments(assetSeed, category, logger = console) {
  const slug = assetSlug(assetSeed);

  writePdf(seedOwnershipDocPath(category, slug), buildOwnershipDocumentPdf(assetSeed), logger);

  for (const doc of assetSeed.additionalDocs ?? []) {
    const docKey = doc.name.replace(/\.pdf$/i, '');
    writePdf(
      seedAssetDocPath(category, slug, docKey),
      buildAdditionalDocumentPdf(doc, assetSeed),
      logger,
    );
  }

  writePdf(
    seedEvaluationDocPath(category, slug),
    buildEvaluationReportPdf(assetSeed),
    logger,
  );
}

function buildAuctionDocuments(auctionSeed, flatAssets, logger = console) {
  const slug = auctionSlug(auctionSeed);
  const docs = auctionSeed.auctionDocuments ?? [];

  docs.forEach((doc, index) => {
    const docKey = doc.name.replace(/\.pdf$/i, '');
    const pdf =
      index === 0
        ? buildAuctionCatalogPdf(auctionSeed, flatAssets)
        : buildAuctionDocumentPdf({
            title: doc.title,
            documentType: doc.documentType ?? 'Auction Document',
            reference: `AUC-${auctionSeed.id.slice(0, 8).toUpperCase()}-${index + 1}`,
            sections: doc.sections ?? [
              {
                heading: doc.title,
                paragraphs: [
                  auctionSeed.auctionConditions ??
                    'Standard Enderass auction terms and buyer obligations apply.',
                ],
                bullets: doc.bullets ?? [
                  'Registered bidders only',
                  'Document fee non-refundable',
                  'On-site inspection recommended before bidding',
                ],
              },
            ],
          });

    writePdf(seedAuctionDocPath(slug, docKey), pdf, logger);
  });
}

async function main() {
  const categories = [...new Set(SEED_AUCTION_CATALOG.map((auction) => auction.category))];
  ensureSeedDirs(categories, console);

  let totalImages = 0;

  for (const auction of SEED_AUCTION_CATALOG) {
    const flatAssets = flattenAssets(auction);

    for (const assetSeed of flatAssets) {
      totalImages += await buildAssetImages(assetSeed, auction.category, console);
      buildAssetDocuments(assetSeed, auction.category, console);
    }

    buildAuctionDocuments(auction, flatAssets, console);
  }

  console.log(`[seed-assets:build] done — ${totalImages} images in ${SEED_ASSETS_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
