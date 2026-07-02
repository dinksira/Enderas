import { sendSuccess } from '../utils/response.util.js';
import { AppError } from '../utils/error.util.js';
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
    const userId = req.user?.id ?? req.auth?.userId ?? null;
    const result = await auctionService.listBrowseAuctions({ status, search }, userId);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getBrowseAuctionById(req, res, next) {
  try {
    const userId = req.user?.id ?? req.auth?.userId ?? null;
    const auction = await auctionService.getBrowseAuctionById(req.params.id, userId);
    return sendSuccess(res, { auction });
  } catch (error) {
    return next(error);
  }
}

export async function getAuctionParticipation(req, res, next) {
  try {
    const userId = req.user?.id ?? req.auth?.userId ?? null;
    if (!userId) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    const participation = await auctionService.getAuctionParticipation(req.params.id, userId);
    return sendSuccess(res, { participation });
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
    const result = await auctionService.closeAuction(req.params.id, resolveStaffId(req));
    return sendSuccess(res, {
      auction: result,
      winnerSelection: result.winnerSelection ?? null,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listEligibleAssetsForAuction(req, res, next) {
  try {
    const items = await auctionService.listEligibleAssetsForAuction({
      search: req.query.search,
      assetId: req.query.assetId,
    });
    return sendSuccess(res, { items });
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

export async function streamAuctionDocument(req, res, next) {
  try {
    const userId = req.user?.id ?? req.auth?.userId ?? null;
    if (!userId) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const docIndex = Number(req.params.docIndex);
    const { absolutePath, fileName, mimeType } = await auctionService.resolveAuctionDocumentForStream(
      req.params.id,
      docIndex,
      userId,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
    return res.sendFile(absolutePath);
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
  getAuctionParticipation,
  updateAuction,
  publishAuction,
  suspendAuction,
  reactivateAuction,
  closeAuction,
  listEligibleAssetsForAuction,
  deleteAuction,
  streamAuctionDocument,
});

export default auctionController;
