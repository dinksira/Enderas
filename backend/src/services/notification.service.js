import { Op } from 'sequelize';
import { Notification } from '../models/notification.model.js';
import { User, Staff, Role } from '../models/index.js';
import { generateUuid } from '../utils/crypto.util.js';
import { AppError } from '../utils/error.util.js';

/**
 * @param {{ userId: string, type: string, title: string, message: string, metadata?: object }} payload
 */
export async function createInAppNotification(payload) {
  const notification = await Notification.create({
    id: generateUuid(),
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    channel: 'in_app',
    status: 'sent',
    metadata: payload.metadata ?? null,
    sent_at: new Date(),
  });

  console.info('[notification.service] in-app notification created:', notification.id, payload.type);
  return notification;
}

/**
 * @param {{ page?: number, limit?: number, status?: string, type?: string }} options
 * @param {{ userId?: string, isStaff?: boolean, isWildcard?: boolean }} scope
 */
export async function listNotifications(options = {}, scope = {}) {
  const { page = 1, limit = 20, status = null, type = null, search = null } = options;
  const where = {};

  if (!scope.isWildcard && scope.userId) {
    where.user_id = scope.userId;
  }

  if (status) where.status = status;
  if (type) where.type = type;

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { message: { [Op.like]: term } },
    ];
  }

  const { rows, count } = await Notification.findAndCountAll({
    where,
    include: scope.isStaff || scope.isWildcard
      ? [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number'] }]
      : [],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    notifications: rows.map(serializeNotification),
    pagination: { page, limit, total: count, pages: Math.ceil(count / limit) || 1 },
  };
}

/**
 * @param {string} userId
 * @param {{ page?: number, limit?: number, status?: string }} options
 */
export async function listNotificationsForUser(userId, options = {}) {
  return listNotifications(options, { userId, isStaff: false });
}

/**
 * @param {string} id
 * @param {{ userId?: string, isStaff?: boolean, isWildcard?: boolean }} scope
 */
export async function getNotificationById(id, scope = {}) {
  const where = { id };
  if (!scope.isWildcard && scope.userId) {
    where.user_id = scope.userId;
  }

  const notification = await Notification.findOne({
    where,
    include: scope.isStaff || scope.isWildcard
      ? [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'mobile_number'] }]
      : [],
  });

  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }

  return serializeNotification(notification);
}

/**
 * @param {string} id
 * @param {string} userId
 */
export async function markAsRead(id, userId) {
  const notification = await Notification.findOne({ where: { id, user_id: userId } });
  if (!notification) {
    throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  }

  await notification.update({ status: 'read', read_at: new Date() });
  return serializeNotification(notification);
}

/**
 * @param {string} id
 * @param {string} userId
 */
export async function markNotificationRead(id, userId) {
  return markAsRead(id, userId);
}

/**
 * @param {string} userId
 */
export async function markAllAsRead(userId) {
  await Notification.update(
    { status: 'read', read_at: new Date() },
    { where: { user_id: userId, status: { [Op.ne]: 'read' } } },
  );
  return { updated: true };
}

/**
 * @param {string} userId
 */
export async function markAllNotificationsRead(userId) {
  return markAllAsRead(userId);
}

/**
 * @param {string} userId
 */
export async function getUnreadCount(userId) {
  const count = await Notification.count({
    where: { user_id: userId, status: { [Op.in]: ['pending', 'sent'] } },
  });
  return count;
}

function serializeNotification(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  return {
    id: plain.id,
    userId: plain.user_id,
    type: plain.type,
    title: plain.title,
    message: plain.message,
    channel: plain.channel,
    status: plain.status,
    metadata: plain.metadata,
    sentAt: plain.sent_at,
    readAt: plain.read_at,
    createdAt: plain.created_at,
    user: plain.user ? {
      id: plain.user.id,
      name: [plain.user.first_name, plain.user.last_name].filter(Boolean).join(' ').trim() || plain.user.mobile_number,
    } : undefined,
  };
}

export async function sendKYCSubmitted(userId) {
  return createInAppNotification({
    userId,
    type: 'general',
    title: 'KYC Submitted',
    message: 'Your KYC documents have been submitted and are pending review.',
  });
}

export async function sendKYCApproved(userId) {
  return createInAppNotification({
    userId,
    type: 'kyc_approved',
    title: 'KYC Approved',
    message: 'Your identity verification has been approved. You can now participate in auctions.',
  });
}

export async function sendKYCRejected(userId, rejectionReason) {
  return createInAppNotification({
    userId,
    type: 'kyc_rejected',
    title: 'KYC Rejected',
    message: rejectionReason || 'Your KYC submission was rejected. Please resubmit your documents.',
    metadata: { rejectionReason },
  });
}

export async function sendAssetApproved(userId) {
  return createInAppNotification({
    userId,
    type: 'asset_approved',
    title: 'Ownership Approved',
    message: 'Your asset ownership documents were approved. An evaluation will be scheduled next.',
  });
}

export async function sendAssetRejected(userId, rejectionReason) {
  return createInAppNotification({
    userId,
    type: 'asset_rejected',
    title: 'Asset Rejected',
    message: rejectionReason || 'Your asset request was rejected.',
    metadata: { rejectionReason },
  });
}

/**
 * Notify active staff members with a given role code.
 * @param {string} roleCode
 */
async function notifyActiveStaffByRole(roleCode, { type, title, message, metadata }) {
  const staffMembers = await Staff.findAll({
    where: { is_active: true, deleted_at: null },
    attributes: ['id', 'user_id'],
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['code'],
        where: { code: roleCode, is_active: true },
        required: true,
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'status'],
        where: { status: 'active', deleted_at: null },
        required: true,
      },
    ],
  });

  await Promise.all(
    staffMembers.map((member) =>
      createInAppNotification({
        userId: member.user_id,
        type,
        title,
        message,
        metadata,
      }),
    ),
  );
}

/**
 * Notify active evaluation officers that an asset is ready for scheduling.
 * @param {{ id: string, title: string }} asset
 */
export async function notifyEvaluationOfficersAssetReady(asset) {
  const title = asset.title?.trim() || 'Untitled asset';
  await notifyActiveStaffByRole('evaluation_officer', {
    type: 'general',
    title: 'Asset Ready for Evaluation',
    message: `Ownership documents for "${title}" have been approved. Schedule a physical evaluation.`,
    metadata: { assetId: asset.id, assetTitle: title },
  });
}

/**
 * Notify active super admins that an evaluation recommendation awaits approval.
 * @param {{ id: string, assetId?: string, assetTitle?: string }} evaluation
 */
export async function notifySuperAdminsEvaluationPending(evaluation) {
  const assetTitle = evaluation.assetTitle?.trim() || 'Untitled asset';
  await notifyActiveStaffByRole('super_admin', {
    type: 'general',
    title: 'Evaluation Pending Approval',
    message: `Evaluation submitted for "${assetTitle}" — pending your approval`,
    metadata: {
      evaluationId: evaluation.id,
      assetId: evaluation.assetId ?? null,
      assetTitle,
    },
  });
}

/**
 * Notify finance staff that a bidder submitted a document fee payment for review.
 * @param {{
 *   payment: { id: string, auction_id: string, amount: number|string },
 *   auction?: { id?: string, title?: string|null },
 *   payerName?: string|null,
 * }} payload
 */
export async function notifyFinanceOfficersPaymentPending({ payment, auction, payerName }) {
  const auctionTitle = auction?.title?.trim() || 'Auction';
  const payer = payerName?.trim() || 'A bidder';
  const amount = Number(payment.amount);
  const amountLabel = Number.isFinite(amount) ? `${amount} ETB` : 'ETB';

  const notificationPayload = {
    type: 'general',
    title: 'Document Payment Submitted',
    message: `${payer} submitted a document fee payment of ${amountLabel} for "${auctionTitle}". Review and verify the receipt.`,
    metadata: {
      paymentId: payment.id,
      auctionId: payment.auction_id ?? auction?.id ?? null,
      auctionTitle,
      payerName: payer,
      amount: Number.isFinite(amount) ? amount : null,
    },
  };

  await Promise.all([
    notifyActiveStaffByRole('finance_officer', notificationPayload),
    notifyActiveStaffByRole('super_admin', notificationPayload),
  ]);
}

/**
 * Notify finance staff that a bidder submitted a CPO deposit for review.
 */
export async function notifyFinanceOfficersCpoDepositPending({ cpoId, bidderName, auctionTitle, amount }) {
  const name = bidderName?.trim() || 'A bidder';
  const title = auctionTitle?.trim() || 'an auction';
  const amountLabel = Number.isFinite(amount) ? `${amount} ETB` : 'ETB';

  const payload = {
    type: 'general',
    title: 'CPO Deposit Submitted',
    message: `${name} submitted a CPO deposit of ${amountLabel} for "${title}". Review and verify the payment.`,
    metadata: { cpoId, auctionTitle, bidderName, amount },
  };

  await Promise.all([
    notifyActiveStaffByRole('finance_officer', payload),
    notifyActiveStaffByRole('super_admin', payload),
  ]);
}

export async function sendPaymentApproved(userId) {
  return createInAppNotification({
    userId,
    type: 'payment_approved',
    title: 'Payment Approved',
    message: 'Your document payment has been verified. You may now submit your CPO.',
  });
}

export async function sendPaymentRejected(userId, rejectionReason) {
  return createInAppNotification({
    userId,
    type: 'payment_rejected',
    title: 'Payment Rejected',
    message: rejectionReason || 'Your payment was rejected. Please review and resubmit.',
    metadata: { rejectionReason },
  });
}

export async function sendCpoApproved(userId) {
  return createInAppNotification({
    userId,
    type: 'cpo_approved',
    title: 'CPO Approved',
    message: 'Your Certificate of Participation has been approved. You can now place bids.',
  });
}

export async function sendCpoRejected(userId, rejectionReason) {
  return createInAppNotification({
    userId,
    type: 'cpo_rejected',
    title: 'CPO Rejected',
    message: rejectionReason || 'Your CPO submission was rejected.',
    metadata: { rejectionReason },
  });
}

export async function sendWinnerAnnouncement(
  userId,
  auctionId,
  auctionTitle = null,
  { lotLabel = null, bidAmount = null } = {},
) {
  const title = auctionTitle?.trim() || 'an auction';
  const lotCopy = lotLabel ? ` for ${lotLabel}` : '';
  const amountCopy = bidAmount != null
    ? ` with a winning bid of ${new Intl.NumberFormat('en-ET').format(Number(bidAmount))} ETB`
    : '';

  return createInAppNotification({
    userId,
    type: 'winner_announcement',
    title: 'You won the auction',
    message: `Congratulations! You are the highest bidder${lotCopy} on "${title}"${amountCopy}.`,
    metadata: { auctionId, auctionTitle, lotLabel, bidAmount },
  });
}

export async function sendWinnerConfirmed(userId, auctionId, auctionTitle = null) {
  const title = auctionTitle?.trim() || 'an auction';
  return createInAppNotification({
    userId,
    type: 'winner_confirmed',
    title: 'Winner Confirmed',
    message: `Your win for ${title} has been formally confirmed by the auction team.`,
    metadata: { auctionId, auctionTitle },
  });
}

export const notificationService = Object.freeze({
  createInAppNotification,
  listNotifications,
  listNotificationsForUser,
  getNotificationById,
  markAsRead,
  markNotificationRead,
  markAllAsRead,
  markAllNotificationsRead,
  getUnreadCount,
  sendKYCSubmitted,
  sendKYCApproved,
  sendKYCRejected,
  sendAssetApproved,
  sendAssetRejected,
  notifyEvaluationOfficersAssetReady,
  notifySuperAdminsEvaluationPending,
  notifyFinanceOfficersPaymentPending,
  notifyFinanceOfficersCpoDepositPending,
  sendPaymentApproved,
  sendPaymentRejected,
  sendCpoApproved,
  sendCpoRejected,
  sendWinnerAnnouncement,
  sendWinnerConfirmed,
});

export default notificationService;
