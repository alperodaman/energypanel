import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/login rate limiting', () => {
  it('returns 429 after 5 attempts within a minute', async () => {
    const attempt = () =>
      request(app).post('/auth/login').send({ email: 'ratelimit@test.local', password: 'wrongpassword' });

    for (let i = 0; i < 5; i += 1) {
      const res = await attempt();
      expect(res.status).toBe(401);
    }

    const sixth = await attempt();
    expect(sixth.status).toBe(429);
    expect(sixth.body.error).toBe('too_many_requests');
  });
});
