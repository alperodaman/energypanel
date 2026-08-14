import { Router } from 'express';
import { createAuthenticateMiddleware } from '@enerjipanel/shared-middleware';
import * as telemetryController from '../controllers/telemetryController.js';

const authenticate = createAuthenticateMiddleware({ jwtSecret: process.env.JWT_SECRET });

const router = Router();

router.get('/:id/telemetry/history', authenticate, telemetryController.historyForDevice);

export default router;
