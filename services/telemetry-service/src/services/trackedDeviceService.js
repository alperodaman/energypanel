import { prisma } from '../db.js';

async function upsertFromDeviceCreatedEvent({ facilityId, deviceId, deviceType, targetTemperature }) {
  return prisma.trackedDevice.upsert({
    where: { deviceId },
    create: { facilityId, deviceId, deviceType, targetTemperature: targetTemperature ?? null },
    update: { facilityId, deviceType, targetTemperature: targetTemperature ?? null },
  });
}

export { upsertFromDeviceCreatedEvent };
