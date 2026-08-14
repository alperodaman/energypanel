import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';

const createdFacilityIds = [];

function authHeader(userId = crypto.randomUUID()) {
  return `Bearer ${jwt.sign({ userId, email: `${userId}@test.local` }, process.env.JWT_SECRET)}`;
}

function uniqueName(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createFacilityWithDevice(userId) {
  const facilityRes = await request(app)
    .post('/facilities')
    .set('Authorization', authHeader(userId))
    .send({ name: uniqueName('internal-facility'), type: 'home' });
  createdFacilityIds.push(facilityRes.body.id);

  const deviceRes = await request(app)
    .post(`/facilities/${facilityRes.body.id}/devices`)
    .set('Authorization', authHeader(userId))
    .send({ name: uniqueName('device'), type: 'thermostat', targetTemperature: 21 });

  return { facility: facilityRes.body, device: deviceRes.body };
}

afterEach(async () => {
  if (createdFacilityIds.length === 0) return;
  await prisma.device.deleteMany({ where: { facilityId: { in: createdFacilityIds } } });
  await prisma.facility.deleteMany({ where: { id: { in: createdFacilityIds } } });
  createdFacilityIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /internal/facilities', () => {
  it('returns all facilities with their devices when the internal secret matches (200)', async () => {
    const userId = crypto.randomUUID();
    const { facility, device } = await createFacilityWithDevice(userId);

    const res = await request(app)
      .get('/internal/facilities')
      .set('X-Internal-Secret', process.env.INTERNAL_SERVICE_SECRET);

    expect(res.status).toBe(200);
    const entry = res.body.find((f) => f.facilityId === facility.id);
    expect(entry).toMatchObject({ facilityId: facility.id, ownerUserId: userId });
    expect(entry.devices).toEqual([
      { deviceId: device.id, deviceType: 'thermostat', targetTemperature: 21 },
    ]);
  });

  it('rejects requests with no internal secret header (401)', async () => {
    const res = await request(app).get('/internal/facilities');

    expect(res.status).toBe(401);
  });

  it('rejects requests with a wrong internal secret (401)', async () => {
    const res = await request(app)
      .get('/internal/facilities')
      .set('X-Internal-Secret', 'not-the-right-secret');

    expect(res.status).toBe(401);
  });
});
