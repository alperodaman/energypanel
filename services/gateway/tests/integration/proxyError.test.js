import request from 'supertest';
import jwt from 'jsonwebtoken';
import { reserveClosedPort } from '../helpers/mockServer.js';

const JWT_SECRET = 'test-secret';

let app;
let token;

beforeAll(async () => {
  const closedFacilityUrl = await reserveClosedPort();

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.AUTH_SERVICE_URL = 'http://127.0.0.1:1';
  process.env.FACILITY_SERVICE_URL = closedFacilityUrl;
  process.env.TELEMETRY_SERVICE_URL = closedFacilityUrl;

  ({ default: app } = await import('../../src/app.js'));

  token = jwt.sign({ userId: 'user-1' }, JWT_SECRET);
});

describe('proxy error responses', () => {
  it('returns a generic 502 body without leaking the internal error message', async () => {
    const res = await request(app).get('/facilities').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'bad_gateway', message: 'upstream service unreachable' });
    expect(res.body.reason).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|127\.0\.0\.1/);
  });
});
