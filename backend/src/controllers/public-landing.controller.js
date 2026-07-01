import { sendSuccess } from '../utils/response.util.js';
import { publicLandingService } from '../services/public-landing.service.js';

export async function getLandingStats(req, res, next) {
  try {
    const stats = await publicLandingService.getPublicLandingStats();
    return sendSuccess(res, stats);
  } catch (error) {
    return next(error);
  }
}

export async function getFeaturedAuctions(req, res, next) {
  try {
    const { limit, category } = req.query;
    const result = await publicLandingService.getPublicFeaturedAuctions({ limit, category });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getLandingPage(req, res, next) {
  try {
    const payload = await publicLandingService.getPublicLandingPage();
    return sendSuccess(res, payload);
  } catch (error) {
    return next(error);
  }
}

export const publicLandingController = Object.freeze({
  getLandingStats,
  getFeaturedAuctions,
  getLandingPage,
});

export default publicLandingController;
