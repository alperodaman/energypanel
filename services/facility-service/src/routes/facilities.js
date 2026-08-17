import { Router } from 'express';
import { createAuthenticateMiddleware } from '@enerjipanel/shared-middleware';
import * as facilityController from '../controllers/facilityController.js';
import * as deviceController from '../controllers/deviceController.js';

const authenticate = createAuthenticateMiddleware({ jwtSecret: process.env.JWT_SECRET });

const router = Router();

router.post('/', authenticate, facilityController.create);
router.get('/', authenticate, facilityController.list);
router.get('/summary/devices', authenticate, facilityController.deviceTypeSummary);
router.get('/:id', authenticate, facilityController.getById);
router.patch('/:id', authenticate, facilityController.update);
router.delete('/:id', authenticate, facilityController.remove);
router.post('/:id/devices', authenticate, deviceController.create);
router.get('/:id/devices', authenticate, deviceController.list);

export default router;
