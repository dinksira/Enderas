import { sendSuccess } from '../utils/response.util.js';
import { organizationAuctionService } from '../services/organization-auction.service.js';

function resolveStaffId(req) {
  return req.user?.staffId ?? req.auth?.staffId ?? null;
}

export async function listLinkedAuctions(req, res, next) {
  try {
    const result = await organizationAuctionService.listLinkedAuctions(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getAvailableAuctions(req, res, next) {
  try {
    const result = await organizationAuctionService.getAvailableAuctionsForOrg(req.params.id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function linkAuction(req, res, next) {
  try {
    const { auctionId } = req.body;
    if (!auctionId) {
      return res.status(400).json({ error: 'auctionId is required' });
    }
    const result = await organizationAuctionService.linkAuctionToOrganization(
      req.params.id,
      auctionId,
      resolveStaffId(req),
    );
    return sendSuccess(res, result, 201);
  } catch (error) {
    return next(error);
  }
}

export async function unlinkAuction(req, res, next) {
  try {
    const result = await organizationAuctionService.unlinkAuctionFromOrganization(
      req.params.id,
      req.params.auctionId,
    );
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export const organizationAuctionController = Object.freeze({
  listLinkedAuctions,
  getAvailableAuctions,
  linkAuction,
  unlinkAuction,
});

export default organizationAuctionController;
