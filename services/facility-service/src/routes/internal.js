import { Router } from 'express';
import { createInternalAuthMiddleware } from '@enerjipanel/shared-middleware';
import * as internalController from '../controllers/internalController.js';

const internalAuthenticate = createInternalAuthMiddleware({
  secret: process.env.INTERNAL_SERVICE_SECRET,
});

const router = Router();

router.get('/facilities', internalAuthenticate, internalController.listAllFacilities);

export default router;
