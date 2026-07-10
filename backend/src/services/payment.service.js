import { Op } from 'sequelize';
import { Payment, PAYMENT_STATUSES } from '../models/payment.model.js';
import { Auction, User, Staff } from '../models/index.js';
import { AppError } from '../utils/error.util.js';
import { generateUuid } from '../utils/crypto.util.js';
import { auditService, AUDIT_ACTIONS } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { assertNotAuctionOwner } from '../utils/auction-owner.util.js';

const paymentInclude = [
  {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'organization_name'],
  },
  {
    model: Auction,
    as: 'auction',
    attributes: ['id', 'title', 'document_price', 'status', 'currency'],
  },
  {
    model: Staff,
    as: 'verifiedByStaff',
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
  if (PAYMENT_STATUSES.includes(tab)) return { status: tab };
  return {};
}

async function getPaymentStats() {
  const [all, pending, approved, rejected] = await Promise.all([
    Payment.count({ where: { deleted_at: null } }),
    Payment.count({ where: { status: 'pending', deleted_at: null } }),
    Payment.count({ where: { status: 'approved', deleted_at: null } }),
    Payment.count({ where: { status: 'rejected', deleted_at: null } }),
  ]);
  return { all, pending, approved, rejected };
}

function serializePaymentListRow(payment) {
  const plain = payment.get ? payment.get({ plain: true }) : payment;
  return {
    id: plain.id,
    userId: plain.user_id,
    payerName: buildUserDisplayName(plain.user),
    auctionId: plain.auction_id,
    auctionTitle: plain.auction?.title ?? null,
    amount: Number(plain.amount),
    currency: plain.currency,
    paymentMethod: plain.payment_method,
    status: plain.status,
    transactionReference: plain.transaction_reference,
    paidAt: plain.paid_at,
    createdAt: plain.created_at,
  };
}

function serializePaymentDetail(payment) {
  const row = serializePaymentListRow(payment);
  const plain = payment.get ? payment.get({ plain: true }) : payment;
  return {
    ...row,
    receiptUrl: plain.receipt_url,
    verifiedByStaffId: plain.verified_by_staff_id,
    verifiedByName: buildStaffDisplayName(plain.verifiedByStaff),
    verifiedAt: plain.verified_at,
    rejectionReason: plain.rejection_reason,
    gatewayResponse: plain.gateway_response,
    updatedAt: plain.updated_at,
  };
}

async function findPaymentOrThrow(id) {
  const payment = await Payment.findOne({
    where: { id, deleted_at: null },
    include: paymentInclude,
  });
  if (!payment) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  return payment;
}

export async function listPayments(options = {}, scope = {}) {
  const {
    page = 1,
    limit = 20,
    tab = null,
    status = null,
    auctionId = null,
    userId = null,
    search = null,
    includeStats = false,
  } = options;

  const where = { deleted_at: null, ...buildTabWhere(tab) };
  if (status && !tab) where.status = status;
  if (auctionId) where.auction_id = auctionId;

  if (!scope.isStaff && !scope.isWildcard && scope.userId) {
    where.user_id = scope.userId;
  } else if (userId) {
    where.user_id = userId;
  }

  const userInclude = {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'email', 'organization_name'],
  };

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { '$auction.title$': { [Op.like]: term } },
      { '$user.first_name$': { [Op.like]: term } },
      { '$user.last_name$': { [Op.like]: term } },
      { '$user.mobile_number$': { [Op.like]: term } },
      { '$user.email$': { [Op.like]: term } },
    ];
  }

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [
      userInclude,
      { model: Auction, as: 'auction', attributes: ['id', 'title', 'document_price', 'status'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
    subQuery: false,
  });

  const result = {
    items: rows.map(serializePaymentListRow),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 0 },
  };

  if (includeStats && (scope.isStaff || scope.isWildcard)) {
    result.stats = await getPaymentStats();
  }

  return result;
}

export { getPaymentStats };

export async function getPaymentById(id, scope = {}) {
  const payment = await findPaymentOrThrow(id);
  if (!scope.isStaff && !scope.isWildcard && scope.userId && payment.user_id !== scope.userId) {
    throw new AppError('Payment not found', 404, 'PAYMENT_NOT_FOUND');
  }
  return serializePaymentDetail(payment);
}

export async function createPayment(payload, userId) {
  const auctionId = payload.auctionId || payload.auction_id;
  const paymentMethod = payload.paymentMethod || payload.payment_method || 'manual';

  if (!auctionId) {
    throw new AppError('Auction is required', 400, 'AUCTION_REQUIRED');
  }

  const auction = await Auction.findOne({ where: { id: auctionId, deleted_at: null } });
  if (!auction) {
    throw new AppError('Auction not found', 404, 'AUCTION_NOT_FOUND');
  }
  if (auction.status !== 'published') {
    throw new AppError('Auction is not open for payments', 400, 'AUCTION_NOT_PUBLISHED');
  }

  await assertNotAuctionOwner(userId, auctionId);

  const existingApproved = await Payment.findOne({
    where: { user_id: userId, auction_id: auctionId, status: 'approved', deleted_at: null },
  });
  if (existingApproved) {
    throw new AppError('Document fee already paid for this auction', 409, 'PAYMENT_EXISTS');
  }

  const existingPending = await Payment.findOne({
    where: { user_id: userId, auction_id: auctionId, status: 'pending', deleted_at: null },
  });
  if (existingPending) {
    throw new AppError('A payment is already pending review', 409, 'PAYMENT_PENDING');
  }

  const expectedAmount = Number(auction.document_price);
  const amount = Number(payload.amount ?? expectedAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Valid payment amount is required', 400, 'INVALID_AMOUNT');
  }

  if (paymentMethod === 'manual' && !payload.receiptUrl && !payload.receipt_url) {
    throw new AppError('Receipt is required for manual payments', 400, 'RECEIPT_REQUIRED');
  }

  const payment = await Payment.create({
    id: generateUuid(),
    user_id: userId,
    auction_id: auctionId,
    amount,
    currency: auction.currency || 'ETB',
    payment_method: paymentMethod,
    status: 'pending',
    transaction_reference: payload.transactionReference || payload.transaction_reference || null,
    receipt_url: payload.receiptUrl || payload.receipt_url || null,
    paid_at: payload.paidAt ? new Date(payload.paidAt) : new Date(),
  });

  await auditService.writeAuditLog({
    userId,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Payment',
    entityId: payment.id,
    metadata: { auctionId, amount, paymentMethod },
  });

  try {
    const payer = await User.findByPk(userId, {
      attributes: ['id', 'first_name', 'last_name', 'organization_name', 'mobile_number'],
    });
    await notificationService.notifyFinanceOfficersPaymentPending({
      payment: { id: payment.id, auction_id: auctionId, amount },
      auction,
      payerName: buildUserDisplayName(payer),
    });
  } catch (notifyError) {
    console.error('[payment.service] failed to notify finance officers:', notifyError);
  }

  return getPaymentById(payment.id, { userId, isStaff: false });
}

export async function approvePayment(id, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const payment = await findPaymentOrThrow(id);
  if (payment.status !== 'pending') {
    throw new AppError('Payment is not pending', 400, 'INVALID_PAYMENT_STATUS');
  }

  const now = new Date();
  await payment.update({
    status: 'approved',
    verified_by_staff_id: staffId,
    verified_at: now,
    rejection_reason: null,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: payment.user_id,
    action: AUDIT_ACTIONS.APPROVE,
    entityType: 'Payment',
    entityId: id,
    newValues: { status: 'approved' },
  });

  await notificationService.sendPaymentApproved(payment.user_id);

  return getPaymentById(id, { isStaff: true });
}

export async function rejectPayment(id, rejectionReason, staffId) {
  if (!staffId) {
    throw new AppError('Staff profile required', 403, 'STAFF_REQUIRED');
  }

  const reason = rejectionReason?.trim();
  if (!reason) {
    throw new AppError('Rejection reason is required', 400, 'REJECTION_REASON_REQUIRED');
  }

  const payment = await findPaymentOrThrow(id);
  if (payment.status !== 'pending') {
    throw new AppError('Payment is not pending', 400, 'INVALID_PAYMENT_STATUS');
  }

  await payment.update({
    status: 'rejected',
    verified_by_staff_id: staffId,
    verified_at: new Date(),
    rejection_reason: reason,
  });

  await auditService.writeAuditLog({
    staffId,
    userId: payment.user_id,
    action: AUDIT_ACTIONS.REJECT,
    entityType: 'Payment',
    entityId: id,
    metadata: { rejectionReason: reason },
  });

  await notificationService.sendPaymentRejected(payment.user_id, reason);

  return getPaymentById(id, { isStaff: true });
}

export async function hasApprovedDocumentPayment(userId, auctionId) {
  const payment = await Payment.findOne({
    where: {
      user_id: userId,
      auction_id: auctionId,
      status: 'approved',
      deleted_at: null,
    },
  });
  return Boolean(payment);
}

export const paymentService = Object.freeze({
  listPayments,
  getPaymentStats,
  getPaymentById,
  createPayment,
  approvePayment,
  rejectPayment,
  hasApprovedDocumentPayment,
});

export default paymentService;
