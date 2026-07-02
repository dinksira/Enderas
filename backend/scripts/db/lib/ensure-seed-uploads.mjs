import fs from 'fs';
import path from 'path';

import { env } from '../../../src/config/env.config.js';
import { buildMinimalPdf } from './minimal-pdf.mjs';
import { SEED_AUCTION_DOC, SEED_OWNERSHIP_DOC } from '../data/auctions.mjs';

function uploadRelativePath(storedUrl) {
  const marker = '/uploads/';
  const index = storedUrl.indexOf(marker);
  if (index === -1) {
    throw new Error(`Seed upload path is missing /uploads/ marker: ${storedUrl}`);
  }
  return storedUrl.slice(index + marker.length);
}

function ensurePdfAtStoredUrl(storedUrl, title, logger = console) {
  const relativePath = uploadRelativePath(storedUrl);
  const absolutePath = path.resolve(process.cwd(), env.storage.uploadDir, relativePath);
  const directory = path.dirname(absolutePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const pdf = buildMinimalPdf(title);
  fs.writeFileSync(absolutePath, pdf);
  logger.log(`[seed] wrote upload file: ${relativePath} (${pdf.length} bytes)`);
}

export function ensureSeedUploadFiles(logger = console) {
  ensurePdfAtStoredUrl(SEED_AUCTION_DOC.url, 'Enderass Auction Catalog', logger);
  ensurePdfAtStoredUrl(SEED_OWNERSHIP_DOC, 'Enderass Ownership Document', logger);
}
