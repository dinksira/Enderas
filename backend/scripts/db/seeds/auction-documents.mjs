import crypto from 'crypto';
import { AuctionDocument } from '../../../src/models/auctionDocument.model.js';
import { Auction } from '../../../src/models/auction.model.js';
import { ADMIN_STAFF_ID, SEED_AUCTION_IDS } from '../data/auctions.mjs';

const DOC_NAMESPACE = 'auction-document-seed';

function deterministicUuid(namespace, ...parts) {
  const hash = crypto
    .createHash('sha256')
    .update([namespace, ...parts].join('|'))
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');
}

function parseDocumentFiles(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function seedAuctionDocuments({ transaction, logger = console }) {
  const auctions = await Auction.findAll({
    where: { id: SEED_AUCTION_IDS },
    attributes: ['id', 'document_files'],
    transaction,
  });

  let documentCount = 0;

  for (const auction of auctions) {
    const files = parseDocumentFiles(auction.document_files);

    for (const file of files) {
      const name = file.name ?? file.file_name ?? 'document.pdf';

      await AuctionDocument.upsert(
        {
          id: deterministicUuid(DOC_NAMESPACE, auction.id, name),
          auction_id: auction.id,
          uploaded_by_staff_id: ADMIN_STAFF_ID,
          title: name,
          description: null,
          file_url: file.url,
          file_name: name,
          file_size: file.size ?? null,
          mime_type: 'application/pdf',
          download_count: 0,
          is_active: true,
          deleted_at: null,
        },
        { transaction },
      );

      documentCount += 1;
    }
  }

  logger.log(`[seed] upserted ${documentCount} auction documents across ${auctions.length} auctions`);
}
