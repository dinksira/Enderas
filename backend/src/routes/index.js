import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import v1Router from './v1.routes.js';
import publicRouter from './public.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/public', publicRouter);
apiRouter.use('/v1', v1Router);

export default apiRouter;
