import { sendSuccess } from '../utils/response.util.js';
import { bidService } from '../services/bid.service.js';

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

export async function listBids(req, res, next) {
  try {
    const { page, limit, auctionId, userId, status, search } = req.query;
    const result = await bidService.listBids(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        auctionId: auctionId || null,
        userId: userId || null,
        status: status || null,
        search: search || null,
      },
      resolveScope(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listMyBids(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await bidService.listMyBids(resolveUserId(req), {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status: status || null,
      search: search || null,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listBidsForAuction(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await bidService.listBidsForAuction(req.params.auctionId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getBidById(req, res, next) {
  try {
    const bid = await bidService.getBidById(req.params.id, resolveScope(req));
    return sendSuccess(res, { bid });
  } catch (error) {
    return next(error);
  }
}

export async function placeBid(req, res, next) {
  try {
    const bid = await bidService.placeBid(
      {
        auctionId: req.body.auctionId || req.body.auction_id,
        auctionAssetId: req.body.auctionAssetId || req.body.auction_asset_id,
        amount: req.body.amount,
      },
      resolveUserId(req),
    );
    return sendSuccess(res, { bid }, 201);
  } catch (error) {
    return next(error);
  }
}

export const bidController = Object.freeze({
  listBids,
  listMyBids,
  listBidsForAuction,
  getBidById,
  placeBid,
});

export default bidController;
