import request from 'supertest';
import app from '../../src/app.js';
import { closeConnection } from '../../src/lib/rabbitmq.js';
import { getPubClient } from '../../src/lib/redis.js';

afterAll(async () => {
  await closeConnection();

  const pubClient = await getPubClient();
  await pubClient.quit();
});

describe('GET /health', () => {
  it('returns 200 with ok status when rabbitmq and redis are reachable', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', dependencies: { rabbitmq: 'ok', redis: 'ok' } });
  });
});
