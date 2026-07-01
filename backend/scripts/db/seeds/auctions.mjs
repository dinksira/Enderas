import { User } from '../../../src/models/user.model.js';
import { Staff } from '../../../src/models/staff.model.js';
import { AssetOwner } from '../../../src/models/assetOwner.model.js';
import { Asset } from '../../../src/models/asset.model.js';
import { Evaluation } from '../../../src/models/evaluation.model.js';
import { Auction } from '../../../src/models/auction.model.js';
import { AuctionAsset } from '../../../src/models/auctionAsset.model.js';
import {
  ADMIN_STAFF_ID,
  BIDDER_USER_ID,
  SEED_ASSET_OWNER_ID,
  SEED_AUCTION_DOC,
  SEED_AUCTIONS,
  SEED_OWNERSHIP_DOC,
} from '../data/auctions.mjs';
import { ensureSeedUploadFiles } from '../lib/ensure-seed-uploads.mjs';

function ownershipDocumentType(assetType) {
  if (assetType === 'vehicle') return 'vehicle_registration_book';
  if (assetType === 'land') return 'title_deed';
  if (assetType === 'building') return 'ownership_certificate';
  return 'purchase_documents';
}

function auctionWindow() {
  const start = new Date(Date.now() - 60 * 60 * 1000);
  const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return { start, end };
}

async function assertPrerequisites(transaction) {
  const bidder = await User.findByPk(BIDDER_USER_ID, { attributes: ['id'], transaction });
  if (!bidder) {
    throw new Error('Bidder test user not found. Seed test users first.');
  }

  const staff = await Staff.findOne({
    where: { id: ADMIN_STAFF_ID, deleted_at: null, is_active: true },
    attributes: ['id'],
    transaction,
  });
  if (!staff) {
    throw new Error('Admin staff profile not found. Seed test users first.');
  }
}

async function ensureAssetOwner(transaction) {
  const [owner] = await AssetOwner.upsert(
    {
      id: SEED_ASSET_OWNER_ID,
      user_id: BIDDER_USER_ID,
      contact_phone: '0987654321',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      status: 'active',
      deleted_at: null,
    },
    { transaction },
  );

  return owner;
}

async function ensureEvaluatedAsset(lot, ownerId, staffId, transaction) {
  const now = new Date();

  await Asset.upsert(
    {
      id: lot.assetId,
      asset_owner_id: ownerId,
      asset_type: lot.assetType,
      title: lot.title,
      description: lot.description,
      location: lot.location,
      ownership_document_type: ownershipDocumentType(lot.assetType),
      ownership_document_url: SEED_OWNERSHIP_DOC,
      image_urls: lot.imageUrls,
      desired_reserve_price: lot.reservePrice,
      auction_conditions: 'Standard Enderass auction terms apply.',
      status: 'evaluated',
      reviewed_by_staff_id: staffId,
      reviewed_at: now,
      deleted_at: null,
    },
    { transaction },
  );

  await Evaluation.upsert(
    {
      id: lot.evaluationId,
      asset_id: lot.assetId,
      evaluated_by_staff_id: staffId,
      scheduled_at: now,
      started_at: now,
      completed_at: now,
      valuation_amount: lot.reservePrice,
      reserve_price_recommendation: lot.reservePrice,
      recommendation: 'approved',
      status: 'approved',
      notes: 'Seeded evaluation for development catalog.',
      deleted_at: null,
    },
    { transaction },
  );
}

async function ensureAuctionCatalogEntry(seed, staffId, transaction, logger) {
  const existing = await Auction.findByPk(seed.id, { transaction });
  const { start, end } = auctionWindow();
  const totalReserve = seed.lots.reduce((sum, lot) => sum + lot.reservePrice, 0);
  const now = new Date();

  if (existing) {
    await existing.update(
      {
        title: seed.title,
        category: seed.category,
        description: seed.description,
        auction_conditions: seed.auctionConditions,
        image_urls: [seed.lots[0].imageUrls[0]],
        document_files: [SEED_AUCTION_DOC],
        start_date: start,
        end_date: end,
        reserve_price: totalReserve,
        total_reserve_price: totalReserve,
        document_price: seed.documentFee,
        cpo_percentage: seed.cpoPercentage,
        status: 'published',
        auction_mode: 'multi',
        published_at: existing.published_at ?? now,
        deleted_at: null,
      },
      { transaction },
    );
    logger.log(`[seed] refreshed auction: ${seed.title}`);
  } else {
    await Auction.create(
      {
        id: seed.id,
        asset_id: null,
        created_by_staff_id: staffId,
        title: seed.title,
        category: seed.category,
        description: seed.description,
        auction_conditions: seed.auctionConditions,
        image_urls: [seed.lots[0].imageUrls[0]],
        document_files: [SEED_AUCTION_DOC],
        start_date: start,
        end_date: end,
        reserve_price: totalReserve,
        total_reserve_price: totalReserve,
        document_price: seed.documentFee,
        cpo_percentage: seed.cpoPercentage,
        currency: 'ETB',
        status: 'published',
        auction_mode: 'multi',
        published_at: now,
      },
      { transaction },
    );
    logger.log(`[seed] created auction: ${seed.title}`);
  }

  for (const [index, lot] of seed.lots.entries()) {
    await AuctionAsset.upsert(
      {
        id: lot.id,
        auction_id: seed.id,
        asset_id: lot.assetId,
        reserve_price: lot.reservePrice,
        sort_order: index,
        lot_label: `Lot ${index + 1}`,
        outcome_status: 'pending',
      },
      { transaction },
    );
  }
}

export async function seedAuctionCatalog({ transaction, logger = console }) {
  ensureSeedUploadFiles(logger);
  await assertPrerequisites(transaction);

  const owner = await ensureAssetOwner(transaction);

  for (const seed of SEED_AUCTIONS) {
    for (const lot of seed.lots) {
      await ensureEvaluatedAsset(lot, owner.id, ADMIN_STAFF_ID, transaction);
    }
    await ensureAuctionCatalogEntry(seed, ADMIN_STAFF_ID, transaction, logger);
  }

  logger.log(`[seed] upserted ${SEED_AUCTIONS.length} published auctions with catalog assets`);
}
