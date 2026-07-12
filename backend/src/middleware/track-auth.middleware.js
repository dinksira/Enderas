import { shareLinkService } from '../services/share-link.service.js';
import { UnauthorizedError } from '../utils/error.util.js';

/**
 * Middleware that validates the scoped track JWT from Authorization header.
 * Expects: Authorization: Bearer <track-jwt>
 * Attaches decoded payload to req.trackAuth.
 */
export function requireTrackAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const decoded = shareLinkService.verifyTrackToken(token);

    req.trackAuth = {
      linkId: decoded.linkId,
      auctionId: decoded.auctionId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Track session expired, please re-authenticate'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid track token'));
    }
    return next(error);
  }
}

export default requireTrackAuth;
