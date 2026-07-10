import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Committed seed media root — safe to check into git. */
export const SEED_ASSETS_ROOT = path.resolve(__dirname, '../../../seed-assets');

export function slugify(value, maxLength = 40) {
  return String(value)
    .replace(/^\d{4}\s+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

export function assetSlug(assetSeed) {
  return assetSeed.slug ?? slugify(assetSeed.title);
}

export function auctionSlug(auctionSeed) {
  return auctionSeed.slug ?? slugify(auctionSeed.title);
}

export function seedCategoryDir(category) {
  return path.join(SEED_ASSETS_ROOT, category);
}

export function seedAuctionDir() {
  return path.join(SEED_ASSETS_ROOT, 'auctions');
}

export function seedImageFileName(slug, index) {
  return `${slug}-${index}.webp`;
}

export function seedDocFileName(slug, docKey) {
  const safeKey = String(docKey).replace(/\.pdf$/i, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
  return `${slug}-${safeKey}.pdf`;
}

export function listSeedImages(category, slug) {
  const dir = seedCategoryDir(category);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(`${slug}-`) && name.endsWith('.webp'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((name) => path.join(dir, name));
}

export function seedImagePath(category, slug, index) {
  return path.join(seedCategoryDir(category), seedImageFileName(slug, index));
}

export function seedAssetDocPath(category, slug, docKey) {
  return path.join(seedCategoryDir(category), seedDocFileName(slug, docKey));
}

export function seedOwnershipDocPath(category, slug) {
  return seedAssetDocPath(category, slug, 'ownership');
}

export function seedEvaluationDocPath(category, slug) {
  return seedAssetDocPath(category, slug, 'evaluation');
}

export function seedAuctionDocPath(auctionSlugValue, docKey) {
  return path.join(seedAuctionDir(), seedDocFileName(auctionSlugValue, docKey));
}

export function ensureSeedDirs(categories, logger = console) {
  fs.mkdirSync(SEED_ASSETS_ROOT, { recursive: true });
  fs.mkdirSync(seedAuctionDir(), { recursive: true });

  for (const category of categories) {
    const dir = seedCategoryDir(category);
    fs.mkdirSync(dir, { recursive: true });
    logger.log(`[seed-assets] ensured dir: ${path.relative(SEED_ASSETS_ROOT, dir)}`);
  }
}
