import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { createNotFoundError } from '../lib/errors.js';
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

async function getDevice({ id, ownerUserId }) {
  const device = await prisma.device.findUnique({
    where: { id },
    include: { facility: true },
  });

  if (!device || device.facility.ownerUserId !== ownerUserId) {
    throw createNotFoundError('device_not_found');
  }

  return device;
}

async function updateDevice({ id, ownerUserId, name, targetTemperature }) {
  await getDevice({ id, ownerUserId });

  return prisma.device.update({
    where: { id },
    data: { name, targetTemperature },
  });
}

async function deleteDevice({ id, ownerUserId }) {
  await getDevice({ id, ownerUserId });

  await prisma.device.delete({ where: { id } });
}

export { createDevice, listDevices, getDevice, updateDevice, deleteDevice };
