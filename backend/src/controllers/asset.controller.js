import { sendSuccess } from '../utils/response.util.js';
import { assetService } from '../services/asset.service.js';

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

export async function createAsset(req, res, next) {
  try {
    const asset = await assetService.createAsset(resolveUserId(req), req.body);
    return sendSuccess(res, { asset }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function createAssetsBatch(req, res, next) {
  try {
    const { assets } = req.body ?? {};
    const result = await assetService.createAssetsBatch(resolveUserId(req), assets);
    return sendSuccess(res, result, 201);
  } catch (error) {
    return next(error);
  }
}

export async function listAssets(req, res, next) {
  try {
    const { status, search, includeStats } = req.query;
    const result = await assetService.listAssets(
      {
        status,
        search,
        includeStats: includeStats === 'true' || includeStats === '1',
      },
      resolveScope(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listMyAssets(req, res, next) {
  try {
    const userId = resolveUserId(req);
    const result = await assetService.listAssets({}, { userId, isStaff: false, isWildcard: false });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getAssetById(req, res, next) {
  try {
    const asset = await assetService.getAssetById(
      req.params.id,
      resolveScope(req),
      resolveUserId(req),
    );
    return sendSuccess(res, { asset });
  } catch (error) {
    return next(error);
  }
}

export async function updateAsset(req, res, next) {
  try {
    const asset = await assetService.updateAsset(
      req.params.id,
      resolveUserId(req),
      req.body,
      resolveScope(req),
    );
    return sendSuccess(res, { asset });
  } catch (error) {
    return next(error);
  }
}

export async function approveAsset(req, res, next) {
  try {
    const { reviewNotes } = req.body ?? {};
    const asset = await assetService.approveAsset(
      req.params.id,
      resolveStaffId(req),
      reviewNotes ?? null,
    );
    return sendSuccess(res, { asset });
  } catch (error) {
    return next(error);
  }
}

export async function rejectAsset(req, res, next) {
  try {
    const { rejectionReason } = req.body ?? {};
    const asset = await assetService.rejectAsset(
      req.params.id,
      resolveStaffId(req),
      rejectionReason,
    );
    return sendSuccess(res, { asset });
  } catch (error) {
    return next(error);
  }
}

export const assetController = Object.freeze({
  createAsset,
  createAssetsBatch,
  listAssets,
  listMyAssets,
  getAssetById,
  updateAsset,
  approveAsset,
  rejectAsset,
});

export default assetController;
