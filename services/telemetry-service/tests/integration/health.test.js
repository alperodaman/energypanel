import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';
import { closeConnection } from '../../src/lib/rabbitmq.js';

afterAll(async () => {
  await prisma.$disconnect();
  await closeConnection();
});

describe('GET /health', () => {
  it('returns 200 with ok status when postgres and rabbitmq are reachable', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', dependencies: { postgres: 'ok', rabbitmq: 'ok' } });
  });
});
