import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { publish } from '../lib/rabbitmq.js';
import { getFacility } from './facilityService.js';

async function createDevice({ facilityId, ownerUserId, name, type, targetTemperature }) {
  await getFacility({ id: facilityId, ownerUserId });

  const device = await prisma.device.create({
    data: { facilityId, name, type, targetTemperature },
  });

  // Bkz. shared-contracts/events.js#DeviceCreatedEvent
  publish(`device.created.${facilityId}.${type}`, {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    facilityId,
    deviceId: device.id,
    deviceType: type,
    name,
    targetTemperature: targetTemperature ?? null,
  });

  return device;
}

async function listDevices({ facilityId, ownerUserId }) {
  await getFacility({ id: facilityId, ownerUserId });

  return prisma.device.findMany({ where: { facilityId } });
}

export { createDevice, listDevices };
