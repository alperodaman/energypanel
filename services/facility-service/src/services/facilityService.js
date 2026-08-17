import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { createNotFoundError, createConflictError } from '../lib/errors.js';
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
  const facilities = await prisma.facility.findMany({
    where: { ownerUserId },
    include: { _count: { select: { devices: true } } },
  });

  return facilities.map(({ _count, ...facility }) => ({
    ...facility,
    deviceCount: _count.devices,
  }));
}

async function getFacility({ id, ownerUserId }) {
  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility || facility.ownerUserId !== ownerUserId) {
    throw createNotFoundError('facility_not_found');
  }

  return facility;
}

async function updateFacility({ id, ownerUserId, name, address, type }) {
  await getFacility({ id, ownerUserId });

  return prisma.facility.update({
    where: { id },
    data: { name, address, type },
  });
}

async function deleteFacility({ id, ownerUserId }) {
  await getFacility({ id, ownerUserId });

  const deviceCount = await prisma.device.count({ where: { facilityId: id } });
  if (deviceCount > 0) {
    throw createConflictError('facility_has_devices');
  }

  await prisma.facility.delete({ where: { id } });
}

async function getDeviceTypeSummary({ ownerUserId }) {
  const counts = await prisma.device.groupBy({
    by: ['type'],
    where: { facility: { ownerUserId } },
    _count: { _all: true },
  });

  return counts.map(({ type, _count }) => ({ type, count: _count._all }));
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

export {
  createFacility,
  listFacilities,
  getFacility,
  updateFacility,
  deleteFacility,
  getDeviceTypeSummary,
  listAllFacilitiesWithDevices,
};
