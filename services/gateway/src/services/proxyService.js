import { createProxyMiddleware } from 'http-proxy-middleware';

function createServiceProxy({ target, pathFilter }) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    on: {
      error(err, req, res) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({ error: 'bad_gateway', message: 'upstream service unreachable', reason: err.message }),
        );
      },
    },
  });
}

function createAuthProxy() {
  return createServiceProxy({
    target: process.env.AUTH_SERVICE_URL,
    pathFilter: '/auth/**',
  });
}

function createFacilityProxy() {
  return createServiceProxy({
    target: process.env.FACILITY_SERVICE_URL,
    pathFilter: '/facilities/**',
  });
}

function createTelemetryProxy() {
  return createServiceProxy({
    target: process.env.TELEMETRY_SERVICE_URL,
    pathFilter: ['/facilities/*/telemetry', '/facilities/*/telemetry/**', '/devices/*/telemetry/**'],
  });
}

// facility-service owns device CRUD (PATCH/DELETE /devices/:id); must be registered
// before the telemetry proxy so it isn't shadowed by a broader /devices/** match.
function createFacilityDeviceProxy() {
  return createServiceProxy({
    target: process.env.FACILITY_SERVICE_URL,
    pathFilter: (path, req) => /^\/devices\/[^/]+$/.test(path) && ['PATCH', 'DELETE'].includes(req.method),
  });
}

export { createAuthProxy, createFacilityProxy, createTelemetryProxy, createFacilityDeviceProxy };
