import { prisma } from '../db.js';
import { Prisma } from '../../generated/prisma-client/client.js';
import { createNotFoundError } from '../lib/errors.js';
import { TYPE_TO_DEVICE_TYPE } from '../schemas.js';

const DEVICE_TYPES = ['energy_meter', 'thermostat', 'boiler'];
const DEFAULT_RANGE_MS = 24 * 60 * 60 * 1000;

async function assertFacilityOwnership({ facilityId, ownerUserId }) {
  const ownership = await prisma.facilityOwnership.findUnique({ where: { facilityId } });
  if (!ownership || ownership.ownerUserId !== ownerUserId) {
    throw createNotFoundError('facility_not_found');
  }
}

async function getLatestReadings({ facilityId, ownerUserId }) {
  await assertFacilityOwnership({ facilityId, ownerUserId });

  const readings = await Promise.all(
    DEVICE_TYPES.map((deviceType) =>
      prisma.reading.findFirst({
        where: { facilityId, deviceType },
        orderBy: { occurredAt: 'desc' },
      })
    )
  );

  return readings
    .filter(Boolean)
    .map(({ deviceId, deviceType, value, unit, occurredAt }) => ({ deviceId, deviceType, value, unit, occurredAt }));
}

async function getFacilityTelemetry({ facilityId, ownerUserId, type, from, to, granularity }) {
  await assertFacilityOwnership({ facilityId, ownerUserId });

  const deviceType = type ? TYPE_TO_DEVICE_TYPE[type] : undefined;
  const rangeEnd = to ? new Date(to) : new Date();
  const rangeStart = from ? new Date(from) : new Date(rangeEnd.getTime() - DEFAULT_RANGE_MS);
  const deviceTypeFilter = deviceType ? Prisma.sql`AND "deviceType" = ${deviceType}` : Prisma.empty;

  const rows = await prisma.$queryRaw`
    SELECT date_trunc(${granularity}, "occurredAt") AS bucket,
           "deviceType" AS "deviceType",
           unit,
           avg(value)::float8 AS value
    FROM "Reading"
    WHERE "facilityId" = ${facilityId}
      AND "occurredAt" >= ${rangeStart}
      AND "occurredAt" <= ${rangeEnd}
      ${deviceTypeFilter}
    GROUP BY bucket, "deviceType", unit
    ORDER BY bucket ASC
  `;

  return rows.map((row) => ({
    timestamp: row.bucket.toISOString(),
    deviceType: row.deviceType,
    value: row.value,
    unit: row.unit,
  }));
}

async function getDeviceTelemetryHistory({ deviceId, ownerUserId, from, to }) {
  const trackedDevice = await prisma.trackedDevice.findUnique({ where: { deviceId } });
  if (!trackedDevice) {
    throw createNotFoundError('device_not_found');
  }

  await assertFacilityOwnership({ facilityId: trackedDevice.facilityId, ownerUserId });

  const occurredAt = {};
  if (from) occurredAt.gte = new Date(from);
  if (to) occurredAt.lte = new Date(to);

  return prisma.reading.findMany({
    where: { deviceId, ...(from || to ? { occurredAt } : {}) },
    orderBy: { occurredAt: 'asc' },
  });
}

export { getLatestReadings, getFacilityTelemetry, getDeviceTelemetryHistory };
