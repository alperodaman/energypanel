import { Router } from 'express';
import { createAuthenticateMiddleware } from '@enerjipanel/shared-middleware';
import * as deviceController from '../controllers/deviceController.js';

const authenticate = createAuthenticateMiddleware({ jwtSecret: process.env.JWT_SECRET });

const router = Router();

router.patch('/:id', authenticate, deviceController.update);
router.delete('/:id', authenticate, deviceController.remove);

export default router;
