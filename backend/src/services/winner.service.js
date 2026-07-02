import { Op } from 'sequelize';
import { Winner, WINNER_STATUSES } from '../models/winner.model.js';
import { Auction, AuctionAsset, Bid, User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { bidService } from './bid.service.js';

const BID_AMOUNT_VIEWER_ROLES = Object.freeze(['super_admin', 'auction_manager']);

const winnerInclude = [
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'status', 'category', 'reserve_price', 'end_date', 'closed_at'],
  },
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'user_type', 'organization_name'],
  },
  {
    model: Staff,
    as: 'selectedByStaff',
    required: false,
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
  },
];

function buildUserDisplayName(user) {
  if (!user) return null;
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.organization_name
    || user.mobile_number
    || null;
}

function buildStaffDisplayName(staff) {
  if (!staff?.user) return staff?.employee_id || null;
  return buildUserDisplayName(staff.user) || staff.employee_id || null;
}

export function canViewBidAmounts(roleCode) {
  return BID_AMOUNT_VIEWER_ROLES.includes(String(roleCode || ''));
}

function maskBidAmount(amount, roleCode) {
  if (canViewBidAmounts(roleCode)) {
    return amount != null ? Number(amount) : null;
  }
  return null;
}

function buildTabWhere(tab) {
  if (!tab || tab === 'all') return {};
  if (WINNER_STATUSES.includes(tab)) return { status: tab };
  return {};
}

async function getWinnerStats() {
  const baseWhere = { deleted_at: null };
  const [all, pendingConfirmation, confirmed, declined, replaced] = await Promise.all([
    Winner.count({ where: baseWhere }),
    Winner.count({ where: { ...baseWhere, status: 'pending_confirmation' } }),
    Winner.count({ where: { ...baseWhere, status: 'confirmed' } }),
    Winner.count({ where: { ...baseWhere, status: 'declined' } }),
    Winner.count({ where: { ...baseWhere, status: 'replaced' } }),
  ]);

  return {
    all,
    pending_confirmation: pendingConfirmation,
    confirmed,
    declined,
    replaced,
  };
}

function formatDateForList(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function serializeWinnerListRow(winner, roleCode) {
  const plain = winner.get ? winner.get({ plain: true }) : winner;
  const bidAmount = plain.winningBid?.amount ?? plain.bid?.amount ?? null;

  return {
    id: plain.id,
    auctionId: plain.auction_id,
    auctionTitle: plain.auction?.title ?? null,
    auctionCategory: plain.auction?.category ?? null,
    userId: plain.user_id,
    winnerName: buildUserDisplayName(plain.user),
    winnerMobile: plain.user?.mobile_number ?? null,
    bidId: plain.bid_id,
    bidAmount: maskBidAmount(bidAmount, roleCode),
    bidAmountMasked: !canViewBidAmounts(roleCode),
    status: plain.status,
    selectionMethod: plain.selection_method ?? 'manual',
    selectedAt: plain.selected_at,
    selectedAtFormatted: formatDateForList(plain.selected_at),
    selectedByName: buildStaffDisplayName(plain.selectedByStaff),
  };
}

async function getBidSummaryForAuction(auctionId, roleCode) {
  const validBids = await Bid.findAll({
    where: { auction_id: auctionId, is_valid: true, status: 'submitted' },
    order: [['amount', 'DESC'], ['submitted_at', 'ASC']],
    attributes: ['id', 'amount', 'submitted_at'],
  });

  const totalValidBids = validBids.length;
  const secondHighest = validBids.length > 1 ? Number(validBids[1].amount) : null;

  return {
    totalValidBids,
    secondHighestBidAmount: canViewBidAmounts(roleCode) ? secondHighest : null,
    canViewAmounts: canViewBidAmounts(roleCode),
  };
}

async function serializeWinnerDetail(winner, roleCode) {
  const row = serializeWinnerListRow(winner, roleCode);
  const plain = winner.get ? winner.get({ plain: true }) : winner;
  const bid = await bidService.getBidById(plain.bid_id, { isStaff: true });
  const bidSummary = await getBidSummaryForAuction(plain.auction_id, roleCode);

  return {
    ...row,
    declineReason: plain.decline_reason,
    declinedAt: plain.declined_at,
    notificationSentAt: plain.notification_sent_at,
    bidAmount: maskBidAmount(bid.amount, roleCode),
    bidAmountMasked: !canViewBidAmounts(roleCode),
    bid: {
      id: bid.id,
      amount: maskBidAmount(bid.amount, roleCode),
      amountMasked: !canViewBidAmounts(roleCode),
      submittedAt: bid.submittedAt,
      isValid: bid.isValid,
      status: bid.status,
    },
    auction: plain.auction
      ? {
          id: plain.auction.id,
          title: plain.auction.title,
          category: plain.auction.category,
          status: plain.auction.status,
          reservePrice: Number(plain.auction.reserve_price),
          endDate: plain.auction.end_date,
          closedAt: plain.auction.closed_at,
        }
      : null,
    winner: plain.user
      ? {
          id: plain.user.id,
          name: buildUserDisplayName(plain.user),
          mobileNumber: plain.user.mobile_number,
          userType: plain.user.user_type,
          organizationName: plain.user.organization_name,
        }
      : null,
    bidSummary,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
}

async function findWinnerOrThrow(id) {
  const winner = await Winner.findOne({
    where: { id, deleted_at: null },
    include: [
      ...winnerInclude,
      {
        model: Bid,
        as: 'winningBid',
        attributes: ['id', 'amount', 'submitted_at', 'is_valid', 'status'],
        required: false,
      },
    ],
  });
  if (!winner) {
    throw new AppError('Winner record not found', 404, 'WINNER_NOT_FOUND');
  }
  return winner;
}

async function findActiveWinnerForLot(auctionId, auctionAssetId = null) {
  const where = {
    auction_id: auctionId,
    deleted_at: null,
    status: { [Op.in]: ['pending_confirmation', 'confirmed'] },
  };

  if (auctionAssetId) {
    where.auction_asset_id = auctionAssetId;
  } else {
    where.auction_asset_id = { [Op.is]: null };
  }

  return Winner.findOne({ where });
}

async function findActiveWinnerForAuction(auctionId) {
  return findActiveWinnerForLot(auctionId, null);
}

async function resolveStaffIdForAutoSelection(auction, staffId) {
  if (staffId) {
    return staffId;
  }

  if (auction?.created_by_staff_id) {
    return auction.created_by_staff_id;
  }

  const fallbackStaff = await Staff.findOne({
    where: { is_active: true },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id'],
        where: { status: 'active', deleted_at: null },
        required: true,
      },
    ],
    order: [['created_at', 'ASC']],
    attributes: ['id'],
  });

  return fallbackStaff?.id ?? null;
}

async function markLotOutcome(auctionAssetId, outcomeStatus) {
  if (!auctionAssetId) {
    return;
  }

  await AuctionAsset.update(
    { outcome_status: outcomeStatus },
    { where: { id: auctionAssetId } },
  );
}

async function createWinnerRecord({
  auctionId,
  bidId,
  userId,
  staffId,
  auctionAssetId = null,
  selectionMethod = 'manual',
  auctionTitle = null,
  lotLabel = null,
  bidAmount = null,
}) {
  const active = await findActiveWinnerForLot(auctionId, auctionAssetId);
  if (active) {
    throw new AppError('Winner already selected for this auction lot', 409, 'WINNER_EXISTS');
  }

  const now = new Date();
  const winner = await Winner.create({
    id: generateUuid(),
    auction_id: auctionId,
    bid_id: bidId,
    auction_asset_id: auctionAssetId,
    user_id: userId,
    selected_by_staff_id: staffId,
    selected_at: now,
    status: 'pending_confirmation',
    selection_method: selectionMethod,
    notification_sent_at: now,
  });

  await notificationService.sendWinnerAnnouncement(userId, auctionId, auctionTitle, {
    lotLabel,
    bidAmount,
  });

  return winner;
}

export async function listWinners(options = {}, roleCode = null) {
  const {
    page = 1,
    limit = 20,
    tab = null,
    status = null,
    auctionId = null,
    search = null,
    includeStats = false,
  } = options;

  const where = { deleted_at: null, ...buildTabWhere(tab) };
  if (status && !tab) where.status = status;
  if (auctionId) where.auction_id = auctionId;

  const auctionInclude = {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'category'],
  };

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'organization_name'],
  };

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { '$user.first_name$': { [Op.like]: term } },
      { '$user.last_name$': { [Op.like]: term } },
      { '$user.mobile_number$': { [Op.like]: term } },
      { '$auction.title$': { [Op.like]: term } },
    ];
  }

  const { count, rows } = await Winner.findAndCountAll({
    where,
    include: [
      userInclude,
      auctionInclude,
      {
        model: Staff,
        as: 'selectedByStaff',
        required: false,
        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
      },
      {
        model: Bid,
        as: 'winningBid',
        attributes: ['id', 'amount'],
        required: false,
      },
    ],
    order: [['selected_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    items: rows.map((row) => serializeWinnerListRow(row, roleCode)),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };

  if (includeStats) {
    result.stats = await getWinnerStats();
  }

  return result;
}

export async function getWinnerById(id, roleCode = null) {
  const winner = await findWinnerOrThrow(id);
  return serializeWinnerDetail(winner, roleCode);
}

export async function getWinnersForAuction(auctionId, roleCode = null) {
  const rows = await Winner.findAll({
    where: { auction_id: auctionId, deleted_at: null },
    include: [
      ...winnerInclude,
      {
        model: Bid,
        as: 'winningBid',
        attributes: ['id', 'amount', 'submitted_at'],
        required: false,
      },
    ],
    order: [['selected_at', 'DESC']],
  });

  return {
    items: await Promise.all(rows.map((row) => serializeWinnerDetail(row, roleCode))),
  };
}

export async function selectWinner({ auctionId, bidId }, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'closed') {
    throw new AppError('Winner can only be selected for closed auctions', 400, 'AUCTION_NOT_CLOSED');
  }

  const bid = await bidService.getBidById(bidId, { isStaff: true });
  if (bid.auctionId !== auctionId) {
    throw new AppError('Bid does not belong to this auction', 400, 'BID_AUCTION_MISMATCH');
  }
  if (!bid.isValid || bid.status !== 'submitted') {
    throw new AppError('Cannot select an invalid bid', 400, 'BID_INVALID');
  }

  const winner = await createWinnerRecord({
    auctionId,
    bidId,
    userId: bid.userId,
    staffId,
    auctionAssetId: bid.auctionAssetId ?? null,
    selectionMethod: 'manual',
    auctionTitle: auction.title,
    lotLabel: bid.auctionAsset?.lotLabel ?? bid.auctionAsset?.lot_label ?? null,
    bidAmount: bid.amount,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: bid.userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Winner',
    entityId: winner.id,
    metadata: { auctionId, bidId, manual: true },
  });

  return getWinnerById(winner.id, 'super_admin');
}

export async function autoSelectWinner(auctionId, staffId) {
  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    return { winner: null, winners: [], noReserveMet: false, noBids: true };
  }

  const resolvedStaffId = await resolveStaffIdForAutoSelection(auction, staffId);
  if (!resolvedStaffId) {
    return {
      winner: null,
      winners: [],
      noReserveMet: false,
      noBids: false,
      staffRequired: true,
    };
  }

  const lots = await AuctionAsset.findAll({
    where: { auction_id: auctionId },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  const targets = lots.length > 0
    ? lots.map((lot) => ({
        lotId: lot.id,
        reserve: Number(lot.reserve_price),
        lotLabel: lot.lot_label || null,
      }))
    : [{
        lotId: null,
        reserve: Number(auction.reserve_price),
        lotLabel: null,
      }];

  const winners = [];
  let sawBid = false;

  for (const target of targets) {
    const existing = await findActiveWinnerForLot(auctionId, target.lotId);
    if (existing) {
      winners.push(await getWinnerById(existing.id, 'super_admin'));
      sawBid = true;
      continue;
    }

    const highestBid = target.lotId
      ? await bidService.getHighestValidBidForLot(auctionId, target.lotId)
      : await bidService.getHighestValidBid(auctionId);

    if (!highestBid) {
      await markLotOutcome(target.lotId, 'unsold');
      continue;
    }

    sawBid = true;
    const amount = Number(highestBid.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      await markLotOutcome(target.lotId, 'unsold');
      continue;
    }

    const winner = await createWinnerRecord({
      auctionId,
      bidId: highestBid.id,
      userId: highestBid.user_id,
      staffId: resolvedStaffId,
      auctionAssetId: target.lotId,
      selectionMethod: 'auto',
      auctionTitle: auction.title,
      lotLabel: target.lotLabel,
      bidAmount: amount,
    });

    await markLotOutcome(target.lotId, 'sold');

    await auditService.writeAuditLog({
      staffId: resolvedStaffId,
      userId: highestBid.user_id,
      action: AUDIT_ACTIONS.CREATE,
      entityType: 'Winner',
      entityId: winner.id,
      metadata: {
        auctionId,
        bidId: highestBid.id,
        auctionAssetId: target.lotId,
        auto: true,
      },
    });

    winners.push(await getWinnerById(winner.id, 'super_admin'));
  }

  if (!sawBid) {
    await auditService.writeAuditLog({
      staffId: resolvedStaffId ?? null,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: 'Auction',
      entityId: auctionId,
      metadata: { action: 'auto_select_winner', outcome: 'no_bids' },
    });
  }

  return {
    winners,
    winner: winners[0] ?? null,
    noReserveMet: false,
    noBids: !sawBid && winners.length === 0,
  };
}

export async function confirmWinner(id, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const winner = await findWinnerOrThrow(id);
  if (winner.status !== 'pending_confirmation') {
    throw new AppError('Winner is not pending confirmation', 400, 'INVALID_WINNER_STATUS');
  }

  await winner.update({ status: 'confirmed' });

  await notificationService.sendWinnerConfirmed(
    winner.user_id,
    winner.auction_id,
    winner.auction?.title,
  );

  await auditService.writeAuditLog({
    staffId,
    userId: winner.user_id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Winner',
    entityId: id,
    metadata: { action: 'confirm' },
  });

  return getWinnerById(id, 'super_admin');
}

export async function declineWinner(id, declineReason, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const reason = declineReason?.trim();
  if (!reason) {
    throw new AppError('Decline reason is required', 400, 'DECLINE_REASON_REQUIRED');
  }

  const winner = await findWinnerOrThrow(id);
  if (!['pending_confirmation', 'confirmed'].includes(winner.status)) {
    throw new AppError('Winner cannot be declined in its current status', 400, 'INVALID_WINNER_STATUS');
  }

  const now = new Date();
  await winner.update({ status: 'declined', decline_reason: reason, declined_at: now });

  await auditService.writeAuditLog({
    staffId,
    userId: winner.user_id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Winner',
    entityId: id,
    metadata: { action: 'decline', reason },
  });

  return getWinnerById(id, 'super_admin');
}

export async function replaceWinner(id, bidId, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const declinedWinner = await findWinnerOrThrow(id);
  if (declinedWinner.status !== 'declined') {
    throw new AppError('Replacement is only available for declined winners', 400, 'INVALID_WINNER_STATUS');
  }

  const auctionId = declinedWinner.auction_id;
  const auctionAssetId = declinedWinner.auction_asset_id ?? null;
  const active = await findActiveWinnerForLot(auctionId, auctionAssetId);
  if (active) {
    throw new AppError('An active winner already exists for this auction lot', 409, 'WINNER_EXISTS');
  }

  const bid = await bidService.getBidById(bidId, { isStaff: true });
  if (bid.auctionId !== auctionId) {
    throw new AppError('Bid does not belong to this auction', 400, 'BID_AUCTION_MISMATCH');
  }
  if (!bid.isValid || bid.status !== 'submitted') {
    throw new AppError('Cannot select an invalid bid', 400, 'BID_INVALID');
  }
  if (bid.id === declinedWinner.bid_id) {
    throw new AppError('Select a different bid as the replacement winner', 400, 'SAME_BID');
  }

  const auction = await Auction.findByPk(auctionId, { attributes: ['title'] });
  const winner = await createWinnerRecord({
    auctionId,
    bidId,
    userId: bid.userId,
    staffId,
    auctionAssetId: bid.auctionAssetId ?? auctionAssetId,
    selectionMethod: 'manual',
    auctionTitle: auction?.title,
    lotLabel: bid.auctionAsset?.lotLabel ?? bid.auctionAsset?.lot_label ?? null,
    bidAmount: bid.amount,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: bid.userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Winner',
    entityId: winner.id,
    metadata: { auctionId, bidId, replacedFrom: id },
  });

  return getWinnerById(winner.id, 'super_admin');
}

export async function getActiveWinnerSummaryForAuction(auctionId, roleCode = null) {
  const winner = await Winner.findOne({
    where: {
      auction_id: auctionId,
      deleted_at: null,
      status: { [Op.in]: ['pending_confirmation', 'confirmed'] },
    },
    include: [
      { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number'] },
      { model: Bid, as: 'winningBid', attributes: ['id', 'amount'], required: false },
    ],
    order: [['selected_at', 'DESC']],
  });

  if (!winner) {
    return null;
  }

  return serializeWinnerListRow(winner, roleCode);
}

export const winnerService = Object.freeze({
  listWinners,
  getWinnerStats,
  getWinnerById,
  getWinnersForAuction,
  getActiveWinnerSummaryForAuction,
  selectWinner,
  autoSelectWinner,
  confirmWinner,
  declineWinner,
  replaceWinner,
  canViewBidAmounts,
});

export default winnerService;
