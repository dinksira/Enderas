import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import v1Router from './v1.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/v1', v1Router);

export default apiRouter;
