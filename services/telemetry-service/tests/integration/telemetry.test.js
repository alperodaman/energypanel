import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db.js';

const createdFacilityIds = [];
const createdDeviceIds = [];

function authToken(userId = crypto.randomUUID()) {
  return jwt.sign({ userId, email: `${userId}@test.local` }, process.env.JWT_SECRET);
}

function authHeader(userId) {
  return `Bearer ${authToken(userId)}`;
}

async function seedFacility(ownerUserId) {
  const facilityId = crypto.randomUUID();
  await prisma.facilityOwnership.create({ data: { facilityId, ownerUserId } });
  createdFacilityIds.push(facilityId);
  return facilityId;
}

async function seedDevice(facilityId, deviceType, targetTemperature = null) {
  const deviceId = crypto.randomUUID();
  await prisma.trackedDevice.create({ data: { facilityId, deviceId, deviceType, targetTemperature } });
  createdDeviceIds.push(deviceId);
  return deviceId;
}

function seedReading({ facilityId, deviceId, deviceType, value, unit, occurredAt, metadata }) {
  return prisma.reading.create({ data: { facilityId, deviceId, deviceType, value, unit, occurredAt, metadata } });
}

afterEach(async () => {
  if (createdDeviceIds.length > 0) {
    await prisma.reading.deleteMany({ where: { deviceId: { in: createdDeviceIds } } });
    await prisma.trackedDevice.deleteMany({ where: { deviceId: { in: createdDeviceIds } } });
    createdDeviceIds.length = 0;
  }
  if (createdFacilityIds.length > 0) {
    await prisma.facilityOwnership.deleteMany({ where: { facilityId: { in: createdFacilityIds } } });
    createdFacilityIds.length = 0;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ownership checks', () => {
  it("returns 404 for /telemetry/latest on another user's facility", async () => {
    const owner = crypto.randomUUID();
    const facilityId = await seedFacility(owner);

    const res = await request(app)
      .get(`/facilities/${facilityId}/telemetry/latest`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });

  it('returns 404 for /telemetry on a facility with no ownership record', async () => {
    const res = await request(app)
      .get(`/facilities/${crypto.randomUUID()}/telemetry`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });

  it("returns 404 for device history on another user's device", async () => {
    const owner = crypto.randomUUID();
    const facilityId = await seedFacility(owner);
    const deviceId = await seedDevice(facilityId, 'energy_meter');

    const res = await request(app)
      .get(`/devices/${deviceId}/telemetry/history`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });
});

describe('GET /facilities/:id/telemetry/latest', () => {
  it('returns the most recent reading for each device type', async () => {
    const userId = crypto.randomUUID();
    const facilityId = await seedFacility(userId);
    const meterId = await seedDevice(facilityId, 'energy_meter');
    const thermostatId = await seedDevice(facilityId, 'thermostat');

    const now = new Date();
    await seedReading({
      facilityId,
      deviceId: meterId,
      deviceType: 'energy_meter',
      value: 1.1,
      unit: 'kWh',
      occurredAt: new Date(now.getTime() - 10000),
    });
    await seedReading({
      facilityId,
      deviceId: meterId,
      deviceType: 'energy_meter',
      value: 2.2,
      unit: 'kWh',
      occurredAt: now,
    });
    await seedReading({
      facilityId,
      deviceId: thermostatId,
      deviceType: 'thermostat',
      value: 21.5,
      unit: 'celsius',
      occurredAt: now,
    });

    const res = await request(app)
      .get(`/facilities/${facilityId}/telemetry/latest`)
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    const byType = Object.fromEntries(res.body.map((r) => [r.deviceType, r]));
    expect(byType.energy_meter).toMatchObject({ deviceId: meterId, value: 2.2, unit: 'kWh' });
    expect(byType.thermostat).toMatchObject({ deviceId: thermostatId, value: 21.5 });
    expect(byType.boiler).toBeUndefined();
  });
});

describe('GET /facilities/:id/telemetry', () => {
  it('filters by type and by the from/to time range', async () => {
    const userId = crypto.randomUUID();
    const facilityId = await seedFacility(userId);
    const meterId = await seedDevice(facilityId, 'energy_meter');
    const thermostatId = await seedDevice(facilityId, 'thermostat');

    const now = new Date();
    const inRange = new Date(now.getTime() - 60 * 60 * 1000);
    const outOfRange = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    await seedReading({
      facilityId,
      deviceId: meterId,
      deviceType: 'energy_meter',
      value: 3,
      unit: 'kWh',
      occurredAt: inRange,
    });
    await seedReading({
      facilityId,
      deviceId: meterId,
      deviceType: 'energy_meter',
      value: 999,
      unit: 'kWh',
      occurredAt: outOfRange,
    });
    await seedReading({
      facilityId,
      deviceId: thermostatId,
      deviceType: 'thermostat',
      value: 22,
      unit: 'celsius',
      occurredAt: inRange,
    });

    const res = await request(app)
      .get(`/facilities/${facilityId}/telemetry`)
      .query({
        type: 'energy',
        from: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString(),
      })
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((r) => r.deviceType === 'energy_meter')).toBe(true);
    expect(res.body.some((r) => r.value === 999)).toBe(false);
  });
});

describe('GET /devices/:id/telemetry/history', () => {
  it("returns only the requested device's readings", async () => {
    const userId = crypto.randomUUID();
    const facilityId = await seedFacility(userId);
    const meterId = await seedDevice(facilityId, 'energy_meter');
    const otherMeterId = await seedDevice(facilityId, 'energy_meter');

    const now = new Date();
    await seedReading({
      facilityId,
      deviceId: meterId,
      deviceType: 'energy_meter',
      value: 4.4,
      unit: 'kWh',
      occurredAt: now,
    });
    await seedReading({
      facilityId,
      deviceId: otherMeterId,
      deviceType: 'energy_meter',
      value: 5.5,
      unit: 'kWh',
      occurredAt: now,
    });

    const res = await request(app)
      .get(`/devices/${meterId}/telemetry/history`)
      .set('Authorization', authHeader(userId));

    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.deviceId === meterId)).toBe(true);
    expect(res.body.some((r) => r.value === 4.4)).toBe(true);
  });

  it('returns 404 for an untracked device id', async () => {
    const res = await request(app)
      .get(`/devices/${crypto.randomUUID()}/telemetry/history`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(404);
  });
});
