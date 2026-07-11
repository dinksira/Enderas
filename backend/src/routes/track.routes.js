import { Router } from 'express';
import { shareLinkController } from '../controllers/share-link.controller.js';
import { requireTrackAuth } from '../middleware/track-auth.middleware.js';

const trackRouter = Router();

trackRouter.post('/:token/authenticate', shareLinkController.authenticateTrackLink);
trackRouter.get('/:token/data', requireTrackAuth, shareLinkController.getTrackData);

export default trackRouter;
