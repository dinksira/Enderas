import { Op } from 'sequelize';
import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
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
  const { page = 1, limit = 20, status = null, type = null } = options;
  const where = {};

  if (!scope.isStaff && !scope.isWildcard) {
    where.user_id = scope.userId;
  }

  if (status) where.status = status;
  if (type) where.type = type;

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
  if (!scope.isStaff && !scope.isWildcard) {
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
    title: 'Asset Approved',
    message: 'Your asset request has been approved and is ready for evaluation.',
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

export async function sendWinnerAnnouncement(userId, auctionId) {
  return createInAppNotification({
    userId,
    type: 'winner_announcement',
    title: 'Auction Winner',
    message: 'Congratulations! You have been selected as the winner for an auction.',
    metadata: { auctionId },
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
  sendPaymentApproved,
  sendPaymentRejected,
  sendCpoApproved,
  sendCpoRejected,
  sendWinnerAnnouncement,
});

export default notificationService;
