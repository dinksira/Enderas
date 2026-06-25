import { sendSuccess } from '../utils/response.util.js';
import { paymentService } from '../services/payment.service.js';

function resolveScope(req) {
  return req.dataScope ?? {
    userId: req.user?.id,
    isStaff: Boolean(req.user?.isStaff),
    isWildcard: false,
  };
}

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

function resolveUserId(req) {
  return req.user?.id ?? req.auth?.userId ?? null;
}

export async function listPayments(req, res, next) {
  try {
    const { page, limit, tab, status, auctionId, userId, search, includeStats } = req.query;
    const result = await paymentService.listPayments(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        tab: tab || null,
        status: status || null,
        auctionId: auctionId || null,
        userId: userId || null,
        search: search || null,
        includeStats: includeStats === 'true',
      },
      resolveScope(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getPaymentById(req, res, next) {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, resolveScope(req));
    return sendSuccess(res, { payment });
  } catch (error) {
    return next(error);
  }
}

export async function createPayment(req, res, next) {
  try {
    const payment = await paymentService.createPayment(req.body, resolveUserId(req));
    return sendSuccess(res, { payment }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function approvePayment(req, res, next) {
  try {
    const payment = await paymentService.approvePayment(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { payment });
  } catch (error) {
    return next(error);
  }
}

export async function rejectPayment(req, res, next) {
  try {
    const payment = await paymentService.rejectPayment(
      req.params.id,
      req.body.rejectionReason || req.body.reason,
      resolveStaffId(req),
    );
    return sendSuccess(res, { payment });
  } catch (error) {
    return next(error);
  }
}

export const paymentController = Object.freeze({
  listPayments,
  getPaymentById,
  createPayment,
  approvePayment,
  rejectPayment,
});

export default paymentController;
