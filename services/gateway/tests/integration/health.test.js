import request from 'supertest';
import { startMockServer, stopMockServer } from '../helpers/mockServer.js';

let authMock;
let facilityMock;
let telemetryMock;
let authHealthy = true;
let facilityHealthy = true;
let telemetryHealthy = true;
let app;

function respondHealth(getHealthy) {
  return (req, res) => {
    const healthy = getHealthy();
    res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: healthy ? 'ok' : 'degraded', dependencies: {} }));
  };
}

beforeAll(async () => {
  authMock = await startMockServer(respondHealth(() => authHealthy));
  facilityMock = await startMockServer(respondHealth(() => facilityHealthy));
  telemetryMock = await startMockServer(respondHealth(() => telemetryHealthy));

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.AUTH_SERVICE_URL = authMock.url;
  process.env.FACILITY_SERVICE_URL = facilityMock.url;
  process.env.TELEMETRY_SERVICE_URL = telemetryMock.url;

  ({ default: app } = await import('../../src/app.js'));
});

afterEach(() => {
  authHealthy = true;
  facilityHealthy = true;
  telemetryHealthy = true;
});

afterAll(async () => {
  await Promise.all([stopMockServer(authMock), stopMockServer(facilityMock), stopMockServer(telemetryMock)]);
});

describe('GET /health', () => {
  it('returns 200 with ok status when all downstream services are healthy', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      dependencies: { auth: 'ok', facility: 'ok', telemetry: 'ok' },
    });
  });

  it('returns 503 with degraded status when a downstream service is unhealthy', async () => {
    facilityHealthy = false;

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      status: 'degraded',
      dependencies: { auth: 'ok', facility: 'error', telemetry: 'ok' },
    });
  });
});
