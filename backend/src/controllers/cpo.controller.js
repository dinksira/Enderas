import { sendSuccess } from '../utils/response.util.js';
import { cpoService } from '../services/cpo.service.js';

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

export async function listCpos(req, res, next) {
  try {
    const { page, limit, tab, status, auctionId, search, includeStats } = req.query;
    const result = await cpoService.listCpos(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        tab: tab || null,
        status: status || null,
        auctionId: auctionId || null,
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

export async function getCpoById(req, res, next) {
  try {
    const cpo = await cpoService.getCpoById(req.params.id, resolveScope(req));
    return sendSuccess(res, { cpo });
  } catch (error) {
    return next(error);
  }
}

export async function createCpo(req, res, next) {
  try {
    const cpo = await cpoService.createCpo(
      {
        auctionId: req.body.auctionId || req.body.auction_id,
        documentUrl: req.body.documentUrl || req.body.document_url,
        selectedAuctionAssetIds:
          req.body.selectedAuctionAssetIds || req.body.selected_auction_asset_ids,
        declaredCpoAmount: req.body.declaredCpoAmount ?? req.body.declared_cpo_amount,
      },
      resolveUserId(req),
    );
    return sendSuccess(res, { cpo }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function approveCpo(req, res, next) {
  try {
    const cpo = await cpoService.approveCpo(
      req.params.id,
      resolveStaffId(req),
      req.body.expiryDate || req.body.expiry_date || null,
    );
    return sendSuccess(res, { cpo });
  } catch (error) {
    return next(error);
  }
}

export async function rejectCpo(req, res, next) {
  try {
    const cpo = await cpoService.rejectCpo(
      req.params.id,
      req.body.rejectionReason || req.body.reason,
      resolveStaffId(req),
    );
    return sendSuccess(res, { cpo });
  } catch (error) {
    return next(error);
  }
}

export const cpoController = Object.freeze({
  listCpos,
  getCpoById,
  createCpo,
  approveCpo,
  rejectCpo,
});

export default cpoController;
