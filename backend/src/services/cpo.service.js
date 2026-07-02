import { Op } from 'sequelize';
import { Cpo, CPO_STATUSES } from '../models/cpo.model.js';
import { Auction, AuctionAsset, User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import {
  normalizeLotIdList,
  computeRequiredCpoAmount,
  roundMoney,
} from '../utils/auction-lot.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { paymentService } from './payment.service.js';

const cpoInclude = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'organization_name'],
  },
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'status', 'cpo_percentage'],
  },
  {
    model: Staff,
    as: 'reviewedByStaff',
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

function buildTabWhere(tab) {
  if (!tab || tab === 'all') return {};
  if (CPO_STATUSES.includes(tab)) return { status: tab };
  return {};
}

async function getCpoStats() {
  const [all, pending, approved, rejected] = await Promise.all([
    Cpo.count({ where: { deleted_at: null } }),
    Cpo.count({ where: { status: 'pending', deleted_at: null } }),
    Cpo.count({ where: { status: 'approved', deleted_at: null } }),
    Cpo.count({ where: { status: 'rejected', deleted_at: null } }),
  ]);
  return { all, pending, approved, rejected };
}

function serializeCpoListRow(cpo) {
  const plain = cpo.get ? cpo.get({ plain: true }) : cpo;
  return {
    id: plain.id,
    userId: plain.user_id,
    bidderName: buildUserDisplayName(plain.user),
    auctionId: plain.auction_id,
    auctionTitle: plain.auction?.title ?? null,
    status: plain.status,
    expiryDate: plain.expiry_date,
    createdAt: plain.created_at,
  };
}

function serializeCpoDetail(cpo) {
  const row = serializeCpoListRow(cpo);
  const plain = cpo.get ? cpo.get({ plain: true }) : cpo;
  return {
    ...row,
    documentUrl: plain.document_url,
    selectedAuctionAssetIds: normalizeLotIdList(plain.selected_auction_asset_ids),
    requiredCpoAmount: plain.required_cpo_amount != null ? Number(plain.required_cpo_amount) : null,
    declaredCpoAmount: plain.declared_cpo_amount != null ? Number(plain.declared_cpo_amount) : null,
    reviewedByStaffId: plain.reviewed_by_staff_id,
    reviewedByName: buildStaffDisplayName(plain.reviewedByStaff),
    reviewedAt: plain.reviewed_at,
    rejectionReason: plain.rejection_reason,
    updatedAt: plain.updated_at,
  };
}

async function findCpoOrThrow(id) {
  const cpo = await Cpo.findOne({
    where: { id, deleted_at: null },
    include: cpoInclude,
  });
  if (!cpo) {
    throw new AppError('CPO record not found', 404, 'CPO_NOT_FOUND');
  }
  return cpo;
}

export async function listCpos(options = {}, scope = {}) {
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

  if (!scope.isStaff && !scope.isWildcard && scope.userId) {
    where.user_id = scope.userId;
  }

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email'],
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

  const { count, rows } = await Cpo.findAndCountAll({
    where,
    include: [
      userInclude,
      { model: Auction, as: 'auction', attributes: ['id', 'title', 'status'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    items: rows.map(serializeCpoListRow),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };

  if (includeStats && (scope.isStaff || scope.isWildcard)) {
    result.stats = await getCpoStats();
  }

  return result;
}

export { getCpoStats };

export async function getCpoById(id, scope = {}) {
  const cpo = await findCpoOrThrow(id);
  if (!scope.isStaff && !scope.isWildcard && scope.userId && cpo.user_id !== scope.userId) {
    throw new AppError('CPO record not found', 404, 'CPO_NOT_FOUND');
  }
  return serializeCpoDetail(cpo);
}

export async function createCpo(
  { auctionId, documentUrl, selectedAuctionAssetIds, declaredCpoAmount },
  userId,
) {
  const resolvedAuctionId = auctionId;
  const resolvedDocUrl = documentUrl?.trim();

  if (!resolvedAuctionId) {
    throw new AppError('Auction is required', 400, 'AUCTION_REQUIRED');
  }
  if (!resolvedDocUrl) {
    throw new AppError('CPO document is required', 400, 'DOCUMENT_REQUIRED');
  }

  const auction = await Auction.findOne({ where: { id: resolvedAuctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'published') {
    throw new AppError('Auction is not open for CPO requests', 400, 'AUCTION_NOT_PUBLISHED');
  }

  const hasPayment = await paymentService.hasApprovedDocumentPayment(userId, resolvedAuctionId);
  if (!hasPayment) {
    throw new AppError('Approved document payment required before CPO submission', 400, 'PAYMENT_REQUIRED');
  }

  const existing = await Cpo.findOne({
    where: { user_id: userId, auction_id: resolvedAuctionId, deleted_at: null },
    order: [['created_at', 'DESC']],
  });
  if (existing && existing.status !== 'rejected') {
    throw new AppError('CPO already submitted for this auction', 409, 'CPO_EXISTS');
  }

  const lots = await AuctionAsset.findAll({
    where: { auction_id: resolvedAuctionId },
    order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
  });

  let selectedIds = normalizeLotIdList(selectedAuctionAssetIds);
  const isMultiLot = auction.auction_mode === 'multi' || lots.length > 1;

  if (lots.length === 1 && !selectedIds.length) {
    selectedIds = [lots[0].id];
  }

  if (isMultiLot && lots.length > 0 && !selectedIds.length) {
    throw new AppError('Select at least one lot to bid on', 400, 'LOTS_REQUIRED');
  }

  const lotIdSet = new Set(lots.map((lot) => lot.id));
  if (selectedIds.some((id) => !lotIdSet.has(id))) {
    throw new AppError('One or more selected lots are invalid', 400, 'INVALID_LOTS');
  }

  let requiredCpoAmount = 0;
  if (lots.length > 0) {
    requiredCpoAmount = computeRequiredCpoAmount(lots, selectedIds, auction.cpo_percentage);
  } else {
    const reserve = Number(auction.reserve_price);
    const percentage = Number(auction.cpo_percentage);
    if (Number.isFinite(reserve) && reserve > 0 && Number.isFinite(percentage) && percentage > 0) {
      requiredCpoAmount = roundMoney((reserve * percentage) / 100);
    }
  }

  const declaredAmount = declaredCpoAmount != null && declaredCpoAmount !== ''
    ? Number(declaredCpoAmount)
    : null;

  const cpo = await Cpo.create({
    id: generateUuid(),
    user_id: userId,
    auction_id: resolvedAuctionId,
    document_url: resolvedDocUrl,
    status: 'pending',
    selected_auction_asset_ids: selectedIds.length > 0 ? selectedIds : null,
    required_cpo_amount: requiredCpoAmount > 0 ? requiredCpoAmount : null,
    declared_cpo_amount: Number.isFinite(declaredAmount) && declaredAmount > 0 ? declaredAmount : null,
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Cpo',
    entityId: cpo.id,
    metadata: {
      auctionId: resolvedAuctionId,
      selectedAuctionAssetIds: selectedIds,
      requiredCpoAmount,
    },
  });

  return getCpoById(cpo.id, { userId, isStaff: false });
}

export async function approveCpo(id, staffId, expiryDate = null) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const cpo = await findCpoOrThrow(id);
  if (cpo.status !== 'pending') {
    throw new AppError('CPO is not pending review', 400, 'INVALID_CPO_STATUS');
  }

  const now = new Date();
  await cpo.update({
    status: 'approved',
    reviewed_by_staff_id: staffId,
    reviewed_at: now,
    rejection_reason: null,
    expiry_date: expiryDate || null,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: cpo.user_id,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: 'Cpo',
    entityId: id,
    newValues: { status: 'approved', expiryDate },
  });

  await notificationService.sendCpoApproved(cpo.user_id);

  return getCpoById(id, { isStaff: true });
}

export async function rejectCpo(id, rejectionReason, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const reason = rejectionReason?.trim();
  if (!reason) {
    throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
  }

  const cpo = await findCpoOrThrow(id);
  if (cpo.status !== 'pending') {
    throw new AppError('CPO is not pending review', 400, 'INVALID_CPO_STATUS');
  }

  await cpo.update({
    status: 'rejected',
    reviewed_by_staff_id: staffId,
    reviewed_at: new Date(),
    rejection_reason: reason,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: cpo.user_id,
    action: AUDIT_ACTIONS.REJECT,
    entityType: 'Cpo',
    entityId: id,
    metadata: { rejectionReason: reason },
  });

  await notificationService.sendCpoRejected(cpo.user_id, reason);

  return getCpoById(id, { isStaff: true });
}

export async function getApprovedCpoRecord(userId, auctionId) {
  const now = new Date();
  return Cpo.findOne({
    where: {
      user_id: userId,
      auction_id: auctionId,
      status: 'approved',
      deleted_at: null,
      [Op.or]: [
        { expiry_date: null },
        { expiry_date: { [Op.gte]: now } },
      ],
    },
    order: [['created_at', 'DESC']],
  });
}

export async function hasApprovedCpo(userId, auctionId) {
  return Boolean(await getApprovedCpoRecord(userId, auctionId));
}

export const cpoService = Object.freeze({
  listCpos,
  getCpoStats,
  getCpoById,
  createCpo,
  approveCpo,
  rejectCpo,
  hasApprovedCpo,
  getApprovedCpoRecord,
});

export default cpoService;
