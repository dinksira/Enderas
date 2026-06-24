import { sendSuccess } from '../utils/response.util.js';
import { auctionService } from '../services/auction.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function createAuction(req, res, next) {
  try {
    const auction = await auctionService.createAuction(req.body, resolveStaffId(req));
    return sendSuccess(res, { auction }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function listAuctions(req, res, next) {
  try {
    const { status, search } = req.query;
    const result = await auctionService.listAuctions({ status, search });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listBrowseAuctions(req, res, next) {
  try {
    const { status, search } = req.query;
    const result = await auctionService.listBrowseAuctions({ status, search });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getBrowseAuctionById(req, res, next) {
  try {
    const auction = await auctionService.getBrowseAuctionById(req.params.id);
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function getAuctionById(req, res, next) {
  try {
    const auction = await auctionService.getAuctionById(req.params.id);
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function updateAuction(req, res, next) {
  try {
    const auction = await auctionService.updateAuction(req.params.id, req.body);
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function publishAuction(req, res, next) {
  try {
    const auction = await auctionService.publishAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function suspendAuction(req, res, next) {
  try {
    const auction = await auctionService.suspendAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function reactivateAuction(req, res, next) {
  try {
    const auction = await auctionService.reactivateAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function closeAuction(req, res, next) {
  try {
    const auction = await auctionService.closeAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAuction(req, res, next) {
  try {
    const result = await auctionService.deleteAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const auctionController = Object.freeze({
  createAuction,
  listAuctions,
  listBrowseAuctions,
  getAuctionById,
  getBrowseAuctionById,
  updateAuction,
  publishAuction,
  suspendAuction,
  reactivateAuction,
  closeAuction,
  deleteAuction,
});

export default auctionController;
