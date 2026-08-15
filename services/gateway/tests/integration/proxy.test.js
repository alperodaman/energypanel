import request from 'supertest';
import jwt from 'jsonwebtoken';
import { startMockServer, stopMockServer, jsonHandler } from '../helpers/mockServer.js';

const JWT_SECRET = 'test-secret';

let authMock;
let facilityMock;
let telemetryMock;
let app;
let token;

beforeAll(async () => {
  authMock = await startMockServer((req, res) => {
    if (req.method === 'POST' && req.url === '/auth/register') {
      return jsonHandler(201, { route: 'auth-register' })(req, res);
    }
    return jsonHandler(404, { error: 'not_found' })(req, res);
  });

  facilityMock = await startMockServer((req, res) => {
    if (req.method === 'GET' && req.url === '/facilities') {
      return jsonHandler(200, { route: 'facilities-list' })(req, res);
    }
    return jsonHandler(404, { error: 'not_found' })(req, res);
  });

  telemetryMock = await startMockServer((req, res) => {
    if (req.method === 'GET' && req.url === '/facilities/fac-1/telemetry') {
      return jsonHandler(200, { route: 'facility-telemetry' })(req, res);
    }
    if (req.method === 'GET' && req.url === '/devices/dev-1/telemetry/history') {
      return jsonHandler(200, { route: 'device-telemetry-history' })(req, res);
    }
    return jsonHandler(404, { error: 'not_found' })(req, res);
  });

  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.AUTH_SERVICE_URL = authMock.url;
  process.env.FACILITY_SERVICE_URL = facilityMock.url;
  process.env.TELEMETRY_SERVICE_URL = telemetryMock.url;

  ({ default: app } = await import('../../src/app.js'));

  token = jwt.sign({ userId: 'user-1' }, JWT_SECRET);
});

afterAll(async () => {
  await Promise.all([stopMockServer(authMock), stopMockServer(facilityMock), stopMockServer(telemetryMock)]);
});

describe('/auth proxy', () => {
  it('proxies to Auth Service without requiring a token', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'a@b.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ route: 'auth-register' });
  });
});

describe('/facilities proxy', () => {
  it('proxies an authenticated request to Facility Service', async () => {
    const res = await request(app).get('/facilities').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: 'facilities-list' });
  });
});

describe('telemetry proxy', () => {
  it('routes /facilities/:id/telemetry to Telemetry Service, not Facility Service', async () => {
    const res = await request(app)
      .get('/facilities/fac-1/telemetry')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: 'facility-telemetry' });
  });

  it('routes /devices/:id/telemetry/history to Telemetry Service', async () => {
    const res = await request(app)
      .get('/devices/dev-1/telemetry/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: 'device-telemetry-history' });
  });
});
