import { Router } from 'express';
import { publicLandingController } from '../controllers/public-landing.controller.js';

const publicRouter = Router();

publicRouter.get('/landing', publicLandingController.getLandingPage);
publicRouter.get('/landing/stats', publicLandingController.getLandingStats);
publicRouter.get('/landing/featured-auctions', publicLandingController.getFeaturedAuctions);

export default publicRouter;
