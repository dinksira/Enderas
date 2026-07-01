import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { Auction, AUCTION_CATEGORIES, AUCTION_STATUSES } from '../models/auction.model.js';
import { AuctionAsset } from '../models/auctionAsset.model.js';
import { Asset } from '../models/asset.model.js';
import { Evaluation } from '../models/evaluation.model.js';
import { Bid } from '../models/bid.model.js';
import { Payment } from '../models/payment.model.js';
import { Cpo } from '../models/cpo.model.js';
import { Staff, User } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { LAUNCH_WORKFLOW_ROLES } from '../constants/staff-role.constants.js';
import { assertStaffRole } from '../utils/staff-role.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { winnerService } from './winner.service.js';
import { paymentService } from './payment.service.js';
import { normalizeLotIdList } from '../utils/auction-lot.util.js';

const DISPLAY_STATUS_MAP = Object.freeze({
  published: 'ACTIVE',
  draft: 'PENDING',
  pending_approval: 'PENDING',
  suspended: 'SUSPENDED',
  closed: 'CLOSED',
  cancelled: 'CLOSED',
});

const ACTIVE_LINKED_AUCTION_STATUSES = Object.freeze(
  AUCTION_STATUSES.filter((status) => !['closed', 'cancelled'].includes(status)),
);

const MAX_LOTS_PER_AUCTION = 25;

/**
 * @param {string} assetId
 */
async function findActiveAuctionForAsset(assetId) {
  const legacyAuction = await Auction.findOne({
    where: {
      asset_id: assetId,
      deleted_at: null,
      status: { [Op.in]: ACTIVE_LINKED_AUCTION_STATUSES },
    },
    attributes: ['id'],
  });

  if (legacyAuction) {
    return legacyAuction;
  }

  const activeLot = await AuctionAsset.findOne({
    where: { asset_id: assetId },
    include: [
      {
        model: Auction,
        as: 'auction',
        required: true,
        where: {
          deleted_at: null,
          status: { [Op.in]: ACTIVE_LINKED_AUCTION_STATUSES },
        },
        attributes: ['id'],
      },
    ],
    attributes: ['id'],
  });

  return activeLot?.auction ?? null;
}

/**
 * @param {object[]} assets
 */
function normalizeLotInputs(assets) {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .map((entry, index) => ({
      assetId: entry?.assetId ?? entry?.asset_id,
      reservePrice: Number(entry?.reservePrice ?? entry?.reserve_price),
      sortOrder: Number.isFinite(Number(entry?.sortOrder)) ? Number(entry.sortOrder) : index,
      lotLabel: entry?.lotLabel?.trim() || entry?.lot_label?.trim() || `Lot ${index + 1}`,
    }))
    .filter((entry) => entry.assetId);
}

function serializeLot(lot) {
  const plain = lot.get ? lot.get({ plain: true }) : lot;
  const asset = plain.asset;

  return {
    id: plain.id,
    auctionId: plain.auction_id,
    assetId: plain.asset_id,
    reservePrice: Number(plain.reserve_price),
    sortOrder: plain.sort_order,
    lotLabel: plain.lot_label,
    outcomeStatus: plain.outcome_status,
    assetTitle: asset?.title ?? null,
    assetType: asset?.asset_type ?? null,
    assetLocation: asset?.location ?? null,
  };
}

const ASSET_TYPE_TO_AUCTION_CATEGORY = Object.freeze({
  vehicle: 'vehicles',
  land: 'land',
  building: 'buildings',
  machinery: 'machinery',
  equipment: 'equipment',
  salvage: 'salvage_assets',
  other: 'other_assets',
});

function mapAssetTypeToAuctionCategory(assetType) {
  return ASSET_TYPE_TO_AUCTION_CATEGORY[assetType] || 'other_assets';
}

function normalizeAssetImageUrls(urls) {
  if (!urls) {
    return [];
  }
  if (typeof urls === 'string') {
    try {
      const parsed = JSON.parse(urls);
      return normalizeAssetImageUrls(parsed);
    } catch {
      return urls.trim() ? [urls.trim()] : [];
    }
  }
  if (!Array.isArray(urls)) {
    return [];
  }
  return urls.filter((url) => typeof url === 'string' && url.trim().length > 0);
}

function normalizeAssetAdditionalDocuments(documents) {
  if (!documents) {
    return [];
  }
  if (typeof documents === 'string') {
    try {
      const parsed = JSON.parse(documents);
      return normalizeAssetAdditionalDocuments(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(documents)) {
    return [];
  }
  return documents
    .filter((doc) => doc && (typeof doc === 'string' ? doc.trim() : doc.url))
    .map((doc) => {
      if (typeof doc === 'string') {
        return { name: 'Supporting Document', url: doc.trim(), size: 0 };
      }
      return {
        name: doc.name || doc.fileName || 'Supporting Document',
        url: doc.url,
        size: Number(doc.size) || 0,
      };
    });
}

function mapDisplayStatus(dbStatus) {
  return DISPLAY_STATUS_MAP[dbStatus] || 'PENDING';
}

function formatDateForList(date) {
  if (!date) {
    return '—';
  }
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeDocumentFiles(documents) {
  if (!Array.isArray(documents)) {
    return [];
  }

  return documents
    .filter((doc) => doc && typeof doc.url === 'string' && doc.url.length > 0)
    .map((doc) => ({
      name: doc.name || doc.fileName || 'document.pdf',
      url: doc.url,
      size: Number(doc.size) || 0,
    }));
}

const DISPLAY_TIMEZONE = 'Africa/Addis_Ababa';

function formatDateTimeForDetail(date) {
  if (!date) {
    return '—';
  }
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DISPLAY_TIMEZONE,
  });
}

function getBiddingWindowStatus(auction) {
  const now = new Date();
  const start = auction.startDate ? new Date(auction.startDate) : null;
  const end = auction.endDate ? new Date(auction.endDate) : null;
  if (!start || !end) return 'unknown';
  if (now < start) return 'before';
  if (now > end) return 'after';
  return 'open';
}

function isWithinBiddingWindow(auction) {
  return getBiddingWindowStatus(auction) === 'open';
}

function buildStaffDisplayName(staff) {
  if (!staff?.user) {
    return staff?.employee_id || null;
  }

  const fullName = [staff.user.first_name, staff.user.last_name].filter(Boolean).join(' ').trim();
  return fullName || staff.user.mobile_number || staff.employee_id || null;
}

async function findAuctionOrThrow(id) {
  const auction = await Auction.findByPk(id);
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  return auction;
}

function assertEditableStatus(dbStatus) {
  const editable = ['draft', 'pending_approval', 'suspended'];
  if (!editable.includes(dbStatus)) {
    throw new AppError('Auction cannot be edited in its current status', 400, 'AUCTION_NOT_EDITABLE');
  }
}

function normalizeImageUrls(imageUrls) {
  if (!Array.isArray(imageUrls)) {
    return [];
  }
  return imageUrls.filter((url) => typeof url === 'string' && url.length > 0);
}

function validateAuctionFields(payload, { requireDocuments = false } = {}) {
  if (payload.title !== undefined && !String(payload.title).trim()) {
    throw new AppError('Auction title is required', 400, 'TITLE_REQUIRED');
  }

  if (payload.category !== undefined && !AUCTION_CATEGORIES.includes(payload.category)) {
    throw new AppError('Valid category is required', 400, 'CATEGORY_REQUIRED');
  }

  const start = payload.startDate ? new Date(payload.startDate) : null;
  const end = payload.endDate ? new Date(payload.endDate) : null;

  if (payload.startDate && Number.isNaN(start?.getTime())) {
    throw new AppError('Valid start date is required', 400, 'INVALID_START_DATE');
  }

  if (payload.endDate && Number.isNaN(end?.getTime())) {
    throw new AppError('Valid end date is required', 400, 'INVALID_END_DATE');
  }

  if (start && end && end <= start) {
    throw new AppError('Closing date must be after start date', 400, 'END_BEFORE_START');
  }

  if (payload.reservePrice !== undefined) {
    const reserve = Number(payload.reservePrice);
    if (!Number.isFinite(reserve) || reserve <= 0) {
      throw new AppError('Reserve price must be a positive number', 400, 'INVALID_RESERVE_PRICE');
    }
  }

  if (payload.documentFee !== undefined) {
    const docFee = Number(payload.documentFee);
    if (!Number.isFinite(docFee) || docFee < 0) {
      throw new AppError('Document fee must be zero or positive', 400, 'INVALID_DOCUMENT_FEE');
    }
  }

  if (payload.cpoPercentage !== undefined) {
    const cpo = Number(payload.cpoPercentage);
    if (!Number.isFinite(cpo) || cpo < 1 || cpo > 100) {
      throw new AppError('CPO percentage must be between 1 and 100', 400, 'INVALID_CPO_PERCENTAGE');
    }
  }

  if (requireDocuments) {
    const docs = normalizeDocumentFiles(payload.documents);
    if (docs.length === 0) {
      throw new AppError('At least one auction document is required', 400, 'DOCUMENTS_REQUIRED');
    }
  }
}

/**
 * @param {string} assetId
 */
async function assertAssetEligibleForAuction(assetId) {
  const asset = await Asset.findOne({ where: { id: assetId, deleted_at: null } });
  if (!asset) {
    throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  }

  if (asset.status !== 'evaluated') {
    throw new AppError(
      'Asset must be fully evaluated before auction creation',
      400,
      'ASSET_NOT_EVALUATED',
    );
  }

  const existingAuction = await findActiveAuctionForAsset(assetId);

  if (existingAuction) {
    throw new AppError('An active auction already exists for this asset', 409, 'ASSET_AUCTION_EXISTS');
  }

  return asset;
}

/**
 * Assets ready for auction creation: evaluated and not linked to an active auction.
 * @param {{ search?: string }} [options]
 */
export async function listEligibleAssetsForAuction(options = {}) {
  const where = { status: 'evaluated', deleted_at: null };

  if (options.assetId) {
    where.id = options.assetId;
  }

  if (options.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { location: { [Op.like]: term } },
    ];
  }

  const assets = await Asset.findAll({
    where,
    include: [
      {
        model: Evaluation,
        as: 'evaluation',
        required: true,
        where: { status: 'approved', deleted_at: null },
      },
    ],
    order: [['updated_at', 'DESC']],
  });

  if (assets.length === 0) {
    return [];
  }

  const assetIds = assets.map((asset) => asset.id);
  const activeLots = await AuctionAsset.findAll({
    where: { asset_id: { [Op.in]: assetIds } },
    attributes: ['asset_id'],
    include: [
      {
        model: Auction,
        as: 'auction',
        required: true,
        where: {
          deleted_at: null,
          status: { [Op.in]: ACTIVE_LINKED_AUCTION_STATUSES },
        },
        attributes: ['id'],
      },
    ],
  });

  const activeAuctions = await Auction.findAll({
    where: {
      asset_id: { [Op.in]: assetIds },
      deleted_at: null,
      status: { [Op.in]: ACTIVE_LINKED_AUCTION_STATUSES },
    },
    attributes: ['asset_id'],
    raw: true,
  });

  const blockedAssetIds = new Set([
    ...activeAuctions.map((row) => row.asset_id),
    ...activeLots.map((row) => row.asset_id),
  ]);

  return assets
    .filter((asset) => !blockedAssetIds.has(asset.id))
    .map((asset) => {
      const plain = asset.get({ plain: true });
      const evaluation = plain.evaluation;

      return {
        id: plain.id,
        title: plain.title,
        assetType: plain.asset_type,
        auctionCategory: mapAssetTypeToAuctionCategory(plain.asset_type),
        location: plain.location,
        description: plain.description,
        auctionConditions: plain.auction_conditions,
        desiredReservePrice: plain.desired_reserve_price != null
          ? Number(plain.desired_reserve_price)
          : null,
        imageUrls: normalizeAssetImageUrls(plain.image_urls),
        ownershipDocumentUrl: plain.ownership_document_url,
        additionalDocuments: normalizeAssetAdditionalDocuments(plain.additional_document_urls),
        evaluation: evaluation
          ? {
              id: evaluation.id,
              valuationAmount: evaluation.valuation_amount != null
                ? Number(evaluation.valuation_amount)
                : null,
              reservePriceRecommendation: evaluation.reserve_price_recommendation != null
                ? Number(evaluation.reserve_price_recommendation)
                : null,
              photoUrls: normalizeAssetImageUrls(evaluation.photo_urls),
              reportUrl: evaluation.report_url,
            }
          : null,
      };
    });
}

/**
 * @param {object} payload
 * @param {string} staffId
 */
export async function createAuction(payload, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required to create auctions', 403, 'STAFF_REQUIRED');
  }

  const {
    title,
    category,
    description,
    auctionConditions,
    startDate,
    endDate,
    reservePrice,
    documentFee,
    cpoPercentage,
    imageUrls,
    documents,
    assetId,
    auctionMode,
    assets,
  } = payload;

  if (!title?.trim()) {
    throw new AppError('Auction title is required', 400, 'TITLE_REQUIRED');
  }

  if (!category || !AUCTION_CATEGORIES.includes(category)) {
    throw new AppError('Valid category is required', 400, 'CATEGORY_REQUIRED');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Valid start and end dates are required', 400, 'INVALID_DATES');
  }

  if (end <= start) {
    throw new AppError('Closing date must be after start date', 400, 'END_BEFORE_START');
  }

  const docFee = Number(documentFee ?? 0);
  if (!Number.isFinite(docFee) || docFee < 0) {
    throw new AppError('Document fee must be zero or positive', 400, 'INVALID_DOCUMENT_FEE');
  }

  const cpo = Number(cpoPercentage);
  if (!Number.isFinite(cpo) || cpo < 1 || cpo > 100) {
    throw new AppError('CPO percentage must be between 1 and 100', 400, 'INVALID_CPO_PERCENTAGE');
  }

  const normalizedDocuments = normalizeDocumentFiles(documents);
  if (normalizedDocuments.length === 0) {
    throw new AppError('At least one auction document is required', 400, 'DOCUMENTS_REQUIRED');
  }

  const normalizedImages = normalizeImageUrls(imageUrls);
  const resolvedMode = auctionMode === 'multi' ? 'multi' : 'single';
  let lotInputs = normalizeLotInputs(assets);

  if (resolvedMode === 'single' && lotInputs.length === 0 && assetId) {
    const reserve = Number(reservePrice);
    if (!Number.isFinite(reserve) || reserve <= 0) {
      throw new AppError('Reserve price must be a positive number', 400, 'INVALID_RESERVE_PRICE');
    }
    lotInputs = [{
      assetId,
      reservePrice: reserve,
      sortOrder: 0,
      lotLabel: 'Lot 1',
    }];
  }

  if (resolvedMode === 'multi') {
    if (lotInputs.length < 2) {
      throw new AppError('Multi-asset auctions require at least two assets', 400, 'MULTI_ASSETS_REQUIRED');
    }
  }

  if (lotInputs.length > MAX_LOTS_PER_AUCTION) {
    throw new AppError(
      `Maximum ${MAX_LOTS_PER_AUCTION} assets per auction`,
      400,
      'AUCTION_LOT_LIMIT',
    );
  }

  const uniqueAssetIds = new Set(lotInputs.map((lot) => lot.assetId));
  if (uniqueAssetIds.size !== lotInputs.length) {
    throw new AppError('Each asset can only appear once in an auction', 400, 'DUPLICATE_AUCTION_ASSET');
  }

  for (const lot of lotInputs) {
    if (!Number.isFinite(lot.reservePrice) || lot.reservePrice <= 0) {
      throw new AppError('Each lot must have a positive reserve price', 400, 'INVALID_LOT_RESERVE');
    }
    await assertAssetEligibleForAuction(lot.assetId);
  }

  let auctionReserve = Number(reservePrice);
  let totalReservePrice = null;

  if (resolvedMode === 'multi') {
    totalReservePrice = lotInputs.reduce((sum, lot) => sum + lot.reservePrice, 0);
    auctionReserve = totalReservePrice;
  } else if (!Number.isFinite(auctionReserve) || auctionReserve <= 0) {
    if (lotInputs.length === 1) {
      auctionReserve = lotInputs[0].reservePrice;
    } else {
      throw new AppError('Reserve price must be a positive number', 400, 'INVALID_RESERVE_PRICE');
    }
  } else if (lotInputs.length === 1) {
    lotInputs[0].reservePrice = auctionReserve;
  }

  const primaryAssetId = resolvedMode === 'single' && lotInputs.length === 1
    ? lotInputs[0].assetId
    : null;

  const auction = await sequelize.transaction(async (transaction) => {
    const createdAuction = await Auction.create({
      id: generateUuid(),
      asset_id: primaryAssetId,
      created_by_staff_id: staffId,
      title: title.trim(),
      category,
      description: description?.trim() || null,
      auction_conditions: auctionConditions?.trim() || null,
      image_urls: normalizedImages.length > 0 ? normalizedImages : null,
      document_files: normalizedDocuments,
      start_date: start,
      end_date: end,
      reserve_price: auctionReserve,
      total_reserve_price: totalReservePrice,
      document_price: docFee,
      cpo_percentage: cpo,
      currency: 'ETB',
      auction_mode: resolvedMode,
      status: 'pending_approval',
    }, { transaction });

    for (const lot of lotInputs) {
      await AuctionAsset.create({
        id: generateUuid(),
        auction_id: createdAuction.id,
        asset_id: lot.assetId,
        reserve_price: lot.reservePrice,
        sort_order: lot.sortOrder,
        lot_label: lot.lotLabel,
        outcome_status: 'pending',
      }, { transaction });
    }

    return createdAuction;
  });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Auction',
    entityId: auction.id,
    metadata: {
      title: auction.title,
      category: auction.category,
      auctionMode: resolvedMode,
      lotCount: lotInputs.length,
    },
  });

  return getAuctionById(auction.id);
}

/**
 * @param {import('sequelize').Model} auction
 * @param {number} bidCount
 * @param {{ createdByName?: string|null }} [extras]
 */
function serializeAuction(auction, bidCount = 0, extras = {}) {
  const plain = auction.get ? auction.get({ plain: true }) : auction;

  return {
    id: plain.id,
    title: plain.title,
    category: plain.category,
    categoryKey: plain.category,
    description: plain.description,
    auctionConditions: plain.auction_conditions,
    imageUrls: normalizeAssetImageUrls(plain.image_urls),
    documents: plain.document_files || [],
    status: mapDisplayStatus(plain.status),
    dbStatus: plain.status,
    startDate: plain.start_date,
    endDate: plain.end_date,
    startingDate: formatDateForList(plain.start_date),
    endingDate: formatDateForList(plain.end_date),
    startDateFormatted: formatDateTimeForDetail(plain.start_date),
    endDateFormatted: formatDateTimeForDetail(plain.end_date),
    reservePrice: Number(plain.reserve_price),
    reserve: Number(plain.reserve_price),
    totalReservePrice: plain.total_reserve_price != null
      ? Number(plain.total_reserve_price)
      : null,
    auctionMode: plain.auction_mode || 'single',
    lots: extras.lots ?? [],
    lotCount: extras.lotCount ?? (extras.lots?.length ?? 0),
    documentFee: Number(plain.document_price),
    cpoPercentage: Number(plain.cpo_percentage),
    currency: plain.currency,
    bids: bidCount,
    bidCount,
    assetId: plain.asset_id,
    createdByStaffId: plain.created_by_staff_id,
    createdByName: extras.createdByName ?? null,
    publishedAt: plain.published_at,
    closedAt: plain.closed_at,
    createdAt: plain.created_at,
    createdAtFormatted: formatDateTimeForDetail(plain.created_at),
    updatedAt: plain.updated_at,
  };
}

const BID_COUNT_SQL = `
  SELECT auction_id, COUNT(*) AS bid_count
  FROM bids
  WHERE auction_id IN (:auctionIds)
  GROUP BY auction_id
`;

async function attachBidCounts(auctions) {
  if (!auctions.length) {
    return auctions.map((a) => serializeAuction(a, 0));
  }

  const ids = auctions.map((a) => a.id);
  const rows = await sequelize.query(BID_COUNT_SQL, {
    replacements: { auctionIds: ids },
    type: QueryTypes.SELECT,
  });

  const countMap = new Map(rows.map((row) => [row.auction_id, Number(row.bid_count)]));

  return auctions.map((auction) => serializeAuction(auction, countMap.get(auction.id) || 0));
}

/**
 * @param {{ status?: string, search?: string }} [options]
 */
export async function listAuctions(options = {}) {
  const where = { deleted_at: null };

  if (options.status) {
    const filter = String(options.status).toUpperCase();
    const statusGroups = {
      ACTIVE: ['published'],
      PENDING: ['draft', 'pending_approval'],
      SUSPENDED: ['suspended'],
      CLOSED: ['closed', 'cancelled'],
    };

    if (statusGroups[filter]) {
      where.status = { [Op.in]: statusGroups[filter] };
    }
  }

  if (options.search) {
    const term = `%${options.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { id: { [Op.like]: term } },
    ];
  }

  const auctions = await Auction.findAll({
    where,
    order: [['created_at', 'DESC']],
  });

  const items = await attachBidCounts(auctions);

  return {
    items,
    total: items.length,
  };
}

const BROWSE_DEFAULT_STATUSES = Object.freeze(['published']);
const BROWSE_VISIBLE_STATUSES = Object.freeze(['published', 'suspended', 'closed', 'cancelled']);

/**
 * Published auctions visible to bidders (no draft/pending).
 * @param {{ status?: string, search?: string }} [options]
 */
export async function listBrowseAuctions(options = {}, userId = null) {
  const where = {
    deleted_at: null,
    status: { [Op.in]: BROWSE_DEFAULT_STATUSES },
  };

  if (options.status) {
    const filter = String(options.status).toUpperCase();
    const statusGroups = {
      ACTIVE: ['published'],
      SUSPENDED: ['suspended'],
      CLOSED: ['closed', 'cancelled'],
    };

    if (statusGroups[filter]) {
      where.status = { [Op.in]: statusGroups[filter] };
    }
  }

  if (options.search) {
    const term = `%${options.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { id: { [Op.like]: term } },
    ];
  }

  const auctions = await Auction.findAll({
    where,
    order: [['start_date', 'DESC']],
  });

  let items = (await attachBidCounts(auctions)).map((row) => sanitizeBrowseAuction(row));
  items = await attachUserParticipationSummaries(items, userId);

  return {
    items,
    total: items.length,
  };
}

function sanitizeBrowseAuction(auction, { documentAccess = false } = {}) {
  if (!auction || typeof auction !== 'object') {
    return auction;
  }

  const sanitized = { ...auction };
  if (!documentAccess) {
    sanitized.documents = [];
    sanitized.documentAccess = false;
  } else {
    sanitized.documentAccess = true;
  }
  return sanitized;
}

function buildParticipationSummary({ payment = null, cpo = null, bid = null, bids = [] } = {}) {
  const paymentApproved = payment?.status === 'approved';
  const paymentPending = payment?.status === 'pending';
  const paymentRejected = payment?.status === 'rejected';
  const cpoApproved = cpo?.status === 'approved';
  const cpoPending = cpo?.status === 'pending';
  const cpoRejected = cpo?.status === 'rejected';
  const bidList = bids.length > 0 ? bids : (bid ? [bid] : []);
  const hasBid = bidList.length > 0;

  let participationStatus = 'not_started';
  if (hasBid) {
    participationStatus = 'bid_submitted';
  } else if (cpoApproved) {
    participationStatus = 'bidding_waiting';
  } else if (cpoRejected) {
    participationStatus = 'cpo_rejected';
  } else if (cpoPending) {
    participationStatus = 'cpo_pending';
  } else if (paymentApproved) {
    participationStatus = 'registered';
  } else if (paymentRejected) {
    participationStatus = 'payment_rejected';
  } else if (paymentPending) {
    participationStatus = 'payment_pending';
  }

  return {
    participationStatus,
    isRegisteredBidder: paymentApproved,
    documentAccess: paymentApproved,
    hasBid,
  };
}

function latestRecordByAuction(records) {
  const map = new Map();
  for (const record of records) {
    const auctionId = record.auction_id ?? record.auctionId;
    if (auctionId && !map.has(auctionId)) {
      map.set(auctionId, record);
    }
  }
  return map;
}

async function attachUserParticipationSummaries(items, userId) {
  if (!userId || !items.length) {
    return items;
  }

  const auctionIds = items.map((item) => item.id);
  const [payments, cpos, bids] = await Promise.all([
    Payment.findAll({
      where: { user_id: userId, auction_id: { [Op.in]: auctionIds }, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Cpo.findAll({
      where: { user_id: userId, auction_id: { [Op.in]: auctionIds }, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Bid.findAll({
      where: { user_id: userId, auction_id: { [Op.in]: auctionIds } },
    }),
  ]);

  const paymentByAuction = latestRecordByAuction(payments);
  const cpoByAuction = latestRecordByAuction(cpos);
  const bidsByAuction = new Map();
  for (const bidRecord of bids) {
    const auctionId = bidRecord.auction_id ?? bidRecord.auctionId;
    if (!auctionId) continue;
    if (!bidsByAuction.has(auctionId)) {
      bidsByAuction.set(auctionId, []);
    }
    bidsByAuction.get(auctionId).push(bidRecord);
  }

  return items.map((item) => ({
    ...item,
    myParticipation: buildParticipationSummary({
      payment: paymentByAuction.get(item.id),
      cpo: cpoByAuction.get(item.id),
      bids: bidsByAuction.get(item.id) || [],
    }),
  }));
}

/**
 * @param {string} auctionId
 * @param {string} userId
 */
export async function getAuctionParticipation(auctionId, userId) {
  const auction = await getBrowseAuctionById(auctionId, userId);
  const lots = auction.lots || [];

  const [payment, cpo, bids] = await Promise.all([
    Payment.findOne({
      where: { user_id: userId, auction_id: auctionId, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Cpo.findOne({
      where: { user_id: userId, auction_id: auctionId, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Bid.findAll({ where: { auction_id: auctionId, user_id: userId } }),
  ]);

  const paymentApproved = payment?.status === 'approved';
  const paymentPending = payment?.status === 'pending';
  const paymentRejected = payment?.status === 'rejected';
  const cpoApproved = cpo?.status === 'approved';
  const cpoPending = cpo?.status === 'pending';
  const cpoRejected = cpo?.status === 'rejected';
  const auctionOpen = auction.dbStatus === 'published';
  const inWindow = isWithinBiddingWindow(auction);
  const biddingWindowStatus = getBiddingWindowStatus(auction);

  const selectedLotIds = cpo ? normalizeLotIdList(cpo.selected_auction_asset_ids) : [];
  const bidByLotId = new Map(
    bids
      .filter((bid) => bid.auction_asset_id)
      .map((bid) => [bid.auction_asset_id, bid]),
  );
  const legacyBid = bids.find((bid) => !bid.auction_asset_id) || null;

  const lotParticipation = lots.map((lot) => {
    const selected = selectedLotIds.includes(lot.id);
    const lotBid = bidByLotId.get(lot.id);
    const canPlaceBidOnLot = Boolean(
      cpoApproved && selected && !lotBid && auctionOpen && inWindow,
    );

    return {
      ...lot,
      selected,
      bid: lotBid
        ? {
            id: lotBid.id,
            amount: Number(lotBid.amount),
            status: lotBid.status,
            submittedAt: lotBid.submitted_at,
          }
        : null,
      canPlaceBid: canPlaceBidOnLot,
    };
  });

  const pendingLotIds = selectedLotIds.filter((lotId) => !bidByLotId.has(lotId));
  const hasBid = bids.length > 0;
  const allSelectedBid = selectedLotIds.length > 0
    ? pendingLotIds.length === 0
    : Boolean(legacyBid);

  const summary = buildParticipationSummary({ payment, cpo, bids });
  let participationStatus = summary.participationStatus;

  if (cpoApproved && pendingLotIds.length > 0 && auctionOpen && inWindow) {
    participationStatus = 'ready_to_bid';
  } else if (cpoApproved && allSelectedBid && hasBid) {
    participationStatus = 'bid_submitted';
  } else if (cpoApproved && pendingLotIds.length > 0 && biddingWindowStatus === 'after') {
    participationStatus = 'bidding_closed';
  } else if (cpoApproved && pendingLotIds.length > 0) {
    participationStatus = 'bidding_waiting';
  } else if (cpoApproved && !hasBid && biddingWindowStatus === 'after') {
    participationStatus = 'bidding_closed';
  } else if (cpoApproved && !hasBid) {
    participationStatus = 'bidding_waiting';
  }

  const canPlaceBid = lotParticipation.some((lot) => lot.canPlaceBid)
    || Boolean(cpoApproved && !legacyBid && lots.length === 0 && auctionOpen && inWindow);

  const serializedBids = bids.map((bid) => ({
    id: bid.id,
    auctionAssetId: bid.auction_asset_id ?? null,
    amount: Number(bid.amount),
    status: bid.status,
    submittedAt: bid.submitted_at,
  }));

  return {
    auctionId,
    participationStatus,
    isRegisteredBidder: summary.isRegisteredBidder,
    isMultiLot: lots.length > 1,
    payment: payment
      ? {
          id: payment.id,
          status: payment.status,
          amount: Number(payment.amount),
          rejectionReason: payment.rejection_reason,
          createdAt: payment.created_at,
        }
      : null,
    cpo: cpo
      ? {
          id: cpo.id,
          status: cpo.status,
          rejectionReason: cpo.rejection_reason,
          expiryDate: cpo.expiry_date,
          selectedAuctionAssetIds: selectedLotIds,
          requiredCpoAmount: cpo.required_cpo_amount != null ? Number(cpo.required_cpo_amount) : null,
          declaredCpoAmount: cpo.declared_cpo_amount != null ? Number(cpo.declared_cpo_amount) : null,
          createdAt: cpo.created_at,
        }
      : null,
    bids: serializedBids,
    lotParticipation,
    bid: legacyBid
      ? {
          id: legacyBid.id,
          amount: Number(legacyBid.amount),
          status: legacyBid.status,
          submittedAt: legacyBid.submitted_at,
        }
      : (serializedBids.length === 1 && lots.length <= 1 ? serializedBids[0] : null),
    gates: {
      documentAccess: paymentApproved,
      cpoApproved,
      canSubmitPayment:
        auctionOpen && !paymentApproved && !paymentPending && (!payment || paymentRejected),
      canSubmitCpo: auctionOpen && paymentApproved && !cpoApproved && !cpoPending,
      canPlaceBid,
      inBiddingWindow: inWindow,
      biddingWindowStatus,
      paymentPending,
      cpoPending,
    },
    flags: {
      paymentApproved,
      paymentRejected,
      cpoApproved,
      cpoRejected,
      hasBid,
      allBidsSubmitted: allSelectedBid && hasBid,
      pendingLotCount: pendingLotIds.length,
    },
  };
}

/**
 * @param {string} id
 * @param {string|null} [userId]
 */
export async function getBrowseAuctionById(id, userId = null) {
  const auction = await findAuctionOrThrow(id);

  if (!BROWSE_VISIBLE_STATUSES.includes(auction.status)) {
    throw new AppError('Auction not available', 404, 'AUCTION_NOT_FOUND');
  }

  const lots = await AuctionAsset.findAll({
    where: { auction_id: id },
    include: [
      {
        model: Asset,
        as: 'asset',
        attributes: ['id', 'title', 'asset_type', 'location'],
      },
    ],
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const [serialized] = await attachBidCounts([auction]);
  serialized.lots = lots.map(serializeLot);
  serialized.lotCount = serialized.lots.length;
  serialized.auctionMode = auction.auction_mode || (serialized.lotCount > 1 ? 'multi' : 'single');
  serialized.totalReservePrice = auction.total_reserve_price != null
    ? Number(auction.total_reserve_price)
    : serialized.lots.reduce((sum, lot) => sum + Number(lot.reservePrice || 0), 0);

  let documentAccess = false;

  if (userId) {
    documentAccess = await paymentService.hasApprovedDocumentPayment(userId, id);
  }

  return sanitizeBrowseAuction(serialized, { documentAccess });
}

/**
 * @param {string} id
 */
export async function getAuctionById(id) {
  const auction = await findAuctionOrThrow(id);

  const staff = await Staff.findByPk(auction.created_by_staff_id, {
    attributes: ['id', 'employee_id', 'department'],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name', 'mobile_number'],
      },
    ],
  });

  const lots = await AuctionAsset.findAll({
    where: { auction_id: id },
    include: [
      {
        model: Asset,
        as: 'asset',
        attributes: ['id', 'title', 'asset_type', 'location'],
      },
    ],
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const serializedLots = lots.map(serializeLot);
  const [serialized] = await attachBidCounts([auction]);
  serialized.createdByName = buildStaffDisplayName(staff?.get({ plain: true }));
  serialized.lots = serializedLots;
  serialized.lotCount = serializedLots.length;
  return serialized;
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function updateAuction(id, payload) {
  const auction = await findAuctionOrThrow(id);

  if (auction.status === 'published') {
    if (payload.imageUrls === undefined) {
      throw new AppError('Auction cannot be edited in its current status', 400, 'AUCTION_NOT_EDITABLE');
    }

    const images = normalizeImageUrls(payload.imageUrls);
    await auction.update({ image_urls: images.length > 0 ? images : null });

    await auditService.writeAuditLog({
      action: AUDIT_ACTIONS.UPDATE,
      entityType: 'Auction',
      entityId: auction.id,
      metadata: { title: auction.title, imageOnly: true },
    });

    return getAuctionById(id);
  }

  assertEditableStatus(auction.status);

  validateAuctionFields(payload, { requireDocuments: false });

  const updateData = {};

  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.description !== undefined) updateData.description = payload.description?.trim() || null;
  if (payload.auctionConditions !== undefined) {
    updateData.auction_conditions = payload.auctionConditions?.trim() || null;
  }
  if (payload.startDate !== undefined) updateData.start_date = new Date(payload.startDate);
  if (payload.endDate !== undefined) updateData.end_date = new Date(payload.endDate);
  if (payload.reservePrice !== undefined) updateData.reserve_price = Number(payload.reservePrice);
  if (payload.documentFee !== undefined) updateData.document_price = Number(payload.documentFee);
  if (payload.cpoPercentage !== undefined) updateData.cpo_percentage = Number(payload.cpoPercentage);

  if (payload.imageUrls !== undefined) {
    const images = normalizeImageUrls(payload.imageUrls);
    updateData.image_urls = images.length > 0 ? images : null;
  }

  if (payload.documents !== undefined) {
    const docs = normalizeDocumentFiles(payload.documents);
    if (docs.length === 0) {
      throw new AppError('At least one auction document is required', 400, 'DOCUMENTS_REQUIRED');
    }
    updateData.document_files = docs;
  }

  if (payload.startDate && payload.endDate) {
    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    if (end <= start) {
      throw new AppError('Closing date must be after start date', 400, 'END_BEFORE_START');
    }
  }

  await auction.update(updateData);

  await auditService.writeAuditLog({
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Auction',
    entityId: auction.id,
    metadata: { title: auction.title },
  });

  return getAuctionById(id);
}

async function transitionAuctionStatus(id, allowedFrom, nextStatus, staffId, auditAction) {
  const auction = await findAuctionOrThrow(id);
  const oldStatus = auction.status;

  if (!allowedFrom.includes(oldStatus)) {
    throw new AppError(`Cannot transition from ${oldStatus} to ${nextStatus}`, 400, 'INVALID_STATUS_TRANSITION');
  }

  const updateData = { status: nextStatus };
  const now = new Date();

  if (nextStatus === 'published') {
    updateData.published_at = auction.published_at || now;
  }

  if (nextStatus === 'closed' || nextStatus === 'cancelled') {
    updateData.closed_at = now;
  }

  await auction.update(updateData);

  if (nextStatus === 'published') {
    const lots = await AuctionAsset.findAll({
      where: { auction_id: auction.id },
      attributes: ['asset_id'],
    });
    const lotAssetIds = lots.map((lot) => lot.asset_id).filter(Boolean);

    if (lotAssetIds.length > 0) {
      await Asset.update(
        { status: 'in_auction' },
        { where: { id: { [Op.in]: lotAssetIds }, deleted_at: null } },
      );
    } else if (auction.asset_id) {
      await Asset.update(
        { status: 'in_auction' },
        { where: { id: auction.asset_id, deleted_at: null } },
      );
    }
  }

  await auditService.writeAuditLog({
    staffId: staffId ?? null,
    action: auditAction,
    entityType: 'Auction',
    entityId: auction.id,
    metadata: { from: oldStatus, to: nextStatus },
  });

  return getAuctionById(id);
}

export async function publishAuction(id, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  await assertStaffRole(
    staffId,
    LAUNCH_WORKFLOW_ROLES.AUCTION_PUBLISH,
    'Only super admins can approve and publish auctions',
    'SUPER_ADMIN_REQUIRED',
  );

  return transitionAuctionStatus(
    id,
    ['draft', 'pending_approval'],
    'published',
    staffId,
    AUDIT_ACTIONS.PUBLISH,
  );
}

export async function suspendAuction(id, staffId) {
  return transitionAuctionStatus(
    id,
    ['published', 'pending_approval', 'draft'],
    'suspended',
    staffId,
    AUDIT_ACTIONS.UPDATE,
  );
}

export async function reactivateAuction(id, staffId) {
  return transitionAuctionStatus(
    id,
    ['suspended'],
    'published',
    staffId,
    AUDIT_ACTIONS.UPDATE,
  );
}

export async function closeAuction(id, staffId) {
  const result = await transitionAuctionStatus(
    id,
    ['published', 'suspended'],
    'closed',
    staffId,
    AUDIT_ACTIONS.CLOSE,
  );

  let winnerSelection = {
    winner: null,
    noReserveMet: false,
    noBids: false,
  };

  try {
    winnerSelection = await winnerService.autoSelectWinner(id, staffId);
  } catch (error) {
    console.warn('[auction.service] autoSelectWinner failed:', error.message);
  }

  return {
    ...result,
    winnerSelection,
  };
}

/**
 * Close all published auctions whose end_date has passed.
 * Used by the background auto-close job and safe to call on a schedule.
 */
export async function closeExpiredPublishedAuctions() {
  const now = new Date();
  const expired = await Auction.findAll({
    where: {
      status: 'published',
      deleted_at: null,
      end_date: { [Op.lte]: now },
    },
    attributes: ['id', 'title', 'created_by_staff_id', 'end_date'],
    order: [['end_date', 'ASC']],
  });

  const results = [];

  for (const auction of expired) {
    const plain = auction.get ? auction.get({ plain: true }) : auction;
    try {
      const closeResult = await closeAuction(plain.id, plain.created_by_staff_id);
      results.push({
        auctionId: plain.id,
        title: plain.title,
        success: true,
        winnerSelection: closeResult.winnerSelection,
      });
    } catch (error) {
      results.push({
        auctionId: plain.id,
        title: plain.title,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    scanned: expired.length,
    closed: results.filter((row) => row.success).length,
    failed: results.filter((row) => !row.success).length,
    results,
  };
}

export async function deleteAuction(id, staffId) {
  const auction = await findAuctionOrThrow(id);

  if (!['draft', 'pending_approval', 'suspended'].includes(auction.status)) {
    throw new AppError('Only pending or suspended auctions can be deleted', 400, 'AUCTION_NOT_DELETABLE');
  }

  await auction.destroy();

  await auditService.writeAuditLog({
    staffId: staffId ?? null,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Auction',
    entityId: id,
    metadata: { title: auction.title },
  });

  return { deleted: true, id };
}

export const auctionService = Object.freeze({
  createAuction,
  listAuctions,
  listBrowseAuctions,
  getAuctionById,
  getBrowseAuctionById,
  getAuctionParticipation,
  updateAuction,
  publishAuction,
  suspendAuction,
  reactivateAuction,
  closeAuction,
  closeExpiredPublishedAuctions,
  deleteAuction,
  listEligibleAssetsForAuction,
  mapDisplayStatus,
});

export default auctionService;
