import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { createNotFoundError } from '../lib/errors.js';
import { publish } from '../lib/rabbitmq.js';

async function createFacility({ ownerUserId, name, address, type }) {
  const facility = await prisma.facility.create({
    data: { ownerUserId, name, address, type },
  });

  // Bkz. shared-contracts/events.js#FacilityCreatedEvent
  publish(`facility.created.${facility.id}`, {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    facilityId: facility.id,
    ownerUserId: facility.ownerUserId,
  });

  return facility;
}

async function listFacilities({ ownerUserId }) {
  return prisma.facility.findMany({
    where: { ownerUserId },
  });
}

async function getFacility({ id, ownerUserId }) {
  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility || facility.ownerUserId !== ownerUserId) {
    throw createNotFoundError('facility_not_found');
  }

  return facility;
}

async function listAllFacilitiesWithDevices() {
  const facilities = await prisma.facility.findMany({
    include: { devices: true },
  });

  return facilities.map((facility) => ({
    facilityId: facility.id,
    ownerUserId: facility.ownerUserId,
    devices: facility.devices.map((device) => ({
      deviceId: device.id,
      deviceType: device.type,
      targetTemperature: device.targetTemperature,
    })),
  }));
}

export { createFacility, listFacilities, getFacility, listAllFacilitiesWithDevices };
