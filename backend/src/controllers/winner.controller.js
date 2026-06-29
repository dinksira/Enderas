import { sendSuccess } from '../utils/response.util.js';
import { winnerService } from '../services/winner.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

function resolveRoleCode(req) {
  return req.user?.roleCode ?? req.auth?.role?.code ?? null;
}

export async function listWinners(req, res, next) {
  try {
    const { page, limit, tab, status, auctionId, search, includeStats } = req.query;
    const result = await winnerService.listWinners(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        tab: tab || null,
        status: status || null,
        auctionId: auctionId || null,
        search: search || null,
        includeStats: includeStats === 'true' || includeStats === '1',
      },
      resolveRoleCode(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getWinnersForAuction(req, res, next) {
  try {
    const result = await winnerService.getWinnersForAuction(
      req.params.auctionId,
      resolveRoleCode(req),
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getWinnerById(req, res, next) {
  try {
    const winner = await winnerService.getWinnerById(req.params.id, resolveRoleCode(req));
    return sendSuccess(res, { winner });
  } catch (error) {
    return next(error);
  }
}

export async function selectWinner(req, res, next) {
  try {
    const winner = await winnerService.selectWinner(
      {
        auctionId: req.body.auctionId || req.body.auction_id,
        bidId: req.body.bidId || req.body.bid_id,
      },
      resolveStaffId(req),
    );
    return sendSuccess(res, { winner }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function confirmWinner(req, res, next) {
  try {
    const winner = await winnerService.confirmWinner(req.params.id, resolveStaffId(req));
    return sendSuccess(res, { winner });
  } catch (error) {
    return next(error);
  }
}

export async function declineWinner(req, res, next) {
  try {
    const winner = await winnerService.declineWinner(
      req.params.id,
      req.body.declineReason || req.body.reason,
      resolveStaffId(req),
    );
    return sendSuccess(res, { winner });
  } catch (error) {
    return next(error);
  }
}

export async function replaceWinner(req, res, next) {
  try {
    const winner = await winnerService.replaceWinner(
      req.params.id,
      req.body.bidId || req.body.bid_id,
      resolveStaffId(req),
    );
    return sendSuccess(res, { winner }, 201);
  } catch (error) {
    return next(error);
  }
}

export const winnerController = Object.freeze({
  listWinners,
  getWinnersForAuction,
  getWinnerById,
  selectWinner,
  confirmWinner,
  declineWinner,
  replaceWinner,
});

export default winnerController;
