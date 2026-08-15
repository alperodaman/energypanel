import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';
import { closeConnection } from '../../src/lib/rabbitmq.js';

const createdFacilityIds = [];

function authToken(userId = crypto.randomUUID()) {
  return jwt.sign({ userId, email: `${userId}@test.local` }, process.env.JWT_SECRET);
}

function authHeader(userId) {
  return `Bearer ${authToken(userId)}`;
}

function uniqueName(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterEach(async () => {
  if (createdFacilityIds.length === 0) return;
  await prisma.device.deleteMany({ where: { facilityId: { in: createdFacilityIds } } });
  await prisma.facility.deleteMany({ where: { id: { in: createdFacilityIds } } });
  createdFacilityIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
  await closeConnection();
});

describe('POST /facilities', () => {
  it('creates a new facility (201)', async () => {
    const userId = crypto.randomUUID();
    const name = uniqueName('facility');

    const res = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader(userId))
      .send({ name, type: 'home' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name, type: 'home', ownerUserId: userId });
    createdFacilityIds.push(res.body.id);
  });

  it('rejects an invalid type (400)', async () => {
    const res = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader())
      .send({ name: uniqueName('facility'), type: 'not-a-type' });

    expect(res.status).toBe(400);
  });

  it('rejects requests without a token (401)', async () => {
    const res = await request(app)
      .post('/facilities')
      .send({ name: uniqueName('facility'), type: 'home' });

    expect(res.status).toBe(401);
  });
});

describe('GET /facilities', () => {
  it('returns only the caller-owned facilities (200)', async () => {
    const userId = crypto.randomUUID();
    const otherUserId = crypto.randomUUID();

    const mine = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('mine'), type: 'home' });
    createdFacilityIds.push(mine.body.id);

    const theirs = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader(otherUserId))
      .send({ name: uniqueName('theirs'), type: 'home' });
    createdFacilityIds.push(theirs.body.id);

    const res = await request(app).get('/facilities').set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body.map((f) => f.id)).toEqual([mine.body.id]);
  });

  it('returns an empty list when the caller owns no facilities (200)', async () => {
    const res = await request(app).get('/facilities').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /facilities/:id', () => {
  it('returns the facility when owned by the caller (200)', async () => {
    const userId = crypto.randomUUID();
    const created = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('single'), type: 'business' });
    createdFacilityIds.push(created.body.id);

    const res = await request(app)
      .get(`/facilities/${created.body.id}`)
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it('returns 404 for a nonexistent facility', async () => {
    const res = await request(app)
      .get(`/facilities/${crypto.randomUUID()}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });

  it("returns 404 for another user's facility", async () => {
    const owner = crypto.randomUUID();
    const created = await request(app)
      .post('/facilities')
      .set('Authorization', authHeader(owner))
      .send({ name: uniqueName('notmine'), type: 'home' });
    createdFacilityIds.push(created.body.id);

    const res = await request(app)
      .get(`/facilities/${created.body.id}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });
});
