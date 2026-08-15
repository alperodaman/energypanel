import request from 'supertest';
import { reserveClosedPort } from '../helpers/mockServer.js';

let app;

beforeAll(async () => {
  const closedFacilityUrl = await reserveClosedPort();
  const closedTelemetryUrl = await reserveClosedPort();

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:1';
  process.env.FACILITY_SERVICE_URL = closedFacilityUrl;
  process.env.TELEMETRY_SERVICE_URL = closedTelemetryUrl;

  ({ default: app } = await import('../../src/app.js'));
});

describe('gateway rejects unauthenticated requests before reaching downstream', () => {
  it('returns 401 (not 502) for /facilities when Facility Service is unreachable and no token is sent', async () => {
    const res = await request(app).get('/facilities');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'missing_token' });
  });

  it('returns 401 (not 502) for a device telemetry path when Telemetry Service is unreachable and no token is sent', async () => {
    const res = await request(app).get('/devices/dev-1/telemetry/history');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'missing_token' });
  });
});
