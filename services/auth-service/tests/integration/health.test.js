import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /health', () => {
  it('returns 200 with ok status when postgres is reachable', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', dependencies: { postgres: 'ok' } });
  });
});
