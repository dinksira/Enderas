import { sendSuccess } from '../utils/response.util.js';
import { shareLinkService } from '../services/share-link.service.js';

async function createShareLink(req, res, next) {
  try {
    const staffId = req.auth?.identity?.staffId;
    const { auctionId } = req.params;
    const { organizationName, contactEmail, password, expiresInDays, maxViews } = req.body;

    const result = await shareLinkService.createShareLink(staffId, auctionId, {
      organizationName,
      contactEmail,
      password,
      expiresInDays,
      maxViews,
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

async function listShareLinks(req, res, next) {
  try {
    const { auctionId } = req.params;
    const links = await shareLinkService.listShareLinks(auctionId);
    return sendSuccess(res, links);
  } catch (error) {
    return next(error);
  }
}

async function revokeShareLink(req, res, next) {
  try {
    const { id } = req.params;
    const result = await shareLinkService.revokeShareLink(id);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

/**
 * Public endpoints (no JWT auth)
 */

async function authenticateTrackLink(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const result = await shareLinkService.authenticateShareLink(token, password);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

async function getTrackData(req, res, next) {
  try {
    const decoded = req.trackAuth;
    const data = await shareLinkService.getAuctionTrackingData(decoded.linkId, decoded.auctionId);
    return sendSuccess(res, data);
  } catch (error) {
    return next(error);
  }
}

export const shareLinkController = Object.freeze({
  createShareLink,
  listShareLinks,
  revokeShareLink,
  authenticateTrackLink,
  getTrackData,
});

export default shareLinkController;
