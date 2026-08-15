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
    pathFilter: ['/facilities/*/telemetry', '/facilities/*/telemetry/**', '/devices/**'],
  });
}

export { createAuthProxy, createFacilityProxy, createTelemetryProxy };
