import { Op } from 'sequelize';
import { Winner, WINNER_STATUSES } from '../models/winner.model.js';
import { Auction, User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { bidService } from './bid.service.js';

const winnerInclude = [
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'status', 'reserve_price', 'end_date'],
  },
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email'],
  },
  {
    model: Staff,
    as: 'selectedByStaff',
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
  },
];

function buildUserDisplayName(user) {
  if (!user) return null;
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.mobile_number
    || null;
}

function buildStaffDisplayName(staff) {
  if (!staff?.user) return staff?.employee_id || null;
  return buildUserDisplayName(staff.user) || staff.employee_id || null;
}

function buildTabWhere(tab) {
  if (!tab || tab === 'all') return {};
  if (WINNER_STATUSES.includes(tab)) return { status: tab };
  return {};
}

async function getWinnerStats() {
  const [all, pendingConfirmation, confirmed, declined] = await Promise.all([
    Winner.count({ where: { deleted_at: null } }),
    Winner.count({ where: { status: 'pending_confirmation', deleted_at: null } }),
    Winner.count({ where: { status: 'confirmed', deleted_at: null } }),
    Winner.count({ where: { status: 'declined', deleted_at: null } }),
  ]);
  return {
    all,
    pending_confirmation: pendingConfirmation,
    confirmed,
    declined,
  };
}

function serializeWinnerListRow(winner) {
  const plain = winner.get ? winner.get({ plain: true }) : winner;
  return {
    id: plain.id,
    auctionId: plain.auction_id,
    auctionTitle: plain.auction?.title ?? null,
    userId: plain.user_id,
    winnerName: buildUserDisplayName(plain.user),
    bidId: plain.bid_id,
    status: plain.status,
    selectedAt: plain.selected_at,
    selectedByName: buildStaffDisplayName(plain.selectedByStaff),
  };
}

async function serializeWinnerDetail(winner) {
  const row = serializeWinnerListRow(winner);
  const plain = winner.get ? winner.get({ plain: true }) : winner;
  const bid = await bidService.getBidById(plain.bid_id, { isStaff: true });

  return {
    ...row,
    declineReason: plain.decline_reason,
    notificationSentAt: plain.notification_sent_at,
    bidAmount: bid.amount,
    bid,
    createdAt: plain.created_at,
    updatedAt: plain.updated_at,
  };
}

async function findWinnerOrThrow(id) {
  const winner = await Winner.findOne({
    where: { id, deleted_at: null },
    include: winnerInclude,
  });
  if (!winner) {
    throw new AppError('Winner record not found', 404, 'WINNER_NOT_FOUND');
  }
  return winner;
}

async function createWinnerRecord({ auctionId, bidId, userId, staffId }) {
  const existing = await Winner.findOne({
    where: { auction_id: auctionId },
  });
  if (existing && !['declined', 'replaced'].includes(existing.status)) {
    throw new AppError('Winner already selected for this auction', 409, 'WINNER_EXISTS');
  }

  if (existing) {
    await existing.update({ status: 'replaced' });
    await existing.destroy();
  }

  const now = new Date();
  const winner = await Winner.create({
    id: generateUuid(),
    auction_id: auctionId,
    bid_id: bidId,
    user_id: userId,
    selected_by_staff_id: staffId,
    selected_at: now,
    status: 'pending_confirmation',
    notification_sent_at: now,
  });

  await notificationService.sendWinnerAnnouncement(userId, auctionId);

  return winner;
}

export async function listWinners(options = {}) {
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

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number'],
  };

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    userInclude.where = {
      [Op.or]: [
        { first_name: { [Op.like]: term } },
        { last_name: { [Op.like]: term } },
        { mobile_number: { [Op.like]: term } },
      ],
    };
    userInclude.required = true;
  }

  const { count, rows } = await Winner.findAndCountAll({
    where,
    include: [
      userInclude,
      { model: Auction, as: 'auction', attributes: ['id', 'title'] },
      {
        model: Staff,
        as: 'selectedByStaff',
        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
      },
    ],
    order: [['selected_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  const result = {
    items: rows.map(serializeWinnerListRow),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };

  if (includeStats) {
    result.stats = await getWinnerStats();
  }

  return result;
}

export async function getWinnerById(id) {
  const winner = await findWinnerOrThrow(id);
  return serializeWinnerDetail(winner);
}

export async function selectWinner({ auctionId, bidId }, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const bid = await bidService.getBidById(bidId, { isStaff: true });
  if (bid.auctionId !== auctionId) {
    throw new AppError('Bid does not belong to this auction', 400, 'BID_AUCTION_MISMATCH');
  }
  if (!bid.isValid) {
    throw new AppError('Cannot select an invalid bid', 400, 'BID_INVALID');
  }

  const winner = await createWinnerRecord({
    auctionId,
    bidId,
    userId: bid.userId,
    staffId,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: bid.userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Winner',
    entityId: winner.id,
    metadata: { auctionId, bidId, manual: true },
  });

  return getWinnerById(winner.id);
}

export async function autoSelectWinner(auctionId, staffId) {
  const highestBid = await bidService.getHighestValidBid(auctionId);
  if (!highestBid) {
    return null;
  }

  const existing = await Winner.findOne({
    where: { auction_id: auctionId, deleted_at: null, status: { [Op.notIn]: ['declined', 'replaced'] } },
  });
  if (existing) {
    return getWinnerById(existing.id);
  }

  let resolvedStaffId = staffId;
  if (!resolvedStaffId) {
    const auction = await Auction.findByPk(auctionId, { attributes: ['created_by_staff_id'] });
    resolvedStaffId = auction?.created_by_staff_id ?? null;
  }
  if (!resolvedStaffId) {
    return null;
  }

  const winner = await createWinnerRecord({
    auctionId,
    bidId: highestBid.id,
    userId: highestBid.user_id,
    staffId: resolvedStaffId,
  });

  await auditService.writeAuditLog({
    staffId: resolvedStaffId,
    userId: highestBid.user_id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Winner',
    entityId: winner.id,
    metadata: { auctionId, bidId: highestBid.id, auto: true },
  });

  return getWinnerById(winner.id);
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

  await auditService.writeAuditLog({
    staffId,
    userId: winner.user_id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Winner',
    entityId: id,
    metadata: { action: 'confirm' },
  });

  return getWinnerById(id);
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

  await winner.update({ status: 'declined', decline_reason: reason });

  await auditService.writeAuditLog({
    staffId,
    userId: winner.user_id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Winner',
    entityId: id,
    metadata: { action: 'decline', reason },
  });

  return getWinnerById(id);
}

export const winnerService = Object.freeze({
  listWinners,
  getWinnerStats,
  getWinnerById,
  selectWinner,
  autoSelectWinner,
  confirmWinner,
  declineWinner,
});

export default winnerService;
