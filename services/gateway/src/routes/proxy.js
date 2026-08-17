import { Router } from 'express';
import { createAuthenticateMiddleware } from '@enerjipanel/shared-middleware';
import { createAuthProxy, createFacilityProxy, createTelemetryProxy, createFacilityDeviceProxy } from '../services/proxyService.js';

function createProxyRouter() {
  const authenticate = createAuthenticateMiddleware({ jwtSecret: process.env.JWT_SECRET });
  const router = Router();

  // register/login etc. already handle their own auth inside Auth Service — plain proxy, no gateway check.
  router.use(createAuthProxy());

  // Everything past this point requires a valid token before it ever reaches a downstream service.
  router.use(authenticate);
  router.use(createFacilityDeviceProxy());
  router.use(createTelemetryProxy());
  router.use(createFacilityProxy());

  return router;
}

export { createProxyRouter };
