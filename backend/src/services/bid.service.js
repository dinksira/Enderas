import { Op } from 'sequelize';
import { Bid } from '../models/bid.model.js';
import { BidDraft } from '../models/bidDraft.model.js';
import { Cpo } from '../models/cpo.model.js';
import { CpoPayment } from '../models/cpoPayment.model.js';
import { Auction, AuctionAsset, User } from '../models/index.js';
import { sequelize } from '../config/db.config.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { normalizeLotIdList, computeMinimumBidFromReserve, computeCpoFromBidAndReserve } from '../utils/auction-lot.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { cpoService } from './cpo.service.js';
import { paymentService } from './payment.service.js';
import { notificationService } from './notification.service.js';
import { assertNotAuctionOwner } from '../utils/auction-owner.util.js';

const bidInclude = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'organization_name'],
  },
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'status', 'reserve_price', 'start_date', 'end_date', 'currency', 'image_urls'],
  },
];

function resolveAuctionCoverImage(imageUrls) {
  if (!Array.isArray(imageUrls)) {
    return null;
  }
  const first = imageUrls.find((url) => typeof url === 'string' && url.length > 0);
  return first ?? null;
}

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
    auctionImageUrl: resolveAuctionCoverImage(plain.auction?.image_urls),
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
      { model: Auction, as: 'auction', attributes: ['id', 'title', 'status', 'image_urls'] },
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

  await assertNotAuctionOwner(userId, auctionId);

  const now = new Date();
  if (now < new Date(auction.start_date) || now > new Date(auction.end_date)) {
    throw new AppError('Auction is not within the bidding window', 400, 'AUCTION_CLOSED');
  }

  const isOwner = await auctionService.isUserAssetOwnerOfAuction(userId, auctionId);
  if (isOwner) {
    throw new AppError('You cannot bid on your own asset auction', 403, 'SELF_BID_FORBIDDEN');
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
    const minimumBid = computeMinimumBidFromReserve(reservePrice);
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
  const minimumBid = computeMinimumBidFromReserve(reservePrice);
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

export async function submitBidWithCpo({ auctionId, bids, cpoDocumentUrl, transactionReference }, userId) {
  if (!auctionId) {
    throw new AppError('Auction is required', 400, 'AUCTION_REQUIRED');
  }
  if (!Array.isArray(bids) || bids.length === 0) {
    throw new AppError('At least one bid is required', 400, 'BIDS_REQUIRED');
  }
  if (!cpoDocumentUrl?.trim()) {
    throw new AppError('CPO receipt upload is required', 400, 'RECEIPT_REQUIRED');
  }

  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'published') {
    throw new AppError('Auction is not open for bidding', 400, 'AUCTION_NOT_PUBLISHED');
  }

  await assertNotAuctionOwner(userId, auctionId);

  const now = new Date();
  if (now < new Date(auction.start_date)) {
    throw new AppError('Auction has not started yet', 400, 'AUCTION_NOT_STARTED');
  }
  if (now > new Date(auction.end_date)) {
    throw new AppError('Auction has already ended', 400, 'AUCTION_ENDED');
  }

  const isOwner = await auctionService.isUserAssetOwnerOfAuction(userId, auctionId);
  if (isOwner) {
    throw new AppError('You cannot bid on your own asset auction', 403, 'SELF_BID_FORBIDDEN');
  }

  const hasPayment = await paymentService.hasApprovedDocumentPayment(userId, auctionId);
  if (!hasPayment) {
    throw new AppError('Approved document payment required', 400, 'PAYMENT_REQUIRED');
  }

  const existing = await Cpo.findOne({
    where: { user_id: userId, auction_id: auctionId, deleted_at: null },
    order: [['created_at', 'DESC']],
  });
  if (existing && existing.status !== 'rejected') {
    throw new AppError('CPO already submitted for this auction', 409, 'CPO_EXISTS');
  }

  const lots = await AuctionAsset.findAll({
    where: { auction_id: auctionId },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const lotMap = new Map(lots.map(l => [l.id, l]));
  const cpoPercentage = Number(auction.cpo_percentage);
  let totalDeposit = 0;
  const validatedBids = [];

  for (const entry of bids) {
    if (!entry.auctionAssetId) {
      throw new AppError('auctionAssetId is required for each bid', 400, 'ASSET_ID_REQUIRED');
    }

    const lot = lotMap.get(entry.auctionAssetId);
    if (!lot) {
      throw new AppError(`Asset ${entry.auctionAssetId} not found in this auction`, 404, 'ASSET_NOT_FOUND');
    }

    const amount = Number(entry.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(`Invalid bid amount for asset ${entry.auctionAssetId}`, 400, 'INVALID_BID_AMOUNT');
    }

    const reservePrice = Number(lot.reserve_price);
    const minimumBid = computeMinimumBidFromReserve(reservePrice);
    if (amount < minimumBid) {
      throw new AppError(
        `Bid for "${lot.lot_label || 'asset'}" must be at least ${minimumBid} (asset reserve price)`,
        400,
        'BID_BELOW_MINIMUM',
      );
    }

    const existingBid = await Bid.findOne({
      where: { auction_id: auctionId, user_id: userId, auction_asset_id: entry.auctionAssetId },
    });
    if (existingBid) {
      throw new AppError(
        `You already have a bid for this asset`,
        409,
        'BID_EXISTS',
      );
    }

    const deposit = computeCpoFromBidAndReserve(amount, reservePrice, cpoPercentage);
    totalDeposit += deposit;

    validatedBids.push({
      auctionAssetId: entry.auctionAssetId,
      amount,
      reservePrice,
      deposit,
    });
  }

  const cpoId = generateUuid();
  const proposedBids = validatedBids.map(b => ({
    auctionAssetId: b.auctionAssetId,
    amount: b.amount,
  }));

  await sequelize.transaction(async (transaction) => {
    await Cpo.create({
      id: cpoId,
      user_id: userId,
      auction_id: auctionId,
      document_url: cpoDocumentUrl.trim(),
      status: 'pending',
      deposit_amount: totalDeposit > 0 ? totalDeposit : null,
      selected_auction_asset_ids: validatedBids.map(b => b.auctionAssetId),
      required_cpo_amount: totalDeposit > 0 ? totalDeposit : null,
      proposed_bids: proposedBids,
    }, { transaction });

    await CpoPayment.create({
      id: generateUuid(),
      cpo_id: cpoId,
      user_id: userId,
      auction_id: auctionId,
      amount: totalDeposit,
      currency: auction.currency || 'ETB',
      payment_method: 'manual',
      receipt_url: cpoDocumentUrl.trim(),
      transaction_reference: transactionReference?.trim() || null,
      status: 'pending',
    }, { transaction });

    for (const bid of validatedBids) {
      const where = {
        user_id: userId,
        auction_id: auctionId,
        auction_asset_id: bid.auctionAssetId,
      };
      const existingDraft = await BidDraft.findOne({ where, transaction });

      if (existingDraft) {
        await existingDraft.update(
          { amount: bid.amount, status: 'locked', cpo_id: cpoId },
          { transaction },
        );
      } else {
        await BidDraft.create({
          id: generateUuid(),
          user_id: userId,
          auction_id: auctionId,
          auction_asset_id: bid.auctionAssetId,
          amount: bid.amount,
          status: 'locked',
          cpo_id: cpoId,
        }, { transaction });
      }
    }
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Cpo',
    entityId: cpoId,
    metadata: { auctionId, depositAmount: totalDeposit, bidCount: validatedBids.length },
  });

  await notificationService.notifyFinanceOfficersCpoDepositPending({
    cpoId,
    bidderName: null,
    auctionTitle: auction.title,
    amount: totalDeposit,
  });

  return {
    cpo: {
      id: cpoId,
      status: 'pending',
      depositAmount: totalDeposit,
    },
    bidDrafts: validatedBids.map(b => ({
      auctionAssetId: b.auctionAssetId,
      amount: b.amount,
      status: 'locked',
    })),
  };
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
  submitBidWithCpo,
});

export default bidService;
