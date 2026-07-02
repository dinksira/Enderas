import { Op } from 'sequelize';
import { Bid } from '../models/bid.model.js';
import { Auction, AuctionAsset, User } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { normalizeLotIdList, computeMinimumBidFromReserve } from '../utils/auction-lot.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { cpoService } from './cpo.service.js';
import { paymentService } from './payment.service.js';

const bidInclude = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'organization_name'],
  },
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'status', 'reserve_price', 'start_date', 'end_date', 'currency'],
  },
];

function buildUserDisplayName(user) {
  if (!user) return null;
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.organization_name
    || user.mobile_number
    || null;
}

function serializeBidListRow(bid) {
  const plain = bid.get ? bid.get({ plain: true }) : bid;
  return {
    id: plain.id,
    auctionId: plain.auction_id,
    auctionAssetId: plain.auction_asset_id ?? null,
    auctionTitle: plain.auction?.title ?? null,
    userId: plain.user_id,
    bidderName: buildUserDisplayName(plain.user),
    amount: Number(plain.amount),
    currency: plain.currency,
    status: plain.status,
    isValid: Boolean(plain.is_valid),
    submittedAt: plain.submitted_at,
    createdAt: plain.created_at,
  };
}

function serializeBidDetail(bid) {
  const row = serializeBidListRow(bid);
  const plain = bid.get ? bid.get({ plain: true }) : bid;
  return {
    ...row,
    invalidReason: plain.invalid_reason,
    auction: plain.auction ? {
      id: plain.auction.id,
      title: plain.auction.title,
      status: plain.auction.status,
      reservePrice: Number(plain.auction.reserve_price),
      startDate: plain.auction.start_date,
      endDate: plain.auction.end_date,
    } : null,
  };
}

async function findBidOrThrow(id) {
  const bid = await Bid.findByPk(id, { include: bidInclude });
  if (!bid) {
    throw new AppError('Bid not found', 404, 'BID_NOT_FOUND');
  }
  return bid;
}

export async function listBids(options = {}, scope = {}) {
  const {
    page = 1,
    limit = 20,
    auctionId = null,
    userId = null,
    status = null,
    search = null,
  } = options;

  const where = {};
  if (auctionId) where.auction_id = auctionId;
  if (status) where.status = status;

  if (!scope.isStaff && !scope.isWildcard && scope.userId) {
    where.user_id = scope.userId;
  } else if (userId) {
    where.user_id = userId;
  }

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number'],
  };

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { '$auction.title$': { [Op.like]: term } },
      { '$user.first_name$': { [Op.like]: term } },
      { '$user.last_name$': { [Op.like]: term } },
      { '$user.mobile_number$': { [Op.like]: term } },
    ];
  }

  const { count, rows } = await Bid.findAndCountAll({
    where,
    include: [
      userInclude,
      { model: Auction, as: 'auction', attributes: ['id', 'title', 'status'] },
    ],
    order: [['submitted_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  return {
    items: rows.map(serializeBidListRow),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };
}

export async function listMyBids(userId, filters = {}) {
  return listBids({ ...filters, userId }, { userId, isStaff: false });
}

export async function listBidsForAuction(auctionId, options = {}) {
  return listBids({ ...options, auctionId }, { isStaff: true, isWildcard: false });
}

export async function getBidById(id, scope = {}) {
  const bid = await findBidOrThrow(id);
  if (!scope.isStaff && !scope.isWildcard && scope.userId && bid.user_id !== scope.userId) {
    throw new AppError('Bid not found', 404, 'BID_NOT_FOUND');
  }
  return serializeBidDetail(bid);
}

export async function placeBid({ auctionId, auctionAssetId, amount }, userId) {
  if (!auctionId) {
    throw new AppError('Auction is required', 400, 'AUCTION_REQUIRED');
  }

  const bidAmount = Number(amount);
  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    throw new AppError('Valid bid amount is required', 400, 'INVALID_BID_AMOUNT');
  }

  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'published') {
    throw new AppError('Auction is not open for bidding', 400, 'AUCTION_NOT_OPEN');
  }

  const now = new Date();
  if (now < new Date(auction.start_date) || now > new Date(auction.end_date)) {
    throw new AppError('Auction is not within the bidding window', 400, 'AUCTION_CLOSED');
  }

  const hasPayment = await paymentService.hasApprovedDocumentPayment(userId, auctionId);
  if (!hasPayment) {
    throw new AppError(
      'Approved document payment required before placing a bid',
      400,
      'PAYMENT_REQUIRED',
    );
  }

  const cpo = await cpoService.getApprovedCpoRecord(userId, auctionId);
  if (!cpo) {
    throw new AppError('Approved CPO required before placing a bid', 400, 'CPO_REQUIRED');
  }

  const lots = await AuctionAsset.findAll({
    where: { auction_id: auctionId },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const selectedLotIds = normalizeLotIdList(cpo.selected_auction_asset_ids);
  let resolvedLotId = auctionAssetId?.trim() || null;

  if (lots.length === 1 && !resolvedLotId) {
    resolvedLotId = lots[0].id;
  }

  if (lots.length > 1 && !resolvedLotId) {
    throw new AppError('Lot selection is required for multi-asset auctions', 400, 'LOT_REQUIRED');
  }

  if (lots.length > 0) {
    const lot = lots.find((entry) => entry.id === resolvedLotId);
    if (!lot) {
      throw new AppError('Selected lot not found in this auction', 404, 'LOT_NOT_FOUND');
    }
    if (selectedLotIds.length > 0 && !selectedLotIds.includes(resolvedLotId)) {
      throw new AppError('Your approved CPO does not cover this lot', 400, 'LOT_NOT_IN_CPO');
    }

    const reservePrice = Number(lot.reserve_price);
    const minimumBid = computeMinimumBidFromReserve(reservePrice, auction.cpo_percentage);
    if (minimumBid > 0 && bidAmount < minimumBid) {
      throw new AppError(`Bid must be at least ${minimumBid}`, 400, 'BID_BELOW_MINIMUM');
    }

    const existing = await Bid.findOne({
      where: { auction_id: auctionId, user_id: userId, auction_asset_id: resolvedLotId },
    });
    if (existing) {
      throw new AppError('You have already placed a bid for this lot', 409, 'BID_EXISTS');
    }

    const bid = await Bid.create({
      id: generateUuid(),
      auction_id: auctionId,
      auction_asset_id: resolvedLotId,
      user_id: userId,
      amount: bidAmount,
      currency: auction.currency || 'ETB',
      submitted_at: now,
      is_valid: true,
      status: 'submitted',
    });

    await auditService.writeAuditLog({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: 'Bid',
      entityId: bid.id,
      metadata: { auctionId, auctionAssetId: resolvedLotId, amount: bidAmount },
    });

    return getBidById(bid.id, { userId, isStaff: false });
  }

  const reservePrice = Number(auction.reserve_price);
  const minimumBid = computeMinimumBidFromReserve(reservePrice, auction.cpo_percentage);
  if (minimumBid > 0 && bidAmount < minimumBid) {
    throw new AppError(`Bid must be at least ${minimumBid}`, 400, 'BID_BELOW_MINIMUM');
  }

  const existing = await Bid.findOne({ where: { auction_id: auctionId, user_id: userId } });
  if (existing) {
    throw new AppError('You have already placed a bid for this auction', 409, 'BID_EXISTS');
  }

  const bid = await Bid.create({
    id: generateUuid(),
    auction_id: auctionId,
    user_id: userId,
    amount: bidAmount,
    currency: auction.currency || 'ETB',
    submitted_at: now,
    is_valid: true,
    status: 'submitted',
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Bid',
    entityId: bid.id,
    metadata: { auctionId, amount: bidAmount },
  });

  return getBidById(bid.id, { userId, isStaff: false });
}

export async function invalidateBid(id, reason, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const invalidReason = reason?.trim();
  if (!invalidReason) {
    throw new AppError('Invalidation reason is required', 400, 'REASON_REQUIRED');
  }

  const bid = await findBidOrThrow(id);
  if (!bid.is_valid) {
    throw new AppError('Bid is already invalid', 400, 'BID_ALREADY_INVALID');
  }

  await bid.update({
    is_valid: false,
    status: 'invalid',
    invalid_reason: invalidReason,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: bid.user_id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Bid',
    entityId: id,
    metadata: { action: 'invalidate', reason: invalidReason },
  });

  return getBidById(id, { isStaff: true });
}

export async function getHighestValidBid(auctionId) {
  return Bid.findOne({
    where: { auction_id: auctionId, is_valid: true, status: 'submitted', auction_asset_id: null },
    order: [['amount', 'DESC'], ['submitted_at', 'ASC']],
    include: bidInclude,
  });
}

export async function getHighestValidBidForLot(auctionId, auctionAssetId) {
  return Bid.findOne({
    where: {
      auction_id: auctionId,
      auction_asset_id: auctionAssetId,
      is_valid: true,
      status: 'submitted',
    },
    order: [['amount', 'DESC'], ['submitted_at', 'ASC']],
    include: bidInclude,
  });
}

export const bidService = Object.freeze({
  listBids,
  listMyBids,
  listBidsForAuction,
  getBidById,
  placeBid,
  invalidateBid,
  getHighestValidBid,
  getHighestValidBidForLot,
});

export default bidService;
