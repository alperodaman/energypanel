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

async function createFacility(userId) {
  const res = await request(app)
    .post('/facilities')
    .set('Authorization', authHeader(userId))
    .send({ name: uniqueName('facility'), type: 'home' });
  createdFacilityIds.push(res.body.id);
  return res.body;
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

describe('POST /facilities/:id/devices', () => {
  it('creates a device on an owned facility (201)', async () => {
    const userId = crypto.randomUUID();
    const facility = await createFacility(userId);

    const res = await request(app)
      .post(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('meter'), type: 'energy_meter' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ facilityId: facility.id, type: 'energy_meter' });
  });

  it('accepts a targetTemperature for a thermostat', async () => {
    const userId = crypto.randomUUID();
    const facility = await createFacility(userId);

    const res = await request(app)
      .post(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('thermostat'), type: 'thermostat', targetTemperature: 21.5 });

    expect(res.status).toBe(201);
    expect(res.body.targetTemperature).toBe(21.5);
  });

  it('rejects an invalid device type (400)', async () => {
    const userId = crypto.randomUUID();
    const facility = await createFacility(userId);

    const res = await request(app)
      .post(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('bad'), type: 'not-a-type' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a nonexistent facility', async () => {
    const res = await request(app)
      .post(`/facilities/${crypto.randomUUID()}/devices`)
      .set('Authorization', authHeader())
      .send({ name: uniqueName('meter'), type: 'energy_meter' });

    expect(res.status).toBe(404);
  });

  it("returns 404 when adding a device to another user's facility", async () => {
    const owner = crypto.randomUUID();
    const facility = await createFacility(owner);

    const res = await request(app)
      .post(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader())
      .send({ name: uniqueName('meter'), type: 'energy_meter' });

    expect(res.status).toBe(404);
  });
});

describe('GET /facilities/:id/devices', () => {
  it('returns the devices belonging to an owned facility (200)', async () => {
    const userId = crypto.randomUUID();
    const facility = await createFacility(userId);
    const created = await request(app)
      .post(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId))
      .send({ name: uniqueName('meter'), type: 'energy_meter' });

    const res = await request(app)
      .get(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body.map((d) => d.id)).toEqual([created.body.id]);
  });

  it('returns an empty list when the facility has no devices (200)', async () => {
    const userId = crypto.randomUUID();
    const facility = await createFacility(userId);

    const res = await request(app)
      .get(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 404 for another user's facility", async () => {
    const owner = crypto.randomUUID();
    const facility = await createFacility(owner);

    const res = await request(app)
      .get(`/facilities/${facility.id}/devices`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });
});
