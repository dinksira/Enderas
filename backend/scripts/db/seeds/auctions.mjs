import { User } from '../../../src/models/user.model.js';
import { Staff } from '../../../src/models/staff.model.js';
import { AssetOwner } from '../../../src/models/assetOwner.model.js';
import { Asset } from '../../../src/models/asset.model.js';
import { Evaluation } from '../../../src/models/evaluation.model.js';
import { Auction } from '../../../src/models/auction.model.js';
import { AuctionAsset } from '../../../src/models/auctionAsset.model.js';
import { Lot } from '../../../src/models/lot.model.js';
import {
  ADMIN_STAFF_ID,
  OWNER_USER_ID,
  SEED_ASSET_OWNER_ID,
  SEED_AUCTION_CATALOG,
} from '../data/auctions.mjs';
import { resolveSeedMedia } from '../lib/seed-media.mjs';

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

function flattenSeedAssets(seed) {
  return seed.lotGroups.flatMap((group) => group.assets);
}

async function assertPrerequisites(transaction) {
  const owner = await User.findByPk(OWNER_USER_ID, { attributes: ['id'], transaction });
  if (!owner) {
    throw new Error('Test owner user not found. Seed test users first.');
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
      user_id: OWNER_USER_ID,
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

async function ensureEvaluatedAsset(assetSeed, ownerId, staffId, transaction) {
  const now = new Date();

  await Asset.upsert(
    {
      id: assetSeed.assetId,
      asset_owner_id: ownerId,
      asset_type: assetSeed.assetType,
      title: assetSeed.title,
      description: assetSeed.description,
      location: assetSeed.location,
      address: assetSeed.address ?? null,
      ownership_document_type: ownershipDocumentType(assetSeed.assetType),
      ownership_document_url: assetSeed.ownershipDocumentUrl,
      additional_document_urls: assetSeed.additionalDocumentUrls ?? null,
      condition_notes: assetSeed.conditionNotes ?? null,
      image_urls: assetSeed.imageUrls,
      desired_reserve_price: assetSeed.reservePrice,
      auction_conditions: assetSeed.auctionConditions ?? 'Standard Enderass auction terms apply.',
      status: 'evaluated',
      reviewed_by_staff_id: staffId,
      reviewed_at: now,
      deleted_at: null,
    },
    { transaction },
  );

  await Evaluation.upsert(
    {
      id: assetSeed.evaluationId,
      asset_id: assetSeed.assetId,
      evaluated_by_staff_id: staffId,
      scheduled_at: now,
      started_at: now,
      completed_at: now,
      valuation_amount: assetSeed.reservePrice,
      reserve_price_recommendation: assetSeed.reservePrice,
      photo_urls: assetSeed.evaluationPhotoUrls ?? assetSeed.imageUrls?.slice(0, 4) ?? null,
      report_url: assetSeed.evaluationReportUrl ?? null,
      recommendation: 'approved',
      status: 'approved',
      notes: assetSeed.evaluationNotes ?? 'Seeded evaluation for development catalog.',
      deleted_at: null,
    },
    { transaction },
  );
}

async function ensureAuctionCatalogEntry(seed, staffId, ownerUserId, transaction, logger) {
  const existing = await Auction.findByPk(seed.id, { transaction });
  const { start, end } = auctionWindow();
  const flatAssets = flattenSeedAssets(seed);
  const totalReserve = flatAssets.reduce((sum, asset) => sum + asset.reservePrice, 0);
  const now = new Date();
  const coverImages = seed.auctionCoverImages?.length
    ? seed.auctionCoverImages
    : seed.coverImage
      ? [seed.coverImage]
      : null;

  const auctionPayload = {
    title: seed.title,
    category: seed.category,
    description: seed.description,
    auction_conditions: seed.auctionConditions,
    image_urls: coverImages,
    document_files: seed.documentFiles,
    start_date: start,
    end_date: end,
    reserve_price: totalReserve,
    total_reserve_price: totalReserve,
    document_price: seed.documentFee,
    cpo_percentage: seed.cpoPercentage,
    status: 'published',
    auction_mode: 'multi',
    owner_id: ownerUserId,
    published_at: existing?.published_at ?? now,
    deleted_at: null,
  };

  if (existing) {
    await existing.update(auctionPayload, { transaction });
    logger.log(`[seed] refreshed auction: ${seed.title}`);
  } else {
    await Auction.create(
      {
        id: seed.id,
        asset_id: null,
        created_by_staff_id: staffId,
        currency: 'ETB',
        ...auctionPayload,
      },
      { transaction },
    );
    logger.log(`[seed] created auction: ${seed.title}`);
  }

  let globalSortOrder = 0;
  for (const [groupIndex, lotGroup] of seed.lotGroups.entries()) {
    await Lot.upsert(
      {
        id: lotGroup.id,
        auction_id: seed.id,
        title: lotGroup.title,
        description: lotGroup.description ?? null,
        sort_order: lotGroup.sortOrder ?? groupIndex,
        deleted_at: null,
      },
      { transaction },
    );

    for (const assetSeed of lotGroup.assets) {
      await AuctionAsset.upsert(
        {
          id: assetSeed.id,
          auction_id: seed.id,
          lot_id: lotGroup.id,
          asset_id: assetSeed.assetId,
          reserve_price: assetSeed.reservePrice,
          sort_order: assetSeed.sortOrder ?? globalSortOrder,
          lot_label: lotGroup.title,
          tags: assetSeed.tags ?? null,
          outcome_status: 'pending',
        },
        { transaction },
      );
      globalSortOrder += 1;
    }
  }
}

export async function seedAuctionCatalog({ transaction, logger = console }) {
  const resolvedAuctions = await resolveSeedMedia(SEED_AUCTION_CATALOG, logger);
  await assertPrerequisites(transaction);

  const owner = await ensureAssetOwner(transaction);
  const totalAssets = resolvedAuctions.reduce(
    (sum, auction) => sum + flattenSeedAssets(auction).length,
    0,
  );
  const totalLots = resolvedAuctions.reduce((sum, auction) => sum + auction.lotGroups.length, 0);

  for (const seed of resolvedAuctions) {
    for (const assetSeed of flattenSeedAssets(seed)) {
      await ensureEvaluatedAsset(assetSeed, owner.id, ADMIN_STAFF_ID, transaction);
    }
    await ensureAuctionCatalogEntry(seed, ADMIN_STAFF_ID, owner.user_id, transaction, logger);
  }

  logger.log(
    `[seed] upserted ${resolvedAuctions.length} auctions, ${totalLots} lots, ${totalAssets} assets with media`,
  );
}
