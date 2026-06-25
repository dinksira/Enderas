import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { Auction, AUCTION_CATEGORIES } from '../models/auction.model.js';
import { Bid } from '../models/bid.model.js';
import { Payment } from '../models/payment.model.js';
import { Cpo } from '../models/cpo.model.js';
import { Staff, User } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { winnerService } from './winner.service.js';
import { paymentService } from './payment.service.js';
import { settingsService } from './settings.service.js';

const DISPLAY_STATUS_MAP = Object.freeze({
  published: 'ACTIVE',
  draft: 'PENDING',
  pending_approval: 'PENDING',
  suspended: 'SUSPENDED',
  closed: 'CLOSED',
  cancelled: 'CLOSED',
});

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

function buildAuctionDocumentsFromAsset(asset) {
  const docs = [];

  if (asset.ownership_document_url) {
    docs.push({
      name: 'Ownership Document',
      url: asset.ownership_document_url,
      size: 0,
    });
  }

  const additional = Array.isArray(asset.additional_document_urls)
    ? asset.additional_document_urls
    : [];

  for (const doc of additional) {
    if (typeof doc === 'string' && doc.trim()) {
      docs.push({ name: 'Supporting Document', url: doc.trim(), size: 0 });
      continue;
    }

    if (doc?.url) {
      docs.push({
        name: doc.name || doc.fileName || 'Supporting Document',
        url: doc.url,
        size: Number(doc.size) || 0,
      });
    }
  }

  return normalizeDocumentFiles(docs);
}

function defaultAuctionWindowDates() {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
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

  const reserve = Number(reservePrice);
  if (!Number.isFinite(reserve) || reserve <= 0) {
    throw new AppError('Reserve price must be a positive number', 400, 'INVALID_RESERVE_PRICE');
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

  const auction = await Auction.create({
    id: generateUuid(),
    asset_id: assetId || null,
    created_by_staff_id: staffId,
    title: title.trim(),
    category,
    description: description?.trim() || null,
    auction_conditions: auctionConditions?.trim() || null,
    image_urls: normalizedImages.length > 0 ? normalizedImages : null,
    document_files: normalizedDocuments,
    start_date: start,
    end_date: end,
    reserve_price: reserve,
    document_price: docFee,
    cpo_percentage: cpo,
    currency: 'ETB',
    status: 'pending_approval',
  });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Auction',
    entityId: auction.id,
    metadata: { title: auction.title, category: auction.category },
  });

  return serializeAuction(auction, 0);
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
    imageUrls: plain.image_urls || [],
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

const BROWSE_VISIBLE_STATUSES = Object.freeze(['published', 'suspended', 'closed', 'cancelled']);

/**
 * Published auctions visible to bidders (no draft/pending).
 * @param {{ status?: string, search?: string }} [options]
 */
export async function listBrowseAuctions(options = {}, userId = null) {
  const where = {
    deleted_at: null,
    status: { [Op.in]: BROWSE_VISIBLE_STATUSES },
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

function buildParticipationSummary({ payment = null, cpo = null, bid = null } = {}) {
  const paymentApproved = payment?.status === 'approved';
  const paymentPending = payment?.status === 'pending';
  const paymentRejected = payment?.status === 'rejected';
  const cpoApproved = cpo?.status === 'approved';
  const cpoPending = cpo?.status === 'pending';
  const cpoRejected = cpo?.status === 'rejected';
  const hasBid = Boolean(bid);

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
  const bidByAuction = latestRecordByAuction(bids);

  return items.map((item) => ({
    ...item,
    myParticipation: buildParticipationSummary({
      payment: paymentByAuction.get(item.id),
      cpo: cpoByAuction.get(item.id),
      bid: bidByAuction.get(item.id),
    }),
  }));
}

/**
 * @param {string} auctionId
 * @param {string} userId
 */
export async function getAuctionParticipation(auctionId, userId) {
  const auction = await getBrowseAuctionById(auctionId, userId);

  const [payment, cpo, bid] = await Promise.all([
    Payment.findOne({
      where: { user_id: userId, auction_id: auctionId, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Cpo.findOne({
      where: { user_id: userId, auction_id: auctionId, deleted_at: null },
      order: [['created_at', 'DESC']],
    }),
    Bid.findOne({ where: { auction_id: auctionId, user_id: userId } }),
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

  const summary = buildParticipationSummary({ payment, cpo, bid });
  let participationStatus = summary.participationStatus;
  if (cpoApproved && !bid && auctionOpen && inWindow) {
    participationStatus = 'ready_to_bid';
  } else if (cpoApproved && !bid && biddingWindowStatus === 'after') {
    participationStatus = 'bidding_closed';
  } else if (cpoApproved && !bid) {
    participationStatus = 'bidding_waiting';
  }

  return {
    auctionId,
    participationStatus,
    isRegisteredBidder: summary.isRegisteredBidder,
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
          createdAt: cpo.created_at,
        }
      : null,
    bid: bid
      ? {
          id: bid.id,
          amount: Number(bid.amount),
          status: bid.status,
          submittedAt: bid.submitted_at,
        }
      : null,
    gates: {
      documentAccess: paymentApproved,
      canSubmitPayment:
        auctionOpen && !paymentApproved && !paymentPending && (!payment || paymentRejected),
      canSubmitCpo: auctionOpen && paymentApproved && !cpoApproved && !cpoPending,
      canPlaceBid: auctionOpen && inWindow && cpoApproved && !bid,
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
      hasBid: Boolean(bid),
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

  const [serialized] = await attachBidCounts([auction]);
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

  const [serialized] = await attachBidCounts([auction]);
  serialized.createdByName = buildStaffDisplayName(staff?.get({ plain: true }));
  return serialized;
}

/**
 * @param {string} id
 * @param {object} payload
 */
export async function updateAuction(id, payload) {
  const auction = await findAuctionOrThrow(id);
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

  try {
    await winnerService.autoSelectWinner(id, staffId);
  } catch (error) {
    console.warn('[auction.service] autoSelectWinner failed:', error.message);
  }

  return result;
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

/**
 * When an auction request (asset) is approved, create and publish a linked auction
 * so it appears in browse and admin auction lists.
 * @param {import('sequelize').Model} asset
 * @param {string} staffId
 */
export async function createPublishedAuctionFromApprovedAsset(asset, staffId) {
  const plain = asset.get ? asset.get({ plain: true }) : asset;

  const existing = await Auction.findOne({
    where: { asset_id: plain.id, deleted_at: null },
  });

  if (existing) {
    if (existing.status !== 'published') {
      await transitionAuctionStatus(
        existing.id,
        ['draft', 'pending_approval', 'suspended'],
        'published',
        staffId,
        AUDIT_ACTIONS.PUBLISH,
      );
    }
    return existing;
  }

  const reserve = Number(plain.desired_reserve_price);
  if (!Number.isFinite(reserve) || reserve <= 0) {
    throw new AppError(
      'Asset must have a valid desired reserve price before approval',
      400,
      'INVALID_RESERVE_PRICE',
    );
  }

  const documents = buildAuctionDocumentsFromAsset(plain);
  if (documents.length === 0) {
    throw new AppError(
      'Asset must include ownership or supporting documents before approval',
      400,
      'DOCUMENTS_REQUIRED',
    );
  }

  const cpoPercentage = Number(await settingsService.getSetting('auction.default_cpo_percentage'));
  const { start, end } = defaultAuctionWindowDates();
  const imageUrls = normalizeImageUrls(plain.image_urls);

  const auction = await Auction.create({
    id: generateUuid(),
    asset_id: plain.id,
    created_by_staff_id: staffId,
    title: plain.title.trim(),
    category: mapAssetTypeToAuctionCategory(plain.asset_type),
    description: plain.description?.trim() || null,
    auction_conditions: plain.auction_conditions?.trim() || null,
    image_urls: imageUrls.length > 0 ? imageUrls : null,
    document_files: documents,
    start_date: start,
    end_date: end,
    reserve_price: reserve,
    document_price: 0,
    cpo_percentage: Number.isFinite(cpoPercentage) && cpoPercentage >= 1 ? cpoPercentage : 1,
    currency: 'ETB',
    status: 'published',
  });

  await auditService.writeAuditLog({
    staffId,
    action: AUDIT_ACTIONS.PUBLISH,
    entityType: 'Auction',
    entityId: auction.id,
    metadata: {
      title: auction.title,
      assetId: plain.id,
      source: 'asset_request_approval',
    },
  });

  return auction;
}

export const auctionService = Object.freeze({
  createAuction,
  createPublishedAuctionFromApprovedAsset,
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
  deleteAuction,
  mapDisplayStatus,
});

export default auctionService;
