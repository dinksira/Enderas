import { sendSuccess } from '../utils/response.util.js';
import { notificationService } from '../services/notification.service.js';

function resolveScope(req) {
  return req.dataScope ?? {
    userId: req.user?.id,
    isStaff: Boolean(req.user?.isStaff),
    isWildcard: false,
  };
}

function resolveUserId(req) {
  return req.user?.id ?? req.auth?.userId ?? null;
}

export async function listNotifications(req, res, next) {
  try {
    const { page, limit, status, type } = req.query;
    const result = await notificationService.listNotifications(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        status: status || null,
        type: type || null,
      },
      resolveScope(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getNotificationById(req, res, next) {
  try {
    const notification = await notificationService.getNotificationById(
      req.params.id,
      resolveScope(req),
    );
    return sendSuccess(res, { notification });
  } catch (error) {
    return next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, resolveUserId(req));
    return sendSuccess(res, { notification });
  } catch (error) {
    return next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(resolveUserId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(resolveUserId(req));
    return sendSuccess(res, { count });
  } catch (error) {
    return next(error);
  }
}

export const notificationController = Object.freeze({
  listNotifications,
  getNotificationById,
  markAsRead,
  markAllRead,
  getUnreadCount,
});

export default notificationController;
